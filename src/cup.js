// Torneo contra la IA: eliminación directa de 8 o 16 equipos. Tus partidos se
// juegan; los demás se simulan con el mismo motor, eligiendo al azar.
import { newMatch, resolveToss, resolvePlay, randomChoice } from './game.js';

export const ROUND_NAMES = { 16: 'Octavos de final', 8: 'Cuartos de final', 4: 'Semifinal', 2: 'Final' };

// La IA se pone más difícil a medida que avanzas.
export function levelFor(teamsLeft) {
  return teamsLeft >= 16 ? 'easy' : teamsLeft === 8 ? 'normal' : 'hard';
}

function shuffle(a, rng = Math.random) {
  a = [...a];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export function newCup({ me, pool, size = 8, length = 'normal', rng = Math.random }) {
  const rivals = shuffle(pool.filter((id) => id !== me), rng).slice(0, size - 1);
  const teams = shuffle([me, ...rivals], rng);
  const first = [];
  for (let i = 0; i < teams.length; i += 2) first.push({ a: teams[i], b: teams[i + 1], res: null });
  return { v: 1, me, size, length, rounds: [first], out: false };
}

export const currentRound = (cup) => cup.rounds[cup.rounds.length - 1];
export const myMatch = (cup) => currentRound(cup).find((m) => m.a === cup.me || m.b === cup.me);
export const teamsLeft = (cup) => currentRound(cup).length * 2;
export const champion = (cup) => { const r = currentRound(cup); return r.length === 1 && r[0].res ? r[0].res.winner : null; };

// Simula un partido completo entre dos equipos de la IA (con penales si empatan).
export function simulate(a, b, length = 'normal', rng = Math.random) {
  let { state } = resolveToss(newMatch({ home: a, away: b, length }), rng() < 0.5 ? 'cara' : 'sello', rng);
  let guard = 0;
  while (state.phase === 'play' && guard++ < 2000) {
    ({ state } = resolvePlay(state, randomChoice(state, 'att', rng), randomChoice(state, 'def', rng), rng));
  }
  return resultOf(state, a, b);
}

// Resultado a partir del estado final de un partido.
export function resultOf(state, a, b) {
  const [ga, gb] = state.score;
  const pens = state.pens ? [...state.pens.goals] : null;
  const winner = pens ? (state.winner === 0 ? a : b) : ga > gb ? a : b;
  return { ga, gb, pens, winner };
}

// Guarda tu resultado, simula el resto de la ronda y arma la siguiente.
export function finishRound(cup, mine, rng = Math.random) {
  const round = currentRound(cup);
  for (const m of round) {
    if (m.res) continue;
    if (mine && (m.a === cup.me || m.b === cup.me)) m.res = mine;
    else m.res = simulate(m.a, m.b, cup.length, rng);
  }
  if (!round.some((m) => m.res.winner === cup.me)) cup.out = cup.out || teamsLeft(cup);
  if (round.length > 1) {
    const next = [];
    for (let i = 0; i < round.length; i += 2) next.push({ a: round[i].res.winner, b: round[i + 1].res.winner, res: null });
    cup.rounds.push(next);
  }
  return cup;
}
