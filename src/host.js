import { newMatch, resolveToss, resolvePlay, validChoice, randomChoice } from './game.js';

// El anfitrión guarda el estado oficial del partido. Recibe elecciones de los
// dos asientos (0 = local, 1 = visita) y difunde cada resultado.
export class Host {
  constructor({ home, away, callerSide, broadcast }) {
    this.state = newMatch({ home, away, callerSide });
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

// Rival controlado por la máquina. Un poco tramposo no: sólo aprende de las
// elecciones pasadas del humano y a veces intenta anticiparlas.
export class Cpu {
  constructor(side, send) {
    this.side = side;
    this.send = send;
    this.history = {};
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
      const humanRole = role === 'att' ? 'def' : 'att';
      const past = this.history[`${state.situation}:${humanRole}`] || [];
      let choice = randomChoice(state, role);
      if (past.length >= 3 && Math.random() < 0.35) {
        const counts = {};
        past.slice(-6).forEach((c) => (counts[c] = (counts[c] || 0) + 1));
        const fav = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
        // Defendiendo, copia lo favorito del humano; atacando, lo evita.
        if (role === 'def' && validChoice(state, role, fav)) choice = fav;
        if (role === 'att' && choice === fav) choice = randomChoice(state, role);
      }
      const seq = state.seq;
      setTimeout(() => this.send({ t: 'choice', seq, choice }), 900 + Math.random() * 1800);
    }
  }
}
