// Calcciopoli · escudos de la Serie A dibujados a mano, siguiendo los escudos reales (ver crests.js).
import { BK, WH, poly, rect, circ, ell, px, word, art, SHIELD, star, vstripes, hstripes, disc, clipCirc, clipPoly, ring } from './crestkit.js';

const alt = (a, b, n) => Array.from({ length: n }, (_, i) => (i % 2 ? b : a));
const GOLD = '#f2b900', RED = '#d41f2a', NAVY = '#12295c', SKY = '#4aa8e0';
// Recorta el dibujo siguiente a una elipse (hay que cerrar con g.restore()).
const clipEll = (g, cx, cy, rx, ry) => { g.save(); g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, 7); g.clip(); };

export const CRESTS_IT = {
  // Atalanta: círculo negro, perfil azul de la mujer y su pelo en ondas negras.
  ATA: { draw(g) {
    circ(g, BK, 13.5, 17, 13); circ(g, WH, 13.5, 17, 11.8);
    clipCirc(g, 11.8);
    poly(g, '#1c6db0', [[0, 0], [14, 0], [12, 7], [9, 10], [10, 13], [8, 16], [10, 18], [9, 21], [11, 25], [0, 34]]);
    [8, 11, 14, 17, 20, 23].forEach((y, i) => { for (let x = 12 + i % 2; x < 27; x++) px(g, BK, x, y + ((x >> 1) % 2)); });
    g.restore();
  } },
  // Bologna: óvalo con franjas azulgrana, cruz roja y las letras BFC sobre azul.
  BFC: { draw(g) {
    ell(g, BK, 13.5, 17, 10, 15); ell(g, WH, 13.5, 17, 8.8, 13.8);
    clipEll(g, 13.5, 17, 8.8, 13.8);
    rect(g, NAVY, 0, 0, 28, 12); word(g, 'BFC', 8, 6, WH);
    vstripes(g, alt('#c4202e', NAVY, 4), 5, 13, 12, 32);
    rect(g, RED, 17, 13, 2, 17); rect(g, RED, 14, 18, 8, 2);
    g.restore();
  } },
  // Cagliari: escudo con la banda roja, la cruz roja y las cuatro cabezas de moro.
  CAG: { draw(g) {
    poly(g, NAVY, SHIELD(0)); clipPoly(g, SHIELD(1.3));
    rect(g, WH, 0, 0, 28, 34); rect(g, RED, 0, 0, 28, 9); word(g, 'CAG', 8, 3, WH);
    rect(g, RED, 13, 9, 2, 22); rect(g, RED, 0, 18, 28, 2);
    [[8, 12], [18, 12], [8, 23], [18, 23]].forEach(([x, y]) => { rect(g, BK, x, y, 3, 3); px(g, WH, x, y + 1); });
    g.restore();
  } },
  // Como: cruz celeste detrás, escudo blanco con el nombre y las olas.
  COM: { draw(g) {
    const B = '#2b6cb8';
    rect(g, B, 11, 1, 6, 32); rect(g, B, 1, 11, 26, 6);
    poly(g, NAVY, [[4, 5], [23, 5], [23, 22], [19, 27], [13.5, 31], [8, 27], [4, 22]]);
    poly(g, WH, [[5.2, 6.2], [21.8, 6.2], [21.8, 21.6], [18.4, 26], [13.5, 29.4], [8.6, 26], [5.2, 21.6]]);
    word(g, 'COMO', 6, 10, NAVY);
    [17, 20, 23].forEach((y) => { for (let x = 7; x < 21; x++) px(g, B, x, y + ((x >> 1) % 2)); });
  } },
  // Cremonese: círculo rojo, gris y dorado, el escudo de franjas con el poste azul y las letras U S C.
  CRE: { draw(g) {
    circ(g, RED, 14, 17, 12.4); circ(g, '#85868c', 14, 17, 10.4); circ(g, '#d09e50', 14, 17, 8.8);
    poly(g, WH, [[10, 3], [14, 3], [14, 17], [12.4, 15], [11.4, 12], [11, 9], [10.4, 6], [10, 5]]);
    rect(g, RED, 10, 3, 4, 2); rect(g, RED, 10, 8, 4, 3); rect(g, RED, 10, 13, 4, 2);
    poly(g, '#0b4a9a', [[14, 3], [18, 3], [18, 5], [17.4, 6], [17, 9], [16.6, 12], [15.6, 15], [14, 17]]);
    rect(g, '#d09e50', 14, 5, 2, 9); px(g, RED, 14, 8, 15, 10, 14, 12);
    // letras blancas con borde negro
    const L = [[1, 12, 2, 9], [6, 12, 2, 10], [2, 20, 5, 2], [20, 12, 2, 10], [22, 12, 5, 2], [22, 20, 5, 2], [25, 14, 2, 1], [25, 18, 2, 2],
      [12, 19, 6, 2], [12, 21, 2, 3], [14, 23, 4, 2], [16, 25, 2, 3], [12, 28, 6, 2]];
    L.forEach(([x, y, w, h]) => rect(g, BK, x - 1, y - 1, w + 2, h + 2));
    L.forEach(([x, y, w, h]) => rect(g, WH, x, y, w, h));
  } },
  // Hellas Verona: las dos cabezas doradas que forman la V, con la escalera en el centro.
  HEL: { draw(g) {
    poly(g, GOLD, [[2, 2], [25, 2], [25, 21], [21, 28], [13.5, 32.6], [6, 28], [2, 21]]);
    poly(g, '#14337a', [[3.2, 3.2], [23.8, 3.2], [23.8, 20.6], [20.4, 27], [13.5, 31], [6.6, 27], [3.2, 20.6]]);
    const A = [[6, 5], [11.6, 12.4], [10.6, 26.4], [4.4, 17.4], [3, 12.6], [3.2, 9.4], [5.6, 6.6]];
    poly(g, GOLD, A); poly(g, GOLD, A.map(([x, y]) => [27 - x, y]));
    px(g, '#14337a', 4, 11, 5, 11, 22, 11, 21, 11);
    poly(g, GOLD, [[13.5, 14.6], [11.8, 17.4], [15.2, 17.4]]);
    rect(g, GOLD, 12, 19, 3, 1); rect(g, GOLD, 12, 21, 3, 1); rect(g, GOLD, 12, 23, 3, 1);
    poly(g, GOLD, [[12, 25], [15, 25], [15, 27.6], [13.5, 30], [12, 27.6]]);
  } },
  // Pisa: óvalo negro con franjas azules, la cruz pisana sobre el círculo rojo y la torre blanca.
  PIS: { draw(g) {
    ell(g, BK, 14, 17, 11.8, 15.8); ell(g, '#1f5fd0', 14, 17, 10.8, 14.8); ell(g, '#101216', 14, 17, 9.6, 13.6);
    clipEll(g, 14, 17, 9.6, 13.6);
    rect(g, '#1f5fd0', 8, 0, 3, 34); rect(g, '#1f5fd0', 18, 0, 3, 34);
    word(g, 'PISA', 6, 9, WH);
    g.restore();
    circ(g, RED, 10.5, 22, 4.2);
    px(g, WH, 10, 19, 10, 20, 10, 21, 10, 22, 10, 23, 10, 24, 7, 22, 8, 22, 9, 22, 11, 22, 12, 22, 13, 22, 8, 20, 12, 24, 8, 24, 12, 20);
    rect(g, WH, 15, 18, 3, 2); rect(g, WH, 14, 21, 4, 2); rect(g, WH, 13, 24, 5, 2); rect(g, WH, 12, 27, 6, 2);
  } },
  // Fiorentina: rombo violeta con borde blanco, lirio rojo arriba y la curva violeta abajo.
  FIO: { draw(g) {
    const V = '#5b2a86';
    poly(g, V, [[13.5, 0.5], [26.5, 17], [13.5, 33.5], [0.5, 17]]);
    poly(g, WH, [[13.5, 2.4], [24.6, 17], [13.5, 31.6], [2.4, 17]]);
    clipPoly(g, [[13.5, 2.4], [24.6, 17], [13.5, 31.6], [2.4, 17]]);
    ell(g, V, 13.5, 28, 14, 11); ell(g, WH, 13.5, 27, 0, 0);
    g.restore();
    art(g, 10, 6, ['...#...', '..###..', '#.###.#', '##.#.##', '.#####.', '..###..', '...#...', '..###..'], { '#': RED });
  } },
  // Genoa: escudo dorado, cruz de San Jorge arriba y el grifo dorado sobre rojo y azul.
  GEN: { draw(g) {
    poly(g, '#c9a24a', SHIELD(0)); clipPoly(g, SHIELD(1.3));
    rect(g, WH, 0, 0, 28, 12); rect(g, RED, 12, 0, 3, 12); rect(g, RED, 0, 5, 28, 3);
    rect(g, '#c4202e', 0, 12, 14, 22); rect(g, '#14284f', 14, 12, 14, 22);
    poly(g, GOLD, [[9, 14], [11, 12.4], [14, 13.4], [18, 12], [18, 17], [17, 21], [15.4, 23], [16.6, 28], [12, 28], [11, 22.6], [8.8, 19]]);
    px(g, '#c4202e', 15, 15);
    g.restore();
  } },
  // Inter: círculo negro con aro azul y el monograma blanco I M.
  INT: { draw(g) {
    circ(g, BK, 13.5, 17, 13); circ(g, WH, 13.5, 17, 11.4); circ(g, '#1a3a9a', 13.5, 17, 10.2);
    ring(g, WH, 13.5, 17, 7.6, 1.2);
    rect(g, WH, 8, 11, 2, 12);
    rect(g, WH, 12, 11, 2, 12); rect(g, WH, 18, 11, 2, 12); poly(g, WH, [[12, 11], [14, 11], [16, 17], [18, 11], [20, 11], [16, 22]]);
  } },
  // Juventus: el nombre arriba y las dos J negras que forman el escudo, la chica con la barra arriba.
  JUV: { draw(g) {
    poly(g, WH, [[3, 2], [24, 2], [24, 22], [20, 29], [13.5, 32.6], [7, 29], [3, 22]]);
    word(g, 'JUVE', 6, 3, BK);
    poly(g, BK, [[4, 10], [13, 10], [13, 21], [11, 25], [4, 27.5], [4, 25.5], [8, 24], [10, 21], [10, 12], [4, 12]]);
    poly(g, BK, [[17, 10], [21, 10], [21, 21], [18, 27], [9, 31], [9, 29], [15, 25.5], [17, 21]]);
  } },
  // Lazio: águila dorada de alas abiertas sobre el escudo celeste y blanco.
  LAZ: { draw(g) {
    poly(g, '#d9a41c', [[0, 9], [5, 4], [12, 6], [13.5, 8], [15, 6], [22, 4], [27, 9], [20, 9], [16, 12], [11, 12], [7, 9]]);
    poly(g, '#b27f10', [[5, 8], [11, 8], [12, 10], [8, 10]]); poly(g, '#b27f10', [[22, 8], [16, 8], [15, 10], [19, 10]]);
    poly(g, WH, [[7, 11], [20, 11], [20, 22], [13.5, 31.6], [7, 22]]);
    poly(g, SKY, [[8.2, 12.2], [18.8, 12.2], [18.8, 21.6], [13.5, 29.6], [8.2, 21.6]]);
    rect(g, WH, 12, 15, 3, 15); rect(g, NAVY, 8, 12, 11, 3); px(g, WH, 10, 13, 13, 13, 16, 13);
  } },
  // Lecce: escudo azul con las franjas amarilla y roja y el olivo.
  LEC: { draw(g) {
    poly(g, '#7a8fa8', SHIELD(0)); clipPoly(g, SHIELD(1.2));
    rect(g, '#3f78b0', 0, 0, 28, 34); word(g, 'LEC', 8, 4, WH);
    rect(g, RED, 0, 10, 28, 1); rect(g, GOLD, 0, 11, 28, 2);
    circ(g, '#c8b078', 13.5, 17, 4.6); circ(g, '#dccb94', 12, 15.6, 2.2); rect(g, '#a48c58', 13, 21, 2, 6); px(g, '#7a6a40', 10, 18, 16, 17, 13, 13);
    rect(g, '#b8b8c0', 16, 26, 5, 2); rect(g, '#b8b8c0', 20, 24, 1, 2);
    g.restore();
  } },
  // Milan: óvalo rojinegro con franjas verticales.
  MIL: { draw(g) {
    ell(g, BK, 13.5, 17, 10.4, 15.4); ell(g, WH, 13.5, 17, 9.2, 14.2);
    clipEll(g, 13.5, 17, 9.2, 14.2);
    vstripes(g, alt('#d2121f', BK, 6), 4, 23, 7, 29);
    rect(g, WH, 0, 0, 28, 7); rect(g, WH, 0, 29, 28, 5); word(g, 'AC', 10, 2, BK);
    g.restore();
  } },
  // Napoli: disco celeste con aro blanco y la N.
  NAP: { draw(g) {
    circ(g, WH, 13.5, 17, 13); circ(g, '#2b9ed8', 13.5, 17, 11.6); ring(g, WH, 13.5, 17, 10, 0.8);
    rect(g, WH, 9, 11, 2, 12); rect(g, WH, 16, 11, 2, 12); poly(g, WH, [[9, 11], [11.4, 11], [18, 23], [15.6, 23]]);
    rect(g, WH, 7, 10, 5, 1); rect(g, WH, 15, 10, 5, 1); rect(g, WH, 7, 23, 5, 1); rect(g, WH, 15, 23, 5, 1);
  } },
  // Parma: escudo con la cruz negra sobre blanco y las franjas amarillas y azules.
  PRM: { draw(g) {
    poly(g, NAVY, SHIELD(0)); clipPoly(g, SHIELD(1.3));
    rect(g, GOLD, 0, 0, 28, 6);
    rect(g, WH, 0, 6, 14, 28); rect(g, BK, 7, 7, 2, 24); rect(g, BK, 3, 13, 10, 2);
    rect(g, GOLD, 14, 6, 14, 28); [16, 19, 22].forEach((x) => rect(g, NAVY, x, 6, 1, 28));
    g.restore();
  } },
  // Roma: escudo con pico arriba, la loba gris con los gemelos sobre amarillo y ROMA dorado sobre granate.
  ROM: { draw(g) {
    const S = (i) => [[13.5, 1 + i * 1.2], [25 - i, 5 + i], [25 - i, 19], [22.5 - i, 26 - i], [13.5, 33 - i * 1.6], [4.5 + i, 26 - i], [2 + i, 19], [2 + i, 5 + i]];
    poly(g, BK, S(0)); clipPoly(g, S(1.2));
    rect(g, '#f4a916', 0, 0, 28, 17); rect(g, '#8c1a30', 0, 17, 28, 17);
    word(g, 'ROMA', 6, 20, '#f4a916');
    const W = '#a9abb0', D = '#6e7078';
    ell(g, W, 14.5, 9.4, 6.6, 2.3); poly(g, W, [[4, 9.5], [5, 6.6], [8, 5.6], [10.4, 7], [11, 9.6], [8, 11]]);
    poly(g, D, [[3, 9], [4.6, 8.6], [4.6, 10], [3, 10.2]]); px(g, W, 6, 5, 7, 4, 8, 5);
    px(g, BK, 6, 8, 5, 10);
    rect(g, W, 9, 11, 1, 5); rect(g, W, 11, 11, 1, 5); rect(g, W, 18, 11, 1, 5); rect(g, W, 20, 11, 1, 5); rect(g, W, 8, 16, 14, 1);
    px(g, D, 14, 11, 16, 11, 20, 12, 15, 8, 18, 7);
    poly(g, W, [[20, 7.5], [22.4, 6], [23, 7], [21, 9]]);
    circ(g, '#e6b98c', 13.5, 13, 0.9); rect(g, '#e6b98c', 13, 14, 2, 2); circ(g, '#e6b98c', 16.5, 13, 0.9); rect(g, '#e6b98c', 16, 14, 2, 2);
    g.restore();
  } },
  // Sassuolo: escudo negro con tres figuras, franja verde y franjas verdinegras con el balón.
  SAS: { draw(g) {
    poly(g, BK, SHIELD(0)); poly(g, '#e6e6e6', SHIELD(0.9)); poly(g, BK, SHIELD(1.6)); clipPoly(g, SHIELD(2));
    rect(g, BK, 0, 0, 28, 12);
    [8, 12, 16].forEach((x) => { rect(g, WH, x, 5, 1, 5); px(g, WH, x, 4); });
    rect(g, '#0e9a40', 0, 12, 28, 3);
    vstripes(g, alt('#0e9a40', BK, 7), 3, 24, 15, 34);
    circ(g, WH, 13.5, 24, 4); px(g, BK, 13, 23, 12, 25, 15, 25, 14, 22);
    g.restore();
  } },
  // Torino: escudo granate con borde dorado, el toro blanco y las letras.
  TOR: { draw(g) {
    poly(g, '#b8956a', SHIELD(0)); clipPoly(g, SHIELD(1.3));
    rect(g, '#7a1d22', 0, 0, 28, 34); word(g, 'TOR', 8, 4, WH);
    poly(g, WH, [[7, 14], [10, 13], [12, 15], [17, 15], [20, 13], [20, 20], [18, 23], [19, 28], [16, 28], [15, 24], [13, 24], [12, 28], [9, 28], [10, 22], [8, 18]]);
    px(g, WH, 6, 11, 7, 12, 10, 11, 11, 12, 5, 12);
    g.restore();
  } },
  // Udinese: corona de laurel, disco blanco y la flecha negra.
  UDI: { draw(g) {
    const L = '#8c9078';
    for (let i = 0; i < 16; i++) { const a = 0.9 + i * 0.28; [-1, 1].forEach((d) => { const x = 13.5 + d * 11.6 * Math.sin(a), y = 17 - 11.6 * Math.cos(a); circ(g, L, x, y, 1.4); }); }
    circ(g, '#dedede', 13.5, 17, 9.6);
    poly(g, BK, [[13.5, 9.5], [20, 19], [16.4, 19], [13.5, 14.8], [10.6, 19], [7, 19]]);
  } },
};
