// Calciopoli · escudos de la Ligue 1 dibujados a mano, siguiendo los escudos reales (ver crests.js).
import { BK, WH, poly, rect, circ, ell, px, word, art, SHIELD, star, vstripes, hstripes, disc, clipCirc, clipPoly, ring } from './crestkit.js';

const alt = (a, b, n) => Array.from({ length: n }, (_, i) => (i % 2 ? b : a));
const GOLD = '#f2b900', GD = '#b88a00', RED = '#d41f2a', NAVY = '#12295c';
// Corona de 11 px de ancho con la esquina izquierda en x0 y el borde de arriba en y.
const crown = (g, x0, y, cap = RED) => {
  poly(g, GD, [[x0, y + 7], [x0, y + 2], [x0 + 3, y + 4], [x0 + 5.5, y], [x0 + 8, y + 4], [x0 + 11, y + 2], [x0 + 11, y + 7]]);
  poly(g, GOLD, [[x0 + 1, y + 6], [x0 + 1, y + 3.4], [x0 + 3.4, y + 5], [x0 + 5.5, y + 1.6], [x0 + 7.6, y + 5], [x0 + 10, y + 3.4], [x0 + 10, y + 6]]);
  rect(g, cap, x0 + 1, y + 6, 9, 1);
  px(g, WH, x0 + 5, y + 3, x0 + 2, y + 4, x0 + 8, y + 4);
};

export const CRESTS_FR = {
  // Olympique de Marsella: círculo azul con la M blanca.
  OM: { draw(g) {
    circ(g, '#1c6db8', 14, 17, 13); ring(g, WH, 14, 17, 11, 1);
    poly(g, WH, [[7.5, 10], [11, 10], [14, 17], [17, 10], [20.5, 10], [20.5, 24], [17.5, 24], [17.5, 16.5], [14, 23], [10.5, 16.5], [10.5, 24], [7.5, 24]]);
  } },
  // Lyon: franja roja con OL, escudo con el león sobre azul y la L roja.
  OL: { draw(g) {
    poly(g, '#b8803a', SHIELD(0)); clipPoly(g, SHIELD(1.2));
    rect(g, WH, 0, 0, 28, 34); rect(g, RED, 0, 0, 28, 9); word(g, 'OL', 10, 3, WH);
    rect(g, '#1d4aa0', 3, 9, 10, 12); px(g, GOLD, 6, 11, 7, 11, 8, 12, 9, 13, 10, 14, 8, 16, 11, 17, 7, 18);
    rect(g, '#1d4aa0', 15, 9, 3, 12); rect(g, '#1d4aa0', 15, 18, 8, 3);
    g.restore();
  } },
  // Paris FC: escudo azul marino con borde celeste, la torre Eiffel y el círculo rojo.
  PFC: { draw(g) {
    poly(g, '#3a9ad8', SHIELD(0)); poly(g, '#0e1a40', SHIELD(1.5));
    word(g, 'PFC', 8, 4, WH);
    poly(g, '#7fc0ee', [[13.5, 10], [15, 18], [17.4, 27], [15.2, 27], [13.5, 22], [11.8, 27], [9.6, 27], [12, 18]]);
    rect(g, '#0e1a40', 12, 19, 3, 1); rect(g, '#0e1a40', 11, 23, 5, 1);
    circ(g, '#d8505a', 13.5, 28, 1.8);
  } },
  // Paris Saint-Germain: círculo azul con aro blanco, la torre Eiffel roja y la flor de lis.
  PSG: { draw(g) {
    circ(g, WH, 14, 17, 13); circ(g, '#0d2c6c', 14, 17, 12);
    word(g, 'PSG', 8, 8, WH);
    poly(g, RED, [[14, 14], [16, 19], [18, 26], [15.4, 26], [14, 22], [12.6, 26], [10, 26], [12, 19]]);
    rect(g, WH, 12, 23, 4, 1);
    px(g, GOLD, 14, 27, 13, 28, 15, 28);
  } },
  // Lens: escudo rojo y amarillo con las letras R C L y la torre negra.
  RCL: { draw(g) {
    poly(g, BK, SHIELD(0)); clipPoly(g, SHIELD(1.3));
    rect(g, '#d4202b', 0, 0, 14, 34); rect(g, GOLD, 14, 0, 14, 34);
    word(g, 'R', 5, 6, GOLD); word(g, 'C', 5, 13, GOLD); word(g, 'L', 5, 20, GOLD);
    rect(g, BK, 17, 7, 6, 11); rect(g, GOLD, 17, 7, 1, 2); rect(g, GOLD, 19, 7, 1, 2); rect(g, GOLD, 21, 7, 1, 2); rect(g, GOLD, 19, 13, 2, 3);
    g.restore();
  } },
  // Estrasburgo: círculo celeste con el centro de franjas azules, rojas y blancas y RCS.
  RCS: { draw(g) {
    circ(g, WH, 14, 17, 13); circ(g, '#2b9ae0', 14, 17, 12); circ(g, WH, 14, 17, 7.8);
    clipCirc(g, 7.4, 14, 17);
    g.translate(14, 17); g.rotate(-0.5); rect(g, '#2b9ae0', -12, -8, 24, 5); rect(g, RED, -12, 3, 24, 5); g.restore();
    g.restore();
    word(g, 'RCS', 8, 15, NAVY);
  } },
  // Brest: escudo rojo con borde blanco y las letras SB 29.
  BRS: { draw(g) {
    poly(g, WH, SHIELD(0)); poly(g, '#d8202c', SHIELD(1.3));
    word(g, 'SB', 7, 6, WH, 2); word(g, '29', 10, 19, WH);
  } },
  // Rennes: escudo negro y rojo con borde dorado y el armiño blanco.
  SRF: { draw(g) {
    poly(g, GOLD, SHIELD(0)); clipPoly(g, SHIELD(1));
    rect(g, '#d8202c', 0, 0, 28, 34);
    poly(g, BK, [[0, 0], [28, 0], [28, 5], [16, 14], [8, 24], [0, 26]]);
    ell(g, WH, 10, 12, 3, 4.6); px(g, BK, 9, 10, 11, 10); px(g, WH, 7, 7, 13, 7, 6, 17);
    g.restore();
  } },
  // Toulouse: círculo violeta con aro blanco, el Capitolio rojo y las letras.
  TFC: { draw(g) {
    circ(g, WH, 14, 17, 13); circ(g, '#4a2a7a', 14, 17, 12); word(g, 'TFC', 8, 7, WH);
    rect(g, '#c4202e', 8, 15, 12, 8); rect(g, '#e8909a', 8, 13, 12, 2); px(g, WH, 10, 17, 12, 17, 14, 17, 16, 17, 18, 17, 10, 20, 12, 20, 14, 20, 16, 20, 18, 20);
  } },
  // Auxerre: escudo azul con la cruz blanca de puntas abiertas y el balón en el centro.
  AUX: { draw(g) {
    poly(g, '#0c2a6a', [[2, 3], [25, 3], [25, 20], [20, 27], [13.5, 32.6], [7, 27], [2, 20]]);
    poly(g, '#1d52a8', [[3.2, 4.2], [23.8, 4.2], [23.8, 19.6], [19.4, 26], [13.5, 30.8], [7.6, 26], [3.2, 19.6]]);
    rect(g, WH, 12, 7, 3, 18); rect(g, WH, 5, 15, 17, 3);
    poly(g, WH, [[10, 6], [17, 6], [14.5, 9], [12.5, 9]]); poly(g, WH, [[10.5, 26], [16.5, 26], [14.5, 23], [12.5, 23]]);
    poly(g, WH, [[4, 12.5], [4, 20.5], [7, 17.4], [7, 15.6]]); poly(g, WH, [[23, 12.5], [23, 20.5], [20, 17.4], [20, 15.6]]);
    circ(g, WH, 13.5, 16.5, 3.8); ring(g, '#1d52a8', 13.5, 16.5, 3.8, 0.7); px(g, '#1d52a8', 13, 15, 14, 18, 12, 17);
  } },
  // Metz: la cruz de Lorena granate de doble travesaño sobre escudo blanco.
  FCM: { draw(g) {
    const G = '#7a1a1f';
    poly(g, G, SHIELD(0)); poly(g, WH, SHIELD(1.3));
    poly(g, G, [[11.4, 6], [16.2, 10.4], [16.2, 29.4], [11.4, 24.4]]);
    rect(g, G, 8, 11.6, 11, 4); rect(g, G, 5, 17, 17, 6);
  } },
  // Nantes: escudo amarillo con las letras verdes, el marco en U, la N y el armiño.
  FCN: { draw(g) {
    const G = '#00a65a';
    poly(g, '#fddc00', [[2, 1], [25, 1], [25, 21], [21, 27], [13.5, 33], [6, 27], [2, 21]]);
    word(g, 'FCN', 8, 3, G);
    const L = [[5.4, 8.5], [7, 8.5], [7, 21], [7.8, 23.2], [10.4, 25.6], [10.4, 28], [6.4, 25], [5.4, 21.4]];
    poly(g, G, L); poly(g, G, L.map(([x, y]) => [26 - x + 1.5, y]));
    rect(g, G, 15.4, 8.5, 1.8, 11); rect(g, G, 9, 12.6, 1.6, 10);
    poly(g, G, [[8.7, 8.5], [11.2, 8.5], [17.2, 17.6], [17.2, 20.2]]); poly(g, G, [[9.6, 12.6], [16.4, 21.6], [15, 22.8], [9.6, 16.4]]);
    poly(g, G, [[13.5, 26], [14.7, 30], [13.5, 31.4], [12.3, 30]]);
  } },
  // Angers: escudo blanco con borde negro, las letras SCO y la flecha.
  SCO: { draw(g) {
    poly(g, BK, [[2, 3], [25, 3], [25, 16], [13.5, 32], [2, 16]]);
    poly(g, '#c8a47a', [[3, 4], [24, 4], [24, 15.6], [13.5, 30.6], [3, 15.6]]);
    poly(g, WH, [[4.2, 5.2], [22.8, 5.2], [22.8, 15.2], [13.5, 28.6], [4.2, 15.2]]);
    word(g, 'SCO', 8, 8, BK);
    poly(g, BK, [[10.5, 16], [16.5, 16], [13.5, 22]]);
  } },
  // Mónaco: corona dorada sobre el escudo de rombos rojos y blancos con borde dorado.
  ASM: { draw(g) {
    crown(g, 8, 1);
    const S = (i) => [[3 + i, 9 + i], [24 - i, 9 + i], [24 - i, 21], [21 - i, 27 - i * 0.6], [13.5, 33 - i * 1.4], [6 + i, 27 - i * 0.6], [3 + i, 21]];
    poly(g, GOLD, S(0)); clipPoly(g, S(1.2));
    vstripes(g, alt(RED, WH, 8), 3, 24, 9, 34);
    [[8, 13], [13, 13], [18, 13], [8, 20], [13, 20], [18, 20], [11, 26], [16, 26]].forEach(([x, y]) => px(g, WH, x, y));
    g.restore();
  } },
  // Niza: águila dorada de alas abiertas sobre el escudo rojinegro.
  OGC: { draw(g) {
    poly(g, '#a47a3a', [[0, 12], [4, 5], [9, 7], [12, 11], [10, 15], [5, 14]]); poly(g, '#a47a3a', [[27, 12], [23, 5], [18, 7], [15, 11], [17, 15], [22, 14]]);
    poly(g, '#c9a24a', [[11, 6], [13.5, 3], [16, 6], [16, 11], [11, 11]]);
    poly(g, WH, [[7, 12], [20, 12], [20, 23], [13.5, 31.6], [7, 23]]);
    clipPoly(g, [[8.2, 13.2], [18.8, 13.2], [18.8, 22.6], [13.5, 29.6], [8.2, 22.6]]);
    vstripes(g, alt(RED, BK, 5), 8, 19, 13, 31); rect(g, WH, 8, 13, 11, 3);
    g.restore();
  } },
  // Le Havre: escudo azul marino con HAC y la mitad inferior celeste con el dragón.
  HAC: { draw(g) {
    poly(g, BK, SHIELD(0)); poly(g, '#14295a', SHIELD(1)); clipPoly(g, SHIELD(1.6));
    word(g, 'HAC', 8, 5, WH);
    rect(g, '#7fb6e0', 0, 16, 28, 18);
    px(g, WH, 8, 20, 9, 20, 10, 21, 11, 21, 12, 20, 13, 20, 14, 21, 15, 21, 16, 20, 17, 20, 9, 24, 10, 24, 11, 24, 15, 24, 16, 24);
    g.restore();
  } },
  // Lille: pentágono azul y rojo con el lobo blanco y las letras LOSC.
  LOSC: { draw(g) {
    poly(g, NAVY, [[13.5, 1], [27, 11], [22, 32], [5, 32], [0, 11]]);
    poly(g, RED, [[13.5, 3.2], [24.8, 12], [20.4, 30], [6.6, 30], [2.2, 12]]);
    poly(g, WH, [[7, 12], [10, 8], [13.5, 11], [17, 8], [20, 12], [18, 19], [13.5, 22], [9, 19]]);
    px(g, RED, 11, 15, 16, 15);
    rect(g, NAVY, 3, 23, 21, 6); word(g, 'LOSC', 6, 24, WH);
  } },
  // Lorient: escudo naranja con el pez blanco y el armiño arriba.
  FCL: { draw(g) {
    poly(g, BK, SHIELD(0)); clipPoly(g, SHIELD(1.2));
    rect(g, '#f2661f', 0, 0, 28, 34);
    rect(g, WH, 0, 0, 28, 9); [4, 9, 14, 19, 23].forEach((x) => px(g, BK, x, 3, x, 4, x - 1, 6, x + 1, 6, x, 7));
    ell(g, WH, 14, 20, 6, 3.4); poly(g, WH, [[19, 20], [24, 16], [24, 24]]); px(g, BK, 10, 19);
    g.restore();
  } },
};
