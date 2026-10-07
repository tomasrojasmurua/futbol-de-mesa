// Calciopoli · escudos de los demás clubes, armados a partir de una receta por club (ver crests.js).
// Receta: [forma, borde, campo, texto, emblema]
//  forma: S casco, R redondo, B placa    campo: ['s',a] ['v',a,b] ['h',a,b] ['x',a,b] ['y',a,b] ['d',a,b] ['t',a,b]
//  texto: [letras, color, colorDeBanda|0]    emblema: [nombre, color, escala]
import { BK, WH, poly, rect, circ, ell, px, word, SHIELD, star, vstripes, hstripes, disc, clipCirc, clipPoly } from './crestkit.js';

const R = '#d8132b', B = '#1b3f94', LB = '#6cb4e4', G = '#0a7a3c', Y = '#f7d117', K = '#15171d', W = WH, N = '#13254a', MA = '#7a1f2b', O = '#f26a1b', P = '#5b2a86', SK = '#87cdee', GR = '#8e949e', GO = '#c9a227', PK = '#e8508a', BR = '#6b3e26';
const alt = (a, b, n) => Array.from({ length: n }, (_, i) => (i % 2 ? b : a));

const BADGE = (i = 0) => [[2 + i, 3 + i], [25 - i, 3 + i], [25 - i, 23], [20 - i * 0.5, 28 - i * 0.8], [13.5, 31 - i], [7 + i * 0.5, 28 - i * 0.8], [2 + i, 23]];

const field = (g, f, bounds) => {
  const [t, a, b] = f; const [x0, x1, y0, y1] = bounds;
  rect(g, a, x0, y0, x1 - x0, y1 - y0);
  if (t === 'v') vstripes(g, alt(a, b, 6), x0, x1, y0, y1);
  else if (t === 'h') hstripes(g, alt(a, b, 6), x0, x1, y0, y1);
  else if (t === 'x') rect(g, b, 14, y0, x1 - 14, y1 - y0);
  else if (t === 'y') rect(g, b, x0, 18, x1 - x0, y1 - 18);
  else if (t === 't') rect(g, b, x0, y0, x1 - x0, 12);
  else if (t === 'd') poly(g, b, [[x0, y0 + 2], [x0 + 8, y0], [x1, y1 - 8], [x1, y1], [x1 - 8, y1], [x0, y0 + 10]].map(([x, y]) => [x, y]));
};

const EMB = {
  star: (g, c, x, y, s) => star(g, c, x, y, 3.2 * s),
  stars3: (g, c, x, y, s) => { star(g, c, x, y - 1.5 * s, 2.2 * s); star(g, c, x - 4 * s, y + 0.8 * s, 2 * s); star(g, c, x + 4 * s, y + 0.8 * s, 2 * s); },
  ball: (g, c, x, y, s) => { circ(g, c, x, y, 3.6 * s); circ(g, K, x, y, 1.1 * s); px(g, K, x - 3 * s, y - 1, x + 2 * s, y - 2 * s, x + 2 * s, y + 2 * s, x - 2 * s, y + 3 * s); },
  cross: (g, c, x, y, s) => { rect(g, c, x - 1 * s, y - 4 * s, 2 * s + 1, 8 * s); rect(g, c, x - 3.5 * s, y - 1.5 * s, 7 * s, 2 * s + 1); },
  crown: (g, c, x, y, s) => { poly(g, c, [[x - 4 * s, y + 2 * s], [x - 4 * s, y - 2 * s], [x - 2 * s, y], [x, y - 3 * s], [x + 2 * s, y], [x + 4 * s, y - 2 * s], [x + 4 * s, y + 2 * s]]); },
  eagle: (g, c, x, y, s) => { poly(g, c, [[x, y - 1 * s], [x - 6 * s, y - 4 * s], [x - 4.5 * s, y], [x - 2 * s, y + 2 * s], [x, y + 4 * s], [x + 2 * s, y + 2 * s], [x + 4.5 * s, y], [x + 6 * s, y - 4 * s]]); circ(g, c, x, y - 2.5 * s, 1.4 * s); },
  bolt: (g, c, x, y, s) => poly(g, c, [[x + 1.5 * s, y - 5 * s], [x - 3 * s, y + 0.5 * s], [x - 0.3 * s, y + 0.5 * s], [x - 1.5 * s, y + 5 * s], [x + 3 * s, y - 1 * s], [x + 0.3 * s, y - 1 * s]]),
  tree: (g, c, x, y, s) => { circ(g, c, x, y - 1.5 * s, 3.3 * s); rect(g, c, x - 0.5 * s, y + 1 * s, s + 0.5, 3.5 * s); },
  sun: (g, c, x, y, s) => { circ(g, c, x, y, 2.4 * s); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; rect(g, c, Math.round(x + Math.cos(a) * 3.8 * s - 0.5), Math.round(y + Math.sin(a) * 3.8 * s - 0.5), 1, 1); } },
  bull: (g, c, x, y, s) => { poly(g, c, [[x - 5 * s, y - 3 * s], [x - 3 * s, y - 1 * s], [x + 3 * s, y - 1 * s], [x + 5 * s, y - 3 * s], [x + 3.5 * s, y + 1 * s], [x + 2 * s, y + 3 * s], [x - 2 * s, y + 3 * s], [x - 3.5 * s, y + 1 * s]]); },
  chev: (g, c, x, y, s) => { poly(g, c, [[x - 5 * s, y + 2 * s], [x, y - 2 * s], [x + 5 * s, y + 2 * s], [x + 5 * s, y + 4 * s], [x, y], [x - 5 * s, y + 4 * s]]); },
};

const ART = {
  lion: ['.#.#####.#.', '#.#######.#', '.#########.', '.##.###.##.', '.#########.', '..#######..', '..###.###..', '...#####...', '....###....'],
  wolf: ['#.......#', '##.....##', '#########', '##.###.##', '#########', '.#######.', '..#####..', '...###...', '....#....'],
  bat: ['##.......##', '####.#.####', '###########', '.##.###.##.', '..#..#..#..'],
  skull: ['.#######.', '#########', '##.###.##', '##.###.##', '#########', '.#######.', '..#.#.#..'],
  hammers: ['##.....##', '.##...##.', '..##.##..', '...###...', '..##.##..', '.##...##.', '##.....##'],
  tower: ['#.#.#', '#####', '.###.', '.###.', '.###.', '.###.', '#####'],
  lily: ['...#...', '..###..', '..###..', '#.###.#', '#######', '.#####.', '..###..', '.#####.'],
  goat: ['#.....#', '##...##', '.#####.', '.#.#.#.', '.#####.', '..###..', '..#.#..'],
};
for (const [k, rows] of Object.entries(ART)) EMB[k] = (g, c, x, y, s) => rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] === '#') rect(g, c, Math.round(x - r.length / 2) + i, Math.round(y - rows.length / 2) + j, 1, 1); });

const mk = ([shape, bd, f, text, em]) => ({ draw(g) {
  const hasT = !!text, hasE = !!em;
  const outer = shape === 'R' ? null : shape === 'B' ? BADGE(0) : SHIELD(0);
  const inner = shape === 'R' ? null : shape === 'B' ? BADGE(1.4) : SHIELD(1.4);
  if (shape === 'R') { disc(g, [[13.5, bd], [12, W], [10.8, f[1]]]); clipCirc(g, 10.8); field(g, f, [2, 26, 6, 29]); }
  else { poly(g, bd, outer); clipPoly(g, inner); field(g, f, [0, 28, 0, 34]); }
  const ty = text ? (hasE ? 16 : shape === 'R' ? 12 : 13) : 0;
  if (hasE) { const s = em[2] || (hasT ? 0.9 : 1.5); EMB[em[0]](g, em[1], 13.5, hasT ? 8 : 15, s); }
  if (hasT) {
    const [s, tc, band] = text; const w = s.length * 4 - 1;
    if (band) { rect(g, band, 0, ty - 2, 28, 9); rect(g, tc, 0, ty - 2, 28, 1); rect(g, tc, 0, ty + 6, 28, 1); }
    word(g, s, Math.round(14 - w / 2), ty, tc);
  }
  g.restore();
} });

const lum = (h) => { const n = parseInt(h.slice(1), 16); return 0.3 * (n >> 16) + 0.59 * ((n >> 8) & 255) + 0.11 * (n & 255); };
const T = (s, c = W, b = 0) => (b && Math.abs(lum(c) - lum(b)) < 70 ? [s, lum(b) > 140 ? K : W, b] : [s, c, b]);
// ---- recetas por club ----
const RECIPES = {
  // Chile
  AUD: ['S', K, ['s', G], T('AUDAX', W, K)], CSL: ['S', K, ['s', O], T('CSC', W, K)], CQU: ['B', K, ['v', Y, K], T('CU', K, Y)], IQQ: ['S', K, ['v', SK, W], T('DI', N, W)],
  LSR: ['S', K, ['x', MA, W], T('DLS', MA, W)], LMC: ['S', K, ['s', R], T('CDL', W, K), ['star', W]], EVV: ['S', K, ['v', B, Y], T('EVE', W, B)], HUC: ['B', K, ['v', B, K], T('CDH', W, K)],
  NUB: ['S', K, ['s', R], T('NUB', W, K), ['star', W]], OHI: ['B', K, ['s', SK], T('OHI', N, W), ['star', W]], PST: ['S', K, ['h', G, W, 3], T('CDP', K, W), ['star', R]], UES: ['S', K, ['x', R, Y], T('UE', K, W)],
  ULC: ['S', K, ['s', R], T('ULC', R, W)],
  // Argentina
  ALD: ['S', K, ['v', G, Y], T('CAA', G, Y)], AAJ: ['S', K, ['s', R], T('AAAJ', R, W), ['star', W]], ATU: ['S', K, ['v', SK, W], T('CAT', N, W)], BAN: ['S', K, ['v', W, G], T('CAB', W, G)],
  BAC: ['S', K, ['v', R, W], T('CBC', W, R)], BLG: ['R', K, ['s', SK], T('CAB', N, W), ['star', W]], CCO: ['S', K, ['v', W, K], T('CCC', W, K)], DYJ: ['S', K, ['x', Y, G], T('DYJ', W, K)],
  RIE: ['S', W, ['s', K], T('CDR', K, W), ['star', W]], GLP: ['S', K, ['s', W], T('GELP', W, N), ['crown', N]], GCZ: ['S', K, ['v', B, W], T('CGC', B, W)], HUR: ['R', R, ['s', W], T('CAH', W, R), ['ball', R, 1]],
  IRV: ['S', K, ['s', B], T('CSIR', W, N), ['star', W]], INS: ['S', K, ['v', W, R], T('IACC', W, R)], LAN: ['S', K, ['s', MA], T('CAL', MA, W), ['cross', W]], NOB: ['S', K, ['x', R, K], T('NOB', W, K), ['star', W]],
  PLA: ['S', K, ['s', W], T('CAP', W, BR), ['star', BR]], RCE: ['S', K, ['v', B, Y], T('CARC', B, Y)], SMJ: ['S', K, ['v', G, K], T('SMSJ', W, K)], SAR: ['S', K, ['s', G], T('CAS', G, W), ['star', W]],
  TAL: ['S', K, ['v', W, N], T('CAT', W, N)], TIG: ['S', K, ['x', N, R], T('TIG', W, K)], USF: ['S', K, ['v', R, W], T('CAU', W, R)],
  // Brasil
  CAM: ['S', K, ['v', K, W], T('CAM', W, K), ['star', W]], BAH: ['S', K, ['y', W, B], T('ECB', B, W), ['star', R]], BOT: ['R', K, ['s', K], T('BFR', K, W), ['star', W, 1.4]], CEA: ['S', K, ['v', K, W], T('CSC', W, K)],
  CRU: ['R', B, ['s', B], T('CEC', B, W), ['stars3', W]], FLU: ['S', K, ['v', MA, G, 3], T('FFC', W, K)], FOR: ['S', K, ['h', R, B, 4], T('FEC', W, K)], SCI: ['S', K, ['s', R], T('SCI', R, W), ['star', W]],
  GRE: ['S', K, ['v', LB, K, 3], T('GFBP', W, K)], JVT: ['S', K, ['v', W, G], T('EC J', G, W)], MIR: ['B', K, ['s', Y], T('MFC', G, Y), ['sun', G]], RBB: ['S', K, ['s', W], T('RBB', W, R), ['bull', R]],
  SFC: ['R', K, ['s', W], T('SFC', W, K), ['star', K]], SPT: ['S', K, ['h', R, K, 4], T('SCR', W, K), ['star', Y]], VAS: ['S', K, ['d', W, K], T('VASCO', W, K), ['cross', R]], VIT: ['S', K, ['h', R, K, 4], T('ECV', W, K), ['star', W]],
  // México
  ATS: ['S', K, ['h', R, K, 6], T('ATLAS', W, K)], ASL: ['S', K, ['x', R, B], T('ASL', W, K)], CAZ: ['R', K, ['s', B], T('CAZ', B, W), ['star', W]], FCJ: ['S', K, ['x', R, G], T('FCJ', W, K)],
  CHV: ['S', K, ['v', R, W], T('CDG', W, B)], LEO: ['S', K, ['s', G], T('LEO', G, W), ['star', W]], MAZ: ['S', K, ['s', P], T('MAZ', P, W)], MTY: ['S', K, ['v', B, W], T('CFM', W, N)],
  NEC: ['S', K, ['h', R, W, 4], T('NEC', W, R)], PCH: ['S', K, ['v', W, B], T('PCH', W, B)], PUB: ['S', K, ['d', W, B], T('PUE', W, B)], PUM: ['S', GO, ['s', N], T('UNAM', GO, N), ['eagle', GO]],
  QRO: ['S', K, ['v', B, K], T('QRO', W, K)], SLA: ['S', K, ['v', G, W], T('CSL', W, G)], UANL: ['S', K, ['s', Y], T('TIG', Y, N), ['star', N]], XOL: ['S', K, ['x', R, K], T('XOL', W, K)],
  TOL: ['S', K, ['s', R], T('TOL', R, W), ['bolt', W]],
  // España
  ALA: ['S', K, ['v', B, W], T('ALA', W, N)], CLT: ['R', K, ['s', SK], T('CEL', N, W), ['star', W]], ELC: ['S', K, ['s', W], T('ECF', W, G), ['star', G]], RCD: ['S', K, ['v', B, W], T('RCD', W, B)],
  GET: ['S', K, ['s', B], T('GCF', B, W), ['crown', W]], GIR: ['S', K, ['v', R, W], T('GFC', W, R)], LVT: ['S', K, ['v', B, R], T('LUD', W, K)], MLL: ['S', K, ['s', R], T('RCDM', R, W), ['crown', Y]],
  OSA: ['S', K, ['s', R], T('CAO', R, N), ['cross', W]], RAY: ['S', K, ['d', W, R], T('RAYO', W, R)], BET: ['S', K, ['v', G, W], T('RBB', W, G), ['crown', Y]], OVI: ['S', K, ['s', B], T('RO', B, W), ['crown', Y]],
  RSO: ['S', K, ['v', B, W], T('RSC', W, N), ['crown', Y]], VCF: ['S', K, ['s', W], T('VCF', W, K), ['bat', K]], VLR: ['S', K, ['s', Y], T('VIL', Y, N), ['star', N]],
  // Inglaterra
  AVL: ['S', K, ['s', MA], T('AVFC', MA, SK), ['lion', SK]], BOU: ['S', K, ['v', R, K], T('AFCB', W, K)], BRE: ['R', K, ['v', R, W], T('BFC', W, R)], BHA: ['S', K, ['v', B, W], T('BHA', W, B)],
  BUR: ['S', K, ['s', MA], T('BFC', MA, SK), ['star', SK]], CRY: ['R', K, ['v', B, R], T('CPFC', W, N), ['eagle', W]], EVE: ['R', K, ['s', B], T('EFC', B, W), ['tower', W]], FUL: ['S', K, ['s', W], T('FFC', W, K), ['crown', K]],
  LEE: ['R', K, ['s', W], T('LUFC', W, B), ['star', B]], NFO: ['S', K, ['s', R], T('NFFC', R, W), ['tree', W]], SUN: ['S', K, ['v', R, W], T('SAFC', W, R)], WHU: ['S', K, ['s', MA], T('WHU', MA, SK), ['hammers', SK]],
  WOL: ['S', K, ['s', Y], T('WWFC', Y, K), ['wolf', K]],
  // Italia
  ATA: ['S', K, ['v', LB, K], T('ATA', W, K)], BFC: ['S', K, ['v', R, N], T('BFC', W, K)], CAG: ['S', K, ['v', R, N], T('CAL', W, K), ['star', W]], COM: ['S', K, ['s', B], T('COM', B, W)],
  CRE: ['S', K, ['v', R, GR], T('CRE', W, K)], FIO: ['S', K, ['s', P], T('ACF', P, W), ['lily', W]], GEN: ['S', K, ['x', R, N], T('GCFC', W, K), ['cross', W]], HEL: ['S', K, ['x', B, Y], T('HEL', W, K)],
  LAZ: ['R', K, ['s', SK], T('SSL', SK, W), ['eagle', W]], LEC: ['S', K, ['v', Y, R], T('LEC', W, K)], PRM: ['S', K, ['s', W], T('PAR', W, B), ['cross', Y]], PIS: ['S', K, ['v', K, B], T('PIS', W, K)],
  SAS: ['S', K, ['v', G, K], T('SAS', W, K)], TOR: ['S', K, ['s', MA], T('TFC', MA, W), ['bull', W]], UDI: ['S', K, ['v', K, W], T('UDI', W, K)],
  // Alemania
  FCA: ['S', K, ['s', W], T('FCA', W, R)], BMG: ['R', G, ['s', W], T('BMG', W, G), ['star', G]], KOE: ['S', K, ['s', W], T('KOE', W, R), ['goat', R]], SGE: ['S', K, ['v', R, K], T('SGE', W, K), ['eagle', W]],
  SCF: ['S', K, ['s', R], T('SCF', R, W)], HSV: ['S', K, ['s', W], T('HSV', W, B), ['star', B]], FCH: ['S', K, ['x', R, B], T('FCH', W, K)], TSG: ['R', K, ['s', B], T('TSG', B, W)],
  M05: ['R', K, ['s', R], T('M05', R, W)], RBL: ['R', K, ['s', W], T('RBL', W, R), ['bull', R]], STP: ['R', K, ['s', BR], T('FCSP', BR, W), ['skull', W]], VFB: ['S', K, ['s', W], T('VFB', W, R), ['star', R]],
  FCU: ['R', K, ['s', R], T('FCU', R, W)], SVW: ['R', K, ['s', G], T('SVW', G, W)], WOB: ['R', K, ['s', G], T('WOB', G, W), ['star', W]],
  // Francia
  SCO: ['S', K, ['v', K, W], T('SCO', W, K)], AUX: ['S', K, ['s', W], T('AJA', W, B), ['star', B]], BRS: ['R', K, ['s', R], T('SB29', R, W)], RCS: ['S', K, ['s', B], T('RCSA', B, W)],
  HAC: ['S', K, ['s', SK], T('HAC', SK, N)], RCL: ['S', K, ['v', R, Y], T('RCL', W, K)], LOSC: ['S', K, ['s', R], T('LOSC', R, N), ['star', W]], FCL: ['R', K, ['s', O], T('FCL', O, K)],
  OL: ['R', K, ['s', W], T('OL', W, B), ['crown', R]], FCM: ['S', K, ['s', MA], T('FCM', MA, W)], ASM: ['S', K, ['d', W, R], T('ASM', W, R)], FCN: ['S', K, ['s', Y], T('FCN', Y, G)],
  OGC: ['S', K, ['x', R, K], T('OGCN', W, K), ['eagle', W]], PFC: ['S', K, ['s', N], T('PFC', N, SK), ['star', SK]], SRF: ['S', K, ['x', R, K], T('SRFC', W, K)], TFC: ['S', K, ['s', P], T('TFC', P, W)],
  // Portugal
  ALV: ['S', K, ['s', R], T('ALV', R, W)], ARO: ['S', K, ['v', Y, B], T('FCA', B, Y)], AVS: ['S', K, ['s', R], T('AVS', R, W), ['star', W]], SCB: ['S', K, ['s', R], T('SCB', R, W), ['cross', W]],
  CPI: ['S', K, ['s', K], T('CPI', K, W), ['star', W]], GDE: ['S', K, ['v', Y, B], T('GDE', Y, B)], CFE: ['S', K, ['v', R, G], T('CFE', W, K)], FAM: ['S', K, ['s', W], T('FAM', W, B)],
  GVF: ['S', K, ['s', R], T('GVF', R, B), ['bull', W]], MOR: ['S', K, ['v', G, W], T('MFC', W, G)], CDN: ['S', K, ['v', K, W], T('CDN', W, K)], RAV: ['S', K, ['v', G, W], T('RAFC', W, G)],
  STC: ['S', K, ['s', R], T('CDSC', R, W)], TON: ['S', K, ['v', Y, G], T('CDT', W, K)], VSC: ['S', K, ['s', W], T('VSC', W, K), ['crown', K]],
  // Japón
  AVI: ['S', K, ['s', N], T('AVI', GR, K), ['star', GR]], CER: ['R', K, ['s', PK], T('CER', PK, N)], FAG: ['S', K, ['s', MA], T('FAG', MA, N)], TOK: ['S', K, ['v', B, R], T('FCT', W, K)],
  GAM: ['S', K, ['v', B, K], T('GAM', W, K)], JEF: ['S', K, ['s', Y], T('JEF', Y, G)], KAS: ['R', K, ['s', '#b0102a'], T('KAS', '#b0102a', N), ['star', W]], KRE: ['S', K, ['s', Y], T('KRE', Y, K), ['sun', K]],
  KAW: ['S', K, ['v', LB, K], T('KAW', W, K)], KYO: ['S', K, ['s', P], T('KYO', P, GO), ['star', GO]], MAC: ['S', K, ['s', N], T('MAC', N, GO), ['star', GO]], MIT: ['S', K, ['s', B], T('MIT', B, W), ['sun', W]],
  NAG: ['S', K, ['s', R], T('NGE', R, GO), ['star', GO]], HIR: ['S', K, ['s', P], T('SFH', P, W), ['star', W]], SHI: ['S', K, ['s', O], T('SSP', O, N), ['sun', N]], VER: ['S', K, ['s', G], T('TV', G, W), ['star', W]],
  URA: ['S', K, ['s', R], T('URA', R, K), ['star', W]], VVN: ['S', K, ['s', O], T('VVN', O, B)], KOB: ['S', K, ['s', MA], T('VIS', MA, K), ['star', W]], YFM: ['S', K, ['s', B], T('YFM', B, W), ['star', W]],
};
export const CRESTS3 = Object.fromEntries(Object.entries(RECIPES).map(([k, v]) => [k, mk(v)]));
