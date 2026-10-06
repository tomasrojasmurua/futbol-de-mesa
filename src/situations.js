// Situaciones de juego: dos mazos de cartas que le pasan cosas al partido.
//
// - Mazo de PARTIDO (60 cartas, 21 situaciones): se roba en cuatro momentos
//   fijos (al 40% y al 80% de cada tiempo, en una salida). A quién le toca lo
//   decide la jugada: el que tiene la pelota, el que defiende, el que va
//   perdiendo o ganando, o los dos.
// - Mazo de DISCIPLINA (uno por duración): se roba con cada falta y afecta al equipo
//   que la cometió (el tiro libre, al que la recibió).
//
// Las cartas nunca tocan el duelo de adivinar: solo cambian caras de los dados.
// Cada carta dura una tirada del dado que nombra (y vence al terminar el tiempo);
// la Lluvia, todo el partido, también en la tanda de penales.
// Las copias de cada carta definen qué tan seguido sale.

// Los cuatro dados del partido.
//  buildDef: el defensor adivinó la salida. attackDef: adivinó en el último tercio.
//  shotSave: el arquero adivinó el remate. shotBeat: el arquero no adivinó.
export const BASE_DICE = {
  buildDef: ['foul', 'steal', 'steal', 'steal', 'steal', 'counter'],
  attackDef: ['corner', 'foul', 'steal', 'steal', 'steal', 'counter'],
  shotSave: ['corner', 'save', 'save', 'save', 'save', 'counter'],
  shotBeat: ['post', 'wide', 'goal', 'goal', 'goal', 'goal'],
  // gambeta que sale en el último tercio: remate, o penal con el 6
  dribbleWin: ['shoot', 'shoot', 'shoot', 'shoot', 'shoot', 'penalty'],
  // cuando el que ataca gana el duelo: la jugada sigue. Solo se tira si una
  // carta de defensa lo cambia (2 caras para cortarla igual).
  buildWin: ['advance', 'advance', 'advance', 'advance', 'advance', 'advance'],
  attackWin: ['shoot', 'shoot', 'shoot', 'shoot', 'shoot', 'shoot'],
};

// ¿Hay alguna carta activa que cambie este dado en esta jugada?
export function hasDieFx(s, die, A, D) {
  return !!s.sit && s.sit.fx.some((e) => e.dice.includes(die) && e.side === (e.role === 'att' ? A : D));
}

// Cada carta dice cómo queda el dado entero mientras dura (to: las 6 caras).
// Al tirar se aplica la diferencia con el dado base, así se puede sumar a otro
// efecto (por ejemplo, la roja). role: 'att' = cuando ese equipo ataca,
// 'def' = cuando defiende. uses: tiradas que dura (Infinity: todo el partido).
const fx = (role, die, to, uses = 1) => ({ role, dice: [die], to, uses });
const S = 'buildDef', U = 'attackDef';
const F = (spec) => spec.split(' ').flatMap((x) => { const [k, n] = x.split(':'); return Array(Number(n || 1)).fill(k); });

// who: poss (tiene la pelota) | def (no la tiene) | losing | winning | both.
// tie: a quién le toca si van empatados (poss o def).
// Todas duran una sola tirada del dado que nombran, salvo la Lluvia (todo el partido).
export const CARDS = {
  hinchada: { deck: 'partido', copies: 3, who: 'losing', tie: 'poss', title: 'Ánimo de la hinchada',
    text: 'En su próximo remate que supere al arquero, todo es gol: ni palo ni afuera.',
    fx: [fx('att', 'shotBeat', F('goal:6'))] },
  suplentes: { deck: 'partido', copies: 3, who: 'def', title: 'Entran suplentes',
    text: 'Piernas frescas: en su próxima defensa, si acierta casi toda pelota recuperada sale de contra; si no acierta, 2 de 6 se la quitan igual y sale de contra.',
    fx: [fx('def', S, F('foul counter:5')), fx('def', U, F('corner foul counter:4')), fx('def', 'buildWin', F('advance:4 counter:2')), fx('def', 'attackWin', F('shoot:4 counter:2'))] },
  lesion: { deck: 'partido', copies: 4, who: 'def', title: 'Lesión',
    text: 'Con uno menos hasta el cambio: en su próxima defensa acertada, dos caras «recupera» pasan a favor del rival.',
    fx: [fx('def', S, F('foul steal:2 advance:2 counter')), fx('def', U, F('corner foul steal shoot:2 counter'))] },
  habilitacion: { deck: 'partido', copies: 4, who: 'poss', title: 'Habilitación larga',
    text: 'Si le adivinan la próxima salida, tres caras pasan a «pase largo»: la pelota llega al último tercio.',
    fx: [fx('att', S, F('foul steal longpass:3 counter'))] },
  primera: { deck: 'partido', copies: 4, who: 'poss', title: 'Remate de primera',
    text: 'Si le adivinan el próximo ataque en el último tercio, el dado queda: córner, falta, recupera y 3 remate al arco.',
    fx: [fx('att', U, F('corner foul steal shoot:3'))] },
  tactico: { deck: 'partido', copies: 4, who: 'losing', tie: 'def', title: 'Cambio táctico: todo al ataque',
    text: 'En su próximo ataque que le adivinen, el rival pierde la contra y la jugada sigue con 3 caras.',
    fx: [fx('att', S, F('foul steal:2 advance:3')), fx('att', U, F('corner foul steal shoot:3'))] },
  arquero: { deck: 'partido', copies: 3, who: 'def', title: 'Fortuna de arquero',
    text: 'En el próximo remate rival que lo supere, tres caras de gol pasan a «atajada al córner».',
    fx: [fx('def', 'shotBeat', F('post wide goal corner:3'))] },
  capitan: { deck: 'partido', copies: 3, who: 'poss', title: 'Capitán inspirado',
    text: 'Tiki-taka: en su próximo ataque que le adivinen, tres caras pasan a favor de su equipo.',
    fx: [fx('att', S, F('foul steal advance:3 counter')), fx('att', U, F('corner foul shoot:3 counter'))] },
  crack: { deck: 'partido', copies: 3, who: 'poss', title: 'Genialidad del crack',
    text: 'En su próximo ataque que le adivinen, tres caras pasan a favor de su equipo.',
    fx: [fx('att', S, F('foul steal advance:3 counter')), fx('att', U, F('corner foul shoot:3 counter'))] },
  polemica: { deck: 'partido', copies: 3, who: 'poss', title: 'Decisión polémica',
    text: 'En su próximo ataque en el último tercio: si se lo adivinan, el dado queda córner, recupera, 3 penal y contra; si gana la gambeta, 3 de 6 son penal (y la carta sigue). Ese penal, si supera al arquero, tiene 5 caras de gol.',
    fx: [fx('att', U, F('corner steal penalty:3 counter')), { ...fx('att', 'dribbleWin', F('shoot:3 penalty:3')), free: true }] },
  lluvia: { deck: 'partido', copies: 2, who: 'both', title: 'Lluvia',
    text: 'Se larga a llover y no para: hasta el final, en los remates de los dos equipos una cara de gol pasa a «afuera».',
    fx: [fx('att', 'shotBeat', F('post wide:2 goal:3'), Infinity)] },
  errordt: { deck: 'partido', copies: 2, who: 'winning', tie: 'poss', title: 'Error del DT',
    text: 'En su próxima defensa acertada pierde la contra y el rival sigue la jugada con 3 caras.',
    fx: [fx('def', S, F('foul steal:2 advance:3')), fx('def', U, F('corner foul steal shoot:3'))] },
  iluminacion: { deck: 'partido', copies: 2, who: 'poss', title: 'Tiro colocado',
    text: 'En su próximo remate que supere al arquero, todo es gol: ni palo ni afuera.',
    fx: [fx('att', 'shotBeat', F('goal:6'))] },
  chilena: { deck: 'partido', copies: 2, who: 'poss', title: 'Arquero nervioso',
    text: 'Si le atajan el próximo remate, el dado queda: córner, 2 atajada y 3 gol.',
    fx: [fx('att', 'shotSave', F('corner save:2 goal:3'))] },
  error: { deck: 'partido', copies: 2, who: 'poss', title: 'Desorden defensivo',
    text: 'En su próximo ataque que le adivinen, el rival pierde la contra y la jugada sigue con 4 caras.',
    fx: [fx('att', S, F('foul steal advance:4')), fx('att', U, F('corner foul shoot:4'))] },
  instruccion: { deck: 'partido', copies: 3, who: 'poss', title: 'Instrucción del DT',
    text: 'En su próximo ataque que le adivinen, el rival pierde la contra: 3 caras de pase largo en la salida o de remate en el último tercio.',
    fx: [fx('att', S, F('foul steal:2 longpass:3')), fx('att', U, F('corner foul steal shoot:3'))] },
  defensa: { deck: 'partido', copies: 2, who: 'def', title: 'Defensa sólida',
    text: 'En el próximo ataque rival en el último tercio: si lo adivina, córner y 5 contra; si no, 2 de 6 la corta igual.',
    fx: [fx('def', U, F('corner counter:5')), fx('def', 'attackWin', F('shoot:4 steal:2'))] },
  barrida: { deck: 'partido', copies: 3, who: 'def', title: 'Barrida quirúrgica',
    text: 'En el próximo ataque rival en el último tercio: si lo adivina, la quita limpia (1 recupera y 5 contra); si no, 2 de 6 llega igual con la barrida.',
    fx: [fx('def', U, F('steal counter:5')), fx('def', 'attackWin', F('shoot:4 steal:2'))] },
  despeje: { deck: 'partido', copies: 3, who: 'def', title: 'Despeje en la línea',
    text: 'En el próximo remate rival que supere al arquero (no en penales), dos caras de gol pasan a «despeje»: un defensor la saca en la línea.',
    fx: [fx('def', 'shotBeat', F('post wide goal:2 clear:2'))] },
  presion: { deck: 'partido', copies: 3, who: 'def', title: 'Presión alta',
    text: 'En la próxima salida rival: si la adivina, toda pelota recuperada sale de contra; si no, 2 de 6 lo apura y se la quita igual.',
    fx: [fx('def', S, F('counter:6')), fx('def', 'buildWin', F('advance:4 steal:2'))] },
  achique: { deck: 'partido', copies: 2, who: 'def', title: 'Achique del arquero',
    text: 'En el próximo remate rival: si su arquero lo adivina, sale rápido (1 atajada y 5 contra); si no, achica y 2 caras de gol pasan a «atajada al córner».',
    fx: [fx('def', 'shotSave', F('save counter:5')), fx('def', 'shotBeat', F('post wide goal:2 corner:2'))] },
  // Disciplina
  warning: { deck: 'disciplina', title: 'Advertencia del árbitro', text: 'El árbitro lo llama y le advierte. El partido sigue su curso.' },
  yellow: { deck: 'disciplina', title: 'Tarjeta amarilla', text: 'Amonestado. Con la segunda, se va expulsado.' },
  freekick: { deck: 'disciplina', title: 'Tiro libre', text: 'La falta fue cerca del área: tiro libre directo al arco.' },
  red: { deck: 'disciplina', title: 'Tarjeta roja',
    text: 'Con uno menos todo el partido: cuando defiende y adivina, una cara «recupera» pasa a falta en la salida o a córner en el último tercio.' },
};

// Penal cobrado por la Decisión polémica: si le gana al arquero, el dado del
// remate queda así (la cara «afuera» también es gol).
export const POLEMICA_BEAT = F('post goal:5');
export const RED_FX = [fx('def', S, F('foul:2 steal:3 counter'), Infinity), fx('def', U, F('corner:2 foul steal:2 counter'), Infinity)];

const DECKS = {};
for (const [id, c] of Object.entries(CARDS)) if (c.copies) (DECKS[c.deck] ||= []).push(...Array(c.copies).fill(id));

// Mazo de disciplina: uno por duración, para que en cualquier largo de partido
// haya más o menos una roja cada 5 partidos (en los cortos hay menos faltas, así
// que el mazo trae más rojas). Contando las de doble amarilla.
export const DISCIPLINE = {
  short: { warning: 4, yellow: 10, freekick: 3, red: 5 }, // ~0,9 faltas por partido
  normal: { warning: 4, yellow: 13, freekick: 3, red: 3 }, // ~1,4
  long: { warning: 7, yellow: 17, freekick: 3, red: 2 }, // ~2,2
};
const deckList = (s, deck) => (deck === 'disciplina'
  ? Object.entries(DISCIPLINE[s.length] || DISCIPLINE.normal).flatMap(([id, n]) => Array(n).fill(id))
  : DECKS[deck]);

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
  if (!sit.decks[deck] || !sit.decks[deck].length) sit.decks[deck] = shuffle(deckList(s, deck), rng);
  return sit.decks[deck].pop();
}

// Bitácora de las situaciones del partido (para la crónica del final). El minuto
// se completa en game.js cuando termina la jugada.
function logCard(s, card) {
  (s.sit.log ||= []).push({ id: card.id, side: card.side, player: card.player ?? null, minute: null, half: s.half });
}

export function newSituations() {
  return { decks: {}, drawn: 0, fx: [], yellows: [[], []], reds: [0, 0], log: [] };
}

// Caras del dado para esta tirada, con las cartas activas aplicadas. A es el que
// ataca y D el que defiende. Cada efecto que toca este dado gasta un uso.
export function rollFaces(s, die, A, D) {
  const f = [...BASE_DICE[die]];
  if (!s.sit) return f;
  const used = [];
  for (const e of s.sit.fx) {
    if (!e.dice.includes(die) || e.side !== (e.role === 'att' ? A : D)) continue;
    // un defensor no saca un penal en la línea: el Despeje queda para el próximo remate
    if (e.card === 'despeje' && s.situation === 'penalty') continue;
    applyFx(f, die, e);
    used.push(e);
  }
  // free: el efecto se aplica sin gastar la carta (se va junto con el otro dado)
  for (const e of used) if (e.uses !== null && !e.free) e.uses--;
  // Una carta de dos dados (salida y último tercio) vale una sola vez: cuando se
  // gasta uno, se va también el otro.
  const spent = new Set(used.filter((e) => e.uses === 0 && e.inst != null).map((e) => e.inst));
  s.sit.fx = s.sit.fx.filter((e) => e.uses === null || (e.uses > 0 && !spent.has(e.inst)));
  return f;
}

// Lo que la carta cambia respecto del dado base: saca las caras que sobran y
// pone las que faltan, en el mismo lugar (así se suma a otros efectos).
function applyFx(f, die, e) {
  const count = (list) => list.reduce((m, k) => ((m[k] = (m[k] || 0) + 1), m), {});
  const base = count(BASE_DICE[die]), to = e.to ? count(e.to) : null;
  const out = [], add = [];
  if (to) {
    for (const k of new Set([...Object.keys(base), ...Object.keys(to)])) {
      const d = (to[k] || 0) - (base[k] || 0);
      for (let i = 0; i < -d; i++) out.push(k);
      for (let i = 0; i < d; i++) add.push(k);
    }
  } else {
    // formato viejo (partidas guardadas): from → to en n caras
    for (let i = 0; i < e.n; i++) { out.push(e.from); add.push(e.to); }
  }
  for (let i = 0; i < Math.min(out.length, add.length); i++) {
    const j = f.indexOf(out[i]);
    if (j >= 0) f[j] = add[i];
  }
}

// Falta: se roba del mazo de disciplina. D cometió la falta, A la recibe.
export function foul(s, ev, A, D, rng) {
  if (!s.sit) return;
  let id = draw(s, 'disciplina', rng);
  // el tiro libre directo solo sale de faltas en el último tercio; en la salida,
  // lejos del arco, el árbitro solo advierte y sigue el juego
  if (id === 'freekick' && s.situation !== 'attack') id = 'warning';
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
  logCard(s, card);
}

// Las cartas de una jugada vencen al terminar cada tiempo: solo siguen las que
// duran todo el partido (la Lluvia y la roja).
export function expireOneUse(s) {
  if (!s.sit) return;
  s.sit.fx = s.sit.fx.filter((e) => e.uses === null);
}

// Entretiempo: vencen las cartas que no se usaron en el primer tiempo.
export function halfTime(s) {
  if (!s.sit) return;
  expireOneUse(s);
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
  // Si ya está lloviendo, una segunda Lluvia no cambia nada.
  const already = id === 'lluvia' && sit.rain;
  if (id === 'lluvia') sit.rain = true;
  for (const side of already ? [] : sides) {
    for (const e of c.fx) sit.fx.push({ ...e, uses: e.uses === Infinity ? null : e.uses, side, card: id, inst: `${id}-${sit.drawn}-${side}` });
  }
  ev.card = { deck: 'partido', id, side: sides.length > 1 ? -1 : sides[0] };
  logCard(s, ev.card);
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
