import { newMatch, resolveToss, resolvePlay, validChoice, randomChoice, optionsFor } from './game.js';

// El anfitrión guarda el estado oficial del partido. Recibe elecciones de los
// dos asientos (0 = local, 1 = visita) y difunde cada resultado.
export class Host {
  constructor({ home, away, callerSide, broadcast, length, shootout = true, setup = null }) {
    this.state = newMatch({ home, away, callerSide, length, shootout, setup });
    this.broadcast = broadcast;
    this.pending = {};
  }

  start() {
    this.broadcast({ t: 'state', state: this.state, ev: { type: 'start' } });
  }

  receive(side, msg) {
    const s = this.state;
    if (msg.t === 'call' && s.phase === 'toss' && side === s.callerSide) {
      const call = msg.call === 'sello' ? 'sello' : 'cara';
      const { state, ev } = resolveToss(s, call);
      this.state = state;
      this.broadcast({ t: 'state', state, ev });
      return;
    }
    if (msg.t === 'choice' && s.phase === 'play' && msg.seq === s.seq) {
      const role = side === s.poss ? 'att' : 'def';
      if (this.pending[role] !== undefined) return;
      this.pending[role] = validChoice(s, role, msg.choice) ? msg.choice : randomChoice(s, role);
      if (this.pending.att !== undefined && this.pending.def !== undefined) {
        const { state, ev } = resolvePlay(s, this.pending.att, this.pending.def);
        this.pending = {};
        this.state = state;
        this.broadcast({ t: 'state', state, ev });
      }
    }
  }
}

// Rival controlado por la IA, con tres niveles.
// - easy: tiene "mañas": repite mucho su propia elección anterior, así que se le puede leer.
// - normal: elige al azar y a veces se anticipa a tu carta más usada.
// - hard: estudia tus patrones (frecuencias y qué eliges después de cada carta)
//   y juega en contra de ellos sin volverse predecible.
export const LEVELS = {
  easy: { label: 'Fácil', read: 0, repeat: 0.55, think: [1200, 2600] },
  normal: { label: 'Normal', read: 0.35, repeat: 0, think: [900, 2400] },
  hard: { label: 'Difícil', read: 0.7, repeat: 0, think: [700, 1800] },
};

export class Cpu {
  constructor(side, send, level = 'normal') {
    this.side = side;
    this.send = send;
    this.level = LEVELS[level] ? level : 'normal';
    this.cfg = LEVELS[this.level];
    this.history = {};   // elecciones del humano por situación y rol
    this.mine = {};      // última elección propia por situación y rol
  }

  onMessage(msg) {
    if (msg.t !== 'state') return;
    const { state, ev } = msg;
    if (ev && ev.type === 'play') {
      const humanRole = ev.poss === this.side ? 'def' : 'att';
      const key = `${ev.situation}:${humanRole}`;
      (this.history[key] ||= []).push(humanRole === 'att' ? ev.att : ev.def);
    }
    if (state.phase === 'toss' && state.callerSide === this.side) {
      setTimeout(() => this.send({ t: 'call', call: Math.random() < 0.5 ? 'cara' : 'sello' }), 1200);
    }
    if (state.phase === 'play') {
      const role = state.poss === this.side ? 'att' : 'def';
      const choice = this.decide(state, role);
      this.mine[`${state.situation}:${role}`] = choice;
      const seq = state.seq;
      const [a, b] = this.cfg.think;
      setTimeout(() => this.send({ t: 'choice', seq, choice }), a + Math.random() * (b - a));
    }
  }

  // Probabilidad estimada de cada carta del humano en esta situación.
  predict(state, humanRole) {
    const ids = optionIds(state, humanRole);
    const past = this.history[`${state.situation}:${humanRole}`] || [];
    const p = Object.fromEntries(ids.map((id) => [id, 1]));
    const recent = past.slice(-8);
    recent.forEach((c, k) => { if (c in p) p[c] += 1 + k * 0.25; });
    if (this.level === 'hard' && past.length >= 2) {
      // Qué suele elegir después de su última carta.
      const last = past[past.length - 1];
      for (let k = 0; k < past.length - 1; k++) if (past[k] === last && past[k + 1] in p) p[past[k + 1]] += 1.5;
    }
    const total = Object.values(p).reduce((x, y) => x + y, 0);
    for (const id of ids) p[id] /= total;
    return p;
  }

  decide(state, role) {
    const ids = optionIds(state, role);
    const key = `${state.situation}:${role}`;
    if (this.cfg.repeat && this.mine[key] && Math.random() < this.cfg.repeat) return this.mine[key];
    const humanRole = role === 'att' ? 'def' : 'att';
    const past = this.history[`${state.situation}:${humanRole}`] || [];
    if (!this.cfg.read || past.length < 2 || Math.random() >= this.cfg.read) return randomChoice(state, role);
    const p = this.predict(state, humanRole);
    if (role === 'def') {
      // Defendiendo: tapa lo que más probablemente elija el humano.
      return weighted(ids, ids.map((id) => p[id] ** 2));
    }
    // Atacando: va por donde el humano menos suele cerrar.
    return weighted(ids, ids.map((id) => (1 - p[id]) ** 2));
  }
}

function optionIds(state, role) {
  return optionsFor(state.situation)[role].map((o) => o.id);
}

function weighted(ids, w) {
  const t = w.reduce((a, b) => a + b, 0);
  let r = Math.random() * t;
  for (let k = 0; k < ids.length; k++) { r -= w[k]; if (r <= 0) return ids[k]; }
  return ids[ids.length - 1];
}
