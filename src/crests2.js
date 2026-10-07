// Calcciopoli · escudos de los demás clubes (ver crests.js).
import { BK, WH, poly, rect, circ, ell, px, word, art, SHIELD, ring, star, vstripes, hstripes, disc, clipCirc, clipPoly } from './crestkit.js';

// Escudo con borde: se rellena con fn dentro del casco.
const sh = (g, border, fn, inner = 1.6) => { poly(g, border, SHIELD(0)); clipPoly(g, SHIELD(inner)); fn(); g.restore(); };
// Aros de colores con el centro recortado: fn dibuja adentro.
const rd = (g, layers, rIn, fn) => { disc(g, layers); clipCirc(g, rIn); fn(); g.restore(); };
const alt = (a, b, n) => Array.from({ length: n }, (_, i) => (i % 2 ? b : a));

export const CRESTS2 = {
  // ---- Clubes de América ----
  // Racing: círculo celeste y blanco a franjas, con una banda y las letras.
  RAC: { draw(g) {
    rd(g, [[13.5, '#1a2a55'], [12.4, '#74acdf']], 12.4, () => vstripes(g, alt('#74acdf', '#f4f4f4', 8), 1, 26, 3, 31));
    rect(g, '#1a2a55', 1, 14, 25, 7); rect(g, '#74acdf', 1, 15, 25, 1); rect(g, '#74acdf', 1, 19, 25, 1); word(g, 'RAC', 8, 15, '#f4f4f4');
  } },
  // U. Católica: escudo azul con la cruz blanca.
  UC: { draw(g) {
    sh(g, '#0c2d83', () => { rect(g, '#0c2d83', 0, 0, 28, 34); rect(g, WH, 11, 4, 5, 22); rect(g, WH, 5, 10, 17, 5); rect(g, '#d6182b', 12, 5, 3, 20); rect(g, '#d6182b', 6, 11, 15, 3); word(g, 'UC', 9, 25, WH); }, 1.2);
  } },
  // Flamengo: rojinegro en franjas con las letras CRF.
  FLA: { draw(g) {
    rd(g, [[13.5, BK], [12.4, '#c8102e']], 12.4, () => hstripes(g, alt('#c8102e', BK, 7), 1, 26, 3, 31));
    rect(g, BK, 1, 13, 25, 8); rect(g, '#c8102e', 1, 13, 25, 1); word(g, 'CRF', 8, 14, WH); rect(g, '#c8102e', 1, 20, 25, 1);
  } },
  // Palmeiras: círculo verde con la P blanca.
  PAL: { draw(g) {
    disc(g, [[13.5, '#006437'], [11.6, WH], [10.4, '#006437']]);
    art(g, 8, 9, ['#######..', '########.', '##....###', '##....###', '##....###', '########.', '#######..', '##.......', '##.......', '##.......', '##.......', '##.......'], { '#': WH });
    star(g, '#f3c613', 20, 11, 1.8); star(g, '#f3c613', 20, 24, 1.8);
  } },
  // Independiente: escudo rojo con las letras CAI.
  IND: { draw(g) {
    sh(g, WH, () => { rect(g, '#d3202d', 0, 0, 28, 34); rect(g, WH, 0, 12, 28, 9); word(g, 'CAI', 8, 14, '#d3202d'); rect(g, '#8c1018', 0, 20, 28, 1); star(g, WH, 13.5, 7, 2); }, 1.4);
  } },
  // San Lorenzo: azulgrana a franjas con las letras CASLA.
  SLO: { draw(g) {
    sh(g, BK, () => { vstripes(g, alt('#0b2a6b', '#c8102e', 6), 0, 28, 0, 34); rect(g, WH, 0, 12, 28, 8); word(g, 'CASLA', 4, 13, '#0b2a6b'); }, 1.5);
  } },
  // Estudiantes: rojo y blanco a franjas con las letras EDLP.
  EST: { draw(g) {
    sh(g, BK, () => { vstripes(g, alt('#d8132b', WH, 6), 0, 28, 0, 34); rect(g, BK, 0, 12, 28, 8); word(g, 'EDLP', 6, 14, WH); rect(g, '#f3c613', 0, 11, 28, 1); rect(g, '#f3c613', 0, 20, 28, 1); }, 1.5);
  } },
  // Vélez: escudo blanco con la V azul.
  VEL: { draw(g) {
    sh(g, '#0b3b8c', () => { rect(g, WH, 0, 0, 28, 34); poly(g, '#0b3b8c', [[2, 3], [9, 3], [13.5, 19], [18, 3], [25, 3], [16.5, 27], [10.5, 27]]); poly(g, '#3b6ac0', [[3, 3], [5.5, 3], [11, 22], [10, 23]]); word(g, 'CAV', 8, 28, '#0b3b8c'); }, 1.3);
  } },
  // Peñarol: círculo amarillo y negro con las letras CAP.
  PEN: { draw(g) {
    rd(g, [[13.5, BK], [12.4, '#f7d117']], 12.4, () => vstripes(g, alt('#f7d117', BK, 8), 1, 26, 3, 31));
    rect(g, '#f7d117', 1, 12, 25, 9); rect(g, BK, 1, 12, 25, 1); rect(g, BK, 1, 20, 25, 1); word(g, 'CAP', 8, 14, BK);
  } },
  // Nacional (Uruguay): blanco, azul y rojo en bandas.
  NAC: { draw(g) {
    sh(g, BK, () => { hstripes(g, ['#0b3b8c', WH, '#d8132b'], 0, 28, 0, 34); word(g, 'CN', 10, 13, '#0b3b8c'); star(g, WH, 13.5, 6, 2); }, 1.5);
  } },
  // Corinthians: círculo blanco y negro con las letras SCCP.
  COR: { draw(g) {
    disc(g, [[13.5, BK], [12.3, WH], [10.6, BK], [9.4, WH]]);
    word(g, 'SCCP', 6, 15, BK); rect(g, '#d8132b', 6, 22, 15, 1); rect(g, BK, 7, 9, 13, 2); rect(g, BK, 12, 10, 3, 4);
  } },
  // São Paulo: bandas rojo, blanco y negro con SPFC.
  SAO: { draw(g) {
    sh(g, BK, () => { hstripes(g, ['#d8132b', WH, BK], 0, 28, 0, 34); word(g, 'SPFC', 6, 13, BK); star(g, '#f3c613', 13.5, 6, 2); star(g, '#f3c613', 8.5, 7, 1.4); star(g, '#f3c613', 18.5, 7, 1.4); }, 1.5);
  } },
  // Atlético Nacional: verde y blanco a franjas.
  ATN: { draw(g) {
    sh(g, '#0a6b3a', () => { vstripes(g, alt('#0a6b3a', WH, 6), 0, 28, 0, 34); rect(g, '#0a6b3a', 0, 12, 28, 8); rect(g, WH, 0, 12, 28, 1); rect(g, WH, 0, 19, 28, 1); word(g, 'ATN', 8, 14, WH); }, 1.5);
  } },
  // América: escudo amarillo con banda azul.
  AME: { draw(g) {
    sh(g, '#0b2a6b', () => { rect(g, '#f7d117', 0, 0, 28, 34); rect(g, '#0b2a6b', 0, 3, 28, 7); word(g, 'CLUB', 5, 4, '#f7d117'); word(g, 'A', 11, 14, '#0b2a6b', 2); rect(g, '#0b2a6b', 5, 27, 18, 2); }, 1.5);
  } },
  // Universitario: la U granate sobre crema.
  UNI: { draw(g) {
    sh(g, '#7a1530', () => { rect(g, '#f0e6c8', 0, 0, 28, 34); art(g, 6, 6, ['#####...#####', '#####...#####', '#####...#####', '#####...#####', '#####...#####', '#####...#####', '#####...#####', '#####...#####', '######.######', '.###########.', '..#########..', '...#######...'], { '#': '#7a1530' }); word(g, 'CRC', 8, 24, '#7a1530'); }, 1.5);
  } },
  // Alianza Lima: azul y blanco con el círculo central.
  ALI: { draw(g) {
    sh(g, '#0a2a6b', () => { vstripes(g, alt('#0a2a6b', WH, 6), 0, 28, 0, 34); circ(g, WH, 13.5, 15, 7.5); circ(g, '#0a2a6b', 13.5, 15, 6.4); word(g, 'AL', 10, 12, WH); star(g, '#f3c613', 13.5, 21, 1.5); }, 1.5);
  } },

  // ---- Clubes de Europa ----
  // Atlético de Madrid: franjas rojiblancas arriba, el oso y el madroño sobre azul.
  ATM: { draw(g) {
    sh(g, '#15171d', () => {
      vstripes(g, alt('#cb3524', WH, 6), 0, 28, 0, 17);
      rect(g, '#1b3d8f', 0, 17, 28, 20);
      for (let i = 0; i < 7; i++) star(g, '#cb3524', 4.2 + i * 3.2, 16.3, 1.5);
      // el oso (marrón) junto al madroño (verde)
      ell(g, '#6b3f26', 10.5, 25, 3.2, 3); circ(g, '#6b3f26', 8.2, 21.5, 1.6); px(g, '#6b3f26', 7, 20, 9, 20); rect(g, '#6b3f26', 8, 27, 1, 2); rect(g, '#6b3f26', 12, 27, 1, 2);
      rect(g, '#7a5a2a', 17, 23, 1, 6); ell(g, '#2f8f3a', 17.5, 22, 3, 3); px(g, '#cb3524', 16, 21, 19, 22, 17, 24);
    }, 1.3);
  } },
  // Manchester City: círculo celeste con el águila.
  MCI: { draw(g) {
    disc(g, [[13.5, '#6cabdd'], [11.8, WH], [10.6, '#1c2c5b']]);
    poly(g, '#f4d35e', [[4.5, 11], [8, 12], [13.5, 8], [19, 12], [22.5, 11], [20.5, 15], [17, 15.5], [13.5, 20], [10, 15.5], [6.5, 15]]);
    rect(g, '#6cabdd', 8, 22, 12, 1.5); rect(g, WH, 8, 24, 12, 1.5); rect(g, '#d8132b', 8, 26, 12, 1);
    px(g, '#1c2c5b', 13, 12, 14, 12);
  } },
  // Arsenal: escudo rojo con el cañón dorado.
  ARS: { draw(g) {
    sh(g, '#ef0107', () => {
      rect(g, '#ef0107', 0, 0, 28, 34); rect(g, WH, 0, 3, 28, 3);
      poly(g, '#e8b923', [[21.5, 9], [23, 11], [9, 18.5], [6.5, 17]]); poly(g, '#a8841a', [[22, 12], [23, 11], [9, 18.5], [8.5, 18]]);
      rect(g, '#e8b923', 4.5, 15, 3, 5); circ(g, '#e8b923', 12.5, 22.5, 3.2); circ(g, '#ef0107', 12.5, 22.5, 1.2); circ(g, '#e8b923', 19.5, 22.5, 3.2); circ(g, '#ef0107', 19.5, 22.5, 1.2);
      rect(g, WH, 0, 27, 28, 1);
    }, 1.2);
  } },
  // Chelsea: círculo azul con el león.
  CHE: { draw(g) {
    disc(g, [[13.5, '#034694'], [11.8, WH], [10.6, '#034694']]);
    art(g, 8, 8, [
      '...yy.yy....', '..yyyyyyy...', '..yyoyyoy...', '..yyyyyyyy..', '...yyyyyyy..', '....yyyyy.yy', '...yyyyyy.y.', '..yyyyyyyyy.', '..yyyyyyy...', '..yy.yyy....', '.yy...yy....', '.y....yy....',
    ], { y: '#dba111', o: '#8a5a10' });
  } },
  // PSG: círculo azul con la Torre Eiffel.
  PSG: { draw(g) {
    disc(g, [[13.5, '#004170'], [11.8, WH], [10.6, '#004170']]);
    poly(g, WH, [[13, 7], [14, 7], [16.5, 26], [15.2, 26], [13.5, 19.5], [11.8, 26], [10.5, 26]]); rect(g, WH, 11.5, 15, 4, 1); rect(g, WH, 12, 11, 3, 1); rect(g, '#da291c', 9, 26, 10, 1);
    rect(g, '#da291c', 6, 18, 4, 5); rect(g, WH, 7, 20, 2, 3); star(g, WH, 20.5, 11, 1.4);
  } },
  // Inter: círculo negro y azul con aro dorado y las letras FCIM.
  INT: { draw(g) {
    rd(g, [[13.5, BK], [12.4, '#c9a227'], [11.2, '#0a2a8c']], 11.2, () => vstripes(g, alt('#0a2a8c', BK, 6), 2, 25, 5, 29));
    rect(g, '#c9a227', 3, 13, 21, 8); rect(g, '#0a2a8c', 3, 14, 21, 6); word(g, 'FCIM', 6, 15, '#e8c34a'); star(g, '#c9a227', 13.5, 8, 1.8);
  } },
  // Milan: franjas rojinegras con la cruz roja sobre blanco.
  MIL: { draw(g) {
    sh(g, BK, () => { vstripes(g, alt('#fb090b', BK, 6), 0, 28, 0, 34); rect(g, WH, 0, 0, 13, 12); rect(g, '#fb090b', 5.5, 0, 2.5, 12); rect(g, '#fb090b', 0, 4.5, 13, 2.5); word(g, 'ACM', 6, 22, WH); }, 1.5);
  } },
  // Ajax: escudo blanco con la franja roja y la cabeza.
  AJA: { draw(g) {
    sh(g, BK, () => {
      rect(g, WH, 0, 0, 28, 34); rect(g, '#d2122e', 9, 0, 10, 34);
      poly(g, BK, [[10, 14], [12, 9.5], [16, 9], [18, 12], [17.5, 15], [15.5, 18], [11, 18]]); px(g, WH, 15, 12);
      word(g, 'AFC', 8, 4, BK); word(g, 'AJAX', 6, 22, BK);
    }, 1.4);
  } },
  // Tottenham: escudo azul con el gallo sobre la pelota.
  TOT: { draw(g) {
    sh(g, WH, () => {
      rect(g, '#132257', 0, 0, 28, 34);
      art(g, 8, 6, ['.....##.....', '....####....', '....###.....', '.....##.....', '...######...', '..########..', '.##########.', '##########..', '..########..', '...######...', '....#..#....', '...##..##...'], { '#': WH });
      px(g, '#d8132b', 11, 8, 10, 9); circ(g, WH, 13.5, 24, 2.8); circ(g, '#132257', 13.5, 24, 1.1);
    }, 1.2);
  } },
  // Newcastle: círculo blanquinegro con las letras NUFC.
  NEW: { draw(g) {
    rd(g, [[13.5, BK], [12.2, WH], [11, BK]], 11, () => vstripes(g, alt(WH, BK, 6), 2, 25, 5, 29));
    rect(g, WH, 2, 13, 23, 8); word(g, 'NUFC', 6, 15, BK);
  } },
  // Borussia Dortmund: círculo amarillo con BVB 09.
  BVB: { draw(g) {
    disc(g, [[13.5, BK], [12.2, '#fde100'], [10.8, BK], [9.6, '#fde100']]);
    word(g, 'BVB', 8, 11, BK); word(g, '09', 11, 18, BK);
  } },
  // Bayer Leverkusen: círculo rojo y negro con la cruz y el 04.
  LEV: { draw(g) {
    disc(g, [[13.5, BK], [12.2, '#e32221'], [10.8, BK], [9.6, '#e32221']]);
    rect(g, WH, 11, 7, 5, 6); rect(g, WH, 8, 9, 11, 2); word(g, '04', 10, 16, WH, 2);
  } },
  // Napoli: círculo celeste con la N.
  NAP: { draw(g) {
    disc(g, [[13.5, '#0b6fb0'], [12, WH], [10.8, '#12a0d7']]);
    art(g, 8, 8, ['####....####','#####...####','######..####','#######.####','####.#######','####..######','####...#####','####....####'].concat(['####....####','####....####','####....####','####....####']), { '#': WH });
  } },
  // Roma: escudo granate y amarillo con ASR.
  ROM: { draw(g) {
    sh(g, BK, () => { rect(g, '#8e1f2f', 0, 0, 14, 34); rect(g, '#f0bc42', 14, 0, 14, 34); rect(g, WH, 0, 12, 28, 8); word(g, 'ASR', 8, 14, '#8e1f2f'); star(g, '#f0bc42', 7, 6, 1.8); star(g, '#8e1f2f', 20, 6, 1.8); }, 1.5);
  } },
  // Sevilla: círculo blanco con el monograma rojo.
  SEV: { draw(g) {
    disc(g, [[13.5, BK], [12.2, WH], [10.6, '#d8132b'], [9.4, WH]]);
    word(g, 'SFC', 8, 14, '#d8132b'); rect(g, '#d8132b', 8, 10, 11, 2); rect(g, '#d8132b', 8, 21, 11, 1);
  } },
  // Athletic: franjas rojiblancas con una banda negra.
  ATH: { draw(g) {
    sh(g, BK, () => { vstripes(g, alt('#d8132b', WH, 6), 0, 28, 0, 34); rect(g, BK, 0, 12, 28, 8); word(g, 'ATH', 8, 14, WH); rect(g, '#f3c613', 0, 11, 28, 1); }, 1.5);
  } },
  // Benfica: escudo rojo con el águila.
  BEN: { draw(g) {
    sh(g, WH, () => {
      rect(g, '#e30613', 0, 0, 28, 34);
      poly(g, WH, [[13, 12], [3, 7], [4.5, 13], [8, 17], [12, 18]]); poly(g, WH, [[14, 12], [24, 7], [22.5, 13], [19, 17], [15, 18]]);
      ell(g, WH, 13.5, 16, 2.6, 4.5); circ(g, WH, 13.5, 10.5, 2); px(g, '#f3c613', 15, 11, 16, 11); poly(g, WH, [[11.5, 19], [15.5, 19], [13.5, 24]]); word(g, 'SLB', 8, 25, WH);
    }, 1.4);
  } },
  // Porto: franjas azules y blancas con la franja dorada.
  FCP: { draw(g) {
    sh(g, '#00428c', () => { vstripes(g, alt('#00428c', WH, 6), 0, 28, 0, 34); rect(g, '#d6a41c', 0, 4, 28, 8); word(g, 'FCP', 8, 6, '#00428c'); rect(g, '#d8132b', 0, 12, 28, 1); }, 1.5);
  } },
  // Sporting: aros verdes y blancos con las letras SCP.
  SCP: { draw(g) {
    sh(g, '#008057', () => { hstripes(g, alt('#008057', WH, 6), 0, 28, 0, 34); rect(g, '#008057', 0, 12, 28, 9); word(g, 'SCP', 8, 14, WH); rect(g, '#d6a41c', 0, 11, 28, 1); rect(g, '#d6a41c', 0, 21, 28, 1); }, 1.5);
  } },
  // PSV: círculo rojo con PSV.
  PSV: { draw(g) {
    disc(g, [[13.5, BK], [12.2, WH], [10.8, '#d8132b']]);
    rect(g, WH, 5, 12, 17, 9); word(g, 'PSV', 8, 14, '#d8132b'); rect(g, BK, 5, 12, 17, 1); rect(g, BK, 5, 20, 17, 1);
  } },
  // Marsella: círculo blanco con las letras OM celestes.
  OM: { draw(g) {
    disc(g, [[13.5, '#2faee0'], [12, WH], [10.6, WH]]);
    ring(g, '#2faee0', 13.5, 17, 10.4, 1); word(g, 'OM', 7, 13, '#2faee0', 2); star(g, '#2faee0', 13.5, 8, 1.8);
  } },
  // Celtic: círculo verde y blanco con el trébol.
  CEL: { draw(g) {
    disc(g, [[13.5, BK], [12.2, '#0a6b38'], [10.5, WH], [9.3, '#0a6b38']]);
    for (const [x, y] of [[10.5, 12.5], [16.5, 12.5], [10.5, 18.5], [16.5, 18.5]]) circ(g, WH, x, y, 3.2);
    rect(g, WH, 11, 13, 5, 6); poly(g, WH, [[13, 20], [14.5, 20], [17, 26], [15.5, 26]]);
  } },
  // Galatasaray: escudo mitad rojo y mitad amarillo con GS.
  GAL: { draw(g) {
    sh(g, BK, () => { rect(g, '#a90432', 0, 0, 14, 34); rect(g, '#fdb913', 14, 0, 14, 34); art(g, 3, 10, ['.####','##..#','#....','#.###','#...#','##..#','.####'].map(r=>r.replace(/#/g,'#')), { '#': '#fdb913' }); art(g, 17, 10, ['.####','#....','.###.','....#','....#','#...#','####.'], { '#': '#a90432' }); word(g, 'GS', 10, 22, WH); }, 1.5);
  } },
};
