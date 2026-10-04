// Modo carrera: una temporada completa de una liga real contra la IA. Tus
// partidos se juegan; el resto de la fecha se simula con el mismo motor.
import { newMatch, resolveToss, resolvePlay, randomChoice } from './game.js';
import { roundRobin, standings } from './league.js';

function shuffle(a, rng = Math.random) {
  a = [...a];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function fixture(ids, double, rng) {
  const first = roundRobin(shuffle(ids, rng)).map((r) => r.filter(([, b]) => b !== null).map(([h, a]) => ({ h, a, res: null })));
  if (!double) return first;
  // Segunda rueda: los mismos cruces con la localía invertida.
  return [...first, ...first.map((r) => r.map((m) => ({ h: m.a, a: m.h, res: null })))];
}

export function newCareer({ league, me, double = false, level = 'normal', length = 'short', rng = Math.random }) {
  return {
    v: 1, league: league.id, me, double, level, length, season: 1,
    rounds: fixture(league.teams, double, rng), round: 0, scorers: {}, history: [], titles: 0,
  };
}

export const totalRounds = (c) => c.rounds.length;
export const seasonOver = (c) => c.round >= c.rounds.length;
export const myFixture = (c) => (seasonOver(c) ? null : c.rounds[c.round].find((m) => m.h === c.me || m.a === c.me));

export function table(c, teams) {
  const results = c.rounds.flat().filter((m) => m.res).map((m) => ({ home: m.h, away: m.a, hs: m.res.hs, as: m.res.as }));
  return standings(teams.map((id) => ({ id })), results);
}

// Partido simulado entre dos equipos de la IA (en liga no hay penales).
export function simulateMatch(h, a, length, rng = Math.random) {
  let { state } = resolveToss(newMatch({ home: h, away: a, length, shootout: false }), rng() < 0.5 ? 'cara' : 'sello', rng);
  let guard = 0;
  while (state.phase === 'play' && guard++ < 2000) ({ state } = resolvePlay(state, randomChoice(state, 'att', rng), randomChoice(state, 'def', rng), rng));
  return state;
}

// Resultado y goleadores a partir del estado final de un partido.
export function resultFrom(state) {
  return { hs: state.score[0], as: state.score[1], goals: (state.goals || []).map((g) => [g.side, g.i]) };
}

function addScorers(c, m) {
  for (const [side, i] of m.res.goals || []) {
    const key = `${side === 0 ? m.h : m.a}:${i}`;
    c.scorers[key] = (c.scorers[key] || 0) + 1;
  }
}

// Cierra la fecha: tu resultado (si lo hay) y el resto simulado.
export function playRound(c, mine, rng = Math.random) {
  if (seasonOver(c)) return c;
  for (const m of c.rounds[c.round]) {
    if (m.res) continue;
    const isMine = m.h === c.me || m.a === c.me;
    m.res = isMine && mine ? mine : resultFrom(simulateMatch(m.h, m.a, c.length, rng));
    addScorers(c, m);
  }
  c.round++;
  return c;
}

export function topScorers(c, n = 5) {
  return Object.entries(c.scorers).map(([k, g]) => { const [team, i] = k.split(':'); return { team, i: Number(i), g }; })
    .sort((x, y) => y.g - x.g).slice(0, n);
}

// Nueva temporada con el mismo equipo: se guarda cómo terminó la anterior.
export function nextSeason(c, league, rng = Math.random) {
  const t = table(c, league.teams);
  const pos = t.findIndex((r) => r.id === c.me) + 1;
  c.history.push({ season: c.season, pos, pts: t[pos - 1].pts, champion: t[0].id });
  if (pos === 1) c.titles++;
  c.season++;
  c.rounds = fixture(league.teams, c.double, rng);
  c.round = 0;
  c.scorers = {};
  return c;
}
