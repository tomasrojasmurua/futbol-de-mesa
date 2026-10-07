// Los himnos: la cámara pasa de cerca por la fila de cada equipo. Los locales
// abrazados por los hombros; los visitantes con la mano en el pecho. Detrás,
// la tribuna fuera de foco con sus banderas y, de noche, los focos.
import { lookOf, kitFor, paint, NUMS } from './cast.js';
import { text as pxText, textW as pxTextW } from '../cutscene.js';
import { LIGHT } from '../matchday.js';
import { rgb, mix, dark, clamp, lerp, ease, seeded, fillPoly, drawSprite, canvas, ellipse, tinted, paintSky, paintRain } from './common.js';
import { vignette } from './locker.js';

const SC = 7;           // de cerca (≈123 px de alto)

const HALF = 1.9;       // segundos por fila

const POSES = {
  linked: () => ({ legs: [{ a: 0.1, f: 0, k: 0.06 }, { a: 0.1, f: 0, k: 0.06 }], arms: [{ a: 1.5, e: -0.7, f: 0, ef: 0 }, { a: 1.5, e: -0.7, f: 0, ef: 0 }] }),
  heart: () => ({ legs: [{ a: 0.08, f: 0, k: 0.06 }, { a: 0.08, f: 0, k: 0.06 }], arms: [{ a: 0.14, e: 0.12, f: 0, ef: 0.3 }, { a: 0.3, e: -2.6, f: 0.5 }] }),
  still: () => ({ legs: [{ a: 0.08, f: 0, k: 0.06 }, { a: 0.08, f: 0, k: 0.06 }], arms: [{ a: 0.05, e: -0.3, f: -0.6, ef: 0 }, { a: 0.05, e: -0.3, f: -0.6, ef: 0 }] }),
};

export class Anthem {
  // o: { teams, kits, cast, at, setup }
  constructor(o) {
    this.o = o;
    const { teams, kits, cast, at, setup } = o;
    const tint = mix(LIGHT[setup.time][setup.weather][1], '#ffffff', setup.time === 'night' ? 0.3 : 0.5);
    this.lines = [0, 1].map((side) => {
      const order = side ? [10, 9, 6, 4] : [9, 10, 7, 4, 2];
      return order.map((i, n) => {
        const pose = side ? (n % 2 ? 'still' : 'heart') : 'linked';
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
    // gradas
    const seat = night ? '#1a1d26' : '#4a4f5a';
    g.fillStyle = seat; g.fillRect(0, sky + 5, W, standB - sky - 5);
    const k0 = kits[side], k1 = kits[1 - side];
    const pal = [k0.shirt, k0.shirt, k0.shirt, k0.alt2 || k0.shirt, '#e8e2d0', '#2c2f38', k1.shirt];
    const skins = ['#e0a77c', '#c68657', '#f1c7a0', '#9c6440'];
    for (let y = sky + 8, r = 0; y < standB - 3; y += 5, r++) {
      for (let c = -1; c < W / 4 + 2; c++) {
        const wx = c * 4 + Math.floor(off / 4) * 4, x = c * 4 - (off % 4) + (r % 2 ? 2 : 0);
        const n = wx * 13 + r * 71 + side * 7;
        if (seeded(n + 9) < 0.06) continue;
        const col = pal[Math.floor(seeded(n + 1) * pal.length)];
        const hop = Math.sin(t * 5 + seeded(n + 3) * 6.28) > 0.75 ? -1 : 0;
        g.fillStyle = col; g.fillRect(Math.round(x), y + 2 + hop, 3, 3);
        g.fillStyle = skins[Math.floor(seeded(n + 5) * 4)]; g.fillRect(Math.round(x) + 1, y + hop, 2, 2);
        // brazos arriba de algunos
        if (seeded(n + 6) < 0.12) { g.fillStyle = skins[0]; g.fillRect(Math.round(x), y - 2 + hop, 1, 2); g.fillRect(Math.round(x) + 3, y - 2 + hop, 1, 2); }
      }
    }
    // banderas grandes que flamean en la tribuna
    for (let i = 0; i < 4; i++) {
      const fx = Math.round(i * 70 + 20 - (off * 1) % 280);
      const x0 = ((fx % 280) + 280) % 280 - 40, y0 = sky + 16 + (i % 2) * 22;
      const kk = i === 3 ? k1 : k0;
      for (let x = 0; x < 30; x++) {
        const wave = Math.round(Math.sin(t * 6 + x * 0.35 + i) * 2);
        const hh = 18;
        for (let y = 0; y < hh; y++) {
          const band = Math.floor((y / hh) * 3);
          let c = band === 1 ? (kk.alt2 || '#ffffff') : kk.shirt;
          if (kk.pattern === 'stripes') c = Math.floor(x / 5) % 2 ? (kk.alt2 || '#fff') : kk.shirt;
          const sh = Math.sin(t * 6 + x * 0.35 + i) > 0.5 ? 0.15 : Math.sin(t * 6 + x * 0.35 + i) < -0.5 ? -0.15 : 0;
          g.fillStyle = sh > 0 ? mix(c, '#ffffff', 0.18) : sh < 0 ? dark(c, 0.22) : c;
          g.fillRect(x0 + x, y0 + y + wave, 1, 1);
        }
      }
      g.fillStyle = '#8a8f99'; g.fillRect(x0 - 1, y0 - 3, 1, 26);
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
    const pan = side ? lerp(150, 0, ease(u)) : lerp(0, 150, ease(u));
    this.paintBg(g, W, H, side, t, pan * 0.35);
    const line = this.lines[side];
    const gap = side ? 64 : 56;
    const feet = Math.round(H * 0.9);
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
