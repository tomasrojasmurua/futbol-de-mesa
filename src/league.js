// Modo liga: de 2 a 4 jugadores, todos contra todos. El que crea la liga es la
// autoridad de todos los partidos: corre un Host por partido y reparte los
// mensajes a quienes juegan y a quien mira.
import { Host } from './host.js';
import { randomChoice, TURN_SECONDS } from './game.js';

// Fixture por el método del círculo. Con 2 jugadores se juega ida y vuelta.
// Devuelve fechas: [[[local, visita] | [jugador, null] (descansa), ...], ...]
export function roundRobin(ids) {
  if (ids.length === 2) return [[[ids[0], ids[1]]], [[ids[1], ids[0]]]];
  const list = ids.length % 2 ? [...ids, null] : [...ids];
  const n = list.length;
  const rounds = [];
  const homes = Object.fromEntries(ids.map((id) => [id, 0]));
  for (let r = 0; r < n - 1; r++) {
    const round = [];
    for (let k = 0; k < n / 2; k++) {
      const a = list[k], b = list[n - 1 - k];
      if (a === null || b === null) { round.push([a ?? b, null]); continue; }
      // Reparte la localía: es local el que menos veces lo ha sido.
      const pair = homes[a] < homes[b] || (homes[a] === homes[b] && (r + k) % 2 === 0) ? [a, b] : [b, a];
      homes[pair[0]]++;
      round.push(pair);
    }
    rounds.push(round);
    list.splice(1, 0, list.pop());
  }
  return rounds;
}

// Tabla: 3 puntos por triunfo, 1 por empate. Desempate: diferencia de gol, goles a favor.
export function standings(players, results) {
  const row = Object.fromEntries(players.map((p) => [p.id, { id: p.id, team: p.team, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, pts: 0 }]));
  for (const r of results) {
    const h = row[r.home], a = row[r.away];
    if (!h || !a) continue;
    h.pj++; a.pj++;
    h.gf += r.hs; h.gc += r.as; a.gf += r.as; a.gc += r.hs;
    if (r.hs > r.as) { h.pg++; a.pp++; h.pts += 3; }
    else if (r.hs < r.as) { a.pg++; h.pp++; a.pts += 3; }
    else { h.pe++; a.pe++; h.pts++; a.pts++; }
  }
  return Object.values(row).sort((x, y) => y.pts - x.pts || (y.gf - y.gc) - (x.gf - x.gc) || y.gf - x.gf);
}

// La autoridad de la liga. send(playerId, msg) entrega un mensaje a un jugador.
export class LeagueHost {
  constructor({ players, length = 'short', send }) {
    this.players = players.map((p) => ({ ...p, gone: false }));
    this.length = length;
    this.send = send;
    this.rounds = roundRobin(this.players.map((p) => p.id));
    this.round = -1;
    this.results = [];
    this.matches = [];
    this.lastTable = null;
  }

  player(id) { return this.players.find((p) => p.id === id); }
  teamOf(id) { return this.player(id).team; }

  start() { this.nextRound(); }

  nextRound() {
    if (this.round >= 0 && this.matches.some((m) => !m.done)) return;
    this.round++;
    if (this.round >= this.rounds.length) return;
    const pairs = this.rounds[this.round];
    this.matches = [];
    let k = 0;
    for (const [home, away] of pairs) {
      if (away === null) continue;
      const m = { mid: `${this.round}-${k++}`, home, away, done: false, result: null, timer: null, host: null };
      this.matches.push(m);
      // Si alguien ya abandonó la liga, el partido se da 3-0 al otro.
      if (this.player(home).gone || this.player(away).gone) { m.wo = true; continue; }
      m.host = new Host({
        home: this.teamOf(home), away: this.teamOf(away), callerSide: 1, length: this.length, shootout: false,
        broadcast: (msg) => this.route(m, msg),
      });
    }
    const fixtures = this.matches.map((m) => ({ mid: m.mid, home: m.home, away: m.away }));
    const resting = pairs.filter(([, b]) => b === null).map(([a]) => a);
    // Quien descansa mira el primer partido de la fecha.
    const live = this.matches.find((m) => !m.wo);
    for (const p of this.players) {
      const mine = this.matches.find((m) => m.home === p.id || m.away === p.id);
      const msg = { t: 'lg', kind: 'round', round: this.round, total: this.rounds.length, fixtures, resting, players: this.roster() };
      if (mine && !mine.wo) msg.play = { mid: mine.mid, side: mine.home === p.id ? 0 : 1 };
      else if (live) msg.watch = live.mid;
      this.send(p.id, msg);
    }
    for (const m of this.matches) if (m.host) { m.host.start(); this.arm(m); }
    for (const m of this.matches) if (m.wo) this.finish(m, this.player(m.home).gone ? 0 : 3, this.player(m.home).gone ? 3 : 0, true);
  }

  // Reparte un mensaje del partido a sus dos jugadores y a los que miran.
  route(m, msg) {
    const out = { ...msg, mid: m.mid };
    m.last = out;
    const watchers = this.players.filter((p) => p.id !== m.home && p.id !== m.away && !this.matches.some((x) => !x.done && !x.wo && x !== m && (x.home === p.id || x.away === p.id)));
    for (const id of [m.home, m.away, ...watchers.map((p) => p.id)]) this.send(id, out);
    if (msg.state && msg.state.phase === 'end') {
      const [hs, as] = msg.state.score;
      // Deja terminar la animación antes de publicar la tabla.
      this.finish(m, hs, as, false);
    } else this.arm(m);
  }

  // Si un jugador no responde (se le cortó la señal), el anfitrión elige por él.
  arm(m) {
    clearTimeout(m.timer);
    if (m.done) return;
    m.timer = setTimeout(() => {
      if (m.done || !m.host) return;
      const s = m.host.state;
      if (s.phase === 'toss') m.host.receive(s.callerSide, { t: 'call', call: Math.random() < 0.5 ? 'cara' : 'sello' });
      else if (s.phase === 'play') {
        for (const role of ['att', 'def']) {
          if (m.host.pending[role] !== undefined) continue;
          const side = role === 'att' ? s.poss : 1 - s.poss;
          m.host.receive(side, { t: 'choice', seq: s.seq, choice: randomChoice(s, role) });
        }
      }
    }, (TURN_SECONDS + 45) * 1000);
  }

  finish(m, hs, as, walkover) {
    if (m.done) return;
    m.done = true;
    clearTimeout(m.timer);
    m.result = { home: m.home, away: m.away, hs, as, walkover, round: this.round };
    this.results.push(m.result);
    if (m.host) m.host.broadcast = () => {};
    if (this.matches.every((x) => x.done)) this.publishTable();
    else {
      // Los que terminaron miran el partido que sigue en juego.
      const live = this.matches.find((x) => !x.done);
      for (const id of [m.home, m.away]) {
        if (this.player(id).gone) continue;
        this.send(id, { t: 'lg', kind: 'wait', watch: live.mid, table: this.table() });
        if (live.last) this.send(id, live.last);
      }
    }
  }

  table() { return standings(this.players, this.results); }
  roster() { return this.players.map(({ id, team, gone }) => ({ id, team, gone })); }

  publishTable() {
    const final = this.round >= this.rounds.length - 1;
    const next = final ? null : this.rounds[this.round + 1].map(([a, b]) => ({ home: a, away: b }));
    this.lastTable = {
      t: 'lg', kind: 'table', round: this.round, total: this.rounds.length, final,
      table: this.table(), results: this.results.filter((r) => r.round === this.round), next,
      players: this.roster(),
    };
    for (const p of this.players) this.send(p.id, this.lastTable);
  }

  receive(id, msg) {
    if (msg.t === 'quit') { this.leave(id); return; }
    if (msg.t !== 'choice' && msg.t !== 'call') return;
    const m = this.matches.find((x) => x.mid === msg.mid);
    if (!m || m.done || !m.host) return;
    const side = m.home === id ? 0 : m.away === id ? 1 : -1;
    if (side < 0) return;
    m.host.receive(side, msg);
  }

  // Un jugador se fue: pierde 3-0 el partido en curso y los que le queden.
  leave(id) {
    const p = this.player(id);
    if (!p || p.gone) return;
    p.gone = true;
    const m = this.matches.find((x) => !x.done && (x.home === id || x.away === id));
    if (m) {
      const other = m.home === id ? m.away : m.home;
      this.send(other, { t: 'lg', kind: 'walkover', mid: m.mid, team: p.team });
      this.finish(m, m.home === id ? 0 : 3, m.home === id ? 3 : 0, true);
    }
  }
}
