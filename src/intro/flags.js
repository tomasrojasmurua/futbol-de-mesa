// Las banderas en la cancha: plano general desde lo alto de la tribuna. Los
// dos equipos formados en el medio y, detrás, dos banderas gigantes que
// flamean sostenidas por la gente alrededor. Adelante, hinchas de espaldas con
// bufandas arriba; caen papelitos.
import { teamFlag, paintFlag } from '../flags.js';
import { rgb, css, mix, dark, mixv, clamp, lerp, ease, seeded, fillPoly, canvas, paintRain } from './common.js';
import { LIGHT } from '../matchday.js';

// Tela de una bandera: la de la selección, o una con los colores del club.
function flagCloth(team, kit) {
  const key = teamFlag(team.id);
  if (key && team.group === 'Selecciones') {
    const cv = paintFlag(canvas(1, 1), key);
    return cv.getContext('2d').getImageData(0, 0, cv.width, cv.height);
  }
  const W = 30, H = 20, cv = canvas(W, H), g = cv.getContext('2d');
  const alt = kit.alt2 && kit.alt2 !== kit.shirt ? kit.alt2 : dark(kit.shirt, 0.35);
  g.fillStyle = kit.shirt; g.fillRect(0, 0, W, H);
  g.fillStyle = alt;
  if (kit.pattern === 'stripes') for (let x = 2; x < W; x += 6) g.fillRect(x, 0, 3, H);
  else if (kit.pattern === 'hoops') for (let y = 2; y < H; y += 6) g.fillRect(0, y, W, 3);
  else if (kit.pattern === 'sash') for (let d = 0; d < W; d++) g.fillRect(d, Math.round(d * 0.66) - 2, 1, 5);
  else { g.fillRect(0, 7, W, 6); }
  // un círculo en el medio con el color contrario
  g.fillStyle = alt; for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) if (x * x + y * y <= 16) g.fillRect(15 + x, 10 + y, 1, 1);
  g.fillStyle = kit.shirt; for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++) if (x * x + y * y <= 5) g.fillRect(15 + x, 10 + y, 1, 1);
  return g.getImageData(0, 0, W, H);
}

export class Flags {
  // o: { teams, kits, setup, aerial (el mundo del estadio ya armado) }
  constructor(o) {
    this.o = o;
    this.cloth = [0, 1].map((s) => flagCloth(o.teams[s], o.kits[s]));
    this.lightK = mixv(rgb(LIGHT[o.setup.time][o.setup.weather][1]), [255, 255, 255], 0.35).map((v) => v / 255);
  }

  draw(g, W, H, t) {
    const A = this.o.aerial;
    if (!A) { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); return; }
    if (!A.ready) A.buildAll();
    // cámara alta en la tribuna principal, corriéndose de a poco
    const z = lerp(-14, 10, ease(t / 3.4));
    const C = { x: -(A.Uin + 9), y: 17, z, yaw: Math.PI / 2, look: Math.atan2(17, A.Uin + 12), aim: 0.42, z0: 12, inside: true };
    A.render(g, W, H, t, C);
    // los jugadores formados en el medio, mirando a la tribuna
    const fig = [];
    const kits = this.o.kits;
    for (let i = 0; i < 11; i++) {
      fig.push([-30, -2.2 - i * 1.1, kits[0], i === 10]);
      fig.push([-30, 2.2 + i * 1.1, kits[1], i === 10]);
    }
    fig.push([-30, 0, { shirt: '#1b1d24', shorts: '#1b1d24' }, false]);
    // dos banderas gigantes detrás, una de cada equipo, sostenidas en el borde
    this.flag(g, A, t, 0, [-6, -22], 26, 36);
    this.flag(g, A, t, 1, [-6, 22], 26, 36);
    for (const [x, zz, k, gk] of fig) this.mini(g, A, x, zz, k, gk);
    this.fans(g, W, H, t);
    this.confetti(g, W, H, t);
    if (this.o.setup.weather === 'rain') paintRain(g, W, H, t, 120, 0.12);
  }

  // Bandera gigante como una malla que ondula; centro [x, z], ancho en x (hacia la cámara) y largo en z.
  flag(g, A, t, side, [cx, cz], wx, wz) {
    const NU = 22, NV = 30, img = this.cloth[side];
    const P = [];
    for (let i = 0; i <= NU; i++) {
      P.push([]);
      for (let j = 0; j <= NV; j++) {
        const u = i / NU, v = j / NV;
        const edge = Math.min(u, 1 - u, v, 1 - v);
        // la gente sostiene los bordes a la altura de los hombros; el centro sube y baja con el viento
        const y = 1.5 + Math.sin(t * 2.6 + v * 7 + u * 3 + side) * 1.1 * Math.min(1, edge * 6) + Math.sin(t * 1.3 + u * 5) * 0.5 * Math.min(1, edge * 4);
        const p = A.project(cx - wx / 2 + u * wx, y, cz - wz / 2 + v * wz);
        P[i].push(p && [p[0], p[1], p[2], y]);
      }
    }
    // de atrás para adelante
    const quads = [];
    for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) {
      const a = P[i][j], b = P[i + 1][j], c = P[i + 1][j + 1], d = P[i][j + 1];
      if (!a || !b || !c || !d) continue;
      quads.push([a[2] + b[2] + c[2] + d[2], i, j, a, b, c, d]);
    }
    quads.sort((p, q) => q[0] - p[0]);
    const L = this.lightK;
    for (const [, i, j, a, b, c, d] of quads) {
      const px = Math.min(img.width - 1, Math.floor(((j + 0.5) / NV) * img.width));
      const py = Math.min(img.height - 1, Math.floor(((i + 0.5) / NU) * img.height));
      const o = (py * img.width + px) * 4;
      // luz según la pendiente de la tela
      const slope = (b[3] - a[3]) + (d[3] - a[3]) * 0.6;
      const sh = clamp(1 + slope * 0.35, 0.62, 1.25);
      const col = [img.data[o] * sh * L[0], img.data[o + 1] * sh * L[1], img.data[o + 2] * sh * L[2]];
      fillPoly(g, [a, b, c, d], css(col));
    }
    // la gente alrededor del borde
    for (let n = 0; n < 40; n++) {
      const per = n / 40;
      let u, v;
      if (per < 0.25) { u = 0; v = per * 4; } else if (per < 0.5) { u = (per - 0.25) * 4; v = 1; } else if (per < 0.75) { u = 1; v = 1 - (per - 0.5) * 4; } else { u = 1 - (per - 0.75) * 4; v = 0; }
      const p = A.project(cx - wx / 2 + u * wx - (u === 0 ? 0.7 : u === 1 ? -0.7 : 0), 0, cz - wz / 2 + v * wz);
      if (!p) continue;
      const x = Math.round(p[0]), y = Math.round(p[1]);
      g.fillStyle = n % 3 ? '#e8e2d0' : '#2c2f38'; g.fillRect(x, y - 4, 2, 3);
      g.fillStyle = '#d9a27a'; g.fillRect(x, y - 5, 2, 1);
      g.fillStyle = '#20232b'; g.fillRect(x, y - 1, 2, 1);
    }
  }

  // Un jugador chiquito (visto de lejos): camiseta, short, medias.
  mini(g, A, x, z, k, gk) {
    const p = A.project(x, 0, z);
    if (!p) return;
    const X = Math.round(p[0]), Y = Math.round(p[1]);
    const L = this.lightK;
    const tint = (c) => css(rgb(c).map((v, i) => v * L[i]));
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(X - 1, Y, 4, 1);
    g.fillStyle = tint(gk ? (k.gk || '#2fbf4a') : k.shirt); g.fillRect(X, Y - 7, 3, 3);
    g.fillStyle = tint(k.shorts || '#222'); g.fillRect(X, Y - 4, 3, 1);
    g.fillStyle = tint('#d9a27a'); g.fillRect(X, Y - 3, 1, 2); g.fillRect(X + 2, Y - 3, 1, 2); g.fillRect(X + 1, Y - 9, 1, 2);
    g.fillStyle = tint(k.shirt); g.fillRect(X, Y - 1, 1, 1); g.fillRect(X + 2, Y - 1, 1, 1);
  }

  // La tribuna de adelante: hinchas de espaldas en filas, con bufandas arriba.
  fans(g, W, H, t) {
    const kits = this.o.kits, k = kits[0], night = this.o.setup.time === 'night';
    const top = Math.round(H * 0.8);
    const seat = night ? '#101218' : '#24262d';
    g.fillStyle = seat; g.fillRect(0, top, W, H - top);
    const hairs = ['#1c1c1c', '#2a1a10', '#4a2e18', '#111111', '#7a5530'];
    const tops = [k.shirt, k.shirt, k.alt2 || k.shirt, '#2c2f38', '#e8e2d0', kits[1].shirt];
    const L = this.lightK;
    const lit = (c, f = 1) => css(rgb(c).map((v, i) => v * L[i] * f));
    // tres filas: más chicas y oscuras atrás, más grandes adelante
    [[top + 2, 5, 0.55], [top + 12, 7, 0.7], [top + 26, 10, 0.85]].forEach(([y0, r, f], row) => {
      const step = r * 2 + 2;
      for (let x = -((row * 7) % step); x < W + step; x += step) {
        const n = x * 7 + row * 131;
        const bob = Math.round(Math.sin(t * 5 + seeded(n) * 6.28) * (row + 1) * 0.6);
        const y = y0 + bob;
        const shirt = tops[Math.floor(seeded(n + 1) * tops.length)];
        // hombros y espalda
        fillPoly(g, [[x - r - 2, H], [x - r - 1, y + r + 2], [x - r + 2, y + r], [x + r - 2, y + r], [x + r + 1, y + r + 2], [x + r + 2, H]], lit(shirt, f));
        // cabeza de atrás (pelo) con la nuca
        g.fillStyle = lit(hairs[Math.floor(seeded(n + 2) * hairs.length)], f);
        g.fillRect(x - Math.ceil(r * 0.6), y - r + 1, Math.ceil(r * 1.2), r + 1);
        g.fillStyle = lit('#c68657', f * 0.8); g.fillRect(x - Math.ceil(r * 0.4), y + 1, Math.ceil(r * 0.8), 1);
        // algunos con la bufanda estirada arriba
        if (seeded(n + 3) < 0.35) {
          const sy = y - r - 6 + Math.round(Math.sin(t * 5 + n) * 1.5);
          g.fillStyle = lit('#c68657', f); g.fillRect(x - r - 1, sy + 2, 1, r + 4); g.fillRect(x + r, sy + 2, 1, r + 4);
          for (let s2 = 0; s2 < r * 2 + 2; s2++) { g.fillStyle = lit(Math.floor(s2 / 3) % 2 ? (k.alt2 || '#ffffff') : k.shirt, f + 0.1); g.fillRect(x - r - 1 + s2, sy + Math.round(Math.sin(s2 * 0.5 + t * 4) * 0.8), 1, 3); }
        }
      }
    });
  }

  confetti(g, W, H, t) {
    const k = this.o.kits;
    const cols = ['#ffffff', '#f4f1ea', k[0].shirt, k[0].alt2 || '#fff', k[1].shirt];
    for (let i = 0; i < 70; i++) {
      const sp = 14 + seeded(i) * 18;
      const y = ((seeded(i + 1) * H + t * sp) % (H + 10)) - 5;
      const x = (seeded(i + 2) * W + Math.sin(t * 2 + i) * 6 + W) % W;
      const flip = Math.sin(t * 8 + i) > 0;
      g.fillStyle = cols[i % cols.length];
      g.fillRect(Math.round(x), Math.round(y), flip ? 2 : 1, flip ? 1 : 2);
    }
  }
}
