// Calcciopoli · escudos del fútbol brasileño dibujados a mano, siguiendo los escudos reales (ver crests.js).
import { BK, WH, poly, rect, circ, ell, px, word, art, SHIELD, star, clipPoly, clipCirc, ring } from './crestkit.js';

const RED = '#e4002b';
const MID = '#8a8a90';
// Estrella de 5 x 5 píxeles.
const star5 = (g, c, x, y) => art(g, x, y, ['..#..', '.###.', '#####', '.###.', '.#.#.'], { '#': c });

export const CRESTS_BR = {
  // Corinthians: ancla y remos rojos detrás del aro negro con la bandera rayada.
  COR: { draw(g) {
    poly(g, RED, [[2, 4], [5.5, 2], [11, 9.5], [9.5, 12], [6, 11], [3.5, 8]]);
    poly(g, RED, [[25, 4], [21.5, 2], [16, 9.5], [17.5, 12], [21, 11], [23.5, 8]]);
    poly(g, RED, [[8.5, 21], [10.5, 21], [14, 29], [11, 29]]); poly(g, RED, [[19.5, 21], [17.5, 21], [14, 29], [17, 29]]);
    circ(g, RED, 14, 3, 2.6); circ(g, WH, 14, 3, 1.1); rect(g, RED, 11, 5.4, 6, 1.4);
    poly(g, RED, [[1, 26], [3.4, 20.5], [7.5, 25], [10.5, 25.5], [14, 30], [17.5, 25.5], [20.5, 25], [24.6, 20.5], [27, 26], [23.5, 27.4], [19, 31.4], [14, 33], [9, 31.4], [4.5, 27.4]]);
    circ(g, WH, 14, 16, 10.8); circ(g, BK, 14, 16, 9.8); circ(g, WH, 14, 16, 7);
    px(g, WH, 5, 15, 5, 18, 6, 21, 7, 11, 9, 8, 12, 6, 15, 6, 18, 7, 21, 9, 23, 12, 23, 16, 22, 20, 20, 23, 17, 24, 11, 24, 8, 22);
    rect(g, BK, 10, 12, 9, 2); rect(g, BK, 10, 15, 9, 2); rect(g, BK, 10, 18, 9, 2);
    rect(g, RED, 10, 12, 3, 3); px(g, WH, 11, 13);
    rect(g, BK, 9, 11, 1, 10);
  } },
  // Botafogo: escudo negro con borde blanco y la estrella solitaria.
  BOT: { draw(g) {
    poly(g, BK, SHIELD(0)); poly(g, WH, SHIELD(1.4)); poly(g, BK, SHIELD(2.8));
    star(g, WH, 13.5, 16.2, 7.6);
  } },
  // Flamengo: escudo rojinegro con las letras CRF en el cuartel rojo.
  FLA: { draw(g) {
    poly(g, BK, SHIELD(0));
    clipPoly(g, SHIELD(1.2));
    [[11, 4], [18, 3.4], [25.2, 3.4]].forEach(() => {});
    rect(g, RED, 17, 6, 8, 3);
    rect(g, RED, 0, 14, 28, 4); rect(g, RED, 0, 22, 28, 4); rect(g, RED, 0, 29, 28, 3);
    rect(g, RED, 3, 3, 13, 9);
    g.restore();
    word(g, 'CRF', 4, 5, WH);
  } },
  // Palmeiras: círculo verde con aro blanco, el escudo con la P, las estrellas y la estrella roja.
  PAL: { draw(g) {
    px(g, '#c8102e', 14, 1, 13, 2, 14, 2, 15, 2, 11, 3, 12, 3, 13, 3, 14, 3, 15, 3, 16, 3, 17, 3, 12, 4, 13, 4, 14, 4, 15, 4, 16, 4, 12, 5, 16, 5);
    circ(g, WH, 14, 19.5, 12.5); circ(g, '#006437', 14, 19.5, 11.5); circ(g, WH, 14, 15, 7);
    poly(g, '#006437', [[14, 8.6], [19, 10.4], [18.6, 15.4], [14, 20], [9.4, 15.4], [9, 10.4]]);
    poly(g, WH, [[14, 9.8], [17.8, 11.2], [17.4, 15], [14, 18.8], [10.6, 15], [10.2, 11.2]]);
    rect(g, '#006437', 12, 11, 2, 7); rect(g, '#006437', 12, 11, 4, 2); rect(g, '#006437', 14.4, 11, 1.6, 4); rect(g, '#006437', 12, 14, 4, 1.4);
    word(g, 'PAL', 8.5, 26, WH);
  } },
  // Santos: escudo rayado con la banda diagonal S.F.C. y la pelota.
  SFC: { draw(g) {
    poly(g, BK, SHIELD(0)); poly(g, WH, SHIELD(1.4));
    clipPoly(g, SHIELD(1.4));
    [5, 11, 17].forEach((a) => rect(g, BK, a, 0, 3, 34));
    poly(g, WH, [[0, 0], [28, 0], [28, 2], [0, 14]]);
    poly(g, WH, [[0, 25], [0, 14], [28, 2], [28, 12]]);
    poly(g, BK, [[0, 23], [0, 16], [28, 4], [28, 10]]);
    g.restore();
    word(g, 'S', 5, 14, WH); word(g, 'F', 12, 11, WH); word(g, 'C', 19, 8, WH);
    circ(g, BK, 8, 7, 3.4); circ(g, WH, 8, 7, 2.4); px(g, BK, 8, 5, 8, 6, 7, 7, 9, 7, 8, 8, 8, 9);
  } },
  // Atlético Mineiro: escudo blanquinegro con CAM y las barras.
  CAM: { draw(g) {
    g.fillStyle = MID;
    poly(g, BK, SHIELD(0)); poly(g, WH, SHIELD(1.2)); poly(g, BK, SHIELD(2.2));
    clipPoly(g, SHIELD(2.2));
    rect(g, WH, 0, 11, 28, 1);
    [7, 11, 15, 19].forEach((x) => rect(g, WH, x, 12, 1, 22));
    g.restore();
    word(g, 'CAM', 8, 5, WH);
  } },
  // Fluminense: escudo granate y verde con el monograma blanco.
  FLU: { draw(g) {
    g.fillStyle = MID;
    poly(g, '#8a1538', SHIELD(0)); poly(g, WH, SHIELD(1)); clipPoly(g, SHIELD(2.6));
    rect(g, '#8a1538', 0, 0, 28, 16); rect(g, '#00734d', 0, 17, 28, 18);
    g.restore();
    word(g, 'FFC', 8, 12, WH);
  } },
  // Mirassol: círculo amarillo con aros verdes, MFC, las tres estrellas y la cinta.
  MIR: { draw(g) {
    const G = '#0a8f2f', Y = '#f7d117';
    star5(g, G, 5, 0); star5(g, Y, 11, 0); star5(g, G, 17, 0);
    poly(g, G, [[0, 24], [4, 23], [4, 28], [14, 31], [24, 28], [24, 23], [28, 24], [26, 29], [14, 33], [2, 29]]);
    circ(g, G, 14, 16, 11); circ(g, Y, 14, 16, 10); circ(g, G, 14, 16, 9); circ(g, Y, 14, 16, 8.4);
    poly(g, Y, [[3, 25], [14, 28.5], [25, 25], [25, 30], [14, 32], [3, 30]]);
    rect(g, G, 6, 11, 1, 9); rect(g, G, 10, 11, 1, 9); px(g, G, 7, 12, 8, 13, 9, 12);
    rect(g, G, 12, 11, 1, 9); rect(g, G, 13, 11, 3, 1); rect(g, G, 13, 15, 2, 1);
    rect(g, G, 17, 12, 1, 7); rect(g, G, 18, 11, 3, 1); rect(g, G, 18, 19, 3, 1); px(g, G, 21, 12, 21, 18);
    rect(g, G, 6, 27, 16, 1);
  } },
  // Vasco da Gama: escudo negro con banda blanca, la carabela con la cruz roja y las letras.
  VAS: { draw(g) {
    g.fillStyle = MID;
    poly(g, BK, SHIELD(0)); poly(g, WH, SHIELD(1.1)); poly(g, BK, SHIELD(2.2));
    clipPoly(g, SHIELD(2.2));
    poly(g, WH, [[0, 26.5], [26.5, 0], [28, 0], [28, 7.5], [0, 35.5]]);
    g.restore();
    const RC = '#c1272d';
    rect(g, BK, 11, 5, 8, 5); rect(g, WH, 12, 6, 6, 3);
    rect(g, BK, 9, 10, 12, 11); rect(g, WH, 10, 11, 10, 9);
    rect(g, RC, 14, 12, 3, 7); rect(g, RC, 12, 14, 7, 3);
    poly(g, BK, [[8, 20], [22, 19], [20, 25], [12, 26]]); poly(g, '#e8a01c', [[9, 21], [20, 20.4], [19, 24], [12, 24.6]]);
    word(g, 'R', 4, 8, WH); word(g, 'V', 13, 27, WH);
  } },
  // Bahia: círculo azul con la bandera tricolor y las dos estrellas.
  BAH: { draw(g) {
    const B = '#0065b3', R = '#ea1c24';
    star5(g, '#ffe000', 3, 0); star5(g, '#ffe000', 20, 0);
    circ(g, B, 14, 20, 12.8); circ(g, WH, 14, 20, 9);
    rect(g, B, 8, 13, 1, 13);
    rect(g, B, 9, 13, 4, 5);
    rect(g, WH, 13, 13, 8, 2); rect(g, R, 13, 15, 8, 3);
    rect(g, WH, 9, 18, 12, 3); rect(g, R, 9, 21, 12, 4);
    circ(g, WH, 11, 15.5, 1.2);
  } },
  // Cruzeiro: círculo azul con aro blanco y las cinco estrellas de la Cruz del Sur.
  CRU: { draw(g) {
    const B = '#1f3d8f';
    circ(g, B, 14, 17, 13); circ(g, WH, 14, 17, 12); circ(g, B, 14, 17, 8.6);
    [[14, 17], [8, 13], [20, 13]].forEach(([x, y]) => px(g, WH, x, y, x - 1, y, x + 1, y, x, y - 1, x, y + 1));
    px(g, WH, 14, 8, 13, 8, 15, 8, 14, 7, 14, 9); px(g, WH, 14, 25, 13, 25, 15, 25, 14, 24, 14, 26);
    px(g, WH, 16, 17);
  } },
  // Grêmio: círculo celeste, blanco y negro con GRÊMIO en la banda central y las tres estrellas.
  GRE: { draw(g) {
    star5(g, '#947650', 4, 0); star5(g, '#aaaaaa', 11, 0); star5(g, '#f5c400', 18, 0);
    circ(g, BK, 14, 19, 13); circ(g, WH, 14, 19, 11.8);
    clipCirc(g, 10.8, 14, 19);
    rect(g, '#0d80bf', 0, 0, 28, 34);
    ell(g, WH, 14, 10, 4.4, 6, 0); ell(g, WH, 14, 28, 4.4, 6, 0);
    rect(g, BK, 0, 14, 28, 10);
    g.restore();
    word(g, 'GRE', 9, 17, WH);
  } },
  // Internacional: círculo rojo con aro blanco y el monograma S I.
  SCI: { draw(g) {
    const R = '#e4091a';
    circ(g, R, 14, 17, 13); circ(g, WH, 14, 17, 12); circ(g, R, 14, 17, 9.4); circ(g, WH, 14, 17, 8.6); circ(g, R, 14, 17, 8);
    poly(g, WH, [[4.5, 17], [9, 12], [9, 22]]); poly(g, WH, [[23.5, 17], [19, 12], [19, 22]]);
    rect(g, WH, 12, 7, 4, 5); rect(g, WH, 11, 7, 6, 1); rect(g, WH, 12, 22, 4, 5); rect(g, WH, 11, 26, 6, 1);
    word(g, 'S', 11, 12, WH, 2);
  } },
  // Red Bull Bragantino: escudo blanco con borde azul, los dos toros rojos, el sol amarillo y la pelota.
  RBB: { draw(g) {
    g.fillStyle = MID;
    const N = '#0b1f4d', R = '#d6203c';
    poly(g, N, SHIELD(0)); poly(g, WH, SHIELD(1.2)); poly(g, N, SHIELD(2)); poly(g, WH, SHIELD(3));
    clipPoly(g, SHIELD(3));
    circ(g, '#fccc0a', 14, 21, 7);
    g.restore();
    word(g, 'RED', 8, 4, R); word(g, 'BULL', 6, 10, R);
    poly(g, R, [[1, 18], [4, 20], [11, 20], [13, 25], [7, 25], [4, 26], [2, 22]]); poly(g, R, [[27, 18], [24, 20], [17, 20], [15, 25], [21, 25], [24, 26], [26, 22]]);
    circ(g, WH, 14, 18, 3.2); px(g, N, 13, 17, 14, 17, 14, 18, 13, 19, 15, 19, 15, 16);
    rect(g, N, 8, 27, 12, 1);
  } },
  // São Paulo: escudo blanco con el rectángulo negro SPFC y la T roja, blanca y negra.
  SAO: { draw(g) {
    const P = [[2, 2], [25, 2], [25, 19], [13.5, 32], [2, 19]];
    poly(g, BK, P); poly(g, WH, [[3, 3], [24, 3], [24, 18.6], [13.5, 30.6], [3, 18.6]]);
    rect(g, BK, 4, 4, 20, 8);
    word(g, 'SPFC', 6, 6, WH);
    poly(g, '#d71920', [[4, 14], [12, 14], [12, 26]]); poly(g, BK, [[23, 14], [15, 14], [15, 26]]);
  } },
  // Vitória: escudo rojinegro con el monograma blanco.
  VIT: { draw(g) {
    poly(g, BK, SHIELD(0)); poly(g, WH, SHIELD(1.1)); clipPoly(g, SHIELD(2.2));
    rect(g, '#ff0010', 0, 0, 28, 16); rect(g, BK, 0, 16, 28, 18);
    g.restore();
    word(g, 'EC', 7, 13, WH);
    px(g, WH, 15, 13, 19, 13, 15, 14, 19, 14, 16, 15, 18, 15, 16, 16, 18, 16, 17, 17);
  } },
};
