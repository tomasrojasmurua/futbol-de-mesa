// Íconos pixel art (16x16) para las cartas, dibujados a mano con rectángulos.
const cache = new Map();

const C = {
  grass: '#3f9c3b', grass2: '#48ab43', line: '#f3f3ea', att: '#ffd23f', attD: '#b8860b',
  def: '#4fb3ff', defD: '#1f5f99', ball: '#ffffff', ink: '#14171f', net: '#c9d2dc', post: '#ffffff',
  skin: '#e0a77c', gk: '#2fbf4a',
};

function px(g, x, y, c, w = 1, h = 1) { g.fillStyle = c; g.fillRect(x, y, w, h); }

function pitch(g) {
  px(g, 1, 1, C.grass, 14, 14);
  for (let y = 1; y < 15; y += 4) px(g, 1, y, C.grass2, 14, 2);
  px(g, 1, 1, C.line, 14, 1); px(g, 1, 14, C.line, 14, 1); px(g, 1, 1, C.line, 1, 14); px(g, 14, 1, C.line, 1, 14);
  px(g, 5, 1, C.line, 6, 1); px(g, 5, 2, C.line, 1, 2); px(g, 10, 2, C.line, 1, 2); px(g, 5, 4, C.line, 6, 1);
}

function ball(g, x, y) { px(g, x, y, C.ball, 2, 2); px(g, x + 1, y + 1, '#9aa3ad'); }

function player(g, x, y, col) {
  px(g, x, y, '#2a1a10', 2, 1); px(g, x, y + 1, C.skin, 2, 1);
  px(g, x - 1, y + 2, col, 4, 2); px(g, x, y + 4, C.ink, 2, 1);
}

function arrowUp(g, x, y, len, col, dark) {
  px(g, x, y + 2, col, 2, len);
  px(g, x - 2, y + 2, col, 6, 1); px(g, x - 1, y + 1, col, 4, 1); px(g, x, y, col, 2, 1);
  px(g, x + 2, y + 3, dark, 1, len - 1);
}

function goal(g) {
  px(g, 0, 0, '#26303c', 16, 16);
  for (let y = 3; y < 12; y++) for (let x = 2; x < 14; x++) if ((x + y) % 2 === 0) px(g, x, y, '#3b4a5a');
  px(g, 1, 2, C.post, 14, 1); px(g, 1, 2, C.post, 1, 11); px(g, 14, 2, C.post, 1, 11);
  px(g, 0, 13, C.grass, 16, 3); px(g, 0, 13, C.line, 16, 1);
}

const DRAW = {
  lane(g, side, role) {
    pitch(g);
    const x = side === 'L' ? 3 : side === 'C' ? 7 : 11;
    if (role === 'att') arrowUp(g, x, 4, 9, C.att, C.attD);
    else {
      px(g, x - 2, 6, C.def, 6, 3); px(g, x - 2, 9, C.defD, 6, 1);
      ball(g, x, 11);
    }
  },
  cross(g) {
    pitch(g);
    player(g, 7, 3, C.att);
    const pts = [[2, 13], [2, 11], [3, 9], [4, 7], [6, 6], [8, 6]];
    pts.forEach(([x, y]) => px(g, x, y, C.att));
    ball(g, 2, 12);
  },
  through(g) {
    pitch(g);
    px(g, 2, 8, C.def, 3, 2); px(g, 11, 8, C.def, 3, 2);
    for (let y = 4; y < 13; y += 2) px(g, 7, y, C.att, 2, 1);
    ball(g, 7, 12); player(g, 7, 2, C.att);
  },
  dribble(g) {
    pitch(g);
    const zz = [[4, 13], [6, 11], [9, 10], [11, 8], [8, 6], [6, 4]];
    zz.forEach(([x, y]) => px(g, x, y, C.att, 2, 1));
    px(g, 9, 7, C.def, 3, 2); px(g, 4, 9, C.def, 3, 2);
    ball(g, 6, 3);
  },
  wings(g) {
    pitch(g);
    px(g, 2, 4, C.def, 2, 9); px(g, 12, 4, C.def, 2, 9);
    px(g, 4, 4, C.defD, 1, 9); px(g, 11, 4, C.defD, 1, 9);
    ball(g, 7, 10);
  },
  line(g) {
    pitch(g);
    px(g, 2, 8, C.def, 12, 2); px(g, 2, 10, C.defD, 12, 1);
    arrowUp(g, 4, 5, 2, C.def, C.defD); arrowUp(g, 10, 5, 2, C.def, C.defD);
    ball(g, 7, 12);
  },
  double(g) {
    pitch(g);
    ball(g, 7, 8);
    player(g, 4, 6, C.def); player(g, 11, 6, C.def);
    px(g, 6, 11, C.def, 4, 1);
  },
  shot(g, side) {
    goal(g);
    const x = side === 'L' ? 3 : side === 'C' ? 7 : 11;
    px(g, x - 1, 4, C.att, 4, 1); px(g, x - 1, 8, C.att, 4, 1); px(g, x - 1, 4, C.att, 1, 5); px(g, x + 2, 4, C.att, 1, 5);
    ball(g, x, 6);
  },
  keeper(g, side) {
    goal(g);
    if (side === 'C') {
      px(g, 7, 5, '#2a1a10', 2, 1); px(g, 7, 6, C.skin, 2, 1);
      px(g, 5, 7, C.gk, 6, 3); px(g, 4, 6, '#fff', 1, 2); px(g, 11, 6, '#fff', 1, 2); px(g, 6, 10, C.ink, 4, 2);
      return;
    }
    const d = side === 'L' ? -1 : 1, cx = side === 'L' ? 4 : 11;
    for (let i = 0; i < 7; i++) px(g, cx - d * i, 6 + Math.floor(i / 2), i < 2 ? '#fff' : i < 3 ? C.skin : i < 5 ? C.gk : C.ink, 1, 2);
    px(g, cx - d * 7, 10, C.ink, 1, 1);
  },
  corner(g, id) {
    pitch(g);
    px(g, 13, 13, '#ddd', 1, 2); px(g, 11, 12, '#f0c419', 2, 1);
    const t = { near: [9, 3], spot: [7, 6], far: [4, 3] }[id];
    const pts = [[12, 12], [12, 10], [11, 8], [10, 6]];
    pts.forEach(([x, y]) => px(g, x, y, '#ffffffaa'));
    px(g, t[0] - 1, t[1] - 1, C.att, 4, 4); ball(g, t[0], t[1]);
  },
  cara(g) {
    px(g, 3, 2, '#e0a800', 10, 12); px(g, 2, 3, '#e0a800', 12, 10);
    px(g, 4, 3, '#ffe680', 8, 2); px(g, 6, 6, '#8a6200', 4, 4); px(g, 7, 5, '#8a6200', 2, 1);
  },
  sello(g) {
    px(g, 3, 2, '#e0a800', 10, 12); px(g, 2, 3, '#e0a800', 12, 10);
    px(g, 7, 4, '#8a6200', 2, 8); px(g, 4, 7, '#8a6200', 8, 2); px(g, 5, 5, '#8a6200', 1, 1); px(g, 10, 10, '#8a6200', 1, 1);
  },
  back(g) {
    px(g, 0, 0, '#1b2a4a', 16, 16);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if ((x + y) % 4 === 0) px(g, x, y, '#223660');
    px(g, 5, 4, '#fff', 6, 8); px(g, 4, 5, '#fff', 8, 6);
    px(g, 7, 6, '#14171f', 2, 2); px(g, 5, 8, '#14171f', 1, 2); px(g, 10, 8, '#14171f', 1, 2); px(g, 7, 10, '#14171f', 2, 1);
  },
};

// Símbolos para las caras del dado (fondo transparente, sobre el dado blanco).
function frame(g) {
  px(g, 2, 4, C.ink, 12, 2); px(g, 2, 4, C.ink, 2, 9); px(g, 12, 4, C.ink, 2, 9);
  for (let y = 6; y < 13; y += 2) for (let x = 4; x < 12; x += 2) px(g, x, y, '#b9c2cc');
}
const FACE = {
  foul(g) { // silbato
    px(g, 2, 7, C.ink, 9, 6); px(g, 3, 6, C.ink, 7, 8); px(g, 9, 6, C.ink, 6, 4);
    px(g, 3, 7, '#d6d9de', 7, 6); px(g, 4, 6, '#d6d9de', 5, 1);
    px(g, 10, 7, '#d6d9de', 4, 2); px(g, 5, 9, '#5d636c', 3, 2); px(g, 4, 7, '#ffffff', 2, 1);
    px(g, 1, 3, '#e23b3b', 1, 4); px(g, 2, 2, '#e23b3b', 3, 1); px(g, 5, 3, '#e23b3b', 1, 3);
  },
  steal(g) { // escudo de la defensa
    px(g, 3, 2, C.defD, 10, 8); px(g, 4, 10, C.defD, 8, 2); px(g, 6, 12, C.defD, 4, 1); px(g, 7, 13, C.defD, 2, 1);
    px(g, 4, 3, C.def, 8, 7); px(g, 5, 10, C.def, 6, 1); px(g, 7, 11, C.def, 2, 1);
    px(g, 6, 5, '#fff', 4, 4); px(g, 7, 6, C.ink, 2, 2);
  },
  counter(g) { // rayo
    const pts = [[9, 1, 3], [8, 2, 3], [7, 3, 3], [6, 4, 3], [5, 5, 3], [4, 6, 7], [7, 7, 3], [6, 8, 3], [5, 9, 3], [4, 10, 3], [4, 11, 2], [3, 12, 2], [3, 13, 1]];
    pts.forEach(([x, y, w]) => px(g, x, y, '#f2b705', w, 1));
    px(g, 9, 1, '#ffe680', 1, 1); px(g, 4, 6, '#ffe680', 3, 1);
  },
  corner(g) { // banderín
    px(g, 4, 2, C.ink, 1, 12); px(g, 2, 14, C.grass, 12, 1);
    px(g, 5, 2, '#e23b3b', 6, 4); px(g, 5, 3, '#f2b705', 3, 2); px(g, 11, 3, '#e23b3b', 1, 2);
  },
  shoot(g) { // pelota disparada
    px(g, 1, 6, '#9aa3ad', 4, 1); px(g, 0, 9, '#9aa3ad', 4, 1); px(g, 1, 12, '#9aa3ad', 4, 1);
    px(g, 7, 4, C.ink, 5, 1); px(g, 6, 5, C.ink, 7, 1); px(g, 5, 6, C.ink, 9, 6); px(g, 6, 12, C.ink, 7, 1); px(g, 7, 13, C.ink, 5, 1);
    px(g, 7, 5, '#fff', 5, 1); px(g, 6, 6, '#fff', 7, 6); px(g, 7, 12, '#fff', 5, 1);
    px(g, 8, 7, C.ink, 3, 3); px(g, 6, 10, C.ink, 1, 1); px(g, 12, 10, C.ink, 1, 1); px(g, 9, 5, C.ink, 1, 1);
  },
  penalty(g) { // arco y pelota en el punto penal
    frame(g); px(g, 6, 11, C.ink, 4, 4); px(g, 7, 12, '#fff', 2, 2);
    px(g, 4, 15, C.grass, 8, 1);
  },
  save(g) { // guante
    px(g, 4, 2, '#1e9e3a', 2, 6); px(g, 6, 1, '#1e9e3a', 2, 7); px(g, 8, 1, '#1e9e3a', 2, 7); px(g, 10, 2, '#1e9e3a', 2, 6);
    px(g, 2, 6, '#1e9e3a', 2, 4); px(g, 4, 7, '#1e9e3a', 8, 5); px(g, 5, 12, '#fff', 6, 2);
    px(g, 5, 2, '#5fd27a', 1, 5); px(g, 7, 1, '#5fd27a', 1, 6); px(g, 9, 1, '#5fd27a', 1, 6); px(g, 11, 2, '#5fd27a', 1, 5);
  },
  goal(g) { // pelota en la red
    frame(g);
    px(g, 5, 7, C.ink, 6, 6); px(g, 6, 6, C.ink, 4, 8);
    px(g, 6, 7, '#fff', 4, 6); px(g, 7, 9, C.ink, 2, 2);
    px(g, 1, 14, C.grass, 14, 1);
  },
  post(g) { // pelota contra el palo
    frame(g); px(g, 12, 4, '#f2b705', 2, 9);
    px(g, 13, 7, C.ink, 3, 4); px(g, 14, 8, '#fff', 2, 2);
    px(g, 11, 5, '#f2b705', 1, 1); px(g, 15, 5, '#f2b705', 1, 1); px(g, 11, 12, '#f2b705', 1, 1); px(g, 15, 12, '#f2b705', 1, 1);
  },
  advance(g) { // flecha: sigue la jugada
    px(g, 2, 6, C.ink, 7, 4); px(g, 8, 2, C.ink, 2, 12); px(g, 10, 3, C.ink, 2, 10); px(g, 12, 5, C.ink, 2, 6); px(g, 14, 7, C.ink, 1, 2);
    px(g, 3, 7, C.att, 6, 2); px(g, 9, 4, C.att, 1, 8); px(g, 10, 5, C.att, 2, 6); px(g, 12, 6, C.att, 1, 4); px(g, 13, 7, C.att, 1, 2);
  },
  wide(g) { // pelota que se va por arriba
    frame(g);
    px(g, 11, 0, C.ink, 4, 4); px(g, 12, 1, '#fff', 2, 2);
    px(g, 8, 3, '#9aa3ad', 2, 1); px(g, 6, 5, '#9aa3ad', 1, 1);
    for (let i = 0; i < 4; i++) { px(g, 5 + i, 7 + i, '#e23b3b', 2, 1); px(g, 9 - i, 7 + i, '#e23b3b', 2, 1); }
  },
};
DRAW.face = (g, kind) => FACE[kind](g);

export function icon(kind, a, b) {
  const key = `${kind}|${a}|${b}`;
  if (cache.has(key)) return cache.get(key);
  const c = document.createElement('canvas');
  c.width = 16; c.height = 16;
  DRAW[kind](c.getContext('2d'), a, b);
  const url = c.toDataURL();
  cache.set(key, url);
  return url;
}

// Ícono de una carta. `screenSide` es el lado tal como lo ve quien mira.
export function iconFor(situation, role, id, screenSide) {
  if (situation === 'build') return icon('lane', screenSide, role);
  if (situation === 'attack') return icon(id === 'cross' ? (role === 'att' ? 'cross' : 'wings') : id === 'through' ? (role === 'att' ? 'through' : 'line') : (role === 'att' ? 'dribble' : 'double'));
  if (situation === 'shot' || situation === 'penalty' || situation === 'shootout') return icon(role === 'att' ? 'shot' : 'keeper', screenSide);
  if (situation === 'corner') return icon('corner', id);
  return icon(id);
}
