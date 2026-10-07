// Calcciopoli · la previa en película: utilidades compartidas por las escenas.
import { hexRgb } from '../teams.js';
import { crestOf, CREST_W, CREST_H } from '../crests.js';

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
export const easeOut = (t) => 1 - (1 - clamp(t, 0, 1)) ** 2;
export const easeIn = (t) => clamp(t, 0, 1) ** 2;
export const fract = (x) => x - Math.floor(x);
export function seeded(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
export function hash2(x, y) { const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); }

// ---------- color ----------
export const rgb = (c) => {
  if (Array.isArray(c)) return c;
  if (typeof c === 'string' && c.startsWith('rgb')) return c.slice(c.indexOf('(') + 1, -1).split(',').slice(0, 3).map(Number);
  return hexRgb(c && c[0] === '#' ? c : '#888888');
};
export const css = (v, a = 1) => (a >= 1 ? `rgb(${v.map((n) => clamp(Math.round(n), 0, 255)).join(',')})` : `rgba(${v.map((n) => clamp(Math.round(n), 0, 255)).join(',')},${a})`);
export const mixv = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const mulv = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
export const mix = (a, b, t) => css(mixv(rgb(a), rgb(b), t));
export const dark = (c, k) => css(mulv(rgb(c), 1 - k));
export const lum = (c) => { const [r, g, b] = rgb(c); return 0.299 * r + 0.587 * g + 0.114 * b; };
// Rampa de pixel art: sombras hacia violeta, luces hacia crema (como players.js).
export function ramp(c) {
  const v = rgb(c), L = lum(v) / 255;
  return [mixv(mulv(v, 0.42 + L * 0.12), [36, 20, 46], 0.35), mixv(mulv(v, 0.7 + L * 0.06), [56, 36, 74], 0.16), v, mixv(v, [255, 243, 220], 0.26), mixv(v, [255, 250, 240], 0.52)].map((x) => css(x));
}

// Rampa de piel: sombras rojizas, luces cálidas.
export function skinRamp(c) {
  const v = rgb(c);
  return [mixv(mulv(v, 0.55), [69, 24, 42], 0.3), mixv(mulv(v, 0.8), [122, 46, 60], 0.14), v, mixv(v, [255, 206, 190], 0.2), mixv(v, [255, 226, 214], 0.36)].map((x) => css(x));
}

// Cielo en franjas (de arriba hacia el horizonte), igual que la previa.
export const SKY = {
  morning: { clear: ['#78acdf', '#8dbbe6', '#a6caeb', '#c3daee', '#dfe8ec', '#f2e5cc'], cloudy: ['#8a929d', '#949ca6', '#a0a7b0', '#acb2ba', '#b8bdc4', '#c3c7cd'], rain: ['#6f7887', '#7a8391', '#868e9b', '#9198a4', '#9ca2ad', '#a6acb6'] },
  afternoon: { clear: ['#3b3366', '#55406f', '#7a4b74', '#a85a6c', '#d6765c', '#f0a256'], cloudy: ['#57505f', '#655c69', '#776a72', '#8a7a7c', '#9c8a84', '#ad998b'], rain: ['#46465a', '#504f62', '#5d5a6b', '#6a6673', '#76717b', '#837c83'] },
  night: { clear: ['#04060d', '#070b16', '#0b1120', '#0f172b', '#141e37', '#1a2644'], cloudy: ['#090b10', '#0c0f15', '#10141b', '#141922', '#181e28', '#1c232f'], rain: ['#07090e', '#0a0d13', '#0e1219', '#12171f', '#161c25', '#1a212c'] },
};
export function paintSky(g, W, y0, y1, time, weather) {
  const bands = SKY[time][weather];
  const h = y1 - y0;
  for (let i = 0; i < bands.length; i++) {
    const a = y0 + Math.round((h * i) / bands.length), b = y0 + Math.round((h * (i + 1)) / bands.length);
    g.fillStyle = bands[i]; g.fillRect(0, a, W, b - a + 1);
    if (i) { g.fillStyle = bands[i - 1]; for (let x = i % 2; x < W; x += 2) g.fillRect(x, a, 1, 1); }
  }
}

// Lluvia por encima de todo (t en segundos).
export function paintRain(g, W, H, t, n = 120, slant = 0.15) {
  g.fillStyle = 'rgba(40,55,85,0.16)'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < n; i++) {
    const v = 0.8 + seeded(i * 3) * 0.6;
    const y = Math.round(fract(seeded(i * 3 + 1) + t * v * 0.9) * (H + 10)) - 5;
    const x = Math.round(fract(seeded(i * 3 + 2) - t * v * slant) * (W + 6));
    g.fillStyle = i % 3 ? 'rgba(205,220,240,0.5)' : 'rgba(235,242,252,0.75)';
    g.fillRect(x, y, 1, 3); g.fillRect(x - 1, y + 3, 1, 2);
  }
}

// Una copia del dibujo multiplicada por un color (luz de la escena), sin tocar el fondo.
export function tinted(cv, color) {
  const c = document.createElement('canvas');
  c.width = cv.width; c.height = cv.height;
  const g = c.getContext('2d');
  g.drawImage(cv, 0, 0);
  g.globalCompositeOperation = 'multiply'; g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
  g.globalCompositeOperation = 'destination-in'; g.drawImage(cv, 0, 0);
  return c;
}

// Silueta de un dibujo en un solo color (sombras proyectadas, contraluz).
export function silhouette(cv, color) {
  const c = document.createElement('canvas');
  c.width = cv.width; c.height = cv.height;
  const g = c.getContext('2d');
  g.drawImage(cv, 0, 0);
  g.globalCompositeOperation = 'source-in'; g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
  return c;
}

export function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

// Disco/elipse rellena en píxeles (sin suavizado).
export function ellipse(g, cx, cy, rx, ry, color) {
  g.fillStyle = color;
  for (let y = -ry; y <= ry; y++) {
    const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry || 1))));
    g.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1);
  }
}

// Polígono relleno píxel a píxel (sin bordes suavizados), por barrido de filas.
export function fillPoly(g, pts, color) {
  g.fillStyle = color;
  let y0 = Infinity, y1 = -Infinity;
  for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
    const yc = y + 0.5, xs = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      if ((a[1] <= yc && b[1] > yc) || (b[1] <= yc && a[1] > yc)) xs.push(a[0] + ((yc - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
    }
    xs.sort((p, q) => p - q);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const xa = Math.round(xs[k]), xb = Math.round(xs[k + 1]);
      if (xb > xa) g.fillRect(xa, y, xb - xa, 1);
    }
  }
}

// Línea de 1 píxel (Bresenham).
export function line(g, x0, y0, x1, y1, color) {
  g.fillStyle = color;
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (let n = 0; n < 2000; n++) {
    g.fillRect(x0, y0, 1, 1);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

// Dibuja un cuadro de jugador con su punto de apoyo en (x, y); flip lo da vuelta.
export function drawSprite(g, s, x, y, flip = false, img = null) {
  const cv = img || s.cv;
  if (!flip) { g.drawImage(cv, Math.round(x - s.ox), Math.round(y - s.oy)); return; }
  g.save();
  g.translate(Math.round(x + s.ox), Math.round(y - s.oy));
  g.scale(-1, 1);
  g.drawImage(cv, 0, 0);
  g.restore();
}

// Escudo simple del club: blasón con los colores de la camiseta y la sigla.
export function crest(g, cx, cy, kit, short, k = 1, txt) {
  // los clubes con escudo propio (src/crests.js) lo usan; el resto, uno genérico con sus colores
  const real = crestOf(short);
  if (real) {
    const w = CREST_W * k, h = CREST_H * k;
    g.save(); g.imageSmoothingEnabled = false;
    g.drawImage(real, Math.round(cx - w / 2), Math.round(cy - h / 2), w, h);
    g.restore();
    return;
  }
  const w = 12 * k, h = 15 * k;
  const pts = [[cx - w, cy - h], [cx + w, cy - h], [cx + w, cy + h * 0.25], [cx, cy + h], [cx - w, cy + h * 0.25]];
  const ol = [[cx - w - 1, cy - h - 1], [cx + w + 1, cy - h - 1], [cx + w + 1, cy + h * 0.25], [cx, cy + h + 2], [cx - w - 1, cy + h * 0.25]];
  fillPoly(g, ol, '#1b1d24');
  fillPoly(g, pts, kit.shirt);
  const alt = kit.alt2 && kit.alt2 !== kit.shirt ? kit.alt2 : dark(kit.shirt, 0.35);
  g.save();
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) g.lineTo(p[0], p[1]); g.closePath(); g.clip();
  g.fillStyle = alt;
  if (kit.pattern === 'stripes') for (let x = cx - w + 2 * k; x < cx + w; x += 6 * k) g.fillRect(Math.round(x), cy - h, 3 * k, h * 2);
  else if (kit.pattern === 'hoops') for (let y = cy - h + 3 * k; y < cy + h; y += 6 * k) g.fillRect(cx - w, Math.round(y), w * 2, 3 * k);
  else g.fillRect(cx - w, Math.round(cy - h + 4 * k), w * 2, 5 * k);
  g.restore();
  g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(cx - w, cy - h, w * 2, 1);
  if (txt !== false && short) {
    const ink = lum(kit.shirt) > 150 ? '#1b1d24' : '#ffffff';
    const s = short.slice(0, 3), kk = k >= 2 ? 2 : 1, tw = s.length * 4 * kk - kk;
    g.fillStyle = lum(alt) > 150 ? 'rgba(0,0,0,0.0)' : 'rgba(0,0,0,0)';
    textPx(g, s, Math.round(cx - tw / 2), Math.round(cy + 2 * k), ink, kk);
  }
}
import { textPx } from './font3.js';
export { textPx };
