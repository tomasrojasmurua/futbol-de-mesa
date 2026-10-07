// Calciopoli · herramientas para dibujar escudos en una grilla de 28 × 34 píxeles.
import { textPx } from './intro/font3.js';

export const W = 28, H = 34;
export const BK = '#15171d';
export const WH = '#f6f3ea';

export const poly = (g, c, pts) => { g.fillStyle = c; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill(); };
export const rect = (g, c, x, y, w, h) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
export const circ = (g, c, x, y, r) => { g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); };
export const ell = (g, c, x, y, rx, ry, a = 0) => { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rx, ry, a, 0, 7); g.fill(); };
export const px = (g, c, ...pts) => { g.fillStyle = c; for (let i = 0; i < pts.length; i += 2) g.fillRect(pts[i], pts[i + 1], 1, 1); };
export const clip = (g, pts) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.clip(); };
export const word = (g, s, x, y, c, k = 1) => textPx(g, s, x, y, c, k);
// Dibujo a mano por filas: cada letra es un color de `map`, el punto es vacío.
export const art = (g, x, y, rows, map) => rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (map[r[i]]) { g.fillStyle = map[r[i]]; g.fillRect(x + i, y + j, 1, 1); } });

// El casco clásico: tapa recta arriba, lados rectos y punta abajo.
export const SHIELD = (i = 0) => [[2 + i, 2 + i], [25 - i, 2 + i], [25 - i, 17], [22 - i * 0.6, 24 - i * 0.4], [13.5, 32 - i * 1.4], [5 + i * 0.6, 24 - i * 0.4], [2 + i, 17]];


// Un anillo (trazo circular) de ancho w.
export const ring = (g, c, x, y, r, w) => { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke(); };
// Estrella de cinco puntas.
export const star = (g, c, x, y, r) => { const p = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.42 : r; p.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); } poly(g, c, p); };
// Franjas verticales / horizontales de colores iguales en un rectángulo.
export const vstripes = (g, cols, x0, x1, y0, y1) => { const w = (x1 - x0) / cols.length; cols.forEach((c, i) => rect(g, c, Math.round(x0 + i * w), y0, Math.round(w + (i < cols.length - 1 ? 0.5 : 0)), y1 - y0)); };
export const hstripes = (g, cols, x0, x1, y0, y1) => { const h = (y1 - y0) / cols.length; cols.forEach((c, i) => rect(g, c, x0, Math.round(y0 + i * h), x1 - x0, Math.round(h + (i < cols.length - 1 ? 0.5 : 0)))); };
// Disco de varios aros: [[radio, color], ...] de afuera hacia adentro.
export const disc = (g, layers, cx = 13.5, cy = 17) => layers.forEach(([r, c]) => circ(g, c, cx, cy, r));
// Recorta el dibujo siguiente al círculo (hay que cerrar con g.restore()).
export const clipCirc = (g, r, cx = 13.5, cy = 17) => { g.save(); g.beginPath(); g.arc(cx, cy, r, 0, 7); g.clip(); };
export const clipPoly = (g, pts) => { g.save(); clip(g, pts); };
