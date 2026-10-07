// Calciopoli · escudos de la liga argentina dibujados a mano, siguiendo los escudos reales (ver crests.js).
import { BK, WH, poly, rect, circ, ell, px, word, art, SHIELD, star, vstripes, hstripes, disc, clipCirc, clipPoly, ring } from './crestkit.js';

const alt = (a, b, n) => Array.from({ length: n }, (_, i) => (i % 2 ? b : a));
const GOLD = '#f2b900', NAVY = '#0b2a6b', RED = '#d41f2a', SKY = '#4aa8e0';
// Escudo alto y angosto (Banfield, Estudiantes, Instituto).
const TALL = (i = 0) => [[6 + i, 6 + i], [21 - i, 6 + i], [21 - i, 24], [17 - i, 29 - i * 0.5], [13.5, 32 - i], [10 + i, 29 - i * 0.5], [6 + i, 24]];

export const CRESTS_AR = {
  // Banfield: franjas verdes y blancas con dos estrellas y CAB.
  BAN: { draw(g) {
    poly(g, BK, TALL(0)); clipPoly(g, TALL(1));
    vstripes(g, alt('#0a7a3b', WH, 7), 6, 21, 0, 34);
    rect(g, WH, 6, 14, 15, 6); word(g, 'CAB', 8, 15, '#0a7a3b');
    g.restore();
    star(g, '#b8bcc4', 10, 3.4, 2); star(g, '#b8bcc4', 17, 3.4, 2);
  } },
  // Belgrano: círculo celeste y blanco con la A y la B.
  BLG: { draw(g) {
    disc(g, [[13.5, '#1d3d84'], [12.2, WH], [10.4, SKY], [8.6, WH]]);
    art(g, 8, 10, ['....##....', '...####...', '..##..##..', '..##..##..', '.##....##.', '.########.', '##########', '##......##'], { '#': SKY });
    word(g, 'B', 12, 17, '#1d3d84');
    px(g, '#1d3d84', 4, 7, 22, 7, 3, 19, 24, 19);
  } },
  // Boca Juniors: escudo azul de borde dorado, estrellas y CABJ.
  BOC: { draw(g) {
    poly(g, GOLD, SHIELD(0)); clipPoly(g, SHIELD(1.6));
    rect(g, '#0f3b97', 0, 0, 28, 34);
    for (let i = 0; i < 5; i++) star(g, GOLD, 5.5 + i * 4, 6, 1.5);
    for (let i = 0; i < 4; i++) star(g, GOLD, 7.5 + i * 4, 10, 1.4);
    rect(g, GOLD, 0, 14, 28, 1); rect(g, GOLD, 0, 21, 28, 1); word(g, 'CABJ', 6, 16, GOLD);
    for (let i = 0; i < 3; i++) star(g, GOLD, 9 + i * 4.8, 26, 1.4);
    g.restore();
  } },
  // Defensa y Justicia: escudo verde con borde amarillo y las letras.
  DYJ: { draw(g) {
    poly(g, '#f2dc16', [[2, 3], [25, 3], [25, 20], [20, 28], [13.5, 32.6], [7, 28], [2, 20]]);
    poly(g, '#13902f', [[3.4, 4.4], [23.6, 4.4], [23.6, 19.6], [19.2, 26.8], [13.5, 30.8], [7.8, 26.8], [3.4, 19.6]]);
    poly(g, '#f2dc16', [[3.4, 21], [9, 24], [16, 25], [23.6, 21], [23.6, 23], [18, 28], [13.5, 30.8], [9, 28], [3.4, 23]]);
    word(g, 'DYJ', 8, 10, '#f2dc16');
    px(g, '#f2dc16', 7, 17, 8, 17);
  } },
  // Estudiantes: franjas rojas y blancas, estrella arriba y E. de L.P.
  EST: { draw(g) {
    star(g, '#e6b800', 13.5, 3.4, 3.4);
    const T = (i) => [[6 + i, 8 + i], [21 - i, 8 + i], [21 - i, 24], [17 - i, 29 - i * 0.5], [13.5, 32 - i], [10 + i, 29 - i * 0.5], [6 + i, 24]];
    poly(g, BK, T(0)); clipPoly(g, T(1));
    vstripes(g, alt(RED, WH, 7), 6, 21, 0, 34);
    rect(g, WH, 6, 9, 15, 6); word(g, 'ELP', 8, 10, RED);
    g.restore();
  } },
  // Gimnasia (La Plata): escudo blanco con el yelmo y el laurel.
  GLP: { draw(g) {
    const GL = '#2d6a2a';
    [-1, 1].forEach((d) => { for (let i = 0; i < 7; i++) { const a = 0.4 + i * 0.22, x = 13.5 + d * 11.4 * Math.cos(a), y = 14 + 14 * Math.sin(a); poly(g, GL, [[x, y - 1.8], [x + d * 1.1, y], [x, y + 1.8], [x - d * 0.9, y]]); } });
    poly(g, '#13254a', [[7, 10], [20, 10], [20, 20], [16, 26], [13.5, 28.6], [11, 26], [7, 20]]);
    poly(g, WH, [[8, 11], [19, 11], [19, 19.6], [15.4, 25], [13.5, 27], [11.6, 25], [8, 19.6]]);
    word(g, 'GE', 10, 15, '#13254a');
    // yelmo con plumas
    poly(g, '#8e99ac', [[10, 9], [10, 5], [13, 3.4], [16.4, 5], [17, 9]]); rect(g, '#13254a', 10, 6.4, 5, 0.9);
    poly(g, '#13254a', [[11, 3.2], [13, 0.8], [15, 1.6], [17, 0.8], [18.6, 3.4], [16, 3.6]]);
  } },
  // Godoy Cruz: círculo gris con franjas azules y blancas.
  GCZ: { draw(g) {
    disc(g, [[13.5, '#6e747f'], [12.4, '#c9ccd2'], [11, '#1d4fa8']]);
    clipCirc(g, 11); vstripes(g, alt('#1d4fa8', WH, 7), 2, 25, 6, 28); g.restore();
    rect(g, WH, 5, 14, 17, 6); word(g, 'CDGC', 6, 15, '#1d4fa8');
  } },
  // Independiente: escudo rojo con la franja blanca diagonal y CAI.
  IND: { draw(g) {
    poly(g, BK, SHIELD(0)); clipPoly(g, SHIELD(1.5));
    rect(g, '#d4202c', 0, 0, 28, 34);
    poly(g, WH, [[0, 4], [5, 2], [28, 21], [28, 27], [24, 28], [0, 10]]);
    word(g, 'C', 5, 4, BK); word(g, 'A', 11, 9, BK); word(g, 'I', 17, 14, BK);
    g.restore();
  } },
  // Lanús: círculo granate con el monograma entrelazado.
  LAN: { draw(g) {
    disc(g, [[13.5, '#7c1d36'], [12.4, '#a8a0a4'], [11.4, '#7c1d36']]);
    ring(g, '#d6c8cd', 13.5, 17, 9.4, 0.9);
    rect(g, '#d6c8cd', 10, 8, 1, 17); rect(g, '#d6c8cd', 10, 24, 9, 1); rect(g, '#d6c8cd', 8, 12, 12, 1);
    poly(g, '#d6c8cd', [[14, 8], [15, 8], [19, 24], [18, 24]]); circ(g, '#d6c8cd', 17.5, 12.5, 1.1);
  } },
  // Newell's Old Boys: escudo mitad rojo y mitad negro con NOB y las estrellas.
  NOB: { draw(g) {
    const S = (i) => [[3 + i, 1 + i], [24 - i, 1 + i], [24 - i, 17], [20 - i * 0.6, 22.6 - i * 0.3], [13.5, 27 - i], [7 + i * 0.6, 22.6 - i * 0.3], [3 + i, 17]];
    poly(g, BK, S(0)); clipPoly(g, S(1.4));
    rect(g, '#d4202c', 0, 0, 14, 34); rect(g, BK, 14, 0, 14, 34);
    word(g, 'N', 5, 6, WH); word(g, 'O', 11, 10, WH); word(g, 'B', 17, 14, WH);
    g.restore();
    [[3, 27], [8, 30], [13.5, 31], [19, 30], [24, 27]].forEach(([x, y]) => star(g, '#d4202c', x, y, 2));
  } },
  // Racing: escudo celeste con borde azul marino, RAC arriba y las tres barras blancas.
  RAC: { draw(g) {
    const N = '#00263f', C = '#009ddf';
    poly(g, N, [[2, 2], [25, 2], [25, 23], [22, 27], [18, 29], [13.5, 32], [9, 29], [5, 27], [2, 23]]);
    poly(g, C, [[3.4, 3.4], [23.6, 3.4], [23.6, 22.6], [21, 25.6], [17.6, 27.4], [13.5, 30], [9.4, 27.4], [6, 25.6], [3.4, 22.6]]);
    word(g, 'RAC', 8, 6, WH);
    rect(g, WH, 5, 13, 4, 11); rect(g, WH, 12, 13, 4, 14); rect(g, WH, 19, 13, 4, 11);
    px(g, C, 13, 27);
  } },
  // River Plate: escudo blanco con la banda roja y CARP.
  RIV: { draw(g) {
    poly(g, BK, SHIELD(0)); poly(g, WH, SHIELD(1.4)); clipPoly(g, SHIELD(1.4));
    poly(g, '#d4202c', [[0, 6], [5, 4], [28, 27], [28, 33], [22, 34], [0, 14]]);
    word(g, 'CA', 14, 4, BK);
    g.restore();
  } },
  // Rosario Central: círculo azul y amarillo con el laurel y CARC.
  RCE: { draw(g) {
    disc(g, [[13.5, '#c99a00'], [12.2, '#f2b900'], [10.6, '#1d3f8c']]);
    clipCirc(g, 10.6); vstripes(g, alt('#1d3f8c', '#f2b900', 11), 3, 24, 6, 28); g.restore();
    rect(g, '#1d3f8c', 5, 13, 17, 8); word(g, 'CARC', 6, 14, '#f2b900');
    px(g, '#c99a00', 2, 6, 25, 6, 1, 14, 26, 14, 2, 22, 25, 22);
  } },
  // San Lorenzo: franjas azules y rojas con el óvalo blanco central.
  SLO: { draw(g) {
    poly(g, BK, SHIELD(0)); clipPoly(g, SHIELD(1.5));
    vstripes(g, alt('#1b3a8c', '#c8102e', 8), 0, 28, 0, 34);
    ell(g, WH, 13.5, 14, 7.5, 6.5); ell(g, '#1b3a8c', 13.5, 14, 6.4, 5.4);
    word(g, 'SL', 10, 12, WH);
    g.restore();
  } },
  // Tigre: franja roja arriba con TIGRE y bandas azul y roja.
  TIG: { draw(g) {
    poly(g, BK, [[2, 2], [25, 2], [25, 22], [20, 28], [13.5, 32.6], [7, 28], [2, 22]]);
    clipPoly(g, [[3.2, 3.2], [23.8, 3.2], [23.8, 21.6], [19.4, 27.2], [13.5, 31.2], [7.6, 27.2], [3.2, 21.6]]);
    vstripes(g, ['#1b3a8c', '#d4202c', '#1b3a8c'], 0, 28, 0, 34);
    rect(g, '#d4202c', 0, 0, 28, 10); word(g, 'TIGRE', 4, 3, WH);
    g.restore();
  } },
  // Vélez Sarsfield: escudo blanco con la V azul.
  VEL: { draw(g) {
    poly(g, '#1b3f94', SHIELD(0)); poly(g, WH, SHIELD(1.5)); clipPoly(g, SHIELD(1.5));
    poly(g, '#1b3f94', [[3, 4], [10, 4], [13.5, 17], [17, 4], [24, 4], [16.6, 27], [10.4, 27]]);
    poly(g, WH, [[7, 4], [9, 4], [13.5, 21], [18, 4], [20, 4], [14.6, 24], [12.4, 24]]);
    g.restore();
  } },
  // Aldosivi: círculo verde y amarillo con las letras CAA.
  ALD: { draw(g) {
    disc(g, [[13.5, '#0b6a2e'], [12.4, '#0f9a42']]);
    clipCirc(g, 12.4); rect(g, '#f4d41a', 8, 0, 12, 34); g.restore();
    word(g, 'C', 12, 6, '#0b6a2e'); word(g, 'A', 12, 14, '#0b6a2e'); word(g, 'A', 12, 22, '#0b6a2e');
  } },
  // Argentinos Juniors: círculo azul con la banda roja diagonal.
  AAJ: { draw(g) {
    disc(g, [[13.5, '#1a3a8c'], [11.6, WH], [10.6, '#1a3a8c'], [9.6, WH]]);
    clipCirc(g, 9.6);
    poly(g, '#d4202c', [[3, 24], [3, 19], [18, 7], [24, 7], [24, 13], [9, 27]]);
    poly(g, '#d4202c', [[16, 21], [24, 14], [24, 28], [16, 28]]);
    g.restore();
  } },
  // Instituto: franjas rojas y blancas con las letras IACC.
  INS: { draw(g) {
    poly(g, BK, TALL(0)); clipPoly(g, TALL(1));
    vstripes(g, alt(RED, WH, 7), 6, 21, 0, 34);
    rect(g, WH, 6, 12, 15, 7); word(g, 'IAC', 8, 13, RED);
    g.restore();
  } },
  // Atlético Tucumán: estrella dorada, franjas celestes y blancas y la banda con C.A.T.
  ATU: { draw(g) {
    const GD = '#9a7b2c', SB = '#79b6e0';
    star(g, GD, 13.5, 3.6, 3.6);
    const S = (i) => [[3 + i, 8 + i], [24 - i, 8 + i], [24 - i, 21], [20 - i * 0.6, 27 - i * 0.4], [13.5, 32.6 - i], [7 + i * 0.6, 27 - i * 0.4], [3 + i, 21]];
    poly(g, GD, S(0)); poly(g, WH, S(1.2)); clipPoly(g, S(1.2));
    vstripes(g, [SB, WH, SB, WH, SB, WH, SB], 3, 24, 8, 34);
    poly(g, WH, [[0, 27], [0, 19], [28, 9], [28, 17]]);
    poly(g, GD, [[0, 18.2], [28, 8.2], [28, 9.4], [0, 19.4]]); poly(g, GD, [[0, 26.2], [28, 16.2], [28, 17.4], [0, 27.4]]);
    word(g, 'CAT', 8, 16, GD);
    g.restore();
  } },
  // Barracas Central: franjas rojas y blancas, el arco con la cruz y el laurel.
  BAC: { draw(g) {
    const R = '#e2001a', GL = '#0f9a3a';
    [-1, 1].forEach((d) => { for (let i = 0; i < 6; i++) { const a = 0.2 + i * 0.28, x = 13.5 + d * (7.6 + 3.6 * Math.sin(a)), y = 12.5 - 8.6 * Math.sin(a * 1.3) * 0.9 - i * 0.2; poly(g, GL, [[x, y - 1.6], [x + d * 1, y], [x, y + 1.6], [x - d * 0.8, y]]); } });
    ring(g, R, 13.5, 14, 7, 1.1); rect(g, WH, 7, 14, 14, 2);
    clipCirc(g, 6.2, 13.5, 14); rect(g, WH, 6, 6, 16, 8); rect(g, R, 13, 6, 1, 9); rect(g, R, 8, 10, 11, 1);
    px(g, R, 9, 7, 10, 7, 9, 8, 16, 7, 17, 7, 17, 8, 9, 12, 10, 12, 9, 13, 16, 12, 17, 12, 17, 13);
    g.restore();
    const S = (i) => [[2 + i, 18], [5 + i * 0.4, 14 + i * 0.4], [22 - i * 0.4, 14 + i * 0.4], [25 - i, 18], [23.4 - i, 20], [23.4 - i, 24], [22 - i * 0.6, 28], [13.5, 33.2 - i], [5 + i * 0.6, 28], [3.6 + i, 24], [3.6 + i, 20]];
    poly(g, R, S(0)); poly(g, WH, S(1.2)); clipPoly(g, S(1.2));
    vstripes(g, alt(WH, R, 9), 3, 24, 13, 34);
    g.restore();
    poly(g, R, [[10.6, 14], [16.4, 14], [13.5, 17.6]]); poly(g, WH, [[11.8, 14], [15.2, 14], [13.5, 16.2]]);
  } },
  // Central Córdoba: franjas negras y blancas con el círculo ACC.
  CCO: { draw(g) {
    const S = [[2, 8], [4, 8], [8, 10], [10, 8], [10, 2], [17, 2], [17, 8], [19, 10], [23, 8], [25, 8], [25, 20], [21, 27], [13.5, 33.4], [6, 27], [2, 20]];
    poly(g, WH, S); clipPoly(g, S);
    rect(g, BK, 0, 0, 28, 34); rect(g, WH, 11, 3, 5, 31); rect(g, WH, 5, 11, 4, 15); rect(g, WH, 18, 11, 4, 15);
    poly(g, WH, [[5, 26], [9, 26], [9, 29], [7, 27.5]]); poly(g, WH, [[18, 26], [22, 26], [20, 27.5], [18, 29]]);
    g.restore();
    circ(g, BK, 13.5, 18, 7.6); circ(g, WH, 13.5, 18, 6.8); circ(g, BK, 13.5, 18, 6); circ(g, WH, 13.5, 18, 5.2);
    word(g, 'ACC', 8, 15, BK);
  } },
  // Deportivo Riestra: escudo blanco de doble borde con la franja negra y las letras A.F.B.C.
  RIE: { draw(g) {
    const S = (i) => [[2 + i, 6 + i], [10 + i, 4 + i], [13.5, 2 + i], [17 - i, 4 + i], [25 - i, 6 + i], [25 - i, 20], [21 - i, 27 - i * 0.4], [13.5, 33 - i], [6 + i, 27 - i * 0.4], [2 + i, 20]];
    poly(g, BK, S(0)); poly(g, WH, S(1)); poly(g, BK, S(2)); poly(g, WH, S(3)); clipPoly(g, S(3));
    rect(g, BK, 0, 13, 28, 8); word(g, 'RIE', 8, 15, WH);
    word(g, 'A', 6, 7, BK); word(g, 'F', 16, 7, BK); word(g, 'B', 8, 22, BK); word(g, 'C', 15, 22, BK);
    g.restore();
  } },
  // Huracán: el globo rojo con la H, las cuerdas y la canasta.
  HUR: { draw(g) {
    const R = '#e30613';
    const ln = (x0, y0, x1, y1, w = 1) => { g.strokeStyle = R; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
    circ(g, R, 13.5, 11.6, 11.6); circ(g, WH, 13.5, 11.6, 10.4);
    // gajos del globo
    ln(13.5, 1.4, 4, 15.5); ln(13.5, 1.4, 23, 15.5); ln(11.5, 1.6, 6.5, 12); ln(15.5, 1.6, 20.5, 12);
    ln(4.2, 7, 11, 17); ln(22.8, 7, 16, 17); ln(2.4, 12, 8, 4.5, 0.8); ln(24.6, 12, 19, 4.5, 0.8);
    // la H
    rect(g, WH, 9.5, 8, 8, 9); rect(g, R, 10, 8, 2, 8); rect(g, R, 15, 8, 2, 8); rect(g, R, 10, 11.5, 7, 2);
    // cuerdas
    ln(5, 19.5, 8.5, 26.4); ln(22, 19.5, 18.5, 26.4); ln(8, 19, 13.5, 28, 0.9); ln(19, 19, 13.5, 28, 0.9); ln(12, 20, 11, 28, 0.8); ln(15, 20, 16, 28, 0.8);
    rect(g, R, 8, 25.6, 11, 1);
    ell(g, R, 13.5, 29.4, 8, 2.4); ell(g, WH, 13.5, 29.2, 6.4, 1.2);
    rect(g, R, 5.6, 30, 16, 3.4); rect(g, WH, 8, 31, 2, 2); rect(g, WH, 12.5, 31, 2, 2); rect(g, WH, 17, 31, 2, 2);
  } },
  // Independiente Rivadavia: círculo azul violeta con el monograma CSR.
  IRV: { draw(g) {
    const BL = '#26218c';
    disc(g, [[13.5, BL], [12.6, WH], [11.6, BL]]);
    g.strokeStyle = WH; g.lineWidth = 1.2; g.beginPath(); g.arc(13.5, 17, 7.6, 0.7, Math.PI * 2 - 0.7); g.stroke();
    word(g, 'S', 9, 14, WH); word(g, 'R', 14, 14, WH);
    rect(g, WH, 7, 8, 14, 0.8); rect(g, WH, 7, 26, 14, 0.8);
  } },
  // Platense: escudo marrón y blanco con la franja diagonal y CAP.
  PLA: { draw(g) {
    const BR = '#4d3a18';
    poly(g, BR, SHIELD(0)); clipPoly(g, SHIELD(1.7));
    rect(g, WH, 0, 0, 28, 34);
    poly(g, BR, [[0, 30], [0, 16], [28, 0], [28, 14]]);
    word(g, 'CAP', 8, 13, WH);
    g.restore();
  } },
  // San Martín de San Juan: escudo negro con tres franjas verdes y el nombre.
  SMJ: { draw(g) {
    const GR = '#3fa83a', K2 = '#151310';
    poly(g, K2, [[1, 4], [8, 5], [13.5, 2], [19, 5], [26, 4], [26, 20], [22, 27], [13.5, 33.4], [5, 27], [1, 20]]);
    poly(g, GR, [[5, 18], [8.6, 17.2], [8.6, 24.8], [5, 22]]);
    poly(g, GR, [[12, 15.4], [16, 14.6], [16, 29.6], [13.5, 31.2], [12, 29.6]]);
    poly(g, GR, [[19.4, 14.4], [23.4, 13.6], [23.4, 21.8], [19.4, 24.8]]);
    word(g, 'SAN', 3, 3, WH); word(g, 'MARTIN', 3, 9, WH);
  } },
  // Sarmiento: escudo verde con borde blanco y las letras C S A.
  SAR: { draw(g) {
    const GR = '#00844a';
    const S = (i) => [[1 + i, 3 + i], [7, 4.8 + i], [13.5, 5.2 + i], [20, 4.8 + i], [26 - i, 3 + i], [26 - i, 20], [22 - i * 0.6, 27 - i * 0.4], [13.5, 33.4 - i], [5 + i * 0.6, 27 - i * 0.4], [1 + i, 20]];
    poly(g, GR, S(0)); poly(g, WH, S(1.6)); poly(g, GR, S(3.2));
    word(g, 'C', 5, 7, WH, 2); word(g, 'S', 16, 7, WH, 2); word(g, 'A', 10, 18, WH, 2);
  } },
  // Talleres: escudo azul marino con cuatro franjas blancas y C.A.T.
  TAL: { draw(g) {
    const NV = '#050f30', GY = '#dcdcd2';
    const S = (i) => [[4 + i, 2 + i], [23 - i, 2 + i], [27 - i, 8], [24 - i, 11], [24.4 - i, 14], [26.6 - i, 22], [22, 29.4 - i * 0.4], [13.5, 33 - i], [5, 29.4 - i * 0.4], [0.4 + i, 22], [2.6 + i, 14], [3 + i, 11], [0.5 + i, 8]];
    poly(g, GY, S(0)); poly(g, NV, S(1.2)); clipPoly(g, S(1.2));
    [[4.6, 7.2, 28.6], [9.9, 12.5, 29.4], [15.6, 18.2, 29.4], [20.8, 23.4, 28.6]].forEach(([a, b, c]) => poly(g, WH, [[a, 8.2], [b, 8.2], [b, c], [a, c - 0.8]]));
    g.restore();
    word(g, 'CAT', 8, 4, WH);
  } },
  // Unión (Santa Fe): franjas rojas y blancas con las letras C A U en diagonal.
  USF: { draw(g) {
    const RD = '#e0121c';
    poly(g, RD, SHIELD(0)); poly(g, WH, SHIELD(1)); clipPoly(g, SHIELD(1.8));
    vstripes(g, alt(WH, RD, 9), 2, 25, 0, 34);
    rect(g, WH, 0, 11, 28, 10); word(g, 'CAU', 8, 14, RD); rect(g, RD, 0, 11, 28, 1); rect(g, RD, 0, 20, 28, 1);
    g.restore();
  } },
};
