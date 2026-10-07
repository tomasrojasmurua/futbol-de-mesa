// Primer plano del camarín: un jugador sentado se ata el botín. Cámara baja,
// de costado: la canilla con la media del club, el botín apoyado en el piso y
// las dos manos que tiran de los cordones, cruzan el nudo y lo aprietan.
// El fondo va fuera de foco (píxeles grandes y poco contraste).
import { Clay, smooth, capsule } from './clay.js';
import { ramp, skinRamp, mix, dark, lum, clamp, lerp, ease, canvas } from './common.js';

const BOOT = '#24242e';
export const CLOSE_LEN = 1.6;
export const CLOSE_FR = 16;

// Dónde va cada cosa (en píxeles del cuadro) según el alto.
function layout(W, H) {
  const gy = Math.round(H * 0.84);
  const bx = 26, by = gy - 7;                 // talón, arriba de la suela
  const P = (x, y) => [bx + x, by + y];
  return { gy, bx, by, P };
}

// Las pinzas de las dos manos (cercana y lejana) y el avance del nudo en el tiempo.
function keys(t, P) {
  const pull = ease(t / 0.7), knot = clamp((t - 0.7) / 0.5, 0, 1), tug = ease((t - 1.2) / 0.3);
  const k = Math.sin(knot * Math.PI);
  const near = [lerp(48, 34, pull) + k * 12 + tug * 2, lerp(-64, -100, pull) + k * 18 - tug * 4];
  const far = [lerp(62, 86, pull) - k * 16 + tug * 2, lerp(-62, -98, pull) + k * 16 - tug * 4];
  return { near: P(...near), far: P(...far), bow: knot > 0.5 ? clamp((knot - 0.5) * 2, 0, 1) : 0, tight: pull };
}

export class CloseUp {
  // o: { pk: camiseta del jugador (piel, medias), kit: del equipo }
  constructor(o) {
    this.o = o;
    this.frames = [];
  }

  // ---------- fondo fuera de foco ----------
  background(W, H) {
    const { kit } = this.o, { gy } = layout(W, H);
    const s = 3, w = Math.ceil(W / s), h = Math.ceil(H / s), cv = canvas(w, h), g = cv.getContext('2d');
    const wall = ramp(mix(kit.shirt, '#1e222c', 0.8)), wood = ramp('#7d5634');
    const y0 = Math.round(gy / s);
    g.fillStyle = wall[1]; g.fillRect(0, 0, w, h);
    // casilleros de madera con camisetas colgadas, apenas reconocibles
    for (let x = -4; x < w; x += 15) {
      g.fillStyle = mix(wood[1], wall[1], 0.45); g.fillRect(x, 6, 14, y0 - 30);
      g.fillStyle = mix(wood[0], wall[0], 0.4); g.fillRect(x + 2, 10, 10, y0 - 36);
      g.fillStyle = mix(kit.shirt, wall[1], 0.45); g.fillRect(x + 4, 16, 6, 10); g.fillRect(x + 3, 17, 8, 3);
      g.fillStyle = mix(wood[2], wall[2], 0.3); g.fillRect(x, 6, 14, 1);
    }
    // el banco (borde de madera iluminado) y su sombra
    const bench = y0 - 26;
    g.fillStyle = mix(wood[2], wall[1], 0.25); g.fillRect(0, bench, w, 4);
    g.fillStyle = mix(wood[3], wall[2], 0.3); g.fillRect(0, bench, w, 1);
    g.fillStyle = wall[0]; g.fillRect(0, bench + 4, w, 3);
    for (const x of [5, 44]) { g.fillStyle = mix(wood[0], wall[0], 0.3); g.fillRect(x, bench + 4, 2, y0 - bench - 4); }
    // un bolso y una botella al fondo, a la derecha
    g.fillStyle = mix(dark(kit.shirt, 0.5), wall[1], 0.4); g.fillRect(40, y0 - 9, 15, 9);
    g.fillStyle = mix('#3aa0e0', wall[1], 0.45); g.fillRect(33, y0 - 8, 2, 8);
    // piso de goma con reflejos de los tubos de luz
    const fl = ramp(mix(kit.shirt, '#191c24', 0.82));
    for (let y = y0; y < h; y++) { g.fillStyle = y === y0 ? fl[0] : fl[1]; g.fillRect(0, y, w, 1); }
    g.fillStyle = fl[2]; g.fillRect(8, y0 + 3, 18, 1); g.fillRect(36, y0 + 6, 14, 1);
    return cv;
  }

  // ---------- la canilla y el botín (se modelan una vez) ----------
  legAndBoot(W, H) {
    const { pk, kit } = this.o, { P, bx, by, gy } = layout(W, H);
    const C = new Clay(W, gy + 2 - 0, 3, 0, 0);
    const sock = ramp(pk.socks), boot = ramp(BOOT), skin = skinRamp(pk.skin);
    const trim = pk.sockTrim && pk.sockTrim !== pk.socks ? pk.sockTrim : (lum(pk.socks) > 140 ? kit.shirt : '#f4f1ea');
    // la canilla: una sola silueta (pantorrilla atrás, canilla recta adelante), media acanalada
    const ank = P(26, -58), knee = P(-8, -340);
    const ax = knee[0] - ank[0], ay = knee[1] - ank[1], al = Math.hypot(ax, ay), ux = ax / al, uy = ay / al;
    const rib = (x, y) => { const v = (x - ank[0]) * -uy + (y - ank[1]) * ux; return ((Math.floor(v * 0.6) % 2) + 2) % 2 ? -0.06 : 0.02; };
    const legPts = [[8, -50], [44, -54], [46, -90], [40, -160], [30, -250], [24, -340], [-36, -340], [-40, -260], [-34, -190], [-22, -140], [-6, -100], [6, -70]].map((q) => P(...q));
    C.part((g) => smooth(g, legPts), sock, { r: 18, tex: rib, shadow: 0 });
    // el relieve de la canillera bajo la media
    C.part((g) => smooth(g, [[40, -96], [44, -130], [36, -210], [26, -236], [20, -200], [24, -120]].map((q) => P(...q))), sock, { r: 8, tex: rib, bias: 0.06, shadow: [-0.6, 0.8] });
    // franjas de la media arriba (salen del cuadro)
    const clipTo = (y0, y1) => (g) => { g.save(); g.beginPath(); g.rect(0, P(0, y1)[1], W, P(0, y0)[1] - P(0, y1)[1]); g.clip(); smooth(g, legPts); g.restore(); };
    C.part(clipTo(-262, -276), ramp(trim), { r: 18, shadow: 0 });
    C.part(clipTo(-284, -292), ramp(trim), { r: 18, shadow: 0 });
    // el botín
    const up = [[3, 0], [0, -14], [-1, -30], [2, -44], [7, -53], [16, -57], [32, -58], [44, -55], [52, -50], [64, -44], [82, -36], [102, -28], [120, -21], [132, -14], [138, -6], [137, 1], [128, 3], [8, 3]];
    C.part((g) => smooth(g, up.map((q) => P(...q))), boot, { r: 10 });
    // el cuello tejido (como una media) y el talón reforzado
    C.part((g) => smooth(g, [[4, -48], [6, -58], [14, -63], [30, -64], [42, -61], [48, -52], [40, -50], [20, -51]].map((q) => P(...q))), boot, { r: 4, bias: -0.08 });
    C.part((g) => smooth(g, [[1, -6], [-1, -26], [3, -42], [12, -40], [12, -8]].map((q) => P(...q))), boot, { r: 6, bias: 0.04 });
    // la lengüeta y la zona de los cordones
    C.part((g) => smooth(g, [[44, -56], [50, -60], [60, -54], [100, -36], [98, -30], [56, -44], [46, -50]].map((q) => P(...q))), boot, { r: 4, bias: 0.12 });
    // la pipa del club en el costado
    const al2 = kit.alt2 && kit.alt2.toLowerCase() !== '#ffffff' ? kit.alt2 : kit.shirt;
    C.part((g) => smooth(g, [[18, -16], [40, -30], [74, -34], [92, -30], [74, -27], [44, -22], [22, -12]].map((q) => P(...q))), ramp(al2), { r: 3 });
    // suela y tapones
    const sole = ramp('#e8e2d2');
    C.part((g) => smooth(g, [[2, 0], [130, 0], [139, -4], [140, 2], [132, 6], [4, 6], [0, 3]].map((q) => P(...q))), sole, { r: 2, shadow: 0 });
    for (const x of [6, 22, 86, 104, 120]) C.part((g) => smooth(g, [[x, 5], [x + 9, 5], [x + 8, 12], [x + 1, 12]].map((q) => P(...q))), sole, { r: 2, bias: -0.15, shadow: 0 });
    // costuras
    const seam = [];
    for (let x = 10; x < 128; x += 1) seam.push(P(x, x < 50 ? -46 + (x - 10) * 0.02 : lerp(-42, -10, (x - 50) / 78)));
    for (let i = 0; i < seam.length - 2; i += 4) C.line([seam[i], seam[i + 1]], boot, 4, 0.6);
    // los ojales
    this.eyes = [];
    for (let i = 0; i < 6; i++) { const u = i / 5; this.eyes.push(P(lerp(52, 94, u), lerp(-53, -36, u))); }
    for (const e of this.eyes) C.part((g) => { g.beginPath(); g.arc(e[0] + 1, e[1] + 1.5, 1.1, 0, 7); g.fill(); }, boot, { flat: 0, shadow: 0 });
    this.legBoot = C.result();
    this.gy = gy;
    this.skin = skin;
  }

  // ---------- una mano que pinza el cordón ----------
  // tip: punto de la pinza; ang: hacia dónde apunta la mano; side: 1 cercana, 0 lejana.
  // La mano se ve desde el dorso: los dedos doblados hacia el botín y el índice
  // y el pulgar que apretan la punta del cordón.
  hand(C, tip, ang, side, sk) {
    const Z = 1.45;                                   // tamaño (una mano real es medio botín)
    const d = [Math.cos(ang), Math.sin(ang)], n = [-d[1], d[0]];
    const s = side ? 1 : -1;
    const tipL = [50, 13];
    const W0 = [tip[0] - (d[0] * tipL[0] + n[0] * tipL[1] * s) * Z, tip[1] - (d[1] * tipL[0] + n[1] * tipL[1] * s) * Z];
    const T = (u, v) => [W0[0] + (d[0] * u + n[0] * v * s) * Z, W0[1] + (d[1] * u + n[1] * v * s) * Z];
    const bias = side ? 0.02 : -0.14;
    const crease = (pts, tone) => C.line(pts.map(([u, v]) => T(u, v)), sk, tone, 0.9);
    // antebrazo: ancho arriba, se angosta en la muñeca
    C.part((g) => smooth(g, [T(-2, -10), T(-40, -14), T(-130, -18), T(-130, 18), T(-40, 14), T(-2, 11)]), sk, { r: 20, bias, shadow: 0 });
    // el pulgar (asoma debajo del índice, hacia la pinza)
    C.part((g) => capsule(g, T(10, 9), T(30, 15), 11, 9.5), sk, { r: 6, bias: bias - 0.1 });
    C.part((g) => capsule(g, T(30, 15), T(tipL[0] - 3, tipL[1] + 3), 9, 7.5), sk, { r: 5, bias: bias - 0.06 });
    // el dorso de la mano
    C.part((g) => smooth(g, [T(-2, -10), T(12, -12), T(26, -14), T(32, -12), T(33, 0), T(32, 11), T(24, 13), T(10, 12), T(-2, 10)]), sk, { r: 16, bias: bias + 0.04, shadow: 0 });
    // tres dedos doblados hacia la palma: falange estirada y la punta que se esconde
    // (gorditos y juntos: se tocan, sin aire entre ellos)
    const fingers = [[-9.5, 8.6, 38], [-3.5, 9.4, 40], [2.5, 9.8, 41]];
    fingers.forEach(([v, wd, len], f) => {
      const k1 = [len, v + 1];
      C.part((g) => { capsule(g, T(28, v), T(...k1), wd, wd - 0.5); capsule(g, T(...k1), T(k1[0] - 2, k1[1] + 6), wd - 0.5, wd - 1.2); }, sk, { r: 5, bias: bias - f * 0.02, shadow: [0.4, 0.6], max: 3 });
    });
    // el índice: estirado hacia la pinza
    C.part((g) => { capsule(g, T(29, 8.5), T(42, 11), 10, 9); capsule(g, T(42, 11), T(tipL[0], tipL[1]), 9, 7.6); }, sk, { r: 5, bias: bias + 0.04, shadow: [0.4, 0.6] });
    // luz en los nudillos
    if (side) for (const v of [-9.5, -3.5, 2.5, 8.5]) C.line([T(29, v - 1.2), T(29.5, v + 1)], sk, 3, 1.2);
    // la uña del índice
    C.line([T(tipL[0] - 4.5, tipL[1] - 2.4), T(tipL[0] - 1.2, tipL[1] - 1.9)], sk, side ? 4 : 3, 1.6);
  }

  // Un cuadro del primer plano (las manos y los cordones), ya en píxeles.
  // which: 'back' (la mano de atrás) o 'front' (cordones y la mano de adelante).
  frame(W, H, i, which) {
    const { P } = layout(W, H);
    const t = (i / (CLOSE_FR - 1)) * CLOSE_LEN;
    const K = keys(t, P);
    const sk = skinRamp(this.o.pk.skin);
    const lace = ramp('#f2efe6');
    const oy = Math.round(H * 0.25), h = Math.round(H * 0.84) - oy;
    // la mano de atrás (queda detrás del botín y de la canilla)
    if (which === 'back') {
      const back = new Clay(W, h, 3, 0, oy);
      this.hand(back, K.far, 1.15 - K.tight * 0.25, 0, sk);
      return back.result();
    }
    // la mano de adelante, los cordones y el moño
    const front = new Clay(W, h, 3, 0, oy);
    const top = this.eyes[0];
    const knotAt = [top[0] + 1, top[1] - 4];
    // cordones cruzados entre los ojales (más flojos al principio)
    for (let j = 0; j < 5; j++) {
      const [ax, ay] = this.eyes[j], [cx, cy] = this.eyes[j + 1];
      const sag = (1 - K.tight) * (5 - j) * 0.5;
      front.line([[ax - 2, ay - 2 + sag], [cx + 2, cy + 1 + sag]], lace, 3, 1.4);
      front.line([[ax + 2, ay + 1 + sag], [cx - 2, cy - 2 + sag]], lace, 2, 1.4);
    }
    // el moño: dos rulos que crecen
    if (K.bow > 0) {
      const r = 2 + K.bow * 5;
      for (const sx of [-1, 1]) {
        const c = [knotAt[0] + sx * (r + 0.5), knotAt[1] - r * 0.5];
        front.part((g) => { g.lineWidth = 1.5; g.beginPath(); g.ellipse(c[0], c[1], r, r * 0.62, sx * -0.5, 0, 7); g.stroke(); }, lace, { flat: sx > 0 ? 2 : 3, shadow: [0.6, 0.8] });
      }
      front.part((g) => { g.beginPath(); g.arc(knotAt[0], knotAt[1], 1.8, 0, 7); g.fill(); }, lace, { flat: 3, shadow: 0 });
    }
    // las puntas del cordón hasta los dedos
    for (const [h0, dx] of [[K.far, 2], [K.near, -2]]) front.line([[knotAt[0] + dx, knotAt[1]], [lerp(knotAt[0], h0[0], 0.5), lerp(knotAt[1], h0[1], 0.5) + 3], h0], lace, dx > 0 ? 2 : 3, 1.5);
    this.hand(front, K.near, 0.55 - K.tight * 0.15, 1, sk);
    return front.result();
  }

  base(W, H) {
    if (this.bg && this.bgH === H) return;
    this.bg = this.background(W, H); this.bgH = H; this.legAndBoot(W, H); this.frames = [];
  }

  // Pinta de antemano una mitad de un cuadro (para repartir el trabajo).
  prepare(W, H, i, which) {
    this.base(W, H);
    if (i == null) return;
    const f = this.frames[i] || (this.frames[i] = {});
    if (!f[which]) f[which] = this.frame(W, H, i, which);
  }

  draw(g, W, H, t) {
    this.base(W, H);
    g.save(); g.imageSmoothingEnabled = false;
    g.drawImage(this.bg, 0, 0, this.bg.width * 3, this.bg.height * 3);
    g.restore();
    const want = clamp(Math.round((t / CLOSE_LEN) * (CLOSE_FR - 1)), 0, CLOSE_FR - 1);
    // el cuadro pedido, o el más cercano ya pintado (si no hay ninguno, se pinta ahora)
    let i = want;
    for (let d = 0; d < CLOSE_FR; d++) {
      const a = this.frames[want - d], b = this.frames[want + d];
      if (a && a.back && a.front) { i = want - d; break; }
      if (b && b.back && b.front) { i = want + d; break; }
    }
    this.prepare(W, H, i, 'back'); this.prepare(W, H, i, 'front');
    const f = this.frames[i], oy = Math.round(H * 0.25);
    g.drawImage(f.back, 0, oy);
    // sombra del pie en el piso
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(8, this.gy + 1, 158, 2); g.fillRect(18, this.gy + 3, 136, 1);
    g.drawImage(this.legBoot, 0, 0);
    g.drawImage(f.front, 0, oy);
  }
}
