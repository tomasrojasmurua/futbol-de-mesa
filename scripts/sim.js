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
console.log(`goles/partido: ${(goals / N).toFixed(2)}, a penales: ${((draws / N) * 100).toFixed(0)}%`);
console.log(Object.entries(outcomes).sort().map(([k, v]) => `${k}: ${(v / N).toFixed(2)}`).join('\n'));

// Liga: cada par se enfrenta una vez (con 2, ida y vuelta) y nadie juega dos veces por fecha.
import('../src/league.js').then(({ roundRobin, standings }) => {
  for (const n of [2, 3, 4]) {
    const ids = ['a', 'b', 'c', 'd'].slice(0, n);
    const rounds = roundRobin(ids);
    const seen = new Set();
    for (const r of rounds) {
      const busy = r.flat().filter(Boolean);
      if (new Set(busy).size !== busy.length) throw new Error('alguien juega dos veces en una fecha');
      for (const [h, a] of r) if (a) seen.add(n === 2 ? h + a : [h, a].sort().join(''));
    }
    if (seen.size !== (n === 2 ? 2 : (n * (n - 1)) / 2)) throw new Error(`fixture incompleto con ${n}`);
  }
  const t = standings([{ id: 'a' }, { id: 'b' }], [{ home: 'a', away: 'b', hs: 1, as: 2 }]);
  if (t[0].id !== 'b' || t[0].pts !== 3) throw new Error('tabla mal ordenada');
  console.log('liga: fixture y tabla OK');
});
