// Situaciones de juego: dos mazos de cartas que le pasan cosas al partido.
//
// - Mazo de PARTIDO: se roba en cuatro momentos fijos (al 40% y al 80% de cada
//   tiempo). A quién le toca lo decide la jugada: el que tiene la pelota, su
//   rival o el que va perdiendo, según la carta.
// - Mazo de DISCIPLINA: se roba cada vez que hay una falta. Siempre afecta al
//   equipo que la cometió (y beneficia al otro).
//
// Las cartas no cambian el marcador directamente: cambian las reglas del próximo
// duelo o del próximo dado, y los dos jugadores ven el efecto antes de elegir.

export const CARDS = {
  // Partido
  crack: { deck: 'partido', title: 'Genialidad del crack', text: 'Su próximo duelo perdido atacando no cuenta: la jugada sigue.' },
  error: { deck: 'partido', title: 'Error en la defensa', text: 'Un defensa la regala: la pelota queda frente al arco para rematar.' },
  tactic: { deck: 'partido', title: 'Cambio táctico', text: 'Todo al ataque: en su próximo remate con el arquero vencido no hay palo ni afuera: es gol.' },
  crowd: { deck: 'partido', title: 'Ánimo de la hinchada', text: 'Su próxima recuperación sale de contragolpe.' },
  spark: { deck: 'partido', title: 'Golpe de iluminación', text: 'En su próxima salida se salta el medio campo y llega directo al último tercio.' },
  // Disciplina
  yellow: { deck: 'disciplina', title: 'Tarjeta amarilla', text: 'Amonestado. Con la segunda, se va expulsado.' },
  red: { deck: 'disciplina', title: 'Tarjeta roja', text: 'Con uno menos: cuando adivina defendiendo, una cara más del dado deja seguir la jugada.' },
  freekick: { deck: 'disciplina', title: 'Tiro libre', text: 'La falta fue cerca del área: tiro libre directo al arco.' },
};

const DECKS = {
  partido: ['crack', 'crack', 'error', 'error', 'tactic', 'tactic', 'crowd', 'crowd', 'spark', 'spark'],
  disciplina: ['yellow', 'yellow', 'yellow', 'yellow', 'yellow', 'yellow', 'red', 'freekick', 'freekick', 'freekick'],
};

// Momentos del mazo de partido, como fracción del tiempo.
const MARKS = [0.4, 0.8];

// Quién comete las faltas: defensas y volantes.
const FOULERS = [2, 3, 6, 7, 1, 4, 5, 8];

function shuffle(list, rng) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function draw(s, deck, rng) {
  const sit = s.sit;
  if (!sit.decks[deck] || !sit.decks[deck].length) sit.decks[deck] = shuffle(DECKS[deck], rng);
  return sit.decks[deck].pop();
}

export function newSituations() {
  return { decks: {}, drawn: 0, fx: [], yellows: [[], []], reds: [0, 0] };
}

const has = (s, id, side) => s.sit && s.sit.fx.some((f) => f.id === id && f.side === side);
const consume = (s, id, side) => { const k = s.sit.fx.findIndex((f) => f.id === id && f.side === side); if (k >= 0) s.sit.fx.splice(k, 1); };

// --- Efectos durante la jugada (los llama resolvePlay) ---

// Genialidad del crack: el atacante pierde el duelo pero la jugada sigue.
export function shieldAttack(s, ev, A) {
  if (!s.sit || !ev.match || (s.situation !== 'build' && s.situation !== 'attack') || !has(s, 'crack', A)) return;
  consume(s, 'crack', A);
  ev.match = false;
  ev.used = 'crack';
}

// Modifica el dado cuando el defensor adivinó en salida o ataque.
// Devuelve el resultado "efectivo" a usar en lugar de la tirada.
export function defenseRoll(s, ev, D, r) {
  if (!s.sit) return r;
  // Con uno (o dos) menos: las caras 2 (y 3) dejan seguir la jugada.
  const reds = Math.min(2, s.sit.reds[D]);
  if (reds && r >= 2 && r <= 1 + reds) { ev.used = 'red'; ev.redFaces = reds; return 1; }
  if (reds) ev.redFaces = reds;
  // Ánimo de la hinchada: la próxima recuperación (caras 2 a 6) sale de contragolpe.
  if (has(s, 'crowd', D)) {
    ev.crowd = true;
    if (r >= 2) { consume(s, 'crowd', D); if (r < 6) { ev.used = 'crowd'; return 6; } }
  }
  return r;
}

// Cambio táctico: con el arquero vencido, el palo y el afuera también son gol.
export function shotRoll(s, ev, A, r) {
  if (!s.sit || !has(s, 'tactic', A)) return r;
  consume(s, 'tactic', A);
  ev.tactic = true;
  if (r <= 2) { ev.used = 'tactic'; return 6; }
  return r;
}

// Falta: se roba del mazo de disciplina. D cometió la falta, A la recibe.
export function foul(s, ev, A, D, rng) {
  if (!s.sit) return;
  const id = draw(s, 'disciplina', rng);
  const player = FOULERS[Math.floor(rng() * FOULERS.length)];
  const card = { deck: 'disciplina', id, side: D, player };
  if (id === 'yellow') {
    if (s.sit.yellows[D].includes(player)) { card.id = 'red'; card.second = true; }
    else s.sit.yellows[D].push(player);
  }
  if (card.id === 'red') s.sit.reds[D]++;
  if (card.id === 'freekick') { card.side = A; s.situation = 'shot'; s.shotKind = 'libre'; }
  if (s.stats) {
    s.stats.yellows ||= [0, 0]; s.stats.reds ||= [0, 0];
    if (card.id === 'yellow') s.stats.yellows[D]++;
    if (card.id === 'red') { s.stats.reds[D]++; if (card.second) s.stats.yellows[D]++; }
  }
  ev.card = card;
}

// Al cerrar la jugada: robo del mazo de partido en los momentos fijos y
// efectos que se aplican al estado (Golpe de iluminación, Error en la defensa).
// Las cartas de partido se reparten según quién tiene la pelota, así que en el
// largo plazo le tocan igual a los dos equipos.
export function afterPlay(s, ev, halfLen, rng) {
  if (!s.sit || s.phase !== 'play' || s.situation === 'shootout') return;
  // Si con esta jugada se termina el tiempo, no pasa nada más.
  if (s.situation === 'build' && s.clock >= halfLen * s.half) return;
  const sit = s.sit;
  // Golpe de iluminación pendiente: la salida se salta y va directo al ataque.
  if (s.situation === 'build' && has(s, 'spark', s.poss)) {
    consume(s, 'spark', s.poss);
    s.situation = 'attack'; s.lane = ['L', 'C', 'R'][Math.floor(rng() * 3)];
    ev.sparkJump = s.poss;
  }
  if (ev.card || ev.sparkJump !== undefined) return;
  if (sit.drawn < 2 && s.half === 2) sit.drawn = 2;
  if (sit.drawn >= 4) return;
  const half = Math.floor(sit.drawn / 2) + 1;
  if (half !== s.half) return;
  const mark = halfLen * (half - 1) + halfLen * MARKS[sit.drawn % 2];
  if (s.clock < mark) return;
  sit.drawn++;
  const id = draw(s, 'partido', rng);
  const P = s.poss, R = 1 - P;
  const losing = s.score[0] === s.score[1] ? R : s.score[0] < s.score[1] ? 0 : 1;
  const side = id === 'tactic' ? losing : id === 'crowd' ? R : P;
  const card = { deck: 'partido', id, side };
  if (id === 'error') {
    // La pelota queda para rematar (si ya venía un remate o un penal, se respeta).
    if (s.situation !== 'shot' && s.situation !== 'penalty') { s.situation = 'shot'; s.shotKind = 'remate'; }
  } else if (id === 'spark' && s.situation === 'build') {
    s.situation = 'attack'; s.lane = ['L', 'C', 'R'][Math.floor(rng() * 3)];
    ev.sparkJump = P;
  } else {
    sit.fx.push({ id, side });
  }
  ev.card = card;
}

// Efectos activos para mostrar en pantalla.
export function activeEffects(state) {
  if (!state.sit) return [];
  return state.sit.fx.map((f) => ({ ...f, title: CARDS[f.id].title }));
}
