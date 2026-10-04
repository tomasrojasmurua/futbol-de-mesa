// Propuesta de cartas que cambian caras del dado (no el piedra-papel-tijera).
// Modelo propio del partido con los mismos dados y reloj de src/game.js, para
// probar mazos sin tocar el motor. Uso:
//   node scripts/dice-cards-sim.js [partidos] [carta]   (carta = solo esa en el mazo)
//   FALTAS=1 ...  agrega una cara de falta al dado del último tercio
const N = Number(process.argv[2] || 20000);
const ONLY = process.argv[3] || null;
const HALF = 27; // partido corto
const MARKS = [0.4, 0.8];

// Dados base: [cara1..cara6]
const BASE = {
  buildDef: ['foul', 'steal', 'steal', 'steal', 'steal', 'counter'], // salida, el defensor adivinó
  attackDef: ['corner', 'steal', 'steal', 'steal', 'steal', 'counter'], // último tercio, el defensor adivinó
  shotSave: ['corner', 'save', 'save', 'save', 'save', 'counter'], // remate, el arquero adivinó
  shotBeat: ['post', 'wide', 'goal', 'goal', 'goal', 'goal'], // remate, el arquero no adivinó
};
if (process.env.FALTAS) BASE.attackDef = ['corner', 'foul', 'steal', 'steal', 'steal', 'counter'];

// Cartas: a quién (según la jugada), qué dado, qué caras cambian y cuántos usos.
//  who: 'poss' tiene la pelota | 'def' no la tiene | 'losing' va perdiendo (empate: tie) | 'both'
const CARDS = {
  hinchada: { copies: 4, who: 'losing', tie: 'poss', role: 'att', dice: ['shotBeat'], from: 'wide', to: 'goal', n: 1, uses: 1 },
  tactico: { copies: 3, who: 'losing', tie: 'def', role: 'def', dice: ['buildDef', 'attackDef'], from: 'steal', to: 'counter', n: 1, uses: 3 },
  lluvia: { copies: 2, who: 'both', role: 'att', dice: ['shotBeat'], from: 'goal', to: 'wide', n: 1, uses: Infinity, half: true },
  arquero: { copies: 2, who: 'def', role: 'def', dice: ['shotBeat'], from: 'goal', to: 'corner', n: 1, uses: 1 },
  crack: { copies: 2, who: 'poss', role: 'att', dice: ['buildDef', 'attackDef'], from: 'steal', to: 'advance', n: 2, uses: 1 },
  iluminacion: { copies: 2, who: 'poss', role: 'att', dice: ['shotSave'], from: 'save', to: 'goal', n: 1, uses: 1 },
  error: { copies: 1, who: 'poss', role: 'att', dice: ['buildDef', 'attackDef'], from: 'steal', to: 'advance', n: 3, uses: 1 },
};
const DISC = { amarilla: 7, roja: 1, libre: 2 };

const deckOf = (spec) => Object.entries(spec).flatMap(([k, v]) => Array(typeof v === 'number' ? v : v.copies).fill(k));
const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const d6 = () => Math.floor(Math.random() * 6);

function play({ cards = true, read = [0, 0] } = {}) {
  const m = { score: [0, 0], poss: Math.random() < 0.5 ? 0 : 1, sit: 'build', clock: 0, half: 1 };
  const first = m.poss, kickoff = m.poss;
  const partido = ONLY ? Array(16).fill(ONLY) : deckOf(CARDS);
  const disc = deckOf(DISC);
  let deckP = shuffle(partido), deckD = shuffle(disc);
  let fx = []; // efectos vivos: { card, side, uses }
  const yellows = [new Set(), new Set()];
  let drawn = 0;
  const st = { cards: 0, fouls: 0, yellow: 0, red: 0, error: 0 };

  const faces = (die, att, def) => {
    const f = [...BASE[die]];
    for (const e of fx) {
      const c = CARDS[e.card] || e.def;
      if (!c.dice.includes(die)) continue;
      if (e.side !== (c.role === 'att' ? att : def)) continue;
      let k = c.n;
      for (let i = 0; i < 6 && k; i++) if (f[i] === c.from) { f[i] = c.to; k--; }
      e.used = true;
    }
    fx.forEach((e) => { if (e.used) { e.uses--; e.used = false; } });
    fx = fx.filter((e) => e.uses > 0);
    return f;
  };
  const duel = () => { // true = el atacante gana el duelo
    const A = m.poss, D = 1 - A;
    if (Math.random() < read[D]) return false;
    if (Math.random() < read[A]) return true;
    return Math.random() < 2 / 3;
  };
  const turnover = (to = 'build') => { m.poss = 1 - m.poss; m.sit = to; };
  const foul = () => {
    st.fouls++;
    if (!cards) return;
    if (!deckD.length) deckD = shuffle(disc);
    let c = deckD.pop(); st.cards++;
    const D = 1 - m.poss, player = Math.floor(Math.random() * 8);
    if (c === 'amarilla') { if (yellows[D].has(player)) c = 'roja'; else { yellows[D].add(player); st.yellow++; } }
    if (c === 'roja') { st.red++; fx.push({ def: { role: 'def', dice: ['buildDef', 'attackDef'], from: 'steal', to: m.sit === 'build' ? 'foul' : 'corner', n: 1 }, side: D, uses: Infinity }); }
    if (c === 'libre') m.sit = 'shot';
  };
  const drawPartido = () => {
    if (!deckP.length) deckP = shuffle(partido);
    const id = deckP.pop(), c = CARDS[id]; st.cards++;
    if (id === 'error') st.error++;
    const P = m.poss, R = 1 - P;
    const [a, b] = m.score, losing = a === b ? null : a < b ? 0 : 1;
    let sides;
    if (c.who === 'both') sides = [0, 1];
    else if (c.who === 'losing') sides = [losing ?? (c.tie === 'poss' ? P : R)];
    else sides = [c.who === 'poss' ? P : R];
    for (const side of sides) fx.push({ card: id, side, uses: c.uses, half: c.half });
  };

  while (true) {
    const A = m.poss, D = 1 - A;
    const win = duel();
    switch (m.sit) {
      case 'build': {
        m.clock += 3 + Math.floor(Math.random() * 3);
        if (win) { m.sit = 'attack'; break; }
        const f = cards ? faces('buildDef', A, D)[d6()] : BASE.buildDef[d6()];
        if (f === 'foul') foul();
        else if (f === 'advance') m.sit = 'attack';
        else turnover(f === 'counter' ? 'attack' : 'build');
        break;
      }
      case 'attack': {
        m.clock += 3;
        if (win) { m.sit = 'shot'; break; } // el penal usa el mismo dado de remate
        const f = cards ? faces('attackDef', A, D)[d6()] : BASE.attackDef[d6()];
        if (f === 'corner') m.sit = 'corner';
        else if (f === 'foul') foul();
        else if (f === 'advance') m.sit = 'shot';
        else turnover(f === 'counter' ? 'attack' : 'build');
        break;
      }
      case 'shot': {
        m.clock += 1;
        const f = cards ? faces(win ? 'shotBeat' : 'shotSave', A, D)[d6()] : BASE[win ? 'shotBeat' : 'shotSave'][d6()];
        if (f === 'goal') { m.score[A]++; turnover('build'); }
        else if (f === 'corner') m.sit = 'corner';
        else turnover(f === 'counter' ? 'attack' : 'build');
        break;
      }
      case 'corner': {
        m.clock += 1;
        if (win) m.sit = 'shot'; else turnover('build');
        break;
      }
    }
    if (m.sit === 'build' && m.clock >= HALF * m.half) {
      if (m.half === 2) break;
      m.half = 2; m.clock = HALF; m.poss = 1 - kickoff; m.sit = 'build';
      fx = fx.filter((e) => !e.half);
      if (drawn < 2) drawn = 2;
      continue;
    }
    if (cards && drawn < 4 && m.sit === 'build') {
      const h = Math.floor(drawn / 2) + 1;
      if (h === m.half && m.clock >= HALF * (h - 1) + HALF * MARKS[drawn % 2]) { drawn++; drawPartido(); }
    }
  }
  return { m, first, st };
}

function row(label, opts) {
  let g = 0, fw = 0, dec = 0, w = 0, l = 0, w35 = 0;
  const t = { cards: 0, fouls: 0, yellow: 0, red: 0, error: 0 };
  for (let i = 0; i < N; i++) {
    const { m, first, st } = play(opts);
    const [a, b] = m.score; g += a + b;
    for (const k in t) t[k] += k === 'error' ? +(st[k] > 0) : st[k];
    if (a !== b) { dec++; if ((a > b ? 0 : 1) === first) fw++; }
    const r = play({ ...opts, read: [0.2, 0] }).m.score; if (r[0] > r[1]) w++; else if (r[0] < r[1]) l++;
    const r3 = play({ ...opts, read: [0.35, 0] }).m.score; if (r3[0] > r3[1]) w35++;
  }
  const f = (x, d = 2) => (x / N).toFixed(d);
  console.log(`${label.padEnd(16)} goles ${f(g)}  gana quien saca ${(100 * fw / dec).toFixed(1)}%  lee 20%: ${(100 * w / N).toFixed(0)}-${(100 * l / N).toFixed(0)}  lee 35%: gana ${(100 * w35 / N).toFixed(0)}  faltas ${f(t.fouls)}  amarillas ${f(t.yellow)}  rojas ${f(t.red, 3)}  partidos con error ${(100 * t.error / N).toFixed(0)}%`);
}

row('sin cartas', { cards: false });
row(ONLY ? `solo ${ONLY}` : 'mazo completo', { cards: true });
