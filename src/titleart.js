// Portada del menú: pasto de cancha visto desde arriba, con franjas de corte y
// el mismo grano que el pasto de las animaciones, y el logo de Calcciopoli
// (pelota y nombre) pintado en pixel art. Todo se pinta en píxeles grandes y se
// escala sin suavizar.
import { P4 } from './players.js';

const rng = (seed) => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; };

// Pasto: franjas verticales de corte (una clara, una oscura), cada una con el
// brillo del corte que cambia de un borde al otro, grano píxel a píxel, matas
// más oscuras, briznas claras y la luz de los focos que cae al centro.
export function paintGrass(cv, W, H) {
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  const R = rng(19);
  const im = g.createImageData(W, H), d = im.data;
  const SW = Math.max(14, Math.round(W / 7));   // ancho de franja
  const A = [74, 156, 64], B = [62, 138, 54];   // los verdes del partido
  // matas: manchas suaves de pasto más tupido o más gastado
  const blobs = [];
  for (let i = 0; i < (W * H) / 900; i++) blobs.push([R() * W, R() * H, 3 + R() * 9, R() < 0.6 ? -0.07 : 0.05]);
  const field = new Float32Array(W * H);
  for (const [bx, by, br, v] of blobs) {
    for (let y = Math.max(0, by - br | 0); y < Math.min(H, by + br + 1); y++) for (let x = Math.max(0, bx - br | 0); x < Math.min(W, bx + br + 1); x++) {
      const q = ((x - bx) ** 2 + (y - by) ** 2) / (br * br);
      if (q < 1) field[y * W + x] += v * (1 - q);
    }
  }
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const u = x + W * 4 - (W / 2 - SW / 2);
      const band = Math.floor(u / SW) % 2, t = (u % SW) / SW;
      const c = band ? A : B;
      // el corte brilla más hacia un borde de la franja
      let k = 1 + (band ? 0.04 - t * 0.06 : -0.02 + t * 0.05);
      const r = R();
      k *= r < 0.1 ? 0.88 : r < 0.2 ? 1.08 : r < 0.24 ? 0.94 : 1;
      // briznas: un píxel claro con su sombra debajo
      if (r > 0.985) k *= 1.22;
      k += field[y * W + x];
      // luz de estadio: centro más claro, bordes más oscuros
      const dx = (x / W - 0.5) * 1.3, dy = y / H - 0.42;
      k *= 1.08 - (dx * dx + dy * dy) * 0.55;
      const i = (y * W + x) * 4;
      d[i] = c[0] * k; d[i + 1] = c[1] * k; d[i + 2] = c[2] * k; d[i + 3] = 255;
    }
  }
  // sombra corta bajo cada brizna clara
  for (let y = H - 2; y >= 0; y--) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4, j = i + W * 4;
    if (d[i + 1] > 178 && d[j + 1] > 120) { d[j] *= 0.86; d[j + 1] *= 0.86; d[j + 2] *= 0.86; }
  }
  g.putImageData(im, 0, 0);
}

// Logo: pelota cosida arriba y el nombre en letras doradas con relieve:
// borde negro, volumen hacia abajo, banda de brillo y un destello.
// Letras propias, gruesas, para el nombre (trazo de 2 píxeles).
const GLYPHS = {
  C: ['.######', '#######', '##.....', '##.....', '##.....', '##.....', '##.....', '#######', '.######'],
  A: ['.#####.', '#######', '##...##', '##...##', '#######', '#######', '##...##', '##...##', '##...##'],
  L: ['##.....', '##.....', '##.....', '##.....', '##.....', '##.....', '##.....', '#######', '#######'],
  I: ['######', '######', '..##..', '..##..', '..##..', '..##..', '..##..', '######', '######'],
  O: ['.#####.', '#######', '##...##', '##...##', '##...##', '##...##', '##...##', '#######', '.#####.'],
  P: ['######.', '#######', '##...##', '##...##', '#######', '######.', '##.....', '##.....', '##.....'],
};
export function paintLogo(cv) {
  const text = 'CALCCIOPOLI';
  const rows = GLYPHS.C.length;
  const tw = [...text].reduce((w, ch) => w + GLYPHS[ch][0].length + 1, -1);
  const mask = new Uint8Array(tw * rows);
  let gx = 0;
  for (const ch of text) { const gl = GLYPHS[ch]; gl.forEach((row, y) => [...row].forEach((c, x) => { if (c === '#') mask[y * tw + gx + x] = 1; })); gx += gl[0].length + 1; }
  const m = { width: tw, height: rows };
  const on = (x, y) => x >= 0 && y >= 0 && x < tw && y < rows && mask[y * tw + x] === 1;
  let y0 = m.height, y1 = 0;
  for (let y = 0; y < m.height; y++) for (let x = 0; x < m.width; x++) if (on(x, y)) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const th = y1 - y0 + 1;
  const BR = 10, ballS = Math.ceil(BR * 2) + 2, gap = 4, EX = 2; // EX: relieve hacia abajo
  const W = tw + 2 + EX, top = ballS + gap, H = top + th + 2 + EX + 1;
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  // pelota con su sombra
  const cx = W / 2;
  g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(Math.round(cx - BR * 0.75), ballS - 1, Math.round(BR * 1.5), 2);
  g.drawImage(P4.ball(BR, 0.35), Math.round(cx - ballS / 2), 0);
  // letras
  const ox = 1, oy = top + 1 - y0;
  const px = (x, y, c) => { g.fillStyle = c; g.fillRect(x, y, 1, 1); };
  const EXC = ['#8a3c08', '#5e2606'];
  for (let e = EX; e >= 1; e--) for (let y = y0; y <= y1; y++) for (let x = 0; x < m.width; x++) if (on(x, y)) px(ox + x, oy + y + e, EXC[e - 1]);
  // borde negro alrededor de letras y relieve
  const solid = new Set();
  for (let y = y0; y <= y1; y++) for (let x = 0; x < m.width; x++) if (on(x, y)) for (let e = 0; e <= EX; e++) solid.add(`${ox + x},${oy + y + e}`);
  const has = (x, y) => solid.has(`${x},${y}`);
  for (const k of solid) {
    const [x, y] = k.split(',').map(Number);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!has(x + dx, y + dy)) px(x + dx, y + dy, '#0a0805');
  }
  // relleno: bandas de dorado de arriba (claro) a abajo (ámbar)
  const BANDS = ['#ffe680', '#ffd23f', '#ffd23f', '#ffc72e', '#f7b528', '#ec9a1c', '#de8414', '#cf700e', '#c0620a'];
  for (let y = y0; y <= y1; y++) for (let x = 0; x < m.width; x++) if (on(x, y)) {
    const b = BANDS[Math.min(BANDS.length - 1, Math.floor(((y - y0) / th) * BANDS.length))];
    px(ox + x, oy + y, b);
    if (!on(x, y - 1)) px(ox + x, oy + y, '#fffbe6');          // filo de luz arriba
    else if (!on(x - 1, y) && y - y0 < th * 0.6) px(ox + x, oy + y, '#ffeaa0');
  }
  // destello en la primera C
  const sx = ox + 2, sy = oy + y0 + 1;
  px(sx, sy - 2, '#ffffff'); px(sx - 1, sy - 1, 'rgba(255,255,255,.6)'); px(sx + 1, sy - 1, 'rgba(255,255,255,.6)'); px(sx, sy - 1, '#ffffff');
  return { W, H };
}

// Íconos de los modos, en pixel art (cada letra es un color).
const PAL = { k: '#0c0f15', y: '#ffd23f', o: '#c77a12', w: '#f4f1e6', g: '#9aa3b5', b: '#7ec8f0', r: '#e05a4a', n: '#5b4630', d: '#3a4152' };
const ICONS = {
  ball: ['...kkkk...', '..kwwwwk..', '.kwwkkwwk.', 'kwwkkkkwwk', 'kwkwkkwkwk', 'kwwwwwwwwk', 'kwkwwwwkwk', '.kwkwwkwk.', '..kwwwwk..', '...kkkk...'],
  cup: ['kkkkkkkkkk', 'kyyyyyyyyk', 'kyykyyyoyk', '.kyyyyyok.', '..kyyyok..', '...kyok...', '....kk....', '...kyok...', '..kkkkkk..', '..knnnnk..'],
  bracket: ['ww........', 'kkkk......', '...k......', '...kkk....', '...k.k....', 'kkkk.kkkyy', 'ww...k..yy', '...kkk....', '...k......', 'kkkk......'],
  duo: ['..kk..kk..', '.kwwkkwwk.', '.kwwkkwwk.', '..kk..kk..', '.kbbkkrrk.', 'kbbbbkrrrk', 'kbbbbkrrrk', '.kbbk.krk.', '.k.k..k.k.', '..........'],
  table: ['kkkkkkkkkk', 'kyykwwwwwk', 'kkkkkkkkkk', 'kggkwwwwwk', 'kkkkkkkkkk', 'kggkwwwwwk', 'kkkkkkkkkk', 'kddkwwwwwk', 'kkkkkkkkkk', '..........'],
};
export function paintIcon(cv, name) {
  const m = ICONS[name];
  if (!m) return;
  cv.width = m[0].length; cv.height = m.length;
  const g = cv.getContext('2d');
  m.forEach((row, y) => [...row].forEach((ch, x) => { if (PAL[ch]) { g.fillStyle = PAL[ch]; g.fillRect(x, y, 1, 1); } }));
}
