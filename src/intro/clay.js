// Modelado con volumen para los planos de cerca: cada pieza (un dedo, la
// palma, el botín) se dibuja como silueta, se «infla» según la distancia al
// borde y se ilumina desde arriba a la izquierda en cinco tonos. Las piezas que
// van encima dejan sombra sobre las de abajo. Al final se reduce a píxeles
// quedándose con el tono que más se repite en cada uno.
import { canvas, rgb } from './common.js';

const L = (() => { const v = [-0.52, -0.66, 0.54], n = Math.hypot(...v); return v.map((x) => x / n); })();
const CUT = [0.2, 0.42, 0.66, 0.86];

export class Clay {
  // W, H: tamaño final en píxeles; k: cuántas veces más grande se modela;
  // ox, oy: dónde queda la esquina (las piezas se dibujan en coordenadas del cuadro).
  constructor(W, H, k = 3, ox = 0, oy = 0) {
    this.W = W; this.H = H; this.k = k; this.ox = ox; this.oy = oy;
    const w = this.w = W * k, h = this.h = H * k;
    this.mcv = canvas(w, h);
    this.mg = this.mcv.getContext('2d', { willReadFrequently: true });
    this.code = new Int16Array(w * h).fill(-1);   // rampa * 8 + tono, -1 vacío
    this.ramps = [];
    this.mask = new Uint8Array(w * h);
    this.dist = new Float32Array(w * h);
  }

  rampId(r) {
    let i = this.ramps.indexOf(r);
    if (i < 0) { i = this.ramps.length; this.ramps.push(r); }
    return i;
  }

  // Silueta de la pieza en la máscara; devuelve el recuadro ocupado. Solo se
  // lee la zona que tocan los trazos (se anotan al dibujar).
  stamp(draw) {
    const { w, h, k, mg, mask } = this;
    const b = [1e9, 1e9, -1e9, -1e9];
    const note = (x, y, r = 0) => { if (x - r < b[0]) b[0] = x - r; if (y - r < b[1]) b[1] = y - r; if (x + r > b[2]) b[2] = x + r; if (y + r > b[3]) b[3] = y + r; };
    if (!mg.__noted) {
      mg.__noted = true;
      for (const f of ['moveTo', 'lineTo']) { const o = mg[f].bind(mg); mg[f] = (x, y) => { mg.__note(x, y); o(x, y); }; }
      const q = mg.quadraticCurveTo.bind(mg); mg.quadraticCurveTo = (a, c, x, y) => { mg.__note(a, c); mg.__note(x, y); q(a, c, x, y); };
      const ar = mg.arc.bind(mg); mg.arc = (x, y, r, ...z) => { mg.__note(x, y, r); ar(x, y, r, ...z); };
      const el = mg.ellipse.bind(mg); mg.ellipse = (x, y, rx, ry, ...z) => { mg.__note(x, y, Math.max(rx, ry)); el(x, y, rx, ry, ...z); };
      const re = mg.rect.bind(mg); mg.rect = (x, y, ww, hh) => { mg.__note(x, y); mg.__note(x + ww, y + hh); re(x, y, ww, hh); };
    }
    mg.__note = (x, y, r = 0) => note(x, y, r + (mg.lineWidth || 1));
    mg.setTransform(1, 0, 0, 1, 0, 0);
    mg.clearRect(0, 0, w, h);
    mg.setTransform(k, 0, 0, k, -this.ox * k, -this.oy * k);
    mg.fillStyle = '#fff'; mg.strokeStyle = '#fff'; mg.lineWidth = 1;
    draw(mg);
    const bx0 = Math.max(0, Math.floor((b[0] - this.ox) * k) - 2), by0 = Math.max(0, Math.floor((b[1] - this.oy) * k) - 2);
    const bx1 = Math.min(w - 1, Math.ceil((b[2] - this.ox) * k) + 2), by1 = Math.min(h - 1, Math.ceil((b[3] - this.oy) * k) + 2);
    if (bx1 < bx0 || by1 < by0) return null;
    const bw = bx1 - bx0 + 1, a = mg.getImageData(bx0, by0, bw, by1 - by0 + 1).data;
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    // limpiar lo que quedó marcado de la pieza anterior
    if (this.last) { const [p0, q0, p1, q1] = this.last; for (let y = q0; y <= q1; y++) mask.fill(0, y * w + p0, y * w + p1 + 1); }
    for (let y = by0; y <= by1; y++) for (let x = bx0; x <= bx1; x++) {
      const on = a[((y - by0) * bw + x - bx0) * 4 + 3] > 127 ? 1 : 0;
      mask[y * w + x] = on;
      if (on) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    this.last = [bx0, by0, bx1, by1];
    return x1 < 0 ? null : [x0, y0, x1, y1];
  }

  // Una pieza con volumen.
  // o: { r: redondez (px finales), shadow: [dx, dy] sombra sobre lo de abajo,
  //      tex(x, y): suma a la luz (tejido, músculo), bias: más luz o más sombra,
  //      flat: tono fijo (sin volumen), min/max: tonos permitidos }
  part(draw, ramp, o = {}) {
    const box = this.stamp(draw);
    if (!box) return;
    const { w, k, mask, dist, code } = this;
    const id = this.rampId(ramp);
    const [x0, y0, x1, y1] = box;
    // sombra sobre lo que ya estaba
    const sh = o.shadow === undefined ? [1, 1.4] : o.shadow;
    if (sh) {
      const dx = Math.round(sh[0] * k), dy = Math.round(sh[1] * k);
      for (let y = y0 + dy; y <= y1 + dy && y < this.h; y++) for (let x = x0 + dx; x <= x1 + dx && x < w; x++) {
        const i = y * w + x, s = (y - dy) * w + (x - dx);
        if (x < 0 || y < 0 || !mask[s] || mask[i] || code[i] < 0) continue;
        const t = code[i] & 7;
        if (t > 0) code[i] = (code[i] & ~7) | (t - 1);
      }
    }
    if (o.flat !== undefined) {
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (mask[y * w + x]) code[y * w + x] = id * 8 + o.flat;
      return;
    }
    // distancia al borde (chaflán 3-4) dentro del recuadro
    const X0 = Math.max(0, x0 - 1), Y0 = Math.max(0, y0 - 1), X1 = Math.min(w - 1, x1 + 1), Y1 = Math.min(this.h - 1, y1 + 1);
    const BIG = 1e6;
    for (let y = Y0; y <= Y1; y++) for (let x = X0; x <= X1; x++) dist[y * w + x] = mask[y * w + x] ? BIG : 0;
    for (let y = Y0 + 1; y <= Y1; y++) for (let x = X0 + 1; x < X1; x++) {
      const i = y * w + x;
      if (!dist[i]) continue;
      dist[i] = Math.min(dist[i], dist[i - 1] + 3, dist[i - w] + 3, dist[i - w - 1] + 4, dist[i - w + 1] + 4);
    }
    for (let y = Y1 - 1; y >= Y0; y--) for (let x = X1 - 1; x > X0; x--) {
      const i = y * w + x;
      if (!dist[i]) continue;
      dist[i] = Math.min(dist[i], dist[i + 1] + 3, dist[i + w] + 3, dist[i + w + 1] + 4, dist[i + w - 1] + 4);
    }
    const R = Math.max(1, (o.r || 4) * k) * 3;
    // altura: perfil redondo según la distancia al borde, suavizada para que no
    // quede una arista en el medio (el «lomo» de las formas infladas)
    const bw = X1 - X0 + 1, bh = Y1 - Y0 + 1;
    let hm = new Float32Array(bw * bh), tmp = new Float32Array(bw * bh);
    for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
      const t = Math.min(dist[(y + Y0) * w + x + X0], R) / R;
      hm[y * bw + x] = Math.sqrt(1 - (1 - t) * (1 - t)) * R / 3;
    }
    const rb = Math.max(1, Math.round(k * (o.soft ?? 1.2)));
    for (let pass = 0; pass < 2; pass++) {
      for (let y = 0; y < bh; y++) { let acc = 0; for (let x = -rb; x < bw + rb; x++) { if (x + rb < bw) acc += hm[y * bw + x + rb]; if (x - rb - 1 >= 0) acc -= hm[y * bw + x - rb - 1]; if (x >= 0 && x < bw) tmp[y * bw + x] = acc / (2 * rb + 1); } }
      for (let x = 0; x < bw; x++) { let acc = 0; for (let y = -rb; y < bh + rb; y++) { if (y + rb < bh) acc += tmp[(y + rb) * bw + x]; if (y - rb - 1 >= 0) acc -= tmp[(y - rb - 1) * bw + x]; if (y >= 0 && y < bh) hm[y * bw + x] = acc / (2 * rb + 1); } }
    }
    const bias = o.bias || 0, lo = o.min ?? 0, hi = o.max ?? 4;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const i = y * w + x;
      if (!mask[i]) continue;
      const j = (y - Y0) * bw + (x - X0);
      const nx = -(hm[j + 1] - hm[j - 1]) / 2, ny = -(hm[j + bw] - hm[j - bw]) / 2;
      const n = Math.hypot(nx, ny, 1);
      let v = (nx * L[0] + ny * L[1] + L[2]) / n;
      v = v * 0.92 + bias + (o.tex ? o.tex(x / k + this.ox, y / k + this.oy) : 0);
      let t = 0;
      while (t < 4 && v > CUT[t]) t++;
      code[i] = id * 8 + Math.max(lo, Math.min(hi, t));
    }
  }

  // Una línea fina (cordón, costura) con tono fijo, en coordenadas finales.
  line(pts, ramp, tone, width = 1) {
    this.part((g) => {
      g.lineWidth = width; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
      g.stroke();
    }, ramp, { flat: tone, shadow: 0 });
  }

  // El dibujo final en píxeles (fondo transparente).
  result() {
    const { W, H, k, w, code } = this;
    const out = canvas(W, H), og = out.getContext('2d');
    const im = og.createImageData(W, H), d = im.data;
    const cols = this.ramps.map((r) => r.map(rgb));
    const cnt = new Map();
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      cnt.clear();
      let empty = 0, best = -1, bn = 0;
      for (let yy = y * k; yy < y * k + k; yy++) for (let xx = x * k; xx < x * k + k; xx++) {
        const c = code[yy * w + xx];
        if (c < 0) { empty++; continue; }
        const n = (cnt.get(c) || 0) + 1;
        cnt.set(c, n);
        if (n > bn) { bn = n; best = c; }
      }
      if (empty * 2 > k * k || best < 0) continue;
      const c = cols[best >> 3][best & 7], j = (y * W + x) * 4;
      d[j] = c[0]; d[j + 1] = c[1]; d[j + 2] = c[2]; d[j + 3] = 255;
    }
    og.putImageData(im, 0, 0);
    return out;
  }
}

// Caminos suaves (puntos de control unidos con curvas), para las siluetas.
export function smooth(g, pts) {
  const n = pts.length, mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const m = mid(pts[n - 1], pts[0]);
  g.beginPath(); g.moveTo(m[0], m[1]);
  for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n], mm = mid(p, q); g.quadraticCurveTo(p[0], p[1], mm[0], mm[1]); }
  g.closePath(); g.fill();
}

// Un tramo redondeado de A a B con anchos wa y wb (dedo, antebrazo, canilla).
export function capsule(g, A, B, wa, wb = wa) {
  const dx = B[0] - A[0], dy = B[1] - A[1], l = Math.hypot(dx, dy) || 1;
  const nx = -dy / l, ny = dx / l, a = Math.atan2(dy, dx);
  g.beginPath();
  g.moveTo(A[0] + nx * wa / 2, A[1] + ny * wa / 2);
  g.lineTo(B[0] + nx * wb / 2, B[1] + ny * wb / 2);
  g.arc(B[0], B[1], wb / 2, a + Math.PI / 2, a - Math.PI / 2, true);
  g.lineTo(A[0] - nx * wa / 2, A[1] - ny * wa / 2);
  g.arc(A[0], A[1], wa / 2, a - Math.PI / 2, a + Math.PI / 2, true);
  g.closePath(); g.fill();
}
