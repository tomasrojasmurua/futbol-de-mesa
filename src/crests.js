// Calcciopoli · escudos de los clubes en pixel art.
// Cada escudo se dibuja a mano sobre una grilla de 28 × 34 píxeles con los
// colores reales del club, se ajusta a su paleta (sin mezclas), se cierra con
// un contorno oscuro y queda en una caché. Se piden por la sigla del equipo.
import { hexRgb as rgb } from './teams.js';
import { W, H, BK, WH, poly, rect, circ, ell, px, clip, word, art, SHIELD } from './crestkit.js';
import { CRESTS2 } from './crests2.js';
import { CRESTS3 } from './crests3.js';
import { CRESTS_CL } from './crests_cl.js';
import { CRESTS_AR } from './crests_ar.js';
import { CRESTS_ES } from './crests_es.js';
import { CRESTS_IT } from './crests_it.js';
import { CRESTS_FR } from './crests_fr.js';
import { CRESTS_BR } from './crests_br.js';

const CRESTS = {
  // Colo-Colo: el cacique de perfil con su penacho, en un escudo blanco y negro.
  CC: {
    pal: [BK, WH, '#c9c5b8', '#d0202c', '#8a8578', '#3a3a42'],
    draw(g) {
      poly(g, BK, SHIELD(0));
      poly(g, WH, SHIELD(2));
      // el penacho: plumas que se abren hacia atrás y arriba (negras y grises)
      g.lineCap = 'butt';
      [[10, 11, 4.5, 5, '#3a3a42'], [11.5, 10.5, 8, 3.2, BK], [13.5, 10, 12.5, 2.6, '#3a3a42'], [15.5, 10.5, 17, 3.2, BK], [17, 11.5, 21, 5.5, '#3a3a42']].forEach(([x0, y0, x1, y1, c]) => {
        g.strokeStyle = c; g.lineWidth = 2.4; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
      });
      // la cabeza de perfil, mirando a la derecha
      poly(g, BK, [[8, 12], [11, 9.8], [16, 10.5], [17.8, 13], [20.5, 16.5], [18.6, 17.8], [19.4, 19.4], [18.2, 21.2], [17.2, 23], [14, 24.8], [9, 25.5], [6.5, 19]]);
      poly(g, BK, [[8, 24], [8, 30], [19, 30], [17.5, 24]]);
      rect(g, '#d0202c', 8, 12.2, 10, 1.8);
      px(g, WH, 15, 15, 16, 15);
      poly(g, '#8a8578', [[10.5, 16], [13, 15.5], [13, 19], [10.5, 21]]);
    },
  },
  // U. de Chile: escudo azul con la U blanca y la franja roja.
  UCH: {
    pal: [BK, WH, '#0b3fa8', '#072a78', '#d6182b', '#8c0f1e', '#3a68c8'],
    draw(g) {
      poly(g, BK, SHIELD(0));
      poly(g, '#0b3fa8', SHIELD(1.5));
      g.save(); clip(g, SHIELD(1.5)); rect(g, '#d6182b', 0, 3, 28, 6); rect(g, '#8c0f1e', 0, 8, 28, 1); rect(g, '#3a68c8', 0, 4, 28, 1); g.restore();
      // una gran U blanca con su sombra
      const U = (ox, oy, c) => { rect(g, c, 6 + ox, 11 + oy, 4, 11); rect(g, c, 17 + ox, 11 + oy, 4, 11); poly(g, c, [[6 + ox, 21 + oy], [21 + ox, 21 + oy], [19 + ox, 27 + oy], [13.5 + ox, 28 + oy], [8 + ox, 27 + oy]]); };
      U(1, 1, '#072a78'); U(0, 0, WH);
      rect(g, '#0b3fa8', 10, 11, 7, 12); poly(g, '#0b3fa8', [[10, 22], [17, 22], [15.5, 25], [11.5, 25]]);
      rect(g, '#072a78', 14, 11, 3, 12);
    },
  },
  // Real Madrid: la corona sobre el círculo blanco con la banda azul y el borde dorado.
  RMA: {
    pal: [BK, WH, '#e8c34a', '#b8902a', '#fbe79a', '#1d4fa3', '#143a7c', '#d0d4dc', '#a03030'],
    draw(g) {
      // corona
      poly(g, '#b8902a', [[7, 9], [6, 2], [10, 5], [13.5, 1], [17, 5], [21, 2], [20, 9]]);
      poly(g, '#e8c34a', [[8, 8.5], [7.5, 3.5], [10.5, 6], [13.5, 2.5], [16.5, 6], [19.5, 3.5], [19, 8.5]]);
      rect(g, '#1d4fa3', 7, 8, 14, 3); rect(g, '#143a7c', 7, 10, 14, 1);
      px(g, '#a03030', 10, 8, 17, 8); px(g, '#fbe79a', 13, 8, 13, 3, 8, 3, 19, 3);
      // el escudo redondo
      circ(g, '#b8902a', 13.5, 21, 12); circ(g, '#e8c34a', 13.5, 21, 11.2); circ(g, '#b8902a', 13.5, 21, 9.7); circ(g, WH, 13.5, 21, 9);
      g.save(); g.beginPath(); g.arc(13.5, 21, 9, 0, 7); g.clip();
      poly(g, '#1d4fa3', [[3, 14], [7, 11], [26, 30], [22, 33]]);
      poly(g, '#143a7c', [[5, 16.5], [8, 14], [26, 31.5], [23.5, 33.5]]);
      px(g, '#fbe79a', 9, 15, 13, 18, 17, 21);
      g.restore();
      // los dos pilares y la cruz del escudo
      rect(g, '#b8902a', 18, 26, 1, 1);
    },
  },
  // Barcelona: el escudo con la cruz de San Jorge, la senyera y las franjas blaugranas.
  BAR: {
    pal: [BK, WH, '#edbb00', '#b88a00', '#a50044', '#6e002d', '#004d98', '#002e63', '#d0d4dc'],
    draw(g) {
      poly(g, '#edbb00', SHIELD(0));
      poly(g, BK, SHIELD(1));
      g.save(); clip(g, SHIELD(1.8));
      // arriba: cruz de San Jorge (izq.) y senyera (der.)
      rect(g, WH, 0, 0, 14, 14); rect(g, '#a50044', 6.5, 0, 2.5, 14); rect(g, '#a50044', 0, 5.5, 14, 2.5);
      rect(g, '#edbb00', 14, 0, 14, 14); for (let i = 0; i < 4; i++) rect(g, '#a50044', 14, 1.5 + i * 3.2, 14, 1.6);
      // abajo: franjas
      for (let x = 0; x < 28; x += 6) { rect(g, '#004d98', x, 14, 3, 20); rect(g, '#a50044', x + 3, 14, 3, 20); }
      rect(g, '#002e63', 0, 12.5, 28, 1); rect(g, '#6e002d', 0, 18, 28, 1);
      // la pelota
      circ(g, WH, 13.5, 26, 3.5); circ(g, '#d0d4dc', 14.5, 27, 2); px(g, '#6e002d', 12, 25, 15, 26);
      // franja del medio con las letras
      rect(g, '#edbb00', 0, 13, 28, 5); rect(g, '#b88a00', 0, 17, 28, 1);
      word(g, 'FCB', 8, 13, '#004d98');
      g.restore();
    },
  },
  // Boca Juniors: óvalo azul con la franja dorada y las iniciales.
  BOC: {
    pal: [BK, WH, '#0b2c7a', '#071c52', '#f7c600', '#b08c00', '#2c52b0'],
    draw(g) {
      poly(g, '#f7c600', SHIELD(0));
      poly(g, '#0b2c7a', SHIELD(1.5));
      g.save(); clip(g, SHIELD(1.5));
      rect(g, '#2c52b0', 3, 3, 3, 30); rect(g, '#071c52', 21, 3, 4, 30);
      // franja dorada central
      rect(g, '#f7c600', 0, 12, 28, 9); rect(g, '#b08c00', 0, 20, 28, 1); rect(g, '#fff0a0', 0, 12, 28, 1);
      word(g, 'CABJ', 6, 14, '#0b2c7a');
      // tres estrellas arriba
      for (const x of [8, 13, 18]) { px(g, '#f7c600', x, 5, x - 1, 6, x, 6, x + 1, 6, x, 7); }
      g.restore();
    },
  },
  // River Plate: escudo blanco con la banda roja en diagonal.
  RIV: {
    pal: [BK, WH, '#d8132b', '#8a0c1c', '#e8e4d8', '#f06a78', '#b8941f'],
    draw(g) {
      poly(g, BK, SHIELD(0));
      poly(g, WH, SHIELD(1.6));
      g.save(); clip(g, SHIELD(1.6));
      // la banda roja en diagonal, de arriba a la izquierda hacia abajo a la derecha
      poly(g, '#d8132b', [[0, 4], [4, 3], [30, 22], [30, 30], [26, 31]]);
      poly(g, '#d8132b', [[0, 4], [0, 12], [26, 31], [30, 30]]);
      poly(g, '#8a0c1c', [[0, 11], [26, 31], [30, 30], [30, 28.5], [27, 29.5], [0, 9.5]]);
      poly(g, '#f06a78', [[0, 4.2], [4, 3.2], [6, 4.7], [0, 6.2]]);
      g.restore();
      px(g, '#b8941f', 19, 8, 18, 9, 19, 9, 20, 9, 19, 10, 9, 23, 8, 24, 9, 24, 10, 24, 9, 25);
    },
  },
  // Liverpool: escudo rojo con el pájaro y las llamas eternas.
  LIV: {
    pal: [BK, WH, '#c8102e', '#8a0a20', '#f6eb61', '#e8a020', '#e05a1a', '#f0f0e0'],
    draw(g) {
      const sh = [[5, 5], [22, 5], [22, 17], [20, 23], [13.5, 30], [7, 23], [5, 17]];
      // llamas a los lados
      for (const [cx, f] of [[2.5, 1], [24.5, -1]]) {
        poly(g, '#e05a1a', [[cx, 31], [cx - 2 * f, 23], [cx - 1 * f, 16], [cx + 0.5 * f, 8], [cx + 1.5 * f, 16], [cx + 2.5 * f, 22]]);
        poly(g, '#f6eb61', [[cx + 0.2 * f, 30], [cx - 1 * f, 23], [cx + 0.2 * f, 15], [cx + 1.5 * f, 22]]);
      }
      poly(g, '#f6eb61', sh); poly(g, '#c8102e', [[6.2, 6.2], [20.8, 6.2], [20.8, 17], [19, 22.5], [13.5, 28.5], [8, 22.5], [6.2, 17]]);
      // el pájaro Liver
      ell(g, WH, 13.5, 16, 4, 5); poly(g, WH, [[9, 14], [4.5, 8.5], [8.5, 9.5], [10, 12]]); poly(g, WH, [[18, 14], [22.5, 8.5], [18.5, 9.5], [17, 12]]);
      poly(g, WH, [[13.5, 21], [11, 26], [16, 26]]); circ(g, WH, 15, 10.5, 2); poly(g, '#f6eb61', [[16.5, 10], [19.5, 11.5], [16.5, 12.5]]);
      px(g, BK, 15, 10); rect(g, '#f0f0e0', 11.5, 17, 5, 1); rect(g, '#8a0a20', 12, 22, 3, 1);
    },
  },
  // Manchester United: el círculo rojo con el barco, el diablo y el tridente.
  MUN: {
    pal: [BK, WH, '#da291c', '#8c1810', '#fbe122', '#b89a10', '#f0a0a0'],
    draw(g) {
      circ(g, BK, 13.5, 17.5, 13.5); circ(g, '#da291c', 13.5, 17.5, 12.5); circ(g, WH, 13.5, 17.5, 11.2); circ(g, '#da291c', 13.5, 17.5, 9.8);
      g.save(); g.beginPath(); g.arc(13.5, 17.5, 9.8, 0, 7); g.clip();
      rect(g, '#8c1810', 0, 25, 28, 10);
      // el barco arriba
      art(g, 8, 14, [
        '..#.....#..',
        '..##...##..',
        '...#####...',
        '...#r#r#...',
        '....###....',
        '.#..###..#.',
        '##.#####.##',
        '.#########.',
        '..#######..',
        '...#####...',
        '...##.##...',
        '...#...#...',
        '..##...##..',
      ], { '#': BK, r: '#da291c' });
      rect(g, '#fbe122', 19, 14, 1, 9); art(g, 17, 12, ['#.#.#', '#####'], { '#': '#fbe122' });
      // el barco: casco amarillo y dos velas blancas
      art(g, 9, 8, ['..w...w..', '.www.www.', 'wwwwwwwww', 'yyyyyyyyy', '.yyyyyyy.'], { w: WH, y: '#fbe122' });
      g.restore();
    },
  },
  // Bayern Múnich: el círculo con los rombos bávaros azules y blancos.
  BAY: {
    pal: [BK, WH, '#0066b2', '#00417a', '#dc052d', '#8a0220', '#8fbce0'],
    draw(g) {
      circ(g, '#00417a', 13.5, 17, 13.5); circ(g, '#0066b2', 13.5, 17, 12.5); circ(g, WH, 13.5, 17, 11.2); circ(g, '#00417a', 13.5, 17, 10.2);
      g.save(); g.beginPath(); g.arc(13.5, 17, 9.4, 0, 7); g.clip();
      rect(g, WH, 0, 0, 28, 34);
      // rombos azules y blancos
      for (let y = -2; y < 36; y += 4) for (let x = -2; x < 30; x += 4) { const o = ((y + 2) / 4) % 2 ? 2 : 0; poly(g, '#0066b2', [[x + o, y - 2], [x + o + 2, y], [x + o, y + 2], [x + o - 2, y]]); }
      g.restore();
      // un arco rojo de mancha en el borde, abajo
      rect(g, '#dc052d', 4.5, 29.4, 19, 1);
      g.save(); g.beginPath(); g.arc(13.5, 17, 11.8, 0.2, Math.PI - 0.2); g.lineWidth = 0.9; g.strokeStyle = '#8fbce0'; g.stroke(); g.restore();
    },
  },
  // Juventus: la J en el escudo negro y blanco.
  JUV: {
    pal: [BK, WH, '#2c2e36', '#c9c9cf', '#8a8a92'],
    draw(g) {
      poly(g, BK, [[4, 2], [23, 2], [25, 5], [25, 22], [22, 27.5], [13.5, 32.5], [5, 27.5], [2, 22], [2, 5]]);
      poly(g, WH, [[6, 4], [21, 4], [22.5, 6], [22.5, 21.5], [20.5, 25], [13.5, 29.5], [6.5, 25], [4.5, 21.5], [4.5, 6]]);
      // una J gruesa: el palo, el gancho redondo y la punta que sube
      rect(g, BK, 12, 6, 5, 13);
      g.strokeStyle = BK; g.lineWidth = 4.5; g.lineCap = 'butt'; g.beginPath(); g.arc(10, 18.5, 4.2, 0.02, Math.PI - 0.02); g.stroke();
      rect(g, BK, 5.5, 15, 4, 3.5);
      rect(g, '#c9c9cf', 5, 5, 1, 16);
    },
  },
};

const ALL = { ...CRESTS3, ...CRESTS, ...CRESTS2, ...CRESTS_CL, ...CRESTS_AR, ...CRESTS_ES, ...CRESTS_IT, ...CRESTS_FR, ...CRESTS_BR };
const cache = new Map();

// Paleta → los píxeles quedan exactamente en los colores del club (sin mezclas).
function snap(cv, pal) {
  const g = cv.getContext('2d'), im = g.getImageData(0, 0, cv.width, cv.height), d = im.data;
  const P = pal.map(rgb);
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 110) { d[i + 3] = 0; continue; }
    let best = 0, bd = 1e9;
    for (let k = 0; k < P.length; k++) { const dd = (d[i] - P[k][0]) ** 2 * 0.3 + (d[i + 1] - P[k][1]) ** 2 * 0.59 + (d[i + 2] - P[k][2]) ** 2 * 0.11; if (dd < bd) { bd = dd; best = k; } }
    d[i] = P[best][0]; d[i + 1] = P[best][1]; d[i + 2] = P[best][2]; d[i + 3] = 255;
  }
  g.putImageData(im, 0, 0);
}

// Contorno oscuro de un píxel alrededor de todo lo dibujado.
function outline(cv, color) {
  const g = cv.getContext('2d'), im = g.getImageData(0, 0, cv.width, cv.height), d = im.data, w = cv.width, h = cv.height;
  const a = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : d[(y * w + x) * 4 + 3]);
  const c = rgb(color), add = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!a(x, y) && (a(x - 1, y) || a(x + 1, y) || a(x, y - 1) || a(x, y + 1))) add.push((y * w + x) * 4);
  for (const i of add) { d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255; }
  g.putImageData(im, 0, 0);
}

// El escudo (canvas de 28 × 34) del equipo con esa sigla, o null si no tiene.
export function crestOf(short) {
  const def = ALL[short];
  if (!def) return null;
  if (cache.has(short)) return cache.get(short);
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d', { willReadFrequently: true });
  // se anotan los colores usados: esa es la paleta del escudo
  const used = new Set();
  for (const prop of ['fillStyle', 'strokeStyle']) {
    const d = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, prop);
    Object.defineProperty(g, prop, { configurable: true, get() { return d.get.call(g); }, set(v) { if (typeof v === 'string' && v[0] === '#') used.add(v.length === 4 ? '#' + [...v.slice(1)].map((c) => c + c).join('') : v.slice(0, 7)); d.set.call(g, v); } });
  }
  def.draw(g);
  snap(cv, [...used]);
  outline(cv, '#0c0d12');
  cache.set(short, cv);
  return cv;
}

export const CREST_W = W, CREST_H = H;
export const CREST_SHORTS = Object.keys(ALL);
