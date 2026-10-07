// Calcciopoli · escudos del fútbol brasileño dibujados a mano, siguiendo los escudos reales (ver crests.js).
import { BK, WH, poly, rect, circ, px, word, SHIELD, star, clipPoly, ring } from './crestkit.js';

const RED = '#e4002b';

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
};
