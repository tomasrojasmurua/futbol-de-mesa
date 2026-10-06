// Calcciopoli · trofeos y sala de trofeos.
// Las copas se pintan píxel por píxel como sólidos de revolución: para cada
// píxel se calcula la normal del metal y se ilumina con un estudio (luz arriba
// a la izquierda, reflejo del cielo y del piso), y el brillo se reduce a una
// paleta corta por material, en bandas duras como el resto del arte.
import { TEAMS } from './teams.js';

// ---------- paletas (de oscuro a brillo) ----------
const RAMPS = {
  gold: ['#2e1a06', '#5a380c', '#8f5c14', '#c48a20', '#e8b532', '#f9d968', '#fff4c0'],
  silver: ['#1e2129', '#3d424f', '#646b7b', '#8f97a8', '#bcc3d0', '#e2e7ef', '#ffffff'],
  green: ['#03190f', '#073a22', '#0d5a34', '#167a47', '#2aa060', '#5cc888', '#b0f0cc'],
  wood: ['#1c0c05', '#34180a', '#522812', '#723a1c', '#935026', '#b46c36', '#d8975a'],
  black: ['#07070a', '#111117', '#1c1c25', '#2a2a36', '#3c3c4a', '#565666', '#80808f'],
  blue: ['#050b26', '#0b1a4a', '#14296e', '#1f3f98', '#3460c0', '#5a88e0', '#a8c8ff'],
  red: ['#260505', '#4a0b0b', '#701414', '#982020', '#c03030', '#e05a5a', '#ffb0b0'],
};
const SH = RAMPS.black; // silueta de las copas que faltan

const norm = (v) => { const l = Math.hypot(...v) || 1; return v.map((x) => x / l); };
const L = norm([-0.55, -0.7, 0.55]);
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

// Brillo de un metal pulido según su normal: en vez de un reflejo físico se usa
// el "cromo" clásico del pixel art: borde oscuro, franja de brillo a la izquierda,
// cuerpo medio, reflejo oscuro a la derecha y un rebote de luz en el canto.
const CHROME = [[-1, 0.42], [-0.82, 0.62], [-0.62, 0.98], [-0.4, 0.86], [-0.18, 0.66], [0.15, 0.56], [0.42, 0.34], [0.66, 0.2], [0.86, 0.36], [1, 0.3]];
function metal(n) {
  const x = Math.max(-1, Math.min(1, n[0] / Math.max(0.2, Math.hypot(n[0], n[2]))));
  let k = 0;
  while (k < CHROME.length - 2 && CHROME[k + 1][0] < x) k++;
  const [xa, va] = CHROME[k], [xb, vb] = CHROME[k + 1];
  let v = va + (vb - va) * ((x - xa) / (xb - xa));
  v += -n[1] * 0.38; // lo que mira hacia arriba brilla, lo de abajo cae en sombra
  const r = [2 * n[2] * n[0], 2 * n[2] * n[1], 2 * n[2] * n[2] - 1];
  v += Math.pow(Math.max(0, dot(r, L)), 30) * 0.5;
  return Math.max(0, Math.min(1, v));
}
// Superficies mate (madera, piedra): difuso con poco brillo.
function matte(n) {
  const r = [2 * n[2] * n[0], 2 * n[2] * n[1], 2 * n[2] * n[2] - 1];
  return Math.min(1, 0.18 + Math.max(0, dot(n, L)) * 0.62 + Math.pow(Math.max(0, dot(r, L)), 12) * 0.35);
}
const tone = (v, steps = 7) => Math.max(0, Math.min(steps - 1, Math.round(v * (steps - 1))));

// Lienzo de píxeles con profundidad (para que asas y figuras tapen bien).
function makeBuf(W, H) {
  return { W, H, c: new Array(W * H).fill(null), z: new Float32Array(W * H).fill(-1e9), m: new Array(W * H).fill(null) };
}
function put(b, x, y, z, col, mat) {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || y < 0 || x >= b.W || y >= b.H) return;
  const i = y * b.W + x;
  if (z < b.z[i]) return;
  b.z[i] = z; b.c[i] = col; b.m[i] = mat;
}

// Sólido de revolución. prof: [[y, radio, material], ...] en píxeles, de arriba a abajo.
function lathe(b, cx, prof, o = {}) {
  const y0 = Math.ceil(prof[0][0]), y1 = Math.floor(prof[prof.length - 1][0]);
  for (let y = y0; y <= y1; y++) {
    let k = 0;
    while (k < prof.length - 2 && prof[k + 1][0] < y) k++;
    const [ya, ra, ma] = prof[k], [yb, rb] = prof[k + 1];
    const t = yb === ya ? 0 : (y - ya) / (yb - ya);
    const s = o.smooth === false ? t : t * t * (3 - 2 * t);
    const r = ra + (rb - ra) * (o.linear ? t : s);
    const dr = (rb - ra) / Math.max(0.5, yb - ya);
    const mat = ma;
    if (r < 0.35) continue;
    if (o.mouth && y === y0) {
      // boca de la copa vista un poco desde arriba: canto claro y el interior en sombra
      const r0 = prof[0][1], ry = Math.max(1.8, r0 * 0.34), cy = y0;
      for (let yy = Math.floor(cy - ry); yy <= cy + ry; yy++) for (let x = Math.floor(cx - r0); x <= Math.ceil(cx + r0); x++) {
        const ex = (x + 0.5 - cx) / r0, ey = (yy + 0.5 - cy) / ry;
        if (ex * ex + ey * ey > 1) continue;
        const ix = (x + 0.5 - cx) / (r0 - 1.1), iy = (yy + 0.5 - cy - 0.25) / (ry - 0.7);
        const R = RAMPS[ma];
        const inner = ix * ix + iy * iy <= 1;
        const col = inner ? R[iy < 0 ? 1 : ix > 0.2 ? 1 : 2] : R[ex < 0.2 ? 6 : 4];
        put(b, x, yy, 500, col, ma);
      }
    }
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      const nx = (x + 0.5 - cx) / r;
      if (Math.abs(nx) > 1) continue;
      const nz = Math.sqrt(1 - nx * nx);
      const n = norm([nx, -dr * 0.9, nz]);
      const ramp = RAMPS[mat] || RAMPS.gold;
      let v = (mat === 'wood' || mat === 'green' || mat === 'black' || mat === 'blue' || mat === 'red') ? matte(n) : metal(n);
      if (o.pattern) v = o.pattern(x, y, v, nx, mat);
      put(b, x, y, nz * r + (o.z || 0), ramp[tone(v)], mat);
    }
  }
}
// Tubo a lo largo de una curva (asas, brazos, cintas).
function tube(b, pts, rad, mat, z = 0) {
  const minx = Math.min(...pts.map((p) => p[0])) - rad - 1, maxx = Math.max(...pts.map((p) => p[0])) + rad + 1;
  const miny = Math.min(...pts.map((p) => p[1])) - rad - 1, maxy = Math.max(...pts.map((p) => p[1])) + rad + 1;
  for (let y = Math.floor(miny); y <= maxy; y++) for (let x = Math.floor(minx); x <= maxx; x++) {
    let best = 1e9, bx = 0, by = 0, bz = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, ay, az = 0] = pts[i], [qx, qy, qz = 0] = pts[i + 1];
      const dx = qx - ax, dy = qy - ay, l2 = dx * dx + dy * dy || 1;
      const t = Math.max(0, Math.min(1, ((x + 0.5 - ax) * dx + (y + 0.5 - ay) * dy) / l2));
      const px = ax + dx * t, py = ay + dy * t, d = Math.hypot(x + 0.5 - px, y + 0.5 - py);
      if (d < best) { best = d; bx = x + 0.5 - px; by = y + 0.5 - py; bz = az + (qz - az) * t; }
    }
    if (best > rad) continue;
    const nz = Math.sqrt(Math.max(0, 1 - (best / rad) ** 2));
    const n = norm([bx / rad, by / rad, nz]);
    put(b, x, y, z + bz + nz * rad, RAMPS[mat][tone(metal(n))], mat);
  }
}
function sphere(b, cx, cy, r, mat, z = 0, pattern) {
  for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) {
    const nx = (x + 0.5 - cx) / r, ny = (y + 0.5 - cy) / r, q = nx * nx + ny * ny;
    if (q > 1) continue;
    const nz = Math.sqrt(1 - q);
    let v = metal([nx, ny, nz]);
    if (pattern) v = pattern(nx, ny, nz, v);
    put(b, x, y, z + nz * r, RAMPS[mat][tone(v)], mat);
  }
}
// Caja con caras planas (bases, placas).
function box(b, x0, y0, w, h, mat, top = 2) {
  const R = RAMPS[mat];
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    const fx = (x - x0) / Math.max(1, w - 1);
    let v = y < y0 + top ? 0.82 : 0.5 - fx * 0.28;
    if (x === x0) v += 0.12;
    if (y === y0 + h - 1) v -= 0.18;
    put(b, x, y, -5, R[tone(v)], mat);
  }
}

// Termina el dibujo: borde de sombra a la derecha y abajo, para separar del fondo.
function finish(b, sil) {
  const cv = document.createElement('canvas');
  cv.width = b.W; cv.height = b.H;
  const g = cv.getContext('2d');
  const id = g.createImageData(b.W, b.H);
  const hexrgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  for (let y = 0; y < b.H; y++) for (let x = 0; x < b.W; x++) {
    const i = y * b.W + x;
    let c = b.c[i];
    if (!c) continue;
    if (sil) {
      const lit = (x > 0 && !b.c[i - 1]) || (y > 0 && !b.c[i - b.W]);
      c = lit ? SH[3] : SH[2];
    } else {
      const R = RAMPS[b.m[i]] || RAMPS.gold;
      const edge = (x < b.W - 1 && !b.c[i + 1]) || (y < b.H - 1 && !b.c[i + b.W]);
      if (edge) { const k = R.indexOf(c); if (k > 0) c = R[Math.max(0, k - 2)]; }
    }
    const [r, gg, bb] = hexrgb(c);
    id.data.set([r, gg, bb, 255], i * 4);
  }
  g.putImageData(id, 0, 0);
  return cv;
}

// ---------- los trofeos ----------
// Cada uno dibuja en un lienzo de W×H con la base apoyada en la última fila.
const ART = {
  // Copa del Mundo: base con dos anillos verdes y dos figuras en espiral que sostienen el globo.
  world(b) {
    const cx = b.W / 2, H = b.H;
    const spiral = (x, y, v, nx) => {
      const ph = (nx * 2.4 + y * 0.42) % 2;
      return (ph > 1.55 && ph < 1.95) ? v - 0.3 : v;
    };
    lathe(b, cx, [[H - 12, 6.4, 'gold'], [H - 11, 7, 'gold'], [H - 10, 7.2, 'green'], [H - 8, 7.4, 'green'], [H - 7, 7.4, 'gold'], [H - 6, 7.6, 'gold'], [H - 5, 7.8, 'green'], [H - 2, 8, 'green'], [H - 1, 8, 'gold']], { smooth: false });
    lathe(b, cx, [[13, 9.4, 'gold'], [16, 8.2, 'gold'], [21, 5.2, 'gold'], [27, 3.8, 'gold'], [33, 5, 'gold'], [H - 12, 6.6, 'gold']], { pattern: spiral });
    // brazos que suben al globo
    tube(b, [[cx - 7.5, 15], [cx - 9.6, 10], [cx - 8, 6]], 1.3, 'gold', 6);
    tube(b, [[cx + 7.5, 15], [cx + 9.6, 10], [cx + 8, 6]], 1.3, 'gold', 6);
    sphere(b, cx, 8.6, 7.4, 'gold', 2, (nx, ny, nz, v) => {
      // continentes en relieve más oscuro
      const u = Math.atan2(nx, nz) * 2.2, w = ny * 3;
      const land = Math.sin(u * 1.7 + 1) + Math.sin(w * 2.1 + u) * 0.8 + Math.sin(u * 3.3 - w * 1.4) * 0.5;
      return land > 0.65 ? v - 0.2 : v;
    });
  },
  // Champions: copa plateada de "orejas grandes".
  ucl(b) {
    const cx = b.W / 2, H = b.H;
    lathe(b, cx, [[H - 7, 5.4, 'silver'], [H - 5, 7.2, 'silver'], [H - 3, 8, 'black'], [H - 1, 8.4, 'black']], { smooth: false });
    lathe(b, cx, [[5, 7.6, 'silver'], [6, 7.2, 'silver'], [16, 6.6, 'silver'], [23, 4.4, 'silver'], [28, 2, 'silver'], [H - 10, 1.8, 'silver'], [H - 7, 4.6, 'silver']], { mouth: true });
    for (const s of [-1, 1]) tube(b, [[cx + s * 6.4, 7], [cx + s * 11.6, 6], [cx + s * 13.4, 12], [cx + s * 12, 21], [cx + s * 8, 27], [cx + s * 3, 30]], 1.35, 'silver', 4);
  },
  // Europa League: copa alta de pétalos sobre base negra.
  uel(b) {
    const cx = b.W / 2, H = b.H;
    lathe(b, cx, [[H - 9, 4.4, 'black'], [H - 1, 6.6, 'black']], { linear: true });
    lathe(b, cx, [[4, 7.4, 'silver'], [12, 6, 'silver'], [21, 3.4, 'silver'], [26, 2.4, 'silver'], [H - 9, 4.2, 'silver']], {
      mouth: true,
      pattern: (x, y, v, nx) => (Math.abs(Math.sin(nx * 4.6)) < 0.22 && y < 24 ? v - 0.26 : v),
    });
  },
  // Libertadores: copa de plata sobre base de madera con placas, y un jugador arriba.
  lib(b) {
    const cx = b.W / 2, H = b.H;
    lathe(b, cx, [[H - 12, 6.2, 'wood'], [H - 7, 7.2, 'wood'], [H - 6, 8.2, 'wood'], [H - 1, 8.8, 'wood']], { smooth: false });
    for (let y = H - 5; y < H - 1; y += 2) for (let x = Math.round(cx - 6); x <= cx + 5; x += 3) { put(b, x, y, 99, RAMPS.silver[5], 'silver'); put(b, x + 1, y, 99, RAMPS.silver[4], 'silver'); }
    lathe(b, cx, [[12, 7.6, 'silver'], [14, 7.2, 'silver'], [21, 6, 'silver'], [26, 3, 'silver'], [H - 13, 2.4, 'silver'], [H - 12, 5.4, 'silver']]);
    for (const s of [-1, 1]) tube(b, [[cx + s * 6.6, 15], [cx + s * 10, 16], [cx + s * 9, 22], [cx + s * 4.4, 25]], 1.1, 'silver', 4);
    // jugador pateando
    sphere(b, cx + 1, 3, 1.6, 'silver', 9);
    tube(b, [[cx + 0.6, 4.6], [cx - 0.2, 8.4]], 1.4, 'silver', 9);
    tube(b, [[cx - 0.2, 8.4], [cx - 2.4, 11.6]], 0.8, 'silver', 9);
    tube(b, [[cx - 0.2, 8.4], [cx + 2.6, 10], [cx + 3.6, 9.2]], 0.8, 'silver', 9);
    tube(b, [[cx + 0.4, 5.6], [cx - 2.6, 4.4]], 0.6, 'silver', 9);
    tube(b, [[cx + 0.4, 5.6], [cx + 3, 6.6]], 0.6, 'silver', 9);
    sphere(b, cx + 4.8, 10.4, 1.1, 'silver', 9);
  },
  // Sudamericana: copa dorada de boca ancha, base azul.
  sud(b) {
    const cx = b.W / 2, H = b.H;
    lathe(b, cx, [[H - 8, 5.4, 'blue'], [H - 1, 7.6, 'blue']], { linear: true });
    lathe(b, cx, [[8, 8.6, 'gold'], [10, 8, 'gold'], [17, 6.4, 'gold'], [24, 2.6, 'gold'], [H - 10, 2.2, 'gold'], [H - 8, 5.6, 'gold']], { mouth: true });
    for (const s of [-1, 1]) tube(b, [[cx + s * 7, 12], [cx + s * 10.6, 13], [cx + s * 10, 18], [cx + s * 5.4, 21]], 1, 'gold', 4);
    sphere(b, cx, 5.4, 2.6, 'gold', 4);
  },
  // Copa América: copa de plata con tapa y asas, sobre una base escalonada de madera.
  ca(b) {
    const cx = b.W / 2, H = b.H;
    lathe(b, cx, [[H - 10, 5.6, 'wood'], [H - 6, 6.6, 'wood'], [H - 5, 8, 'wood'], [H - 1, 8.6, 'wood']], { smooth: false });
    lathe(b, cx, [[2, 1.2, 'silver'], [3, 1.8, 'silver'], [6, 2.2, 'silver'], [8, 6.4, 'silver'], [10, 7.4, 'silver'], [12, 7.4, 'silver'], [20, 6.8, 'silver'], [26, 3.2, 'silver'], [H - 12, 2.6, 'silver'], [H - 10, 5.6, 'silver']], {
      pattern: (x, y, v) => (y === 12 || y === 13 ? v - 0.22 : v),
    });
    for (const s of [-1, 1]) tube(b, [[cx + s * 6.6, 13], [cx + s * 11, 12], [cx + s * 10.4, 19], [cx + s * 5.6, 22]], 1.1, 'silver', 4);
  },
  // Eurocopa: copa alta y esbelta, sin asas grandes.
  euro(b) {
    const cx = b.W / 2, H = b.H;
    lathe(b, cx, [[H - 6, 5.2, 'silver'], [H - 4, 6.8, 'silver'], [H - 1, 7.4, 'silver']], { smooth: false });
    lathe(b, cx, [[3, 6.2, 'silver'], [5, 5.6, 'silver'], [14, 5.2, 'silver'], [20, 3.8, 'silver'], [26, 2.4, 'silver'], [H - 10, 2, 'silver'], [H - 6, 5, 'silver']]);
    for (const s of [-1, 1]) tube(b, [[cx + s * 5, 6], [cx + s * 7.4, 7], [cx + s * 7.2, 11], [cx + s * 5, 12]], 0.8, 'silver', 3);
  },
  // Copa Calcciopoli: dorada con una pelota encima.
  calc(b) {
    const cx = b.W / 2, H = b.H;
    lathe(b, cx, [[H - 8, 5.6, 'black'], [H - 1, 7.8, 'black']], { linear: true });
    lathe(b, cx, [[11, 8.4, 'gold'], [13, 7.8, 'gold'], [20, 6, 'gold'], [26, 2.8, 'gold'], [H - 10, 2.4, 'gold'], [H - 8, 5.8, 'gold']], { mouth: true });
    for (const s of [-1, 1]) tube(b, [[cx + s * 7, 14], [cx + s * 11, 13], [cx + s * 11, 20], [cx + s * 5.4, 23]], 1.15, 'gold', 4);
    sphere(b, cx, 6.4, 5, 'silver', 600, (nx, ny, nz, v) => {
      const a = Math.atan2(ny, nx), d = Math.hypot(nx, ny);
      const pent = d < 0.32 || (d > 0.62 && d < 0.92 && Math.cos(a * 5) > 0.55);
      return pent ? v * 0.32 : v;
    });
  },
  // Ligas: copas genéricas con detalles distintos.
  cup(b, o) {
    const cx = b.W / 2, H = b.H, m = o.mat || 'silver';
    lathe(b, cx, [[H - 8, 5.2, o.base || 'wood'], [H - 1, 7.6, o.base || 'wood']], { linear: true });
    lathe(b, cx, [[o.top || 9, o.w || 7.8, m], [(o.top || 9) + 2, (o.w || 7.8) - 0.6, m], [20, 6, m], [26, 2.8, m], [H - 10, 2.4, m], [H - 8, 5.4, m]], { mouth: !o.lid && !o.crown });
    if (o.handles !== false) for (const s of [-1, 1]) tube(b, [[cx + s * 6.6, 13], [cx + s * 10.6, 12.6], [cx + s * 10.2, 19], [cx + s * 5.2, 22]], 1.05, m, 4);
    if (o.lid) lathe(b, cx, [[o.top - 5, 1.2, m], [o.top - 4, 2, m], [o.top - 2, 2.4, m], [o.top, (o.w || 7.8) - 0.8, m]], { smooth: false });
    if (o.crown) {
      // corona: aro dorado con puntas y piedras rojas, sobre la tapa
      lathe(b, cx, [[o.top - 2, 1.4, m], [o.top, (o.w || 7.8) - 0.8, m]], { smooth: false });
      lathe(b, cx, [[o.top - 6, 4.4, 'gold'], [o.top - 3, 5, 'gold']], { linear: true, z: 40 });
      for (const dx of [-4.2, -1.4, 1.4, 4.2]) tube(b, [[cx + dx, o.top - 6], [cx + dx * 1.12, o.top - 9]], 0.8, 'gold', 60);
      sphere(b, cx, o.top - 10, 1.4, 'gold', 60);
      for (const dx of [-3, 0, 3]) put(b, cx + dx, o.top - 5, 900, RAMPS.red[dx === 0 ? 5 : 3], 'red');
    }
    if (o.band) for (let x = Math.round(cx - 5); x <= cx + 4; x++) put(b, x, 16, 99, RAMPS[o.band][3 + (x % 2)], o.band);
  },
  // Bundesliga: el plato de campeón sobre un atril.
  plate(b) {
    const cx = b.W / 2, H = b.H, cy = 17, rx = 13, ry = 13;
    tube(b, [[cx, cy + 4], [cx, H - 3]], 1.4, 'silver', -6);
    lathe(b, cx, [[H - 4, 4.6, 'wood'], [H - 1, 6.4, 'wood']], { linear: true });
    for (let y = cy - ry; y <= cy + ry; y++) for (let x = cx - rx; x <= cx + rx; x++) {
      const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry, d = Math.hypot(nx, ny);
      if (d > 1) continue;
      // anillos: borde, corona de placas y el centro
      const ring = d > 0.86 ? 0.5 : d > 0.36 ? 0.2 : 0.05;
      let n = norm([nx * ring, ny * ring, 1]);
      let v = metal(n);
      if (d > 0.4 && d < 0.84 && Math.abs(Math.sin(Math.atan2(ny, nx) * 9)) < 0.18) v -= 0.25;
      if (Math.abs(d - 0.86) < 0.05 || Math.abs(d - 0.38) < 0.05) v -= 0.3;
      const mat = d < 0.3 ? 'gold' : 'silver';
      put(b, x, y, 10, RAMPS[mat][tone(v)], mat);
    }
  },
  // Ligue 1: el hexágono de plata.
  hex(b) {
    const cx = b.W / 2, H = b.H, cy = 15, R = 10;
    lathe(b, cx, [[H - 8, 4.2, 'black'], [H - 1, 7.2, 'black']], { linear: true });
    tube(b, [[cx, cy + 8], [cx, H - 8]], 1.6, 'silver', -2);
    const pts = Array.from({ length: 6 }, (_, i) => [cx + Math.cos(Math.PI / 6 + (i * Math.PI) / 3) * R, cy + Math.sin(Math.PI / 6 + (i * Math.PI) / 3) * R]);
    for (let y = cy - R; y <= cy + R; y++) for (let x = cx - R; x <= cx + R; x++) {
      const px = x + 0.5, py = y + 0.5;
      let inside = true;
      for (let i = 0; i < 6; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % 6]; if ((bx - ax) * (py - ay) - (by - ay) * (px - ax) < 0) inside = false; }
      if (!inside) continue;
      // facetas: seis triángulos hacia el centro, cada uno con su inclinación
      const a = Math.atan2(py - cy, px - cx), seg = Math.floor(((a + Math.PI * 2 - Math.PI / 6) % (Math.PI * 2)) / (Math.PI / 3));
      const ma = Math.PI / 6 + seg * (Math.PI / 3) + Math.PI / 6;
      const d = Math.hypot(px - cx, py - cy) / R;
      const tilt = d > 0.25 ? 0.5 : 0;
      let v = metal(norm([Math.cos(ma) * tilt, Math.sin(ma) * tilt, 1]));
      if (Math.abs(d - 0.62) < 0.07) v -= 0.22;
      put(b, x, y, 10, RAMPS.silver[tone(v)], 'silver');
    }
  },
};

// ---------- competiciones ----------
const CLUB_EU_TOP = ['rma', 'bar', 'atm', 'ath', 'ars', 'liv', 'mci', 'mun', 'che', 'tot', 'new', 'int', 'juv', 'mil', 'nap', 'rom', 'it_ata', 'bay', 'bvb', 'lev', 'de_rbl', 'de_vfb', 'psg', 'om', 'fr_mon', 'fr_lil', 'ben', 'fcp', 'scp', 'aja', 'psv', 'cel', 'gal'];
const CLUB_EU_2 = ['es_bet', 'es_rso', 'sev', 'es_vil', 'es_val', 'es_cel', 'en_avl', 'en_bha', 'en_nfo', 'en_whu', 'it_laz', 'it_fio', 'it_bfc', 'it_com', 'de_sge', 'de_scf', 'de_tsg', 'de_bmg', 'fr_lyo', 'fr_nic', 'fr_lens', 'fr_str', 'pt_bra', 'pt_vsc', 'cel', 'gal', 'psv', 'aja'];
const SA_TOP = ['river', 'boca', 'rac', 'ind', 'slo', 'est', 'vel', 'ar_tal', 'ar_lan', 'ar_rce', 'fla', 'pal', 'cor', 'sao', 'br_flu', 'br_bot', 'br_cam', 'br_gre', 'br_sci', 'br_cru', 'colo', 'udch', 'uc', 'pen', 'nac', 'atn', 'ali', 'uni'];
const byGroup = (g) => TEAMS.filter((t) => t.group === g).map((t) => t.id);
const SA_ALL = [...byGroup('Primera de Chile'), ...byGroup('Liga Profesional'), ...byGroup('Brasileirão'), 'pen', 'nac', 'atn', 'ali', 'uni'];

// Copas con cuadro de 16 u 8 equipos (la Europa League y la Sudamericana son de 8).
export const COMPS = [
  { id: 'ucl', name: 'Champions League', sub: 'Los grandes de Europa', art: 'ucl', pool: CLUB_EU_TOP, size: 16 },
  { id: 'uel', name: 'Europa League', sub: 'Clubes de Europa', art: 'uel', pool: CLUB_EU_2, size: 8 },
  { id: 'lib', name: 'Copa Libertadores', sub: 'Los grandes de Sudamérica', art: 'lib', pool: SA_TOP, size: 16 },
  { id: 'sud', name: 'Copa Sudamericana', sub: 'Clubes de Sudamérica', art: 'sud', pool: SA_ALL.filter((id) => !SA_TOP.slice(0, 10).includes(id)), size: 8 },
  { id: 'wc', name: 'Copa del Mundo', sub: 'Selecciones de todo el mundo', art: 'world', pool: byGroup('Selecciones'), size: 16 },
  { id: 'ca', name: 'Copa América', sub: 'Selecciones de América', art: 'ca', pool: ['arg', 'chi', 'bra', 'uru', 'col', 'per', 'ecu', 'par', 'ven', 'bol', 'mex', 'usa', 'can'], size: 8 },
  { id: 'euro', name: 'Eurocopa', sub: 'Selecciones de Europa', art: 'euro', pool: ['esp', 'fra', 'ger', 'eng', 'ita', 'por', 'ned', 'cro', 'bel', 'sui', 'den'], size: 8 },
];
// El torneo libre de siempre.
export const FREE_CUP = { id: 'calc', name: 'Copa Calcciopoli', sub: 'Torneo libre: tú eliges con quién', art: 'calc' };

// Trofeos de liga (modo carrera).
const LEAGUE_ART = {
  cl: { name: 'Campeonato chileno', art: 'cup', o: { mat: 'silver', lid: true, top: 11 } },
  ar: { name: 'Liga Profesional', art: 'cup', o: { mat: 'silver', band: 'blue' } },
  br: { name: 'Brasileirão', art: 'cup', o: { mat: 'gold', base: 'green', handles: false, w: 8.6 } },
  mx: { name: 'Liga MX', art: 'cup', o: { mat: 'silver', base: 'black', w: 8.8 } },
  es: { name: 'LaLiga', art: 'cup', o: { mat: 'silver', base: 'black', lid: true, top: 10 } },
  en: { name: 'Premier League', art: 'cup', o: { mat: 'silver', base: 'black', crown: true, top: 12 } },
  it: { name: 'Serie A', art: 'cup', o: { mat: 'silver', base: 'black', band: 'green', handles: false, w: 8.2 } },
  de: { name: 'Bundesliga', art: 'plate' },
  fr: { name: 'Ligue 1', art: 'hex' },
  pt: { name: 'Primeira Liga', art: 'cup', o: { mat: 'silver', base: 'wood', band: 'red' } },
};
export const TROPHY_LIST = [
  ...COMPS.map((c) => ({ id: c.id, name: c.name, art: c.art })),
  { id: 'calc', name: FREE_CUP.name, art: 'calc' },
  ...Object.entries(LEAGUE_ART).map(([id, l]) => ({ id: `lg_${id}`, name: l.name, art: l.art, o: l.o })),
];

const cache = {};
export function trophyCanvas(id, { sil = false, W = 30, H = 46 } = {}) {
  const key = `${id}|${sil}|${W}x${H}`;
  if (cache[key]) return cache[key];
  const t = TROPHY_LIST.find((x) => x.id === id);
  const b = makeBuf(W, H);
  ART[t.art](b, t.o || {});
  return (cache[key] = finish(b, sil));
}

// ---------- vitrina guardada en el celular ----------
export function loadTrophies() { try { return JSON.parse(localStorage.getItem('fdm-trophies')) || {}; } catch { return {}; } }
// Suma un título: id de la copa, equipo y cuándo.
export function addTrophy(id, team) {
  try {
    const all = loadTrophies();
    (all[id] = all[id] || []).push({ team, at: Date.now() });
    localStorage.setItem('fdm-trophies', JSON.stringify(all));
  } catch { /* sin storage */ }
}

// ---------- la sala ----------
// Sala de trofeos de un club: pared con boiserie de madera y tela verde,
// una vitrina grande de madera y vidrio con focos, y piso de parquet.
// Devuelve dónde quedó cada copa para poder tocarla.
export const ROOM_W = 200;
export const ROOM_ROWS = [
  ['lib', 'ucl', 'wc', 'uel', 'sud'],
  ['ca', 'calc', 'euro'],
  ['lg_cl', 'lg_ar', 'lg_br', 'lg_mx', 'lg_pt'],
  ['lg_es', 'lg_en', 'lg_it', 'lg_de', 'lg_fr'],
];
export function paintRoom(cv, won, kit) {
  const W = ROOM_W, TOP = 46, SHELF = 66, H = TOP + SHELF * ROOM_ROWS.length + 58;
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  const px = (x, y, c) => { g.fillStyle = c; g.fillRect(x, y, 1, 1); };
  const rect = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
  const WOOD = RAMPS.wood;

  // Pared: tela verde oscura con un damasco tenue arriba, boiserie abajo.
  for (let y = 0; y < H - 40; y++) for (let x = 0; x < W; x++) {
    const d = ((x + (Math.floor(y / 10) % 2) * 6) % 12 < 2 && y % 10 < 6) || ((y + 3) % 10 === 0 && x % 12 > 3 && x % 12 < 9);
    const vign = Math.hypot((x - W / 2) / W, (y - 120) / H);
    px(x, y, vign > 0.62 ? '#08160f' : d ? '#16301f' : vign > 0.45 ? '#0d2116' : '#11281b');
  }
  // moldura alta
  rect(0, 0, W, 4, WOOD[1]); rect(0, 4, W, 1, WOOD[4]); rect(0, 5, W, 1, WOOD[0]);
  // boiserie baja (detrás de la vitrina se ve a los costados)
  const wy = H - 92;
  for (let y = wy; y < H - 40; y++) for (let x = 0; x < W; x++) {
    const panel = x % 34, pv = (y - wy) % 52;
    let c = WOOD[2 + (hash(Math.floor(x / 2), y) > 0.82 ? 1 : 0)];
    if (panel === 3 || pv === 4) c = WOOD[4];
    if (panel === 30 || pv === 48) c = WOOD[0];
    px(x, y, c);
  }
  rect(0, wy - 2, W, 2, WOOD[5]); rect(0, wy, W, 1, WOOD[1]);
  // piso de parquet en espiga y una alfombra roja
  for (let y = H - 40; y < H; y++) for (let x = 0; x < W; x++) {
    const u = (x + y) % 16, v = (x - y + 400) % 16, alt = Math.floor((x + y) / 16) % 2;
    let c = WOOD[alt ? 3 : 4];
    if ((alt ? u : v) === 0) c = WOOD[1];
    if (hash(x, y) > 0.9) c = WOOD[alt ? 2 : 3];
    const depth = (y - (H - 40)) / 40;
    if (x > 56 - depth * 14 && x < 144 + depth * 14) c = (x - (56 - depth * 14) < 2 || (144 + depth * 14) - x < 2) ? '#d9a42a' : (hash(x >> 1, y >> 1) > 0.8 ? '#6d1212' : '#7f1717');
    px(x, y, c);
  }
  rect(0, H - 40, W, 1, WOOD[0]);

  // Escudo del club (los colores de tu equipo) colgado arriba.
  const cx = W / 2;
  if (kit) {
    for (let y = 0; y < 26; y++) for (let x = -11; x <= 11; x++) {
      const ww = y < 16 ? 11 : 11 - (y - 16) * 1.1;
      if (Math.abs(x) > ww) continue;
      const edge = Math.abs(x) > ww - 1.5 || y < 1.5;
      const stripe = kit.pattern === 'stripes' ? (Math.floor((x + 11) / 4) % 2) : kit.pattern === 'band' ? (Math.abs(y - x * 0.6 - 10) < 3) : kit.pattern === 'center' ? Math.abs(x) < 3 : kit.pattern === 'hoops' ? (Math.floor(y / 4) % 2) : 0;
      let c = edge ? (x < 0 ? '#f9d968' : '#c48a20') : stripe ? kit.alt2 : kit.shirt;
      px(cx + x, 10 + y, c);
    }
    rect(cx - 12, 8, 25, 2, '#e8b532');
    for (let x = -4; x <= 4; x++) px(cx + x, 7 - Math.round(Math.abs(x) / 2), '#e8b532');
  }

  // Vitrina
  const X0 = 12, X1 = W - 12, Y0 = TOP, Y1 = TOP + SHELF * ROOM_ROWS.length + 8;
  // sombra en la pared
  g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(X0 + 4, Y0 + 4, X1 - X0, Y1 - Y0);
  // cuerpo de madera con cornisa
  for (let y = Y0 - 8; y < Y1 + 10; y++) for (let x = X0 - 4; x < X1 + 4; x++) {
    const inside = x >= X0 + 4 && x < X1 - 4 && y >= Y0 && y < Y1;
    if (inside) continue;
    let k = 3;
    if (y < Y0 - 4) k = y === Y0 - 8 ? 6 : y < Y0 - 6 ? 5 : 2;
    else if (y >= Y1 + 6) k = 1;
    else if (x < X0) k = 4; else if (x >= X1) k = 2;
    if (hash(x, y >> 1) > 0.86) k = Math.max(0, k - 1);
    px(x, y, WOOD[k]);
  }
  // fondo de terciopelo azul noche, iluminado por un foco detrás de cada copa
  const slots = [];
  ROOM_ROWS.forEach((row, r) => {
    const sy = Y0 + r * SHELF;
    const step = (X1 - X0 - 8) / row.length;
    row.forEach((id, i) => slots.push({ id, x: Math.round(X0 + 4 + step * i + step / 2 - 15), y: sy + 8, cx: X0 + 4 + step * i + step / 2, row: r }));
  });
  for (let y = Y0; y < Y1; y++) for (let x = X0 + 4; x < X1 - 4; x++) {
    // cono de luz de cada foco: angosto arriba, se abre hacia el estante
    let best = 0;
    const r = Math.min(ROOM_ROWS.length - 1, Math.floor((y - Y0) / SHELF)), fy = y - (Y0 + r * SHELF);
    for (const s of slots) {
      if (s.row !== r) continue;
      const half = 3 + fy * 0.28;
      const t = 1 - Math.abs(x - s.cx) / half;
      if (t > 0) best = Math.max(best, Math.min(1, t * 1.6) * (0.55 + fy / SHELF * 0.45));
    }
    const back = 0.5 + 0.5 * Math.sin(((y - Y0) % SHELF) / SHELF * Math.PI);
    const c = best > 0.62 ? '#2c3870' : best > 0.25 ? '#212b5a' : back > 0.85 ? '#182044' : '#131a3a';
    px(x, y, c);
  }
  // estantes de vidrio con canto de bronce, y focos arriba de cada piso
  ROOM_ROWS.forEach((row, r) => {
    const sy = Y0 + r * SHELF + SHELF - 6;
    rect(X0 + 4, sy, X1 - X0 - 8, 1, '#e6f2ff');
    rect(X0 + 4, sy + 1, X1 - X0 - 8, 2, '#8fb0c8');
    rect(X0 + 4, sy + 3, X1 - X0 - 8, 1, '#c48a20');
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(X0 + 4, sy + 4, X1 - X0 - 8, 3);
    const ty = Y0 + r * SHELF;
    for (const s of slots.filter((q) => q.row === r)) {
      rect(Math.round(s.cx) - 2, ty, 5, 2, '#3a3a44'); rect(Math.round(s.cx) - 1, ty + 2, 3, 1, '#fff4c0');
      // placa de bronce en el canto del estante
      rect(Math.round(s.cx) - 6, sy + 1, 12, 3, '#8f5c14'); rect(Math.round(s.cx) - 5, sy + 1, 10, 1, '#f9d968'); rect(Math.round(s.cx) - 5, sy + 2, 10, 1, '#c48a20');
    }
  });
  // copas
  const owned = (id) => (won[id] || []).length > 0;
  for (const s of slots) {
    const tc = trophyCanvas(s.id, { sil: !owned(s.id) });
    g.drawImage(tc, s.x, s.y + 4);
  }
  // vidrio: reflejos en diagonal sobre todo el frente
  g.save();
  g.beginPath(); g.rect(X0 + 4, Y0, X1 - X0 - 8, Y1 - Y0); g.clip();
  g.fillStyle = 'rgba(255,255,255,.07)';
  for (let k = -2; k < 6; k++) { g.beginPath(); const x0 = X0 + k * 52; g.moveTo(x0, Y1); g.lineTo(x0 + 14, Y1); g.lineTo(x0 + 14 + 120, Y0); g.lineTo(x0 + 120, Y0); g.fill(); }
  g.fillStyle = 'rgba(255,255,255,.05)';
  for (let k = -2; k < 6; k++) { g.beginPath(); const x0 = X0 + 20 + k * 52; g.moveTo(x0, Y1); g.lineTo(x0 + 4, Y1); g.lineTo(x0 + 124, Y0); g.lineTo(x0 + 120, Y0); g.fill(); }
  g.restore();
  // bisagras y cerradura de bronce
  for (const y of [Y0 + 10, Y1 - 16]) rect(X0 + 1, y, 2, 6, '#e8b532');
  rect(X1 - 3, Y0 + SHELF * 2 - 6, 2, 8, '#e8b532'); px(X1 - 3, Y0 + SHELF * 2 - 3, '#5a380c');
  // patas
  rect(X0 - 2, Y1 + 10, 6, 6, WOOD[1]); rect(X1 - 4, Y1 + 10, 6, 6, WOOD[1]);
  return { W, H, slots: slots.map((s) => ({ id: s.id, x: s.x, y: s.y + 4, w: 30, h: 46 })) };
}
