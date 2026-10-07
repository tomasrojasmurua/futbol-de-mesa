// Los himnos: la cámara pasa de cerca por la fila de cada equipo. Los locales
// abrazados por los hombros; los visitantes con la mano en el pecho. Detrás,
// la tribuna fuera de foco con sus banderas y, de noche, los focos.
import { lookOf, kitFor, paint, NUMS } from './cast.js';
import { text as pxText, textW as pxTextW } from '../cutscene.js';
import { LIGHT } from '../matchday.js';
import { rgb, mix, dark, clamp, lerp, ease, seeded, fillPoly, drawSprite, canvas, ellipse, tinted, paintSky, paintRain } from './common.js';
import { vignette } from './locker.js';

const SC = 5;           // de cerca (≈170 px de alto: se ven de las rodillas para arriba)

const HALF = 1.9;       // segundos por fila

// Cómo escucha cada uno el himno: manos juntas adelante, atrás, o la mano en el pecho.
const LEGS = () => [{ a: 0.08, f: 0, k: 0.06 }, { a: 0.08, f: 0, k: 0.06 }];
const POSES = {
  clasp: () => ({ legs: LEGS(), arms: [{ a: 0.12, e: -0.95, f: 0.25, ef: 0.5 }, { a: 0.12, e: -0.95, f: 0.25, ef: 0.5 }] }),
  behind: () => ({ legs: LEGS(), arms: [{ a: 0.18, e: -0.3, f: -0.5, ef: -0.4 }, { a: 0.18, e: -0.3, f: -0.5, ef: -0.4 }] }),
  heart: () => ({ legs: LEGS(), arms: [{ a: 0.07, e: 0.04, f: 0, ef: 0.1 }, { a: 0.3, e: -2.6, f: 0.5 }] }),
};
const ORDER = [['clasp', 'heart', 'behind', 'clasp', 'heart'], ['heart', 'behind', 'heart', 'clasp']];

export class Anthem {
  // o: { teams, kits, cast, at, setup }
  constructor(o) {
    this.o = o;
    const { teams, kits, cast, at, setup } = o;
    const tint = mix(LIGHT[setup.time][setup.weather][1], '#ffffff', setup.time === 'night' ? 0.3 : 0.5);
    this.lines = [0, 1].map((side) => {
      const order = side ? [10, 9, 6, 4] : [9, 10, 7, 4, 2];
      return order.map((i, n) => {
        const pose = ORDER[side][n];
        const kit = kitFor(kits[side], lookOf(teams[side], side, i), NUMS[i]);
        const anim = `anthem-${side}-${i}`;
        cast.want(anim, 0, at + side * HALF, () => { const s = paint(POSES[pose](), kit, 'front', SC); return { ...s, cv: tinted(s.cv, tint) }; });
        return { anim, i, n };
      });
    });
  }

  // La tribuna detrás de la fila: hinchas en filas (saltan un poco), banderas
  // que flamean y carteles. off: corrimiento de la cámara.
  paintBg(g, W, H, side, t, off) {
    const { setup, kits, teams } = this.o;
    const night = setup.time === 'night', wet = setup.weather !== 'clear';
    const sky = Math.round(H * 0.1), standB = Math.round(H * 0.56), board = standB, grass = standB + 9;
    paintSky(g, W, 0, sky + 2, setup.time, setup.weather);
    // techo de la tribuna
    g.fillStyle = night ? '#20232c' : '#7d838c'; g.fillRect(0, sky, W, 5);
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, sky + 5, W, 3);
    for (let x = -(off % 24); x < W; x += 24) { g.fillStyle = night ? '#fff6d0' : '#cfd3da'; g.fillRect(Math.round(x), sky + 1, 4, 2); }
    // gradas: la tribuna va fuera de foco (se pinta a la mitad y se agranda, con poco contraste)
    const seat = night ? '#1a1d26' : '#4a4f5a';
    const top = sky + 5, sh2 = Math.ceil((standB - top) / 2), sw2 = Math.ceil(W / 2) + 2;
    const cv = this.blur && this.blur.height === sh2 ? this.blur : (this.blur = canvas(sw2, sh2));
    const b = cv.getContext('2d');
    b.fillStyle = seat; b.fillRect(0, 0, sw2, sh2);
    const k0 = kits[side], k1 = kits[1 - side];
    const pal = [k0.shirt, k0.shirt, k0.shirt, k0.alt2 || k0.shirt, '#e8e2d0', '#2c2f38', k1.shirt];
    const skins = ['#e0a77c', '#c68657', '#f1c7a0', '#9c6440'];
    const o2 = off / 2;
    for (let y = 1, r = 0; y < sh2 - 1; y += 3, r++) {
      // cada fila un poco más oscura hacia arriba (lejos de los focos)
      for (let c = -1; c < sw2 / 2 + 2; c++) {
        const wx = c + Math.floor(o2 / 2), x = c * 2 - (o2 % 2) + (r % 2);
        const n = wx * 13 + r * 71 + side * 7;
        if (seeded(n + 9) < 0.05) continue;
        const hop = Math.sin(t * 5 + seeded(n + 3) * 6.28) > 0.8 ? -1 : 0;
        b.fillStyle = pal[Math.floor(seeded(n + 1) * pal.length)]; b.fillRect(Math.round(x), y + 1 + hop, 2, 2);
        b.fillStyle = skins[Math.floor(seeded(n + 5) * 4)]; b.fillRect(Math.round(x), y + hop, 1, 1);
        if (seeded(n + 6) < 0.1) { b.fillStyle = skins[1]; b.fillRect(Math.round(x) + 1, y - 1 + hop, 1, 1); }
      }
    }
    // banderas grandes que flamean en la tribuna
    for (let i = 0; i < 4; i++) {
      const x0 = (((Math.round(i * 35 + 10 - o2) % 140) + 140) % 140) - 20, y0 = 5 + (i % 2) * 11;
      const kk = i === 3 ? k1 : k0;
      for (let x = 0; x < 15; x++) {
        const wv = Math.sin(t * 6 + x * 0.7 + i), wave = Math.round(wv);
        for (let y = 0; y < 9; y++) {
          let c = Math.floor((y / 9) * 3) === 1 ? (kk.alt2 || '#ffffff') : kk.shirt;
          if (kk.pattern === 'stripes') c = Math.floor(x / 3) % 2 ? (kk.alt2 || '#fff') : kk.shirt;
          b.fillStyle = wv > 0.5 ? mix(c, '#ffffff', 0.15) : wv < -0.5 ? dark(c, 0.2) : c;
          b.fillRect(x0 + x, y0 + y + wave, 1, 1);
        }
      }
    }
    // neblina: baja el contraste (la tribuna queda atrás, fuera de foco)
    b.fillStyle = night ? 'rgba(20,24,36,0.32)' : 'rgba(150,156,168,0.22)'; b.fillRect(0, 0, sw2, sh2);
    // desenfoque: se promedia a la mitad (cada bloque mezcla varias personas) y se agranda
    const qw = Math.ceil(sw2 / 2), qh = Math.ceil(sh2 / 2);
    const q = this.blur2 && this.blur2.height === qh ? this.blur2 : (this.blur2 = canvas(qw, qh));
    const qg = q.getContext('2d');
    qg.imageSmoothingEnabled = true; qg.imageSmoothingQuality = 'medium';
    qg.clearRect(0, 0, qw, qh); qg.drawImage(cv, 0, 0, qw, qh);
    g.save(); g.imageSmoothingEnabled = false;
    g.imageSmoothingEnabled = true;
    g.drawImage(q, -(off % 4), top, qw * 4, qh * 4);
    g.restore();
    // destellos de los celulares y luces en la tribuna (de noche, como bokeh)
    if (night) for (let i = 0; i < 14; i++) {
      const on = Math.sin(t * 3 + i * 7.1) > 0.6;
      if (!on) continue;
      const x = Math.round(((seeded(i + side * 40) * W * 1.5 - off * 0.5) % W + W) % W), y = Math.round(top + 4 + seeded(i + 9) * (standB - top - 10));
      g.fillStyle = 'rgba(255,250,235,0.35)'; g.fillRect(x - 1, y - 1, 4, 4);
      g.fillStyle = 'rgba(255,252,242,0.8)'; g.fillRect(x, y, 2, 2);
    }
    // carteles LED y el pasto
    g.fillStyle = '#0f1117'; g.fillRect(0, board, W, 9);
    const name = teams[side].name.toUpperCase() + ' · CALCCIOPOLI · ';
    const tw = pxTextW(name) + 4;
    for (let x = -((off * 1.3 + t * 20) % tw); x < W; x += tw) pxText(g, name, Math.round(x), board + 2, side ? '#ffe27a' : '#9fe0ff');
    for (let y = grass; y < H; y++) { g.fillStyle = Math.floor((y - grass) / 12) % 2 ? '#3f9c3b' : '#48ab43'; g.fillRect(0, y, W, 1); }
    g.fillStyle = 'rgba(246,246,236,0.8)'; g.fillRect(0, grass + 6, W, 1);
    // la luz de la hora
    const [tS, tG] = LIGHT[setup.time][setup.weather];
    g.save();
    g.globalCompositeOperation = 'multiply';
    g.fillStyle = tS; g.fillRect(0, sky, W, standB - sky);
    g.fillStyle = tG; g.fillRect(0, standB, W, H - standB);
    g.restore();
    if (night) {
      g.save(); g.globalCompositeOperation = 'screen';
      const gr = g.createRadialGradient(W / 2, H, 10, W / 2, H, H * 0.6);
      gr.addColorStop(0, 'rgba(255,246,210,0.2)'); gr.addColorStop(1, 'rgba(255,246,210,0)');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      g.restore();
    }
  }

  draw(g, W, H, t) {
    const side = t < HALF ? 0 : 1;
    const u = side ? (t - HALF) / HALF : t / HALF;
    // el fondo se mueve más lento que los jugadores (paralaje)
    const gap = 80, line = this.lines[side];
    const span = 40 + (line.length - 1) * gap + 40 - W;
    const pan = side ? lerp(span, 0, ease(u)) : lerp(0, span, ease(u));
    this.paintBg(g, W, H, side, t, pan * 0.35);
    const feet = Math.round(H * 1.08);
    line.forEach((p, n) => {
      const s = this.o.cast.get(p.anim, 0, 1);
      if (!s) return;
      const breathe = Math.round(Math.sin(t * 2.2 + n) * 0.6);
      const x = 40 + n * gap - pan;
      drawSprite(g, s, x, feet + breathe);
    });
    // rótulo de la transmisión
    const team = this.o.teams[side];
    const nat = team.group === 'Selecciones';
    const label = nat ? 'HIMNO NACIONAL' : 'HIMNO DEL CLUB';
    const name = team.name.toUpperCase();
    const k = this.o.kits[side];
    const y = Math.round(H * 0.06) + 8;
    const w = Math.max(pxTextW(label), pxTextW(name)) + 14;
    const slide = Math.round((1 - ease(clamp(u * 4, 0, 1))) * -w);
    g.fillStyle = 'rgba(12,14,22,0.82)'; g.fillRect(8 + slide, y, w, 19);
    g.fillStyle = k.shirt; g.fillRect(8 + slide, y, 3, 19);
    pxText(g, label, 15 + slide, y + 3, '#e8c84a');
    pxText(g, name, 15 + slide, y + 11, '#ffffff');
    if (this.o.setup.weather === 'rain') paintRain(g, W, H, t, 90, 0.1);
    vignette(g, W, H);
  }
}
