// Simula muchos partidos con elecciones al azar para revisar duración y marcadores.
import { newMatch, resolveToss, resolvePlay, randomChoice } from '../src/game.js';

const N = Number(process.argv[2] || 2000);
let decisions = 0, goals = 0, maxDec = 0, draws = 0;
const outcomes = {};
for (let i = 0; i < N; i++) {
  let { state } = resolveToss(newMatch({ home: 'rac', away: 'uc' }), 'cara');
  let d = 0;
  while (state.phase === 'play') {
    const r = resolvePlay(state, randomChoice(state, 'att'), randomChoice(state, 'def'));
    outcomes[`${r.ev.situation}:${r.ev.outcome}`] = (outcomes[`${r.ev.situation}:${r.ev.outcome}`] || 0) + 1;
    state = r.state; d++;
    if (d > 500) throw new Error('partido infinito');
  }
  decisions += d; maxDec = Math.max(maxDec, d);
  goals += state.score[0] + state.score[1];
  if (state.score[0] === state.score[1]) draws++;
}
console.log(`decisiones/partido: ${(decisions / N).toFixed(1)} (máx ${maxDec})`);
console.log(`goles/partido: ${(goals / N).toFixed(2)}, empates: ${((draws / N) * 100).toFixed(0)}%`);
console.log(Object.entries(outcomes).sort().map(([k, v]) => `${k}: ${(v / N).toFixed(2)}`).join('\n'));
