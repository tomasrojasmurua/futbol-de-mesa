// Mide cada nivel de IA contra dos tipos de "humanos" simulados:
// uno con mañas (repite su carta favorita) y uno totalmente al azar.
import { newMatch, resolveToss, resolvePlay, randomChoice, optionsFor } from '../src/game.js';
import { Cpu } from '../src/host.js';

const humans = {
  conMañas: (state, role) => { const ids = optionsFor(state.situation)[role].map((o) => o.id); return Math.random() < 0.5 ? ids[0] : ids[Math.floor(Math.random() * ids.length)]; },
  alAzar: (state, role) => randomChoice(state, role),
};
const N = Number(process.argv[2] || 1500);
for (const [hn, human] of Object.entries(humans)) {
  for (const level of ['easy', 'normal', 'hard']) {
    let w = 0, l = 0, gd = 0;
    for (let i = 0; i < N; i++) {
      let picked = null;
      const cpu = new Cpu(1, () => {}, level);
      cpu.decideOrig = cpu.decide;
      let { state } = resolveToss(newMatch({ home: 'a', away: 'b' }), 'cara');
      while (state.phase === 'play') {
        const cpuRole = state.poss === 1 ? 'att' : 'def';
        picked = cpu.decide(state, cpuRole);
        cpu.mine[`${state.situation}:${cpuRole}`] = picked;
        const h = human(state, cpuRole === 'att' ? 'def' : 'att');
        const r = cpuRole === 'att' ? resolvePlay(state, picked, h) : resolvePlay(state, h, picked);
        const humanRole = r.ev.poss === 1 ? 'def' : 'att';
        (cpu.history[`${r.ev.situation}:${humanRole}`] ||= []).push(humanRole === 'att' ? r.ev.att : r.ev.def);
        state = r.state;
      }
      const d = state.score[0] - state.score[1];
      gd += d; if (d > 0) w++; else if (d < 0) l++;
    }
    console.log(`${hn.padEnd(9)} vs ${level.padEnd(6)} humano gana ${((w / N) * 100).toFixed(0)}% · pierde ${((l / N) * 100).toFixed(0)}% · dif. gol ${(gd / N).toFixed(2)}`);
  }
}
