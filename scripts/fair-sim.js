// Revisa que el partido no favorezca a nadie: quién saca primero, qué opción
// conviene, y cuánto pesan las decisiones frente al dado.
import { newMatch, resolveToss, resolvePlay, randomChoice, optionsFor, LENGTHS } from '../src/game.js';

const N = Number(process.argv[2] || 20000);

// Jugador que "lee" al rival con probabilidad `read`: si lo lee, elige la
// respuesta ganadora; si no, al azar.
function play(length, read = [0, 0]) {
  let { state } = resolveToss(newMatch({ home: 'a', away: 'b', length }), 'cara');
  const first = state.poss;
  let d = 0, outs = 0;
  while (state.phase === 'play') {
    const A = state.poss, D = 1 - A;
    let att = randomChoice(state, 'att'), def = randomChoice(state, 'def');
    if (Math.random() < read[D]) def = att;
    else if (Math.random() < read[A]) {
      const ids = optionsFor(state.situation).att.map((o) => o.id).filter((x) => x !== def);
      att = ids[Math.floor(Math.random() * ids.length)];
    }
    const r = resolvePlay(state, att, def);
    if (r.ev.outcome === 'wide' || r.ev.outcome === 'post') outs++;
    state = r.state; d++;
  }
  return { state, first, d, outs };
}

for (const length of Object.keys(LENGTHS)) {
  let firstWins = 0, draws = 0, goals = 0, dec = 0, outs = 0;
  for (let i = 0; i < N; i++) {
    const { state, first, d, outs: o } = play(length);
    const [a, b] = state.score;
    if (a === b) draws++; else if ((a > b ? 0 : 1) === first) firstWins++;
    goals += a + b; dec += d; outs += o;
  }
  const decided = N - draws;
  console.log(`${length}: ${(dec / N).toFixed(1)} decisiones, ${(goals / N).toFixed(2)} goles, ${(outs / N).toFixed(2)} remates afuera/palo, a penales ${(100 * draws / N).toFixed(0)}%, gana el que saca primero ${(100 * firstWins / decided).toFixed(1)}% de los partidos con ganador`);
}

// Valor de cada opción de ataque contra un defensor al azar: probabilidad de gol de esa llegada.
const val = {};
for (const opt of ['cross', 'through', 'dribble']) {
  let g = 0;
  for (let i = 0; i < N * 3; i++) {
    let s = { ...newMatch({ home: 'a', away: 'b' }), phase: 'play', situation: 'attack', poss: 0 };
    let r = resolvePlay(s, opt, randomChoice(s, 'def'));
    while (r.state.poss === 0 && ['shot', 'penalty', 'corner'].includes(r.state.situation)) {
      s = r.state;
      r = resolvePlay(s, randomChoice(s, 'att'), randomChoice(s, 'def'));
    }
    if (r.state.score[0]) g++;
  }
  val[opt] = (100 * g / (N * 3)).toFixed(1) + '%';
}
console.log('gol por llegada según opción:', val);

// Peso de las decisiones: alguien que lee al rival un 20% de las veces contra uno al azar.
for (const p of [0.1, 0.2, 0.35]) {
  let w = 0, l = 0;
  for (let i = 0; i < N; i++) {
    const { state } = play('normal', [p, 0]);
    if (state.score[0] > state.score[1]) w++; else if (state.score[0] < state.score[1]) l++;
  }
  console.log(`lee al rival ${p * 100}% de las veces: gana ${(100 * w / N).toFixed(0)}%, pierde ${(100 * l / N).toFixed(0)}%`);
}
