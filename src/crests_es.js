// Calcciopoli · escudos de LaLiga dibujados a mano, siguiendo los escudos reales (ver crests.js).
import { BK, WH, poly, rect, circ, ell, px, word, art, SHIELD, star, vstripes, hstripes, disc, clipCirc, clipPoly, ring } from './crestkit.js';

const alt = (a, b, n) => Array.from({ length: n }, (_, i) => (i % 2 ? b : a));
const GOLD = '#f2b900', GD = '#b88a00', RED = '#d41f2a', NAVY = '#10306e';
// Corona de 11 px de ancho con la esquina izquierda en x0 y el borde de arriba en y.
const crown = (g, x0, y, cap = RED) => {
  poly(g, GD, [[x0, y + 7], [x0, y + 2], [x0 + 3, y + 4], [x0 + 5.5, y], [x0 + 8, y + 4], [x0 + 11, y + 2], [x0 + 11, y + 7]]);
  poly(g, GOLD, [[x0 + 1, y + 6], [x0 + 1, y + 3.4], [x0 + 3.4, y + 5], [x0 + 5.5, y + 1.6], [x0 + 7.6, y + 5], [x0 + 10, y + 3.4], [x0 + 10, y + 6]]);
  rect(g, cap, x0 + 1, y + 6, 9, 1);
  px(g, WH, x0 + 5, y + 3, x0 + 2, y + 4, x0 + 8, y + 4);
};
// Pelota de cuero dorada con costuras.
const ball = (g, x, y, r) => { circ(g, '#7a4a14', x, y, r); circ(g, '#d49a2a', x, y, r - 0.9); px(g, '#7a4a14', Math.floor(x) - 1, Math.floor(y), Math.floor(x), Math.floor(y) - 1, Math.floor(x) + 1, Math.floor(y) + 1); };

export const CRESTS_ES = {
  // Alavés: óvalo azul y blanco con la punta de lanza, el banderín con D A y el remo.
  ALA: { draw(g) {
    const B1 = '#1a4aa0', B2 = '#4aa6e0';
    poly(g, B1, [[22, 12], [27, 20], [20, 22]]);
    g.save(); g.translate(13, 16); g.rotate(0.2);
    ell(g, B1, 0, 0, 12.6, 9.4); ell(g, WH, 0, 0, 11, 7.8);
    g.beginPath(); g.ellipse(0, 0, 11, 7.8, 0, 0, 7); g.clip(); rect(g, B2, -14, 1, 28, 10);
    g.restore();
    poly(g, WH, [[22.6, 14.6], [25, 20], [21, 21]]);
    rect(g, B1, 5, 6, 11, 9); rect(g, WH, 6, 7, 9, 7); word(g, 'DA', 7, 8, B1);
    px(g, WH, 8, 18, 13, 20, 17, 19, 11, 22, 16, 23);
    poly(g, B1, [[1, 30], [10, 27], [25, 22], [25, 24], [10, 29]]);
  } },
  // Athletic: escudo blanco, el escudo rojiblanco adentro con la casa y las dos X.
  ATH: { draw(g) {
    poly(g, BK, SHIELD(0)); poly(g, WH, SHIELD(1));
    word(g, 'ATH', 8, 3, BK);
    const I = [[5, 9], [22, 9], [22, 19], [13.5, 30], [5, 19]];
    poly(g, BK, [[4, 8], [23, 8], [23, 19.6], [13.5, 31.4], [4, 19.6]]);
    clipPoly(g, I);
    vstripes(g, alt(RED, WH, 9), 5, 22, 9, 31);
    rect(g, BK, 5, 9, 8, 7);
    rect(g, WH, 6, 13, 4, 2); rect(g, WH, 7, 11, 2, 2); px(g, WH, 11, 11, 11, 13);
    g.restore();
  } },
  // Atlético de Madrid: franjas rojiblancas, la banda azul con cinco estrellas y el madroño.
  ATM: { draw(g) {
    poly(g, GOLD, SHIELD(0)); clipPoly(g, SHIELD(1.4));
    vstripes(g, alt(RED, WH, 7), 3, 24, 0, 34);
    poly(g, '#1c3f98', [[0, 0], [28, 0], [28, 5], [0, 19]]);
    [[5, 12], [10, 10], [15, 8], [20, 6], [24, 4]].forEach(([x, y]) => star(g, WH, x, y, 1.8));
    circ(g, '#2f8a3a', 7, 5, 2.4); px(g, RED, 6, 4, 8, 5, 7, 7); rect(g, '#6a3b1e', 7, 7, 1, 3);
    g.restore();
  } },
  // Barcelona: escudo con la cruz de San Jorge, la senyera, FCB y las franjas blaugrana con el balón.
  BAR: { draw(g) {
    const BL = '#1e4a9a', GA = '#a3123e';
    poly(g, GOLD, SHIELD(0)); clipPoly(g, SHIELD(1.4));
    rect(g, WH, 0, 0, 13, 13); rect(g, RED, 6, 0, 2, 13); rect(g, RED, 0, 5, 13, 2);
    rect(g, GOLD, 13, 0, 15, 13); for (let i = 0; i < 4; i++) rect(g, RED, 15 + i * 3, 0, 1, 13);
    rect(g, GOLD, 0, 13, 28, 6); word(g, 'FCB', 8, 14, NAVY);
    vstripes(g, alt(BL, GA, 8), 0, 28, 19, 34);
    ball(g, 13.5, 25, 3.4);
    g.restore();
  } },
  // Betis: rombo verdiblanco con borde dorado, corona y el monograma RBB.
  BET: { draw(g) {
    const GR = '#0f8a42';
    crown(g, 8, 1);
    poly(g, GOLD, [[1, 9], [26, 9], [13.5, 32]]);
    clipPoly(g, [[3.4, 10.4], [23.6, 10.4], [13.5, 28.6]]);
    vstripes(g, alt(GR, WH, 7), 3, 24, 10, 30);
    g.restore();
    circ(g, GR, 13.5, 17, 6.6); circ(g, WH, 13.5, 17, 5.6);
    word(g, 'BB', 10, 15, GR); px(g, GR, 10, 14, 15, 14);
  } },
  // Celta: cruz roja con las puntas abiertas, la corona y el escudito celeste en el centro.
  CLT: { draw(g) {
    const CR = '#d8232a', SK = '#74b8e8';
    rect(g, CR, 12, 3, 3, 24); poly(g, CR, [[12, 27], [15, 27], [13.5, 33]]);
    rect(g, CR, 3, 12, 22, 3);
    poly(g, CR, [[9, 4], [13.5, 0], [18, 4], [15.5, 6], [11.5, 6]]);
    poly(g, CR, [[1, 9], [5, 11], [5, 16], [1, 18]]); poly(g, CR, [[26, 9], [22, 11], [22, 16], [26, 18]]);
    px(g, CR, 0, 13, 27, 13);
    crown(g, 8, 6, CR);
    poly(g, WH, [[9, 13], [18, 13], [18, 21], [13.5, 25], [9, 21]]);
    poly(g, SK, [[10, 14], [17, 14], [17, 20.4], [13.5, 23.4], [10, 20.4]]);
    word(g, 'C', 12, 16, WH);
  } },
  // Elche: escudo con borde dorado, C y F arriba, el busto, el castillo y los campos.
  ELC: { draw(g) {
    poly(g, GOLD, SHIELD(0)); clipPoly(g, SHIELD(1.4));
    rect(g, WH, 0, 0, 28, 14);
    word(g, 'C', 5, 5, '#2f7a3a'); word(g, 'F', 20, 5, '#2f7a3a');
    circ(g, '#e8b484', 13.5, 5.6, 2.2); rect(g, '#3a2414', 11, 3, 5, 2); poly(g, '#6a4423', [[9, 11], [10, 8.4], [17, 8.4], [18, 11]]);
    rect(g, '#2f7a3a', 8, 11, 11, 2);
    rect(g, RED, 0, 14, 28, 8);
    rect(g, '#d8b070', 10, 15, 8, 5); rect(g, '#c29850', 9, 14, 10, 1); px(g, BK, 13, 18, 14, 18, 13, 19, 14, 19);
    rect(g, '#2a68b0', 0, 22, 28, 12);
    rect(g, '#2f9a4a', 0, 28, 28, 1); rect(g, '#2f9a4a', 0, 30, 28, 1);
    rect(g, '#d8b070', 10, 23, 8, 4); rect(g, '#c29850', 9, 23, 10, 1);
    word(g, 'C', 5, 22, WH); word(g, 'I', 21, 22, WH);
    g.restore();
  } },
  // Espanyol: corona sobre el círculo rojo con el anillo dorado y las franjas azules y blancas en diagonal.
  RCD: { draw(g) {
    crown(g, 8, 1);
    circ(g, RED, 13.5, 20, 12.4); ring(g, GOLD, 13.5, 20, 10.4, 1); circ(g, WH, 13.5, 20, 9);
    clipCirc(g, 9, 13.5, 20);
    g.translate(13.5, 20); g.rotate(Math.PI / 4);
    for (let i = -4; i <= 4; i += 2) rect(g, '#1a52a8', i * 2.5 - 1.25, -12, 2.5, 24);
    g.restore();
    px(g, GOLD, 4, 15, 4, 24, 23, 15, 23, 24, 8, 30, 19, 30);
  } },
  // Getafe: balón arriba, anillo azul, y el escudo amarillo con cruz roja y verde con estrellas.
  GET: { draw(g) {
    circ(g, '#1a4aa0', 13.5, 19, 12.8); ring(g, WH, 13.5, 19, 9.8, 1);
    circ(g, BK, 13.5, 5, 4.6); circ(g, WH, 13.5, 5, 3.7); px(g, BK, 13, 4, 12, 6, 15, 5, 14, 7);
    rect(g, '#f4c20d', 8, 13, 5, 12); rect(g, '#2e8b3a', 13, 13, 6, 12);
    rect(g, RED, 9, 17, 3, 1); rect(g, RED, 10, 15, 1, 5);
    px(g, WH, 15, 15, 17, 15, 16, 17, 15, 19, 17, 19, 16, 21, 15, 23, 17, 23);
  } },
  // Girona: corona negra y dorada, círculo rojo y blanco y el rombo ajedrezado.
  GIR: { draw(g) {
    poly(g, BK, [[8, 8], [8, 2], [11, 4], [13.5, 1], [16, 4], [19, 2], [19, 8]]);
    rect(g, GOLD, 9, 6, 9, 1); px(g, GOLD, 9, 3, 13, 2, 17, 3);
    circ(g, BK, 13.5, 20, 12.8); circ(g, WH, 13.5, 20, 11.8);
    clipCirc(g, 11.4, 13.5, 20); vstripes(g, alt(RED, WH, 9), 2, 25, 8, 33); g.restore();
    poly(g, BK, [[13.5, 9.5], [23, 20], [13.5, 30.5], [4, 20]]);
    poly(g, GOLD, [[13.5, 10.6], [21.8, 20], [13.5, 29.4], [5.2, 20]]);
    poly(g, RED, [[13.5, 11.8], [20.4, 20], [13.5, 28.2], [6.6, 20]]);
    poly(g, WH, [[13.5, 13], [18.8, 20], [13.5, 27], [8.2, 20]]);
    [[13, 15], [13, 19], [13, 23], [11, 17], [15, 17], [11, 21], [15, 21], [9, 19], [17, 19]].forEach(([x, y]) => px(g, BK, x, y));
  } },
  // Levante: murciélago negro sobre el escudo azulgrana, la franja blanca con las iniciales y el balón.
  LVT: { draw(g) {
    poly(g, BK, [[3, 11], [3, 6], [7, 8], [10, 10], [17, 10], [20, 8], [24, 6], [24, 11]]);
    poly(g, BK, [[10, 9], [9, 3], [12, 7], [13.5, 6], [15, 7], [18, 3], [17, 9]]);
    poly(g, BK, [[2, 11], [25, 11], [25, 21], [13.5, 32], [2, 21]]);
    clipPoly(g, [[3.2, 12.2], [23.8, 12.2], [23.8, 20.6], [13.5, 30.6], [3.2, 20.6]]);
    vstripes(g, alt('#18408c', '#a3123e', 8), 3, 24, 12, 31);
    rect(g, WH, 0, 16, 28, 5); word(g, 'LUD', 8, 17, BK);
    ball(g, 13.5, 26, 2.6);
    g.restore();
  } },
  // Mallorca: corona, laurel verde y el círculo rojo con la M dorada.
  MLL: { draw(g) {
    crown(g, 8, 1);
    circ(g, '#2f7a3a', 13.5, 20, 12.6); circ(g, '#1f5a2a', 13.5, 20, 10.6);
    circ(g, GOLD, 13.5, 20, 9.2); circ(g, RED, 13.5, 20, 7.8);
    art(g, 9, 17, ['##.....##', '###...###', '#.##.##.#', '#..###..#', '#...#...#', '#...#...#', '#...#...#'], { '#': GOLD });
    rect(g, GOLD, 10, 29, 7, 2);
  } },
  // Osasuna: escudo mitad rojo y mitad azul marino con las letras C A O, la cadena y el león.
  OSA: { draw(g) {
    crown(g, 8, 1);
    const S = (i) => [[2 + i, 9 + i], [25 - i, 9 + i], [25 - i, 21], [22 - i, 26 - i * 0.4], [13.5, 33 - i * 1.4], [5 + i, 26 - i * 0.4], [2 + i, 21]];
    poly(g, GOLD, S(0)); clipPoly(g, S(1.4));
    rect(g, RED, 0, 0, 13, 34); rect(g, '#0f1f60', 13, 0, 15, 34);
    g.restore();
    ring(g, WH, 13.5, 18, 4.2, 1.3);
    word(g, 'C', 4, 14, WH); word(g, 'A', 20, 14, WH); word(g, 'O', 12, 27, GOLD);
    px(g, GOLD, 12, 16, 13, 16, 14, 17, 12, 18, 13, 19, 14, 19);
  } },
  // Oviedo: corona roja, banda azul con RO, la Cruz de la Victoria y el balón.
  OVI: { draw(g) {
    crown(g, 8, 1, RED); rect(g, RED, 9, 2, 9, 3); px(g, GOLD, 13, 0);
    poly(g, GOLD, [[4, 9], [23, 9], [23, 26], [20, 30], [13.5, 32], [7, 30], [4, 26]]);
    poly(g, WH, [[5.4, 10.4], [21.6, 10.4], [21.6, 25.6], [19, 29], [13.5, 30.6], [8, 29], [5.4, 25.6]]);
    rect(g, '#1a50a8', 7, 11, 13, 7); word(g, 'RO', 10, 12, WH);
    rect(g, '#1a50a8', 8, 19, 11, 6); rect(g, GOLD, 13, 19, 1, 5); rect(g, GOLD, 11, 21, 5, 1); px(g, GOLD, 11, 20, 15, 20);
    circ(g, WH, 13.5, 28, 2.2); ring(g, '#3a9ad8', 13.5, 28, 2.2, 0.8);
  } },
  // Rayo Vallecano: la franja roja en diagonal, laurel y las letras R V M.
  RAY: { draw(g) {
    poly(g, GOLD, SHIELD(0)); poly(g, WH, SHIELD(1.4));
    poly(g, RED, [[15, 3], [20, 3], [16, 12], [19, 12], [10, 28], [11, 19], [8, 19]]);
    word(g, 'R', 21, 6, BK); word(g, 'M', 20, 22, BK);
    ring(g, '#2f7a3a', 8.5, 14, 4.2, 1.2); rect(g, GOLD, 7, 11, 3, 5); px(g, '#2f7a3a', 8, 19, 9, 19);
  } },
  // Real Madrid: corona dorada y el círculo con la banda morada en diagonal.
  RMA: { draw(g) {
    crown(g, 8, 1, '#5a2a8a');
    circ(g, GD, 13.5, 21, 11.6); circ(g, GOLD, 13.5, 21, 10.8); circ(g, GD, 13.5, 21, 9.6); circ(g, WH, 13.5, 21, 8.8);
    clipCirc(g, 8.8, 13.5, 21);
    g.translate(13.5, 21); g.rotate(Math.PI / 4); rect(g, GD, -14, -3.5, 28, 7); rect(g, '#6a2a98', -14, -2.5, 28, 5); g.restore();
    g.restore();
    px(g, GOLD, 9, 17, 10, 16, 17, 25, 18, 24);
  } },
  // Real Sociedad: la bandera azul y blanca ondeando, la pelota de cuero y la corona.
  RSO: { draw(g) {
    poly(g, GD, [[2, 4], [4, 3], [26, 29], [24, 31]]);
    poly(g, '#1a52a8', [[2, 10], [8, 14], [9, 21], [17, 26], [25, 27], [22, 32], [11, 31], [5, 26], [3, 19]]);
    clipPoly(g, [[2, 10], [8, 14], [9, 21], [17, 26], [25, 27], [22, 32], [11, 31], [5, 26], [3, 19]]);
    hstripes(g, alt('#1a52a8', WH, 9), 0, 28, 10, 32);
    g.restore();
    circ(g, '#6a3e12', 14, 16, 8.4); circ(g, '#a8782e', 14, 16, 7.4);
    px(g, '#6a3e12', 11, 13, 12, 14, 16, 18, 15, 12, 17, 14, 13, 19);
    crown(g, 14, 1);
  } },
  // Sevilla: escudo con el monograma SFC, el santo, el balón y las franjas rojiblancas.
  SEV: { draw(g) {
    poly(g, GOLD, SHIELD(0)); clipPoly(g, SHIELD(1.4));
    rect(g, RED, 0, 0, 28, 6);
    rect(g, '#d8b878', 0, 6, 13, 11); rect(g, RED, 5, 9, 4, 6); circ(g, '#e8b484', 7, 8, 1.4); px(g, GOLD, 6, 6, 7, 6, 8, 6);
    rect(g, WH, 13, 6, 15, 11); word(g, 'SF', 15, 8, BK);
    vstripes(g, alt(RED, WH, 7), 3, 24, 17, 34);
    ball(g, 13.5, 17, 3);
    g.restore();
  } },
  // Valencia: murciélago negro, escudo blanco con franja celeste, franjas rojas y doradas y el balón.
  VCF: { draw(g) {
    poly(g, BK, [[2, 11], [2, 5], [6, 8], [9, 5], [11, 8], [12, 2], [13.5, 5], [15, 2], [16, 8], [18, 5], [21, 8], [25, 5], [25, 11]]);
    poly(g, BK, [[2, 11], [25, 11], [25, 21], [13.5, 33], [2, 21]]);
    clipPoly(g, [[3.2, 12.2], [23.8, 12.2], [23.8, 20.6], [13.5, 31], [3.2, 20.6]]);
    rect(g, WH, 0, 0, 28, 17); rect(g, '#3aa4de', 0, 17, 28, 3);
    vstripes(g, alt(GOLD, RED, 8), 3, 24, 20, 34);
    ball(g, 13.5, 26, 3.2);
    g.restore();
  } },
  // Villarreal: corona, círculo azul y el rombo amarillo con las franjas y las letras CVF.
  VLR: { draw(g) {
    crown(g, 8, 1);
    circ(g, NAVY, 13.5, 20, 12.8); ring(g, WH, 13.5, 20, 10.6, 0.8);
    poly(g, GOLD, [[13.5, 8.5], [22.5, 14], [22.5, 22], [13.5, 31], [4.5, 22], [4.5, 14]]);
    [8, 11, 14, 17].forEach((x) => rect(g, RED, x, 24, 1, 6));
    word(g, 'C', 7, 12, BK); word(g, 'F', 18, 12, BK);
    poly(g, BK, [[11, 12], [12.4, 12], [13.5, 19], [14.6, 12], [16, 12], [14.4, 25], [12.6, 25]]);
  } },
};
