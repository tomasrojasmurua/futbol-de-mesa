// Situaciones de juego: dos mazos de cartas que le pasan cosas al partido.
//
// - Mazo de PARTIDO (40 cartas, 14 situaciones): se roba en cuatro momentos
//   fijos (al 40% y al 80% de cada tiempo, en una salida). A quién le toca lo
//   decide la jugada: el que tiene la pelota, el que defiende, el que va
//   perdiendo o ganando, o los dos.
// - Mazo de DISCIPLINA (20 cartas): se roba con cada falta y afecta al equipo
//   que la cometió (el tiro libre, al que la recibió).
//
// Las cartas nunca tocan el duelo de adivinar: solo cambian caras de los dados.
// Las copias de cada carta definen qué tan seguido sale.

// Los cuatro dados del partido.
//  buildDef: el defensor adivinó la salida. attackDef: adivinó en el último tercio.
//  shotSave: el arquero adivinó el remate. shotBeat: el arquero no adivinó.
export const BASE_DICE = {
  buildDef: ['foul', 'steal', 'steal', 'steal', 'steal', 'counter'],
  attackDef: ['corner', 'steal', 'steal', 'steal', 'steal', 'counter'],
  shotSave: ['corner', 'save', 'save', 'save', 'save', 'counter'],
  shotBeat: ['post', 'wide', 'goal', 'goal', 'goal', 'goal'],
};

const PLAY = ['buildDef', 'attackDef'];
// role: 'att' = cuando ese equipo ataca, 'def' = cuando defiende.
// from → to en n caras, durante `uses` tiradas (half: hasta el entretiempo).
const fx = (role, dice, from, to, n, uses, half = false) => ({ role, dice, from, to, n, uses, half });

// who: poss (tiene la pelota) | def (no la tiene) | losing | winning | both.
// tie: a quién le toca si van empatados (poss o def).
export const CARDS = {
  hinchada: { deck: 'partido', copies: 3, who: 'losing', tie: 'poss', title: 'Ánimo de la hinchada',
    text: 'En su próximo remate que supere al arquero, la cara «afuera» también es gol.',
    fx: [fx('att', ['shotBeat'], 'wide', 'goal', 1, 1)] },
  suplentes: { deck: 'partido', copies: 3, who: 'def', title: 'Entran suplentes',
    text: 'Piernas frescas: en sus 2 próximas defensas acertadas, una cara «recupera» pasa a contragolpe.',
    fx: [fx('def', PLAY, 'steal', 'counter', 1, 2)] },
  lesion: { deck: 'partido', copies: 4, who: 'def', title: 'Lesión',
    text: 'Con uno menos hasta el cambio: en sus 3 próximas defensas acertadas, una cara «recupera» pasa a «sigue la jugada» del rival.',
    fx: [fx('def', PLAY, 'steal', 'advance', 1, 3)] },
  habilitacion: { deck: 'partido', copies: 4, who: 'poss', title: 'Habilitación larga',
    text: 'Si le adivinan la próxima salida, una cara «recupera» pasa a «remate directo».',
    fx: [fx('att', ['buildDef'], 'steal', 'shoot', 1, 1)] },
  tactico: { deck: 'partido', copies: 4, who: 'losing', tie: 'def', title: 'Cambio táctico: todo al ataque',
    text: 'En sus 3 próximos ataques que le adivinen, una cara «recupera» pasa a «sigue la jugada». Pero en su próxima defensa acertada, al rival le pasa lo mismo.',
    fx: [fx('att', PLAY, 'steal', 'advance', 1, 3), fx('def', PLAY, 'steal', 'advance', 1, 1)] },
  arquero: { deck: 'partido', copies: 3, who: 'def', title: 'Arquero inspirado',
    text: 'En el próximo remate rival que lo supere, una cara de gol pasa a «atajada al córner».',
    fx: [fx('def', ['shotBeat'], 'goal', 'corner', 1, 1)] },
  capitan: { deck: 'partido', copies: 3, who: 'poss', title: 'Capitán inspirado',
    text: 'Tiki-taka: en sus 3 próximos ataques que le adivinen, una cara «recupera» pasa a «sigue la jugada».',
    fx: [fx('att', PLAY, 'steal', 'advance', 1, 3)] },
  crack: { deck: 'partido', copies: 3, who: 'poss', title: 'Genialidad del crack',
    text: 'En su próximo ataque que le adivinen, dos caras «recupera» pasan a «sigue la jugada».',
    fx: [fx('att', PLAY, 'steal', 'advance', 2, 1)] },
  polemica: { deck: 'partido', copies: 3, who: 'poss', title: 'Decisión polémica',
    text: 'Si le adivinan el próximo ataque en el último tercio, una cara «recupera» pasa a penal.',
    fx: [fx('att', ['attackDef'], 'steal', 'penalty', 1, 1)] },
  lluvia: { deck: 'partido', copies: 2, who: 'both', title: 'Lluvia',
    text: 'Cancha pesada hasta el entretiempo: en los remates de los dos equipos, una cara de gol pasa a «afuera».',
    fx: [fx('att', ['shotBeat'], 'goal', 'wide', 1, Infinity, true)] },
  errordt: { deck: 'partido', copies: 2, who: 'winning', tie: 'poss', title: 'Error del DT',
    text: 'En sus 2 próximas defensas acertadas, una cara «recupera» pasa a «sigue la jugada» del rival.',
    fx: [fx('def', PLAY, 'steal', 'advance', 1, 2)] },
  iluminacion: { deck: 'partido', copies: 2, who: 'poss', title: 'Golpe de iluminación',
    text: 'En su próximo remate que supere al arquero, el palo también es gol: pega en el palo y entra.',
    fx: [fx('att', ['shotBeat'], 'post', 'goal', 1, 1)] },
  chilena: { deck: 'partido', copies: 2, who: 'poss', title: 'Golazo de chilena',
    text: 'Si le atajan el próximo remate, una cara «atajada» pasa a gol.',
    fx: [fx('att', ['shotSave'], 'save', 'goal', 1, 1)] },
  error: { deck: 'partido', copies: 2, who: 'poss', title: 'Error en la defensa',
    text: 'En su próximo ataque que le adivinen, tres caras «recupera» pasan a «sigue la jugada».',
    fx: [fx('att', PLAY, 'steal', 'advance', 3, 1)] },
  // Disciplina
  yellow: { deck: 'disciplina', copies: 15, title: 'Tarjeta amarilla', text: 'Amonestado. Con la segunda, se va expulsado.' },
  freekick: { deck: 'disciplina', copies: 4, title: 'Tiro libre', text: 'La falta fue cerca del área: tiro libre directo al arco.' },
  red: { deck: 'disciplina', copies: 1, title: 'Tarjeta roja',
    text: 'Con uno menos todo el partido: cuando defiende y adivina, una cara «recupera» pasa a falta en la salida o a córner en el último tercio.' },
};

const RED_FX = [fx('def', ['buildDef'], 'steal', 'foul', 1, Infinity), fx('def', ['attackDef'], 'steal', 'corner', 1, Infinity)];

const DECKS = {};
for (const [id, c] of Object.entries(CARDS)) (DECKS[c.deck] ||= []).push(...Array(c.copies).fill(id));

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

// Caras del dado para esta tirada, con las cartas activas aplicadas. A es el que
// ataca y D el que defiende. Cada efecto que toca este dado gasta un uso.
export function rollFaces(s, die, A, D) {
  const f = [...BASE_DICE[die]];
  if (!s.sit) return f;
  const used = [];
  for (const e of s.sit.fx) {
    if (!e.dice.includes(die) || e.side !== (e.role === 'att' ? A : D)) continue;
    let k = e.n;
    for (let i = 0; i < 6 && k; i++) if (f[i] === e.from) { f[i] = e.to; k--; }
    used.push(e);
  }
  for (const e of used) if (e.uses !== null) e.uses--;
  s.sit.fx = s.sit.fx.filter((e) => e.uses === null || e.uses > 0);
  return f;
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
  if (card.id === 'red') {
    s.sit.reds[D]++;
    // uses: null = todo el partido (Infinity no sobrevive al JSON de la red).
    for (const e of RED_FX) s.sit.fx.push({ ...e, uses: null, side: D, card: 'red' });
  }
  if (card.id === 'freekick') { card.side = A; s.situation = 'shot'; s.shotKind = 'libre'; }
  s.stats.yellows ||= [0, 0]; s.stats.reds ||= [0, 0];
  if (card.id === 'yellow') s.stats.yellows[D]++;
  if (card.id === 'red') { s.stats.reds[D]++; if (card.second) s.stats.yellows[D]++; }
  ev.card = card;
}

// Entretiempo: se seca la cancha (se van los efectos «hasta el entretiempo»).
export function halfTime(s) {
  if (!s.sit) return;
  s.sit.fx = s.sit.fx.filter((e) => !e.half);
  if (s.sit.drawn < 2) s.sit.drawn = 2;
}

// Al cerrar la jugada: robo del mazo de partido en los momentos fijos, siempre
// en una salida (para que la carta se vea antes de la jugada que afecta).
export function afterPlay(s, ev, halfLen, rng) {
  if (!s.sit || s.phase !== 'play' || s.situation !== 'build' || ev.card) return;
  // Si con esta jugada se termina el tiempo, la carta espera.
  if (s.clock >= halfLen * s.half) return;
  const sit = s.sit;
  if (sit.drawn < 2 && s.half === 2) sit.drawn = 2;
  if (sit.drawn >= 4) return;
  const half = Math.floor(sit.drawn / 2) + 1;
  if (half !== s.half) return;
  if (s.clock < halfLen * (half - 1) + halfLen * MARKS[sit.drawn % 2]) return;
  sit.drawn++;
  const id = draw(s, 'partido', rng);
  const c = CARDS[id];
  const P = s.poss, R = 1 - P;
  const lead = s.score[0] === s.score[1] ? null : s.score[0] > s.score[1] ? 0 : 1;
  const tie = c.tie === 'def' ? R : P;
  let sides;
  if (c.who === 'both') sides = [0, 1];
  else if (c.who === 'losing') sides = [lead === null ? tie : 1 - lead];
  else if (c.who === 'winning') sides = [lead === null ? tie : lead];
  else sides = [c.who === 'poss' ? P : R];
  for (const side of sides) {
    for (const e of c.fx) {
      // En el segundo tiempo la lluvia dura hasta el final.
      sit.fx.push({ ...e, uses: e.uses === Infinity ? null : e.uses, side, card: id, half: e.half && s.half === 1 });
    }
  }
  ev.card = { deck: 'partido', id, side: sides.length > 1 ? -1 : sides[0] };
}

// Cartas activas para mostrar en pantalla (una por carta y equipo; la roja aparte).
export function activeEffects(state) {
  if (!state.sit) return [];
  const seen = new Set();
  const out = [];
  for (const f of state.sit.fx) {
    if (f.card === 'red') continue;
    const key = `${f.card}:${f.side}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ id: f.card, side: f.side, title: CARDS[f.card].title });
  }
  return out;
}
