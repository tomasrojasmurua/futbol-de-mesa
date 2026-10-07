// Las banderas en la cancha: plano general desde lo alto de la tribuna. Los
// dos equipos formados en el medio y, detrás, dos banderas gigantes que
// flamean sostenidas por la gente alrededor. Adelante, hinchas de espaldas con
// bufandas arriba; caen papelitos.
import { teamFlag, paintFlag } from '../flags.js';
import { rgb, css, mix, dark, mixv, lum, clamp, lerp, ease, seeded, fillPoly, canvas, paintRain, crest } from './common.js';
import { LIGHT } from '../matchday.js';

// Tela de una bandera: la de la selección, o una con los colores del club.
function flagCloth(team, kit) {
  const key = teamFlag(team.id);
  if (key && team.group === 'Selecciones') {
    const cv = paintFlag(canvas(1, 1), key);
    return cv.getContext('2d').getImageData(0, 0, cv.width, cv.height);
  }
  // bandera del club: el color de la camiseta, dos franjas del color contrario y el escudo grande
  const W = 60, H = 40, cv = canvas(W, H), g = cv.getContext('2d');
  const alt = kit.alt2 && kit.alt2 !== kit.shirt ? kit.alt2 : (lum(kit.shirt) > 150 ? '#1b1d24' : '#ffffff');
  g.fillStyle = kit.shirt; g.fillRect(0, 0, W, H);
  g.fillStyle = alt;
  if (kit.pattern === 'stripes') for (let x = 3; x < W; x += 10) g.fillRect(x, 0, 5, H);
  else if (kit.pattern === 'hoops') for (let y = 3; y < H; y += 10) g.fillRect(0, y, W, 5);
  else { g.fillRect(0, 3, W, 3); g.fillRect(0, H - 6, W, 3); }
  crest(g, W / 2, H / 2 - 2, kit, team.short, 1);
  return g.getImageData(0, 0, W, H);
}

export class Flags {
  // o: { teams, kits, setup, aerial (el mundo del estadio ya armado) }
  constructor(o) {
    this.o = o;
    this.cloth = [0, 1].map((s) => flagCloth(o.teams[s], o.kits[s]));
    this.lightK = mixv(rgb(LIGHT[o.setup.time][o.setup.weather][1]), [255, 255, 255], 0.35).map((v) => v / 255);
    const SK = ['#f1c7a0', '#e0a77c', '#c68657', '#9c6440', '#6e4428'], HR = ['#2a1a10', '#111111', '#4a2e18', '#7a5530', '#d9b25a'];
    this.looks = Array.from({ length: 23 }, (_, i) => ({ skin: SK[Math.floor(seeded(i * 3 + 1) * SK.length)], hair: HR[Math.floor(seeded(i * 3 + 2) * HR.length)] }));
  }

  draw(g, W, H, t) {
    const A = this.o.aerial;
    if (!A) { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); return; }
    if (!A.ready) A.buildAll();
    // cámara alta en la tribuna principal, corriéndose de a poco
    const z = lerp(-8, 8, ease(t / 3.4));
    const cx = -(A.Uin + 9);
    const C = { x: cx, y: 15, z, yaw: Math.PI / 2, look: Math.atan2(15, -cx - 2), aim: 0.5, z0: 12, inside: true, zoom: 1.7 };
    A.render(g, W, H, t, C);
    // los jugadores formados en el medio, mirando a la tribuna
    const fig = [];
    const kits = this.o.kits;
    const looks = this.looks;
    for (let i = 0; i < 11; i++) {
      fig.push([-14, -2.4 - i * 1.15, kits[0], i === 10, looks[i]]);
      fig.push([-14, 2.4 + i * 1.15, kits[1], i === 10, looks[i + 11]]);
    }
    fig.push([-14, 0, { shirt: '#1b1d24', shorts: '#1b1d24', alt2: '#1b1d24' }, false, looks[22]]);
    // dos banderas gigantes detrás de los jugadores, una de cada equipo, sostenidas en el borde
    this.flag(g, A, t, 0, [8, -15], 18, 28);
    this.flag(g, A, t, 1, [8, 15], 18, 28);
    for (const [x, zz, k, gk, lk] of fig) this.mini(g, A, x, zz, k, gk, lk);
    this.fans(g, W, H, t);
    this.confetti(g, W, H, t);
    if (this.o.setup.weather === 'rain') paintRain(g, W, H, t, 120, 0.12);
  }

  // Bandera gigante como una malla que ondula; centro [x, z], ancho en x (hacia la cámara) y largo en z.
  flag(g, A, t, side, [cx, cz], wx, wz) {
    const NU = 26, NV = 40, img = this.cloth[side];
    const P = [];
    for (let i = 0; i <= NU; i++) {
      P.push([]);
      for (let j = 0; j <= NV; j++) {
        const u = i / NU, v = j / NV;
        const edge = Math.min(u, 1 - u, v, 1 - v);
        // la gente sostiene los bordes a la altura de los hombros; el centro sube y baja con el viento
        const y = 1.6 + u * 5.5 + Math.sin(t * 2.6 + v * 7 + u * 3 + side) * 1.1 * Math.min(1, edge * 6) + Math.sin(t * 1.3 + u * 5) * 0.5 * Math.min(1, edge * 4);
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
      const py = Math.min(img.height - 1, Math.floor((1 - (i + 0.5) / NU) * img.height));
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
      if (u > 0.35) continue;   // los de atrás quedan tapados por la tela levantada
      const p = A.project(cx - wx / 2 + u * wx - (u === 0 ? 0.7 : 0), 0, cz - wz / 2 + v * wz);
      if (!p) continue;
      const x = Math.round(p[0]), y = Math.round(p[1]);
      g.fillStyle = n % 3 ? '#e8e2d0' : '#2c2f38'; g.fillRect(x, y - 4, 2, 3);
      g.fillStyle = '#d9a27a'; g.fillRect(x, y - 5, 2, 1);
      g.fillStyle = '#20232b'; g.fillRect(x, y - 1, 2, 1);
    }
  }

  // Un jugador visto de lejos, de frente, dibujado a mano píxel por píxel
  // (pelo, cara, camiseta con su lado en sombra, short, medias y botines).
  mini(g, A, x, z, k, gk, lk) {
    const p = A.project(x, 0, z);
    if (!p) return;
    const X = Math.round(p[0]) - 2, Y = Math.round(p[1]) - 15;
    const L = this.lightK;
    const tint = (c, f = 1) => css(rgb(c).map((v, i) => v * L[i] * f));
    const shirt = gk ? (k.gk || '#2fbf4a') : k.shirt;
    const alt = k.alt2 && k.alt2 !== k.shirt && !gk ? k.alt2 : null;
    const socks = lum(k.shorts || '#222') > 128 ? k.shorts : shirt;
    const C = { h: tint(lk.hair), s: tint(lk.skin), S: tint(lk.skin, 0.75), T: tint(shirt), D: tint(shirt, 0.72), A: alt ? tint(alt) : tint(shirt, 0.86), P: tint(k.shorts || '#222'), Q: tint(k.shorts || '#222', 0.7), k: tint(socks), b: '#16161c' };
    const ROWS = ['.hhh.', '.hss.', '.sSs.', '..S..', 'TTATT', 'TTADD', 'sTADS', 'sTTDS', '.TTD.', '.PPQ.', '.P.Q.', '.s.S.', '.k.k.', '.k.k.', 'bb.bb'];
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(X, Y + 15, 6, 1);
    ROWS.forEach((r, y) => { for (let i = 0; i < 5; i++) { const c = r[i]; if (c === '.') continue; g.fillStyle = C[c] || C.T; g.fillRect(X + i, Y + y, 1, 1); } });
  }

  // La tribuna de adelante: hinchas de espaldas en filas, con bufandas arriba.
  fans(g, W, H, t) {
    const kits = this.o.kits, k = kits[0], night = this.o.setup.time === 'night';
    const top = Math.round(H * 0.84);
    const hairs = ['#1c1c1c', '#2a1a10', '#4a2e18', '#111111', '#7a5530'];
    const tops = [k.shirt, k.shirt, k.alt2 || k.shirt, '#2c2f38', '#e8e2d0', kits[1].shirt];
    const L = this.lightK;
    const lit = (c, f = 1) => css(rgb(c).map((v, i) => v * L[i] * f));
    // los de adelante, muy cerca de la cámara: fuera de foco (se pintan y se suavizan)
    const fw = Math.ceil(W / 2), fh = Math.ceil((H - top + 24) / 2);
    const cv = this.fcv && this.fcv.height === fh ? this.fcv : (this.fcv = canvas(fw, fh));
    const f = cv.getContext('2d');
    f.clearRect(0, 0, fw, fh);
    [[14, 6, 0.5], [20, 8, 0.62]].forEach(([y0, r, sh], row) => {
      const step = r * 2 + 1;
      for (let x = -((row * 5) % step); x < fw + step; x += step) {
        const n = x * 7 + row * 131;
        const y = y0 + Math.round(Math.sin(t * 5 + seeded(n) * 6.28) * (row + 1) * 0.8);
        // hombros, nuca y pelo
        f.fillStyle = lit(tops[Math.floor(seeded(n + 1) * tops.length)], sh);
        f.beginPath(); f.ellipse(x, y + r * 1.6, r * 1.15, r * 0.9, 0, 0, 7); f.fill(); f.fillRect(x - r * 1.15, y + r * 1.6, r * 2.3, fh);
        f.fillStyle = lit(hairs[Math.floor(seeded(n + 2) * hairs.length)], sh);
        f.beginPath(); f.ellipse(x, y + r * 0.4, r * 0.6, r * 0.72, 0, 0, 7); f.fill();
        // bufandas estiradas arriba
        if (seeded(n + 3) < 0.4) {
          const sy = y - r * 0.9 + Math.sin(t * 5 + n) * 1.2;
          for (let s2 = -r; s2 < r; s2++) { f.fillStyle = lit(Math.floor((s2 + r) / 2) % 2 ? (k.alt2 || '#ffffff') : k.shirt, sh + 0.25); f.fillRect(x + s2, sy + Math.sin(s2 * 0.5 + t * 4) * 0.7, 1, 2); }
          f.fillStyle = lit('#c68657', sh); f.fillRect(x - r - 1, sy, 1, r); f.fillRect(x + r, sy, 1, r);
        }
      }
    });
    g.save(); g.imageSmoothingEnabled = true;
    g.drawImage(cv, 0, top - 24, fw * 2, fh * 2);
    g.restore();
    if (night) { g.fillStyle = 'rgba(6,8,14,0.25)'; g.fillRect(0, top - 6, W, H - top + 6); }
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
