// Toma aérea del estadio, como la del helicóptero de la transmisión.
// El estadio y la ciudad son un relieve de alturas (un «vóxel» por medio metro)
// que se recorre columna por columna, de adelante hacia atrás, como los
// simuladores de vuelo de los 90: cada columna de la pantalla avanza por el
// suelo y pinta lo que asoma por encima de lo ya pintado. Las fachadas salen
// con sus ventanas según la altura a la que pega el rayo.
import { stadiumFor } from '../stadiums.js';
import { rgb, clamp, lerp, hash2, seeded, mixv, SKY, paintSky, paintRain, canvas } from './common.js';

const CELL = 0.5;           // metros por celda de la grilla del estadio
const R = 124;              // la grilla cubre [-R, R] en x y z
const N = Math.round((R * 2) / CELL);
const DEPTH = 27;           // profundidad de las tribunas
const PLAZA = DEPTH + 20;
const CCELL = 1.5, CR = 640, CN = Math.round((CR * 2) / CCELL); // grilla de la ciudad   // explanada alrededor del estadio
const RING = PLAZA + 12;    // avenida de circunvalación

// materiales
const M_FLAT = 0, M_GRASS = 1, M_CROWD = 2, M_ROOF = 3, M_WALL = 4, M_TREE = 5, M_ROAD = 6, M_BUILD = 7, M_NET = 8, M_BOARD = 9;

const pack = (c) => (255 << 24) | (clamp(c[2] | 0, 0, 255) << 16) | (clamp(c[1] | 0, 0, 255) << 8) | clamp(c[0] | 0, 0, 255);
const unpack = (p) => [p & 255, (p >> 8) & 255, (p >> 16) & 255];
const LAMP = pack([200, 150, 96]);
const CC = {
  walk: pack([150, 146, 140]), road: pack([64, 66, 72]), paint: pack([210, 200, 150]),
  leaf0: pack([62, 116, 54]), leaf1: pack([44, 90, 42]), leaf2: pack([30, 66, 34]), lawn: pack([78, 132, 64]), path: pack([176, 160, 120]),
  tile: pack([176, 104, 78]), ac: pack([96, 98, 104]),
  roofs: [[150, 146, 140], [176, 112, 84], [128, 124, 122], [196, 186, 168], [110, 112, 120]].map(pack),
};

function sdBox(u, v, bx, by, r) {
  const qx = Math.abs(u) - bx + r, qy = Math.abs(v) - by + r;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
}

// Luz de cada hora: dirección del sol (hacia el sol), color del sol y del ambiente.
const LIGHTS = {
  morning: { sun: [0.72, 0.62, 0.3], sunC: [1.0, 0.97, 0.88], amb: [0.5, 0.56, 0.68], fog: '#c9d8e6' },
  afternoon: { sun: [-0.86, 0.3, 0.4], sunC: [1.08, 0.82, 0.6], amb: [0.42, 0.36, 0.5], fog: '#c78a74' },
  night: { sun: null, sunC: [0, 0, 0], amb: [0.2, 0.24, 0.36], fog: '#141c30' },
};

export class Aerial {
  // o: { setup, kits: [kit local, kit visita], W, H }
  constructor(o) {
    this.o = o;
    this.st = stadiumFor(o.setup.stadium);
    this.time = o.setup.time; this.weather = o.setup.weather;
    this.night = this.time === 'night';
    this.wet = this.weather !== 'clear';
    const L = LIGHTS[this.time];
    const s = L.sun;
    this.sun = s && !this.wet ? (() => { const l = Math.hypot(...s); return [s[0] / l, s[1] / l, s[2] / l]; })() : null;
    this.sunC = this.wet ? [0.8, 0.8, 0.82] : L.sunC;
    this.amb = this.wet ? (this.night ? [0.18, 0.2, 0.28] : [0.62, 0.64, 0.7]) : L.amb;
    const bands = SKY[this.time][this.weather];
    this.fog = rgb(bands[bands.length - 1]);
    this.gen = this.buildGen();
    this.ready = false;
  }

  // Arma el mundo de a poco (ms por llamada) para no trabar la pantalla.
  buildStep(ms = 8) {
    if (this.ready) return true;
    const end = performance.now() + ms;
    while (performance.now() < end) if (this.gen.next().done) { this.ready = true; return true; }
    return false;
  }
  buildAll() { while (!this.buildStep(1000)); }

  // ---------- el mundo ----------
  *buildGen() {
    const st = this.st, k = this.o.kits;
    const run = st.track ? 11 : 5;
    this.Uin = 34 + run; this.Vin = 52.5 + run;
    const round = st.shape === 'round';
    this.cr = round ? 26 : 4;
    const H = this.h = new Float32Array(N * N);
    const C = this.c = new Int32Array(N * N);
    const MT = this.m = new Uint8Array(N * N);
    const crowdPal = [k[0].shirt, k[0].shirt, k[0].alt2 || k[0].shirt, '#e8e2d0', '#2a2a2e', '#d9a27a', '#8a5a3c'].map(rgb);
    const awayPal = [k[1].shirt, k[1].shirt, k[1].alt2 || k[1].shirt, '#e8e2d0', '#2a2a2e', '#d9a27a'].map(rgb);
    const seats = st.seats.map(rgb);
    const roofC = st.roof ? rgb(st.roof) : null;
    const standTop = 1.2 + DEPTH * 0.62;
    this.standTop = standTop;
    const lightsOnRoof = !!st.roof;
    this.towers = [];
    if (!lightsOnRoof) for (const sx of [-1, 1]) for (const sz of [-1, 1]) this.towers.push([sx * (this.Uin + DEPTH + 4), sz * (this.Vin + DEPTH + 4)]);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      if (i === 0 && j % 12 === 11) yield;
      const x = -R + (i + 0.5) * CELL, z = -R + (j + 0.5) * CELL;
      const idx = j * N + i;
      const d = sdBox(x, z, this.Uin, this.Vin, this.cr);
      let h = 0, c, m = M_FLAT;
      const n = hash2(i, j);
      if (d < 0) {
        const ax = Math.abs(x), az = Math.abs(z);
        if (ax <= 34 && az <= 52.5) {
          // pasto con franjas de corte y las líneas
          const stripe = Math.floor((z + 52.5) / 5.25) % 2;
          c = stripe ? [72, 160, 66] : [60, 142, 56];
          if (st.mow === 'checks' && Math.floor((x + 34) / 8.5) % 2) c = stripe ? [60, 142, 56] : [72, 160, 66];
          c = mixv(c, [40, 100, 40], n * 0.12);
          m = M_GRASS;
          if (this.isLine(ax, az, x, z)) c = [236, 238, 228];
        } else if (st.track && d > -9.5 && d < -1.6) {
          c = mixv(rgb(st.track), [0, 0, 0], n * 0.08);
          if (Math.abs(((d + 9.5) % 1.2) - 0.6) > 0.52) c = [226, 220, 210];
        } else {
          c = mixv([58, 128, 52], [36, 90, 36], n * 0.25);
          m = M_GRASS;
        }
        // arcos
        if (ax < 3.66 && az > 52.5 && az < 54.5) { h = 2.44; c = [232, 236, 240]; m = M_NET; }
        // carteles de publicidad
        if (d > -1.2 && d < -0.5) {
          h = 1.0; m = M_BOARD;
          const seg = Math.floor((Math.atan2(z, x) + Math.PI) * 9);
          c = seg % 3 === 0 ? rgb(k[0].shirt) : seg % 3 === 1 ? [20, 24, 34] : [240, 210, 70];
        }
      } else if (d < DEPTH) {
        h = 1.2 + d * 0.62;
        m = M_CROWD;
        const row = Math.floor(d / 0.8);
        const ang = Math.atan2(z / this.Vin, x / this.Uin);
        const aisle = Math.abs(((ang * 30) % 1 + 1) % 1 - 0.5) > 0.47;
        if (d > 11.5 && d < 12.8) { c = [150, 150, 146]; m = M_FLAT; h = 1.2 + 11.5 * 0.62; }
        else if (aisle) c = [128, 128, 124];
        else {
          const awayEnd = z < -this.Vin + 4;
          const r = hash2(i * 3 + 1, j * 7 + 2);
          if (r < 0.16) c = mixv(seats[row % 2], [0, 0, 0], 0.15);
          else {
            const pal = awayEnd ? (r < 0.85 ? awayPal : crowdPal) : r < 0.92 ? crowdPal : awayPal;
            c = pal[Math.floor(hash2(i + 9, j + 4) * pal.length)];
          }
          if (row % 2) c = mixv(c, [0, 0, 0], 0.12);
        }
        // letras/colores de la tribuna en la parte de arriba
        if (d > DEPTH - 3) c = mixv(seats[0], [0, 0, 0], 0.2);
      } else if (d < DEPTH + 2.2) {
        h = standTop + 1.6; m = M_WALL; c = [176, 172, 164];
      } else if (d < PLAZA) {
        // explanada: baldosas claras, árboles alrededor
        c = (Math.floor(x / 3) + Math.floor(z / 3)) % 2 ? [176, 170, 158] : [166, 160, 150];
        const tr = this.treeAt(x, z, d);
        if (tr) { h = tr[0]; c = tr[1]; m = M_TREE; }
      } else if (d < RING) {
        // avenida que rodea el estadio
        c = [62, 64, 70];
        m = M_ROAD;
        const mid = Math.abs(d - (PLAZA + RING) / 2);
        if (mid < 0.3 && Math.floor((x + z) / 3) % 2) c = [220, 210, 150];
        if (d - PLAZA < 1.6 || RING - d < 1.6) c = [140, 138, 132];
      } else {
        this.city(x, z);
        h = this.cH; c = unpack(this.cC); m = this.cM;
      }
      // techo: un anillo sobre la parte de arriba de las tribunas, con vigas y
      // un borde de policarbonato más claro
      const r0 = st.features.includes('dome') ? 9 : 15;
      if (roofC && d > r0 && d < DEPTH + 3.2) {
        h = standTop + 4 + (d - r0) * 0.12; m = M_ROOF;
        const ang = Math.atan2(z / this.Vin, x / this.Uin);
        const rib = Math.abs((((ang * 36) / Math.PI) % 1 + 1) % 1 - 0.5) > 0.45;
        c = roofC;
        if (rib) c = mixv(roofC, [40, 40, 50], 0.28);
        if (d < r0 + 3.2) c = mixv(roofC, [210, 225, 235], 0.45);
        if (d > DEPTH + 2.4) c = mixv(roofC, [0, 0, 0], 0.15);
      }
      H[idx] = h; C[idx] = pack(c); MT[idx] = m;
    }
    // la ciudad, en una grilla más gruesa alrededor
    const CH = this.ch = new Float32Array(CN * CN), CCo = this.cc = new Int32Array(CN * CN);
    const CMt = this.cm = new Uint8Array(CN * CN), CWv = this.cw = new Float32Array(CN * CN);
    for (let j = 0; j < CN; j++) {
      if (j % 24 === 23) yield;
      for (let i = 0; i < CN; i++) {
        const idx = j * CN + i;
        this.city(-CR + (i + 0.5) * CCELL, -CR + (j + 0.5) * CCELL);
        CH[idx] = this.cH; CCo[idx] = this.cC; CMt[idx] = this.cM; CWv[idx] = this.cW;
      }
    }
    this.sh = yield* this.shadows(this.h, N, CELL);
    this.csh = yield* this.shadows(this.ch, CN, CCELL);
    yield* this.lightGrids();
  }

  isLine(ax, az, x, z) {
    const w = 0.42;
    if (ax > 34 - w * 2 || az > 52.5 - w * 2) return true;           // laterales y de fondo
    if (Math.abs(z) < w) return true;                                // mitad de cancha
    const r = Math.hypot(x, z);
    if (Math.abs(r - 9.15) < w) return true;                         // círculo central
    if (r < 0.6) return true;
    // áreas grandes y chicas
    const big = (az > 52.5 - 16.5 && az < 52.5) && ax < 20.16;
    if (big && (Math.abs(az - (52.5 - 16.5)) < w || Math.abs(ax - 20.16) < w)) return true;
    const small = (az > 52.5 - 5.5 && az < 52.5) && ax < 9.16;
    if (small && (Math.abs(az - (52.5 - 5.5)) < w || Math.abs(ax - 9.16) < w)) return true;
    // medialuna
    const pr = Math.hypot(x, az - (52.5 - 11));
    if (az < 52.5 - 16.5 && Math.abs(pr - 9.15) < w) return true;
    return false;
  }

  treeAt(x, z, d) {
    // fila de árboles en la explanada
    const rd = PLAZA - 7;
    if (Math.abs(d - rd) > 3.2) return null;
    const ang = Math.atan2(z, x), per = 7;
    const s = (ang * (this.Uin + rd)) / per;
    const cx = Math.round(s);
    const off = (s - cx) * per, dd = d - rd;
    const r2 = off * off + dd * dd;
    if (r2 > 9) return null;
    const hh = 6 + seeded(cx * 3) * 2 - r2 * 0.25 + hash2(Math.round(x * 2), Math.round(z * 2)) * 0.8;
    const g = this.time === 'afternoon' ? [70, 112, 52] : [58, 112, 52];
    return [hh, mixv(g, [24, 60, 30], clamp(r2 / 9 + hash2(Math.round(x * 3), Math.round(z * 3)) * 0.3, 0, 1))];
  }

  // Ciudad infinita: manzanas de 56 m con calles; en cada manzana cuatro lotes
  // con edificios, casas o una plaza con árboles. Deja el resultado en cH, cC
  // (color empaquetado), cM (material) y cW (variante de fachada).
  city(x, z) {
    const P = 56, ROAD = 11;
    const gx = x + 1000 * P, gz = z + 1000 * P;
    const rx = gx % P, rz = gz % P;
    this.cW = 0;
    if (rx < ROAD || rz < ROAD) {
      const side = Math.min(rx < ROAD ? Math.min(rx, ROAD - rx) : 99, rz < ROAD ? Math.min(rz, ROAD - rz) : 99);
      let c = side < 1.8 ? CC.walk : CC.road;
      if (rx < ROAD && rz >= ROAD && Math.abs(rx - ROAD / 2) < 0.25 && Math.floor(gz / 3) % 2) c = CC.paint;
      if (rz < ROAD && rx >= ROAD && Math.abs(rz - ROAD / 2) < 0.25 && Math.floor(gx / 3) % 2) c = CC.paint;
      this.cH = 0; this.cC = c; this.cM = M_ROAD;
      return;
    }
    const bx = Math.floor(gx / P), bz = Math.floor(gz / P);
    const lx = rx - ROAD, lz = rz - ROAD, half = (P - ROAD) / 2;
    const qx = lx < half ? 0 : 1, qz = lz < half ? 0 : 1;
    const blockType = hash2(bx + 0.5, bz + 0.25);
    if (blockType < 0.12) {
      // plaza con árboles
      const tx = Math.floor(lx / 6), tz = Math.floor(lz / 6);
      const ox = (lx % 6) - 3, oz = (lz % 6) - 3, r2 = ox * ox + oz * oz;
      if (r2 < 7 && hash2(tx + bx * 9, tz + bz * 7) < 0.6) { this.cH = 5 + hash2(tx, tz) * 2 - r2 * 0.3; this.cC = r2 < 2.5 ? CC.leaf0 : r2 < 5 ? CC.leaf1 : CC.leaf2; this.cM = M_TREE; return; }
      this.cH = 0; this.cC = (Math.floor(lx) + Math.floor(lz)) % 5 ? CC.lawn : CC.path; this.cM = M_GRASS;
      return;
    }
    const ex = lx - qx * half, ez = lz - qz * half; // dentro del lote
    const m = 1.6;
    if (ex < m || ez < m || ex > half - m || ez > half - m) { this.cH = 0; this.cC = CC.walk; this.cM = M_FLAT; return; }
    const id = hash2(bx * 2 + qx, bz * 2 + qz);
    // edificios más altos lejos del estadio
    const dist = Math.abs(x) + Math.abs(z);
    const tall = clamp((dist - 300) / 500, 0, 1);
    const low = id < 0.4 - tall * 0.25;
    const h = low ? 4 + id * 7 : 8 + Math.pow(hash2(bx * 5 + qx, bz * 3 + qz), 1.8) * (18 + tall * 40);
    this.cW = id; this.cM = M_BUILD;
    if (low) { this.cH = h; this.cC = CC.tile; return; }
    // cosas en la azotea
    if (hash2(Math.floor(ex / 3) + bx, Math.floor(ez / 3) + bz) > 0.9) { this.cH = h + 1.6; this.cC = CC.ac; return; }
    this.cH = h; this.cC = CC.roofs[Math.floor(hash2(bx * 7 + qx, bz * 11 + qz) * CC.roofs.length)];
  }

  // Sombras del sol: cada celda mira hacia el sol unos pasos.
  *shadows(Hg, n, cell) {
    const out = new Uint8Array(n * n);
    if (!this.sun) return out;
    const [sx, sy, sz] = this.sun;
    const hz = Math.hypot(sx, sz);
    const slope = (sy / hz) * cell;
    const dx = sx / hz, dz = sz / hz;
    const maxS = Math.min(120, Math.ceil(46 / slope));
    const stp = Math.max(1, Math.round(1 / cell));
    for (let j = 0; j < n; j++) {
      if (j % 32 === 31) yield;
      for (let i = 0; i < n; i++) {
        const h0 = Hg[j * n + i];
        for (let s = stp; s < maxS; s += stp) {
          const ii = Math.round(i + dx * s), jj = Math.round(j + dz * s);
          if (ii < 0 || jj < 0 || ii >= n || jj >= n) break;
          if (Hg[jj * n + ii] > h0 + slope * s + 0.3) { out[j * n + i] = 1; break; }
        }
      }
    }
    return out;
  }

  // ---------- la cámara ----------
  // Color de arriba ya iluminado (con caché por color base y sombra).
  lit(base, shadow, wx, wz) {
    if (this.night) {
      const d = sdBox(wx, wz, this.Uin, this.Vin, this.cr);
      const l = d < 0 ? 1.05 : d < DEPTH + 3 ? 0.8 - (d / DEPTH) * 0.25 : d < RING ? 0.2 + Math.max(0, 0.3 - (d - DEPTH) / 80) : 0.2;
      const c = unpack(base);
      return pack([c[0] * l * 0.95, c[1] * l * 0.98, c[2] * l * 1.05 + 6]);
    }
    const key = base * 2 + shadow;
    let v = this.litCache.get(key);
    if (v === undefined) {
      const c = unpack(base), s = this.sun && !shadow ? 0.62 : 0;
      v = pack([c[0] * (this.amb[0] + s * this.sunC[0]), c[1] * (this.amb[1] + s * this.sunC[1]), c[2] * (this.amb[2] + s * this.sunC[2])]);
      this.litCache.set(key, v);
    }
    return v;
  }

  // Luz de las dos grillas (una vez).
  *lightGrids() {
    this.litCache = new Map();
    this.top = new Int32Array(N * N);
    for (let j = 0; j < N; j++) {
      if (j % 48 === 47) yield;
      for (let i = 0; i < N; i++) {
        const idx = j * N + i;
        this.top[idx] = this.lit(this.c[idx], this.sh[idx], -R + (i + 0.5) * CELL, -R + (j + 0.5) * CELL);
      }
    }
    this.ctop = new Int32Array(CN * CN);
    for (let j = 0; j < CN; j++) {
      if (j % 64 === 63) yield;
      for (let i = 0; i < CN; i++) {
        const idx = j * CN + i, x = -CR + (i + 0.5) * CCELL, z = -CR + (j + 0.5) * CCELL;
        let v = this.lit(this.cc[idx], this.csh[idx], x, z);
        if (this.night && this.cm[idx] === M_ROAD && (((x + z) * 0.25) % 6 + 6) % 6 < 0.9) v = LAMP;
        this.ctop[idx] = v;
      }
    }
  }

  sample(x, z) {
    let i = Math.floor((x + R) / CELL), j = Math.floor((z + R) / CELL);
    if (i >= 0 && j >= 0 && i < N && j < N) {
      const idx = j * N + i;
      this.sH = this.h[idx]; this.sC = this.c[idx]; this.sT = this.top[idx]; this.sM = this.m[idx]; this.sW = ((i >> 3) * 0.37 + (j >> 3) * 0.61) % 1;
      return;
    }
    i = Math.floor((x + CR) / CCELL); j = Math.floor((z + CR) / CCELL);
    if (i >= 0 && j >= 0 && i < CN && j < CN) {
      const idx = j * CN + i;
      this.sH = this.ch[idx]; this.sC = this.cc[idx]; this.sT = this.ctop[idx]; this.sM = this.cm[idx]; this.sW = this.cw[idx];
      return;
    }
    this.sH = 0; this.sM = M_FLAT; this.sT = this.sC = CC.road;
  }

  // u: avance de la toma (0 a 1)
  draw(g, W, H, t, u) {
    // vuelo: rodea el estadio de a poco mientras se acerca y baja
    const a = 0.62 + u * 0.45;
    const rad = lerp(215, 160, u), camY = lerp(128, 96, u);
    this.render(g, W, H, t, { x: Math.sin(a) * rad, z: Math.cos(a) * rad, y: camY, yaw: a + Math.PI, look: Math.atan2(camY, rad), aim: 0.52, z0: 25 });
  }

  // Cámara libre: posición, hacia dónde mira (yaw: 0 = hacia +z) y cuánto mira hacia abajo.
  render(g, W, H, t, C) {
    if (!this.img || this.img.width !== W || this.img.height !== H) {
      this.img = canvas(W, H); this.ig = this.img.getContext('2d');
      this.id = this.ig.createImageData(W, H); this.px = new Uint32Array(this.id.data.buffer);
      this.depth = new Float32Array(W * H);
    }
    if (!this.ready) this.buildAll();
    const cx = C.x, cz = C.z, camY = C.y, a = C.yaw;
    const fx = Math.sin(a), fz = Math.cos(a);     // hacia adelante (horizontal)
    const rx = -fz, rz = fx;                       // hacia la derecha
    const f = W * 1.02;
    const hz = H * (C.aim ?? 0.5) - f * Math.tan(C.look);
    this.cam = { cx, cz, camY, fx, fz, rx, rz, f, hz, inside: !!C.inside };
    // cielo y montañas de fondo
    paintSky(g, W, 0, Math.max(8, Math.round(hz + 6)), this.time, this.weather);
    this.paintFar(g, W, hz, a, t);
    const px = this.px, depth = this.depth;
    px.fill(0); depth.fill(0);
    const fog = this.fog, fr = fog[0], fgc = fog[1], fb = fog[2];
    const maxZ = this.wet ? 640 : 820;
    const fog0 = this.wet ? 110 : 230;
    const FACADE = (1 << M_BUILD) | (1 << M_WALL) | (1 << M_ROOF) | (1 << M_TREE) | (1 << M_NET) | (1 << M_BOARD);
    for (let x = 0; x < W; x++) {
      const k = (x + 0.5 - W / 2) / f;
      const dx = fx + rx * k, dz = fz + rz * k;
      let ybuf = H;
      let z = C.z0 || 25;
      while (z < maxZ && ybuf > 0) {
        const wx = cx + dx * z, wz = cz + dz * z;
        this.sample(wx, wz);
        const iy = Math.ceil(hz + ((camY - this.sH) * f) / z);
        if (iy < ybuf) {
          let fogT = (z - fog0) / (maxZ - fog0);
          fogT = fogT < 0 ? 0 : fogT > 1 ? 1 : fogT * fogT;
          const tp = this.sT;
          const top = (255 << 24) | (Math.round((((tp >> 16) & 255) * (1 - fogT)) + fb * fogT) << 16) | (Math.round((((tp >> 8) & 255) * (1 - fogT)) + fgc * fogT) << 8) | Math.round(((tp & 255) * (1 - fogT)) + fr * fogT);
          const m = this.sM, isF = (FACADE >> m) & 1;
          const hTop = this.sH - 0.45;
          let base = null;
          for (let y = iy < 0 ? 0 : iy; y < ybuf; y++) {
            let col = top;
            if (isF) {
              const hw = camY - ((y + 0.5 - hz) * z) / f;
              if (hw < hTop) {
                if (!base) base = unpack(this.sC);
                col = pack(mixv(this.facade(base, m, hw, wx, wz, dx, dz, t), fog, fogT));
              }
            }
            px[y * W + x] = col;
            depth[y * W + x] = z;
          }
          ybuf = iy;
        }
        z += z * 0.006 + 0.15;
      }
      // lo que queda abajo del horizonte y más allá de la niebla
      const fogPix = (255 << 24) | (fb << 16) | (fgc << 8) | fr;
      for (let y = Math.max(0, Math.ceil(hz + 6)); y < ybuf; y++) px[y * W + x] = fogPix;
    }
    this.ig.putImageData(this.id, 0, 0);
    g.drawImage(this.img, 0, 0);
    if (this.night) this.paintFlashes(g, W, H, t);
    this.paintLights(g, W, H, t);
    this.paintSkyLife(g, W, hz, t);
    if (this.weather === 'rain') paintRain(g, W, H, t, 140, 0.12);
  }

  // flashes de celulares en las tribunas de noche
  paintFlashes(g, W, H, t) {
    for (let i = 0; i < 26; i++) {
      const k = Math.floor(t * 4 + seeded(i) * 4);
      const ang = seeded(i * 13 + k * 7) * Math.PI * 2, dd = 2 + seeded(i * 5 + k) * (DEPTH - 6);
      let lo = 0, hi = 220;
      for (let it = 0; it < 14; it++) { const mid = (lo + hi) / 2; if (sdBox(Math.cos(ang) * mid, Math.sin(ang) * mid, this.Uin, this.Vin, this.cr) < dd) lo = mid; else hi = mid; }
      const wx = Math.cos(ang) * lo, wz = Math.sin(ang) * lo;
      const p = this.project(wx, 1.4 + dd * 0.62, wz);
      if (!p) continue;
      const x = Math.round(p[0]), y = Math.round(p[1]);
      if (x < 0 || y < 0 || x >= W || y >= H || Math.abs(this.depth[y * W + x] - p[2]) > 8) continue;
      g.fillStyle = '#ffffff'; g.fillRect(x, y, 1, 1);
    }
  }

  facade(base, m, hw, wx, wz, dx, dz, t) {
    // la cara que mira a la cámara: más clara si le da el sol
    let k = 0.62;
    if (this.sun && !this.night) {
      const dot = -(dx * this.sun[0] + dz * this.sun[2]) / Math.hypot(dx, dz) / Math.hypot(this.sun[0], this.sun[2]);
      k = 0.5 + Math.max(0, dot) * 0.5;
    }
    if (m === M_TREE) return mixv(base, [10, 30, 18], 0.4);
    if (m === M_NET) return [210, 214, 220];
    if (m === M_BOARD) return base;
    if (m === M_ROOF && hw > this.standTop + 2.4) return mixv(base, [20, 20, 30], 0.45);
    if (m === M_ROOF) m = M_WALL;
    let wall = m === M_WALL ? [184, 180, 172] : mixv([206, 196, 180], [120, 124, 136], this.sW);
    let col;
    const lat = wx + wz;
    if (m === M_WALL) {
      // fachada: costillas verticales, pisos con aberturas oscuras y una franja con el color del club
      const rib = Math.abs(((lat * 0.4) % 1 + 1) % 1 - 0.5) > 0.38;
      const lvl = ((hw % 5.2) + 5.2) % 5.2;
      col = rib ? mixv(wall, [255, 255, 255], 0.12) : wall;
      if (!rib && lvl > 3.4 && lvl < 4.6) col = this.night ? [255, 220, 160] : [52, 54, 64];
      if (hw < 2.2) col = mixv(wall, [0, 0, 0], 0.35);
      if (hw > this.standTop - 1.5) col = mixv(rgb(this.st.seats[0]), [0, 0, 0], 0.1);
      if (this.night && !rib && lvl > 3.4 && lvl < 4.6) return mixv(col, [0, 0, 0], 0.35);
    } else {
      const fl = hw / 3.1, wc = lat / 2.6;
      const win = (fl % 1) > 0.35 && (fl % 1) < 0.8 && (((wc % 1) + 1) % 1) < 0.55;
      if (win) {
        if (this.night) {
          const on = hash2(Math.floor(fl) + Math.floor(wx), Math.floor(wc) + Math.floor(wz)) > 0.55;
          col = on ? [255, 214, 140] : [26, 30, 44];
          return col;
        }
        col = mixv([70, 86, 110], [160, 180, 200], (Math.floor(fl) % 3) * 0.15);
      } else col = wall;
    }
    if (this.night) return [col[0] * 0.22, col[1] * 0.24, col[2] * 0.32];
    return [col[0] * k * (this.wet ? 0.85 : 1), col[1] * k * (this.wet ? 0.85 : 1), col[2] * k * (this.wet ? 0.9 : 1)];
  }

  // proyecta un punto del mundo a la pantalla
  project(x, y, z) {
    const c = this.cam;
    const vx = x - c.cx, vz = z - c.cz;
    const dep = vx * c.fx + vz * c.fz;
    if (dep < 1) return null;
    const lat = vx * c.rx + vz * c.rz;
    return [this.img.width / 2 + (lat * c.f) / dep, c.hz + ((c.camY - y) * c.f) / dep, dep];
  }

  paintLights(g, W, H, t) {
    const lightsOn = this.night || this.wet || this.time === 'afternoon';
    // torres de iluminación (o luces en el borde del techo)
    for (const [x, z] of this.towers) {
      const b = this.project(x, 0, z), top = this.project(x, this.standTop + 24, z);
      if (!b || !top) continue;
      const bx = Math.round(b[0]), by = Math.round(b[1]), tx = Math.round(top[0]), ty = Math.round(top[1]);
      if (![bx, by, tx, ty].every(Number.isFinite) || Math.abs(tx) > 2000 || Math.abs(by - ty) > 3000) continue;
      for (let y = ty; y <= by; y++) {
        const xx = Math.round(lerp(tx, bx, (y - ty) / Math.max(1, by - ty)));
        if (xx < 0 || xx >= W || y < 0 || y >= H) continue;
        if (this.depth[y * W + xx] && this.depth[y * W + xx] < b[2] - 6) continue;
        g.fillStyle = this.night ? '#3a4152' : '#5d636e'; g.fillRect(xx, y, 1, 1);
      }
      g.fillStyle = '#20242c'; g.fillRect(tx - 3, ty - 3, 7, 4);
      for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { g.fillStyle = lightsOn ? '#fff8d8' : '#8a90a0'; g.fillRect(tx - 2 + i * 2, ty - 2 + j * 2, 1, 1); }
      if (this.night) {
        g.save(); g.globalCompositeOperation = 'screen';
        const gr = g.createRadialGradient(tx, ty, 0, tx, ty, 16);
        gr.addColorStop(0, 'rgba(255,250,220,0.55)'); gr.addColorStop(1, 'rgba(255,250,220,0)');
        g.fillStyle = gr; g.fillRect(tx - 16, ty - 16, 32, 32);
        g.restore();
      }
    }
    if (this.st.roof && lightsOn) {
      // anillo de focos bajo el borde del techo
      const n = 44;
      for (let i = 0; i < n; i++) {
        const ang = (i / n) * Math.PI * 2;
        // punto sobre el borde interno del techo
        let lo = 0, hi = 200;
        for (let it = 0; it < 16; it++) { const mid = (lo + hi) / 2; if (sdBox(Math.cos(ang) * mid, Math.sin(ang) * mid, this.Uin, this.Vin, this.cr) < 11.5) lo = mid; else hi = mid; }
        const p = this.project(Math.cos(ang) * lo, this.standTop + 5.5, Math.sin(ang) * lo);
        if (!p) continue;
        const xx = Math.round(p[0]), yy = Math.round(p[1]);
        if (xx < 0 || xx >= W || yy < 0 || yy >= H) continue;
        if (this.depth[yy * W + xx] < p[2] - 3) continue;
        g.fillStyle = (i + Math.floor(t * 2)) % 7 ? '#fff6d0' : '#ffffff'; g.fillRect(xx, yy, 1, 1);
      }
    }
    if (this.night && !this.cam.inside) {
      // el resplandor del estadio sobre la ciudad oscura
      const c = this.project(0, 0, 0);
      if (c) {
        g.save(); g.globalCompositeOperation = 'screen';
        const gr = g.createRadialGradient(c[0], c[1] - 8, 6, c[0], c[1] - 8, W * 0.75);
        gr.addColorStop(0, 'rgba(255,246,210,0.22)'); gr.addColorStop(0.5, 'rgba(255,240,200,0.08)'); gr.addColorStop(1, 'rgba(255,240,200,0)');
        g.fillStyle = gr; g.fillRect(0, 0, W, H);
        g.restore();
      }
    }
  }

  // Cordillera o cerros lejanos detrás de la ciudad; se corren un poco al girar.
  paintFar(g, W, hz, a, t) {
    const andes = this.st.features.includes('andes');
    const off = a * 160;
    const hz0 = Math.round(hz + 6);
    const base = andes ? (this.night ? '#1b2235' : this.time === 'afternoon' ? '#6a4a6a' : '#7b8aa6') : (this.night ? '#121828' : this.time === 'afternoon' ? '#7a5a6e' : '#93a3b8');
    const snow = this.night ? '#56607a' : this.time === 'afternoon' ? '#f0c0b0' : '#f4f6fa';
    const shade = this.night ? '#151b2c' : this.time === 'afternoon' ? '#55395a' : '#647490';
    for (let x = 0; x < W; x++) {
      const u = x + off;
      let h = andes ? 18 + Math.sin(u * 0.045) * 7 + Math.sin(u * 0.13 + 1) * 4 + Math.abs(Math.sin(u * 0.31)) * 3 : 5 + Math.sin(u * 0.05) * 2.5 + Math.sin(u * 0.17) * 1.2;
      h = Math.round(h);
      const slope = (andes ? Math.cos(u * 0.045) * 0.31 + Math.cos(u * 0.13 + 1) * 0.52 : 0);
      for (let y = 0; y < h; y++) {
        let c = slope > 0 ? shade : base;
        if (andes && y > h - 6 + Math.sin(u * 0.7) * 1.5 && !this.wet) c = slope > 0 ? (this.night ? '#3c4560' : '#c9d2e2') : snow;
        g.fillStyle = c; g.fillRect(x, hz0 - y, 1, 1);
      }
    }
    if (this.wet) { g.fillStyle = this.night ? 'rgba(20,24,34,0.6)' : 'rgba(170,176,186,0.55)'; g.fillRect(0, hz0 - 30, W, 34); }
  }

  paintSkyLife(g, W, hz, t) {
    if (this.wet || this.night) {
      if (this.night && !this.wet) for (let i = 0; i < 30; i++) {
        const x = Math.floor(seeded(i * 3 + 1) * W), y = Math.floor(seeded(i * 3 + 2) * Math.max(4, hz - 20));
        g.fillStyle = Math.sin(t * 2 + i) > 0.8 ? '#ffffff' : '#8a9bc4'; g.fillRect(x, y, 1, 1);
      }
      return;
    }
    // pájaros que cruzan
    for (let i = 0; i < 4; i++) {
      const x = Math.round(((seeded(i * 7) * W + t * (8 + i * 2)) % (W + 20)) - 10);
      const y = Math.round(10 + seeded(i * 7 + 1) * Math.max(10, hz - 20) + Math.sin(t * 2 + i) * 2);
      const flap = Math.sin(t * 10 + i * 2) > 0;
      g.fillStyle = this.time === 'afternoon' ? '#3a2a40' : '#3a4250';
      g.fillRect(x, y, 1, 1);
      g.fillRect(x - 1, y + (flap ? -1 : 0), 1, 1); g.fillRect(x + 1, y + (flap ? -1 : 0), 1, 1);
      g.fillRect(x - 2, y + (flap ? -1 : 1), 1, 1); g.fillRect(x + 2, y + (flap ? -1 : 1), 1, 1);
    }
  }
}
