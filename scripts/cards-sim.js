// Simula las cartas de "situación de juego" sobre el motor real (game.js) para
// ver cuántas salen, cuánto mueven los goles y si las decisiones siguen pesando.
// Uso: node scripts/cards-sim.js [partidos] [corto|normal|largo]
import { newMatch, resolveToss, resolvePlay, randomChoice, optionsFor } from '../src/game.js';

const N = Number(process.argv[2] || 20000);
const LEN = { corto: 'short', normal: 'normal', largo: 'long' }[process.argv[3] || 'corto'];
const DRAW_AT = [20, 40, 65, 85]; // minutos en que se roba del mazo de partido

// Efectos sobre un duelo. Cada uno conserva el duelo de adivinar; sólo cambia
// cuántas opciones hay o cuántas veces se juega:
//  extra   4 opciones contra 4 (atacante gana 3/4 en vez de 2/3)
//  replay  si el atacante pierde, se juega otra vez (8/9)
//  double  el defensor cubre 2 de 3 (1/3)
//  discard el atacante descarta una opción en público (1/2)
function applyEffect(eff, att, def, pick) {
  const match = att === def;
  if (eff === 'extra' && match && Math.random() < 1 / 4) return [att, '_'];
  if (eff === 'double' && !match && Math.random() < 1 / 2) return [att, att];
  if (eff === 'discard' && !match && Math.random() < 1 / 4) return [att, att];
  if (eff === 'replay' && match) return pick();
  return [att, def];
}

const PARTIDO = [
  'crack', 'crack', // al que tiene la pelota: su próximo ataque en el último tercio con 4 opciones
  'error', 'error', // al que defiende: si adivina su próxima defensa, se repite el duelo
  'tactico', 'tactico', // a los dos: cada DT elige en secreto ir al ataque o meterse atrás
  'hinchada', // al que va perdiendo (empate: a los dos): en su próximo remate, "afuera" pasa a ser gol
  'iluminacion', // a los dos: una vez hasta el entretiempo, repiten un duelo perdido
];
const DISCIPLINA = ['amarilla', 'amarilla', 'amarilla', 'amarilla', 'roja', 'libre', 'libre', 'libre'];

const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

function play({ cards = true, read = [0, 0], only = null } = {}) {
  let { state } = resolveToss(newMatch({ home: 'a', away: 'b', length: LEN }), 'cara');
  const first = state.poss;
  const deckP = shuffle(only ? PARTIDO.filter((c) => c === only) : PARTIDO);
  const deckD = shuffle(DISCIPLINA);
  // Modificadores vivos por equipo: { eff, role ('att'|'def'), sit (null = cualquiera), n }
  const mods = [[], []];
  const tok = [0, 0]; // fichas de iluminación
  const hinchada = [false, false];
  const yellow = [false, false];
  let drawn = 0, cardsN = 0, fouls = 0, plays = 0;
  const draw = (deck) => { const c = deck.shift(); if (c) deck.push(c); return c; };

  const leader = () => (state.score[0] === state.score[1] ? -1 : state.score[0] > state.score[1] ? 0 : 1);

  function partidoCard(c) {
    cardsN++;
    const A = state.poss, D = 1 - A, L = leader();
    const behind = L === -1 ? null : 1 - L;
    switch (c) {
      case 'crack': mods[A].push({ eff: 'extra', role: 'att', sit: 'attack', n: 1 }); break;
      case 'error': mods[D].push({ eff: 'replay', role: 'def', sit: null, n: 1 }); break;
      case 'tactico':
        // Los dos DT eligen en secreto: al ataque (su próximo ataque con 4 opciones)
        // o atrás (su próxima defensa cubre 2 de 3).
        for (const t of [0, 1]) {
          if (Math.random() < 0.5) mods[t].push({ eff: 'extra', role: 'att', sit: null, n: 1 });
          else mods[t].push({ eff: 'double', role: 'def', sit: null, n: 1 });
        }
        break;
      case 'hinchada': if (behind != null) hinchada[behind] = true; else hinchada[0] = hinchada[1] = true; break;
      case 'iluminacion': tok[0]++; tok[1]++; break;
    }
  }
  function disciplinaCard(c, fouler) {
    cardsN++;
    const victim = 1 - fouler;
    if (c === 'amarilla') { if (yellow[fouler]) c = 'roja'; else yellow[fouler] = true; }
    if (c === 'roja') { mods[victim].push({ eff: 'extra', role: 'att', sit: null, n: 5 }); yellow[fouler] = false; }
    if (c === 'libre' && state.situation === 'build' && state.poss === victim) state = { ...state, situation: 'corner', lane: 'C' };
  }

  while (state.phase === 'play' && state.situation !== 'shootout') {
    if (cards && drawn < DRAW_AT.length && state.minute >= DRAW_AT[drawn] && state.situation === 'build') {
      partidoCard(draw(deckP)); drawn++;
    }
    const A = state.poss, D = 1 - A;
    const pick = () => {
      let att = randomChoice(state, 'att'), def = randomChoice(state, 'def');
      if (Math.random() < read[D]) def = att;
      else if (Math.random() < read[A]) {
        const ids = optionsFor(state.situation).att.map((o) => o.id).filter((x) => x !== def);
        att = ids[Math.floor(Math.random() * ids.length)];
      }
      return [att, def];
    };
    let [att, def] = pick();
    if (cards) {
      const live = [...mods[A].filter((m) => m.role === 'att'), ...mods[D].filter((m) => m.role === 'def')]
        .filter((m) => !m.sit || m.sit === state.situation);
      for (const m of live) { [att, def] = applyEffect(m.eff, att, def, pick); m.n--; }
      mods[0] = mods[0].filter((m) => m.n > 0); mods[1] = mods[1].filter((m) => m.n > 0);
      // Iluminación: se usa en el primer remate atajado.
      if (tok[A] && att === def && (state.situation === 'shot' || state.situation === 'penalty')) { tok[A]--; [att, def] = pick(); }
    }
    const before = state;
    const r = resolvePlay(state, att, def);
    state = r.state; plays++;
    if (cards && hinchada[A] && r.ev.outcome === 'wide') {
      hinchada[A] = false;
      state.score[A]++; state.poss = D; state.situation = 'build'; state.lane = 'C';
    } else if (cards && hinchada[A] && r.ev.outcome === 'goal') hinchada[A] = false;
    const foul = r.ev.outcome === 'foul' || r.ev.outcome === 'penalty';
    if (foul) { fouls++; if (cards) disciplinaCard(draw(deckD), D); }
    if (r.ev.halfEnd === 1) { tok[0] = tok[1] = 0; }
  }
  return { state, first, cardsN, fouls, plays };
}

function report(label, opts) {
  let goals = 0, cards = 0, fouls = 0, plays = 0, firstW = 0, dec = 0, comeback = 0, behindHT = 0;
  for (let i = 0; i < N; i++) {
    const r = play(opts);
    const [a, b] = r.state.score;
    goals += a + b; cards += r.cardsN; fouls += r.fouls; plays += r.plays;
    if (a !== b) { dec++; if ((a > b ? 0 : 1) === r.first) firstW++; }
  }
  const w = (p) => {
    let win = 0, lose = 0;
    for (let i = 0; i < N; i++) {
      const { state } = play({ ...opts, read: [p, 0] });
      if (state.score[0] > state.score[1]) win++; else if (state.score[0] < state.score[1]) lose++;
    }
    return `${(100 * win / N).toFixed(0)}-${(100 * lose / N).toFixed(0)}`;
  };
  console.log(`${label.padEnd(22)} jugadas ${(plays / N).toFixed(1)}  goles ${(goals / N).toFixed(2)}  cartas ${(cards / N).toFixed(1)}  faltas ${(fouls / N).toFixed(2)}  gana quien saca ${(100 * firstW / dec).toFixed(1)}%  lee 20%: ${w(0.2)}  lee 35%: ${w(0.35)}`);
}

console.log(`Partido ${process.argv[3] || 'corto'}, ${N} partidos por fila. "lee X%": gana-pierde del que lee al rival.`);
report('sin cartas', { cards: false });
report('mazo completo', { cards: true });
for (const c of (process.argv[4] ? process.argv[4].split(',') : new Set(PARTIDO))) report(`solo ${c}`, { cards: true, only: c });
