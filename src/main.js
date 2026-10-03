import { TEAMS, teamById, matchKits } from './teams.js';
import { optionsFor, SHOT_TITLES, TURN_SECONDS, fmtMinute, commentary, diceReason, diceFaces, DIE_LABELS, LENGTHS, randomChoice } from './game.js';
import { Host, Cpu, LEVELS } from './host.js';
import { createRoom, joinRoom } from './net.js';
import { Renderer } from './render.js';
import * as audio from './audio.js';
import { icon, iconFor } from './icons.js';

const $ = (s) => document.querySelector(s);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- preferencias ----------
let myTeamId = 'rac';
try { myTeamId = localStorage.getItem('fdm-team') || 'rac'; } catch { /* sin storage */ }
let myLength = 'normal';
try { myLength = LENGTHS[localStorage.getItem('fdm-len')] ? localStorage.getItem('fdm-len') : 'normal'; } catch { /* sin storage */ }

function show(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
}

export function swatchCss(kit) {
  const { shirt, alt2, pattern, shorts } = kit;
  let top;
  switch (pattern) {
    case 'stripes': top = `repeating-linear-gradient(90deg, ${shirt} 0 4px, ${alt2} 4px 8px)`; break;
    case 'band': top = `linear-gradient(${shirt} 0 35%, ${alt2} 35% 55%, ${shirt} 55%)`; break;
    case 'hoops': top = `repeating-linear-gradient(180deg, ${shirt} 0 4px, ${alt2} 4px 8px)`; break;
    case 'sash': top = `linear-gradient(225deg, ${shirt} 0 40%, ${alt2} 40% 58%, ${shirt} 58%)`; break;
    case 'sleeves': top = `linear-gradient(90deg, ${alt2} 0 22%, ${shirt} 22% 78%, ${alt2} 78%)`; break;
    case 'center': top = `linear-gradient(90deg, ${shirt} 0 38%, ${alt2} 38% 62%, ${shirt} 62%)`; break;
    case 'checks': top = `conic-gradient(${shirt} 25%, ${alt2} 0 50%, ${shirt} 0 75%, ${alt2} 0) 0 0 / 8px 8px`; break;
    default: top = shirt;
  }
  return `linear-gradient(transparent 70%, ${shorts} 70%), ${top}`;
}

function paintMyTeam() {
  const t = teamById(myTeamId);
  $('#my-team-name').textContent = t.name;
  $('#my-swatch').style.background = swatchCss(t.kit);
}

function buildTeamGrid() {
  const grid = $('#team-grid');
  grid.innerHTML = '';
  let group = '';
  for (const t of TEAMS) {
    if (t.group !== group) {
      group = t.group;
      const h = document.createElement('h3'); h.textContent = group; grid.appendChild(h);
    }
    const b = document.createElement('button');
    b.className = 'team-btn' + (t.id === myTeamId ? ' sel' : '');
    b.innerHTML = `<span class="kit-swatch"></span><span>${t.name}</span>`;
    b.querySelector('.kit-swatch').style.background = swatchCss(t.kit);
    b.onclick = () => {
      myTeamId = t.id;
      try { localStorage.setItem('fdm-team', t.id); } catch { /* sin storage */ }
      paintMyTeam();
      show('screen-menu');
    };
    grid.appendChild(b);
  }
}

// ---------- modal ----------
function modal(html, buttons = []) {
  const box = $('#modal-box');
  box.innerHTML = html + '<div class="btns"></div>';
  const wrap = box.querySelector('.btns');
  for (const [label, cls, fn] of buttons) {
    const b = document.createElement('button');
    b.className = 'btn ' + cls; b.textContent = label;
    b.onclick = () => { if (fn() !== false) closeModal(); };
    wrap.appendChild(b);
  }
  $('#modal').classList.add('show');
}
function closeModal() { $('#modal').classList.remove('show'); }

const HELP = `
<h2>¿Cómo se juega?</h2>
<p>Cada partido dura dos tiempos de 45' (unos 5 a 8 minutos reales). Todo se decide con cartas, como un piedra-papel-tijera: los dos eligen a la vez y el partido se juega en la cancha según lo que eligieron.</p>
<h3>1. La salida</h3>
<p>Quien tiene la pelota elige por dónde sale: izquierda, centro o derecha. El rival elige qué zona cierra. Si el rival adivina, recupera la pelota; si no, el ataque llega al último tercio.</p>
<h3>2. El último tercio</h3>
<p>El atacante elige <b>centro al área</b>, <b>pase filtrado</b> o <b>gambeta</b>. El defensor elige <b>cerrar bandas</b> (para el centro), <b>achicar la línea</b> (para el pase filtrado) o <b>doble marca</b> (para la gambeta). Si el defensor acierta, corta el ataque.</p>
<h3>3. El remate</h3>
<p>El atacante patea a un palo o al medio; el arquero elige hacia dónde se tira. Si adivina, ataja. Si no... ¡casi siempre es gol!</p>
<h3>El dado</h3>
<p>En los momentos clave se tira un dado especial: cada cara trae un símbolo de lo que pasa y debajo ves cuántas caras tiene cada resultado. Las reglas son las mismas para los dos equipos.</p>
<ul>
<li>Cuando la defensa adivina, recupera la pelota, salvo una cara para cada lado: una falta o un córner a favor del que ataca, o un <b>contragolpe</b> para el que defiende.</li>
<li>Si el arquero adivina, ataja; una cara da rebote al córner y otra un saque rápido de contra.</li>
<li>Si le ganas al arquero, la imagen se congela con la pelota en el aire y el dado decide: 2 caras de gol, 2 de palo y 2 afuera. Igual para cualquier remate.</li>
<li>Una gambeta exitosa puede terminar en <b>penal</b>.</li>
</ul>
<h3>Duración</h3>
<p>En el menú eliges partido <b>corto</b> (unos 3 a 5 minutos), <b>normal</b> (5 a 8) o <b>largo</b> (10 a 14). En una sala manda la duración de quien la crea.</p>
<h3>Salas</h3>
<p>Crea una sala, comparte el código o el enlace, y tu rival entra desde su celular. Tienes ${TURN_SECONDS} segundos para cada carta: si se acaba el tiempo, se elige sola.</p>`;

// Describe una elección desde la pantalla de quien mira (su equipo ataca hacia arriba).
function describe(sit, role, id, iAttack) {
  const mirror = { L: 'R', C: 'C', R: 'L' };
  const side = (lane) => ({ L: 'izquierda', C: 'centro', R: 'derecha' })[iAttack ? lane : mirror[lane]];
  if (sit === 'build') return role === 'att' ? (id === 'C' ? 'Salida por el centro' : `Salida por la ${side(id)}`) : (id === 'C' ? 'Cierra el centro' : `Cierra la ${side(id)}`);
  if (sit === 'shot' || sit === 'penalty') {
    if (role === 'att') return id === 'C' ? 'Remate al medio' : `Remate a la ${side(id)}`;
    return id === 'C' ? 'Arquero al medio' : `Arquero a la ${side(id)}`;
  }
  const o = optionsFor(sit)[role].find((x) => x.id === id);
  return o ? o.label : id;
}

const MIRROR = { L: 'R', C: 'C', R: 'L' };

// Datos de una carta vista desde la pantalla de quien mira.
function cardInfo(sit, role, id, iAttack) {
  const screen = iAttack ? id : MIRROR[id];
  return { label: describe(sit, role, id, iAttack), img: iconFor(sit, role, id, screen) };
}

function cardHtml({ label, img, hint }, role, tag) {
  return `<span class="card-top">${tag}</span><img class="ic" src="${img}" alt=""><span class="lb">${label}</span>${hint ? `<span class="hn">${hint}</span>` : ''}`;
}

const QUESTIONS = {
  build: ['¿Llegará tu pase?', '¿Le cortas el pase?'],
  attack: ['¿Rompes la defensa?', '¿Lo frenas?'],
  shot: ['¿Será gol?', '¿Ataja tu arquero?'],
  penalty: ['¿Será gol?', '¿Ataja tu arquero?'],
  corner: ['¿Ganas por arriba?', '¿Despejas el córner?'],
};

// ---------- vista del partido ----------
class MatchView {
  constructor({ mySide, send, isHost, onRematch }) {
    this.mySide = mySide;
    this.send = send;
    this.isHost = isHost;
    this.onRematch = onRematch;
    this.queue = [];
    this.busy = false;
    this.timer = null;
    this.state = null;
    if (!renderer) renderer = new Renderer($('#pitch'), ui);
    renderer.resize();
    show('screen-game');
    renderer.resize();
    $('#feed').textContent = '¡Bienvenidos al estadio!';
    this.clearCards('Preparando la cancha…');
  }

  onMessage(msg) {
    if (msg.t !== 'state') return;
    this.queue.push(msg);
    this.pump();
  }

  async pump() {
    if (this.busy) return;
    this.busy = true;
    while (this.queue.length) {
      const m = this.queue.shift();
      try { await this.handle(m.state, m.ev); } catch (e) { console.error(e); }
    }
    this.busy = false;
  }

  names() { return this.state.teams.map((id) => teamById(id).name); }

  async handle(state, ev) {
    this.state = state;
    if (ev.type === 'start') {
      const teams = state.teams.map(teamById);
      this.kits = matchKits(teams[0], teams[1]);
      renderer.setup(teams, this.kits, this.mySide);
      renderer.kickoffNow(0);
      this.paintHud(state);
      this.lastSeq = -1;
      if (state.length && state.length !== 'normal') this.feed(`Partido ${LENGTHS[state.length].label.toLowerCase()}. ¡Bienvenidos al estadio!`);
      return this.promptToss(state);
    }
    if (ev.type === 'toss') {
      this.stopTimer();
      this.clearCards('Lanzamiento de moneda…');
      await ui.coin(ev.result, `${this.names()[ev.winner]} gana el sorteo y saca.`);
      await renderer.kickoff(ev.winner);
      audio.sound('whistle');
      this.feed(`¡Comienza el partido! Saca ${this.names()[ev.winner]}.`);
      return this.prompt(state);
    }
    if (ev.type === 'play') {
      this.stopTimer();
      this.clearCards(null);
      ev.diceText = diceReason(ev);
      ev.diceFaces = diceFaces(ev);
      this.currentEv = ev;
      this.duelStart(ev);
      await renderer.play(ev);
      this.feed(commentary(ev, this.names()));
      this.paintHud(state);
      if (ev.halfEnd) {
        audio.sound('whistle3');
        await ui.banner(ev.halfEnd === 1 ? 'ENTRETIEMPO' : 'FINAL', { hold: 1800 });
        if (ev.halfEnd === 2) return this.showEnd(state);
        this.feed(`Arranca el segundo tiempo. Saca ${this.names()[state.poss]}.`);
        await renderer.kickoff(ev.kickoffAfter);
        audio.sound('whistle');
      } else if (ev.outcome === 'goal') {
        await renderer.kickoff(ev.kickoffAfter);
        audio.sound('whistle');
      }
      return this.prompt(state);
    }
  }

  // Al empezar la jugada: tu carta boca arriba, la del rival boca abajo.
  duelStart(ev) {
    const iAttack = ev.poss === this.mySide;
    const mine = iAttack ? ev.att : ev.def, theirs = iAttack ? ev.def : ev.att;
    const myRole = iAttack ? 'att' : 'def', theirRole = iAttack ? 'def' : 'att';
    $('#panel-title').textContent = QUESTIONS[ev.situation][iAttack ? 0 : 1];
    const r = $('#panel-role'); r.textContent = '? ? ?'; r.className = 'role suspense';
    const me = cardInfo(ev.situation, myRole, mine, iAttack);
    const them = cardInfo(ev.situation, theirRole, theirs, iAttack);
    $('#cards').innerHTML = `
      <div class="duel-card mine ${myRole}"><div class="card ${myRole}">${cardHtml(me, myRole, 'TÚ')}</div></div>
      <div class="vs">VS</div>
      <div class="duel-card theirs ${theirRole}"><div class="flip"><div class="face back"><img src="${icon('back')}" alt=""><span>RIVAL</span></div><div class="face front card ${theirRole}">${cardHtml(them, theirRole, 'RIVAL')}</div></div></div>
      <div id="stamp" class="stamp"></div>`;
    $('#cards').classList.add('reveal');
    $('#panel').classList.add('tense');
    const names = this.names();
    const pre = {
      build: `${names[ev.poss]} intenta salir jugando…`,
      attack: `${names[ev.poss]} llega al último tercio…`,
      shot: `¡${names[ev.poss]} va a rematar!`,
      penalty: `Se prepara el penal…`,
      corner: `Tiro de esquina para ${names[ev.poss]}…`,
    }[ev.situation];
    this.feed(pre);
  }

  // El momento de la verdad: se da vuelta la carta del rival.
  duelReveal(ev) {
    const iAttack = ev.poss === this.mySide;
    const won = iAttack ? !ev.match : ev.match;
    $('#panel').classList.remove('tense');
    const theirs = document.querySelector('.duel-card.theirs');
    if (theirs) theirs.classList.add('open');
    const winCard = document.querySelector(won ? '.duel-card.mine' : '.duel-card.theirs');
    if (winCard) winCard.classList.add('win');
    const lose = document.querySelector(won ? '.duel-card.theirs' : '.duel-card.mine');
    if (lose) lose.classList.add('lose');
    const goal = ev.outcome === 'goal';
    const text = goal ? (iAttack ? '¡GOOOL!' : 'GOL EN CONTRA') : won ? '¡GANASTE EL DUELO!' : 'PERDISTE EL DUELO';
    const stamp = $('#stamp');
    if (stamp) { stamp.textContent = text; stamp.className = 'stamp show ' + (won ? 'good' : 'bad'); }
    $('#panel-title').textContent = won ? (iAttack ? 'El rival no lo vio venir.' : '¡Le leíste la jugada!') : (iAttack ? 'El rival te leyó la jugada.' : 'No adivinaste.');
    const r = $('#panel-role'); r.textContent = won ? 'GANASTE' : 'PERDISTE'; r.className = 'role ' + (won ? 'good' : 'bad');
    audio.sound(won ? 'win-duel' : 'lose-duel');
  }

  paintHud(state) {
    const teams = state.teams.map(teamById);
    // El jugador siempre ve su equipo a la izquierda del marcador.
    const order = this.mySide === 0 ? [0, 1] : [1, 0];
    order.forEach((side, k) => {
      $(`#hud-n${k}`).textContent = teams[side].short;
      $(`#hud-sw${k}`).style.background = swatchCss(this.kits[side]);
      $(`#hud-s${k}`).textContent = state.score[side];
    });
    $('#hud-min').textContent = (state.half === 1 ? '1T ' : '2T ') + fmtMinute(Math.max(state.minute, state.half === 2 ? 45 : 0), state.half);
  }

  feed(text) {
    const f = $('#feed');
    f.textContent = text;
    f.classList.remove('flash'); void f.offsetWidth; f.classList.add('flash');
  }

  clearCards(waitText) {
    $('#cards').innerHTML = waitText ? `<div class="wait"><span class="ball-spin"></span>${waitText}</div>` : '';
    $('#cards').classList.remove('locked', 'reveal');
    $('#panel').classList.remove('tense');
    if (!waitText) $('#panel-title').textContent = 'El partido está en juego…';
    $('#panel-role').textContent = '';
    $('#timer-bar').style.width = '0';
  }

  startTimer(onExpire) {
    this.stopTimer();
    const t0 = performance.now();
    const bar = $('#timer-bar');
    let lastTick = TURN_SECONDS;
    const tick = () => {
      const left = TURN_SECONDS - (performance.now() - t0) / 1000;
      bar.style.width = `${Math.max(0, (left / TURN_SECONDS) * 100)}%`;
      bar.classList.toggle('low', left < 4);
      if (left < 4 && Math.ceil(left) < lastTick) { lastTick = Math.ceil(left); audio.sound('tick'); }
      if (left <= 0) { this.stopTimer(); onExpire(); return; }
      this.timer = requestAnimationFrame(tick);
    };
    this.timer = requestAnimationFrame(tick);
  }
  stopTimer() { if (this.timer) cancelAnimationFrame(this.timer); this.timer = null; }

  renderCards(title, roleTxt, roleCls, options, onPick) {
    $('#panel-title').textContent = title;
    const r = $('#panel-role'); r.textContent = roleTxt; r.className = 'role ' + roleCls;
    const box = $('#cards');
    box.innerHTML = ''; box.classList.remove('locked', 'reveal');
    let picked = false;
    const pick = (o, el) => {
      if (picked) return;
      picked = true;
      this.stopTimer();
      audio.unlock(); audio.sound('card');
      box.classList.add('locked');
      el && el.classList.add('chosen');
      $('#panel-title').textContent = 'Esperando al rival…';
      onPick(o.id);
    };
    const els = options.map((o) => {
      const b = document.createElement('button');
      b.className = 'card ' + roleCls;
      b.innerHTML = cardHtml(o, roleCls, roleCls === 'att' ? 'ATAQUE' : roleCls === 'def' ? 'DEFENSA' : 'SORTEO');
      b.onclick = () => pick(o, b);
      box.appendChild(b);
      return b;
    });
    this.startTimer(() => {
      const k = Math.floor(Math.random() * options.length);
      pick(options[k], els[k]);
    });
  }

  promptToss(state) {
    if (state.callerSide !== this.mySide) {
      this.clearCards('El rival elige cara o sello…');
      $('#panel-title').textContent = 'Sorteo inicial';
      return;
    }
    this.renderCards('Sorteo: ¿cara o sello?', 'MONEDA', 'coin', [
      { id: 'cara', label: 'Cara', img: icon('cara') },
      { id: 'sello', label: 'Sello', img: icon('sello') },
    ], (call) => this.send({ t: 'call', call }));
  }

  prompt(state) {
    if (state.phase !== 'play') return;
    const att = state.poss === this.mySide;
    const role = att ? 'att' : 'def';
    const sit = state.situation;
    const def = optionsFor(sit);
    let opts = def[role].map((o) => ({ ...o }));
    let title = att ? def.attTitle : def.defTitle;
    if (att && (sit === 'shot' || sit === 'penalty')) title = SHOT_TITLES[state.shotKind] || title;
    if (!att && sit === 'penalty') title = '¡Penal en contra! ¿Hacia dónde se tira tu arquero?';
    if (!att && opts[0].lane) {
      // El rival viene de frente: su izquierda es tu derecha. Ordenamos por pantalla.
      const screen = { L: 'derecha', C: 'centro', R: 'izquierda' };
      opts = ['R', 'C', 'L'].map((id) => {
        const o = opts.find((x) => x.id === id);
        let label;
        if (sit === 'build') label = id === 'C' ? 'Cerrar el centro' : `Cerrar ${screen[id]}`;
        else label = id === 'C' ? 'Quedarse al medio' : `Volar a la ${screen[id]}`;
        return { ...o, label };
      });
    }
    opts = opts.map((o) => ({ ...o, img: iconFor(sit, role, o.id, att ? o.id : MIRROR[o.id]) }));
    const seq = state.seq;
    this.renderCards(title, att ? 'ATACAS' : 'DEFIENDES', role, opts, (choice) => this.send({ t: 'choice', seq, choice }));
  }

  showEnd(state) {
    this.stopTimer();
    this.clearCards('Partido terminado');
    const teams = state.teams.map(teamById);
    const [a, b] = state.score;
    const me = this.mySide;
    const res = a === b ? 'Empate' : (state.score[me] > state.score[1 - me] ? '¡Ganaste!' : 'Perdiste');
    if (res === '¡Ganaste!') audio.sound('win');
    const st = state.stats;
    const row = (label, k) => `<tr><td>${st[k][0]}</td><td>${label}</td><td>${st[k][1]}</td></tr>`;
    const html = `<h2>${res}</h2>
      <div class="final-score"><div>${teams[0].short}<small>${teams[0].name}</small></div><div>${a} - ${b}</div><div>${teams[1].short}<small>${teams[1].name}</small></div></div>
      <table class="stats">${row('Remates', 'shots')}${row('Al arco', 'onTarget')}${row('Córners', 'corners')}${row('Recuperaciones', 'steals')}</table>`;
    const btns = [];
    if (this.onRematch) btns.push(['Revancha', 'primary', () => { this.onRematch(); }]);
    btns.push(['Volver al menú', 'ghost', () => { leaveMatch(); }]);
    modal(html, btns);
  }

  destroy() { this.stopTimer(); this.queue = []; }
}

// ---------- capa de UI para el motor ----------
const ui = {
  sound: (n) => audio.sound(n),
  reveal(ev) { if (view) view.duelReveal(ev); },
  cinema(on) { document.querySelector('.pitch-wrap').classList.toggle('cinema', on); if (on) audio.sound('heart'); },
  banner(text, opts = {}) {
    const el = $('#banner');
    el.className = 'banner' + (opts.small ? ' small' : '') + (opts.goal ? ' goal' : '');
    el.textContent = text;
    if (opts.goal) { el.style.color = opts.color; el.style.setProperty('--c2', opts.alt); } else { el.style.color = ''; }
    requestAnimationFrame(() => el.classList.add('show'));
    const hold = opts.hold || (opts.goal ? 2600 : opts.small ? 1100 : 1500);
    clearTimeout(this._bt);
    this._bt = setTimeout(() => el.classList.remove('show'), hold);
    return wait(Math.min(hold, 1300));
  },
  async dice(value, reason, faces) {
    const wrap = $('#dice'), die = $('#die'), legend = $('#dice-legend');
    // Leyenda: qué puede salir y cuántas caras tiene cada cosa.
    const kinds = [...new Set(faces)];
    legend.innerHTML = kinds.map((k) => {
      const n = faces.filter((f) => f === k).length;
      return `<span class="chip" data-k="${k}"><img src="${icon('face', k)}" alt=""><b>${DIE_LABELS[k]}</b><i>${'●'.repeat(n)}${'○'.repeat(6 - n)}</i></span>`;
    }).join('');
    const face = (k) => {
      die.innerHTML = `<img src="${icon('face', k)}" alt="${DIE_LABELS[k]}">`;
      legend.querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', c.dataset.k === k));
    };
    $('#dice-text').textContent = 'Tirando el dado…';
    wrap.classList.add('show'); die.classList.add('rolling');
    audio.sound('dice');
    for (let i = 0; i < 10; i++) { face(faces[Math.floor(Math.random() * 6)]); await wait(85); }
    const k = faces[value - 1];
    face(k); die.classList.remove('rolling');
    legend.querySelector(`.chip[data-k="${k}"]`)?.classList.add('hit');
    $('#dice-text').textContent = reason;
    await wait(1600);
    wrap.classList.remove('show');
  },
  async coin(result, text) {
    const wrap = $('#coin'), c = $('#coin-face');
    $('#coin-text').textContent = 'La moneda está en el aire…';
    c.textContent = '';
    wrap.classList.add('show'); c.classList.add('flip');
    audio.sound('coin');
    await wait(1500);
    c.classList.remove('flip');
    c.textContent = result.toUpperCase();
    $('#coin-text').textContent = `Salió ${result}. ${text}`;
    await wait(1800);
    wrap.classList.remove('show');
  },
  fadeOut() { $('#fade').classList.add('on'); return wait(260); },
  fadeIn() { $('#fade').classList.remove('on'); return wait(260); },
};

// ---------- sesiones ----------
let renderer = null;
let view = null;
let session = null; // { cleanup }

function leaveMatch() {
  if (view) view.destroy();
  view = null;
  if (session) { try { session.cleanup(); } catch { /* ya cerrada */ } }
  session = null;
  closeModal();
  history.replaceState(null, '', location.pathname);
  show('screen-menu');
}

function pickCpuOpponent() {
  const pool = TEAMS.filter((t) => t.id !== myTeamId);
  return pool[Math.floor(Math.random() * pool.length)].id;
}

function startCpu(level = 'normal', awayId = pickCpuOpponent()) {
  audio.unlock();
  let host, cpu;
  const deliver = (m) => setTimeout(() => { view && view.onMessage(m); cpu.onMessage(m); }, 0);
  host = new Host({ home: myTeamId, away: awayId, callerSide: 0, broadcast: deliver, length: myLength });
  cpu = new Cpu(1, (m) => host.receive(1, m), level);
  view = new MatchView({ mySide: 0, isHost: true, send: (m) => host.receive(0, m), onRematch: () => { leaveMatch(); startCpu(level, awayId); } });
  session = { cleanup: () => { host.broadcast = () => {}; } };
  $('#feed').textContent = `Contra la IA (${LEVELS[level].label}). ¡Bienvenidos al estadio!`;
  host.start();
}

function startHostGame(conn, guestTeam) {
  let host, n = 0, lastMsg = null;
  const deliver = (m) => {
    lastMsg = { ...m, n: ++n };
    conn.send(lastMsg);
    setTimeout(() => view && view.onMessage(m), 0);
  };
  const begin = () => {
    host = new Host({ home: myTeamId, away: guestTeam, callerSide: 1, broadcast: deliver, length: myLength });
    host.start();
  };
  const rematch = () => {
    closeModal();
    view.destroy();
    view = makeView();
    begin();
    return false;
  };
  const makeView = () => new MatchView({ mySide: 0, isHost: true, send: (m) => host.receive(0, m), onRematch: rematch });
  view = makeView();
  conn.on('message', (m) => {
    if (m.t === 'choice' || m.t === 'call') host.receive(1, m);
    // El rival volvió de una desconexión corta: le reenviamos el último estado.
    if (m.t === 'sync' && lastMsg && lastMsg.n > (m.n || 0)) conn.send(lastMsg);
    if (m.t === 'reconnected' && lastMsg) conn.send(lastMsg);
  });
  begin();
}

function onDisconnect() {
  if (!view) return;
  view.destroy();
  modal('<h2>Conexión perdida</h2><p>Se cortó la conexión con tu rival. Pueden crear una sala nueva.</p>', [['Volver al menú', 'primary', () => leaveMatch()]]);
}

function createOnline() {
  audio.unlock();
  show('screen-lobby');
  $('#room-code').textContent = '·····';
  $('#lobby-msg').textContent = '';
  let conn = null;
  const room = createRoom({
    onReady: (code, broker) => {
      $('#room-code').textContent = code;
      const url = `${location.origin}${location.pathname}?sala=${code}&b=${broker}`;
      $('#btn-share').onclick = async () => {
        const text = `¡Te desafío a un partido de Calcciopoli! Entra con el código ${code}`;
        try {
          if (navigator.share) await navigator.share({ title: 'Calcciopoli', text, url });
          else { await navigator.clipboard.writeText(`${text}: ${url}`); $('#lobby-msg').textContent = 'Enlace copiado.'; }
        } catch { /* cancelado */ }
      };
    },
    onGuest: (c, hello) => {
      conn = c;
      c.on('close', onDisconnect);
      if (!view) startHostGame(c, teamById(hello.team).id);
    },
    onError: (e) => { $('#lobby-msg').textContent = errorText(e); },
  });
  session = { cleanup: () => { if (conn) conn.close(); room.destroy(); } };
  $('#btn-cancel').onclick = () => leaveMatch();
}

function errorText(e) {
  if (!e) return 'Error de conexión.';
  if (e.type === 'peer-unavailable') return 'No hay una sala abierta con ese código (o ya empezó).';
  if (e.type === 'full') return 'La sala ya está llena.';
  if (e.type === 'timeout') return 'No se pudo conectar. Revisa el código o tu conexión.';
  if (e.type === 'network' || e.type === 'server-error' || e.type === 'socket-error') return 'Sin conexión con el servidor de salas. Intenta de nuevo.';
  if (e.type === 'browser-incompatible') return 'Tu navegador no permite partidas en línea.';
  return 'Error de conexión: ' + (e.type || e.message || '');
}

function joinOnline(code) {
  code = (code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (code.length !== 5) { $('#menu-msg').textContent = 'El código tiene 5 letras.'; return; }
  audio.unlock();
  $('#menu-msg').textContent = 'Conectando…';
  $('#btn-join').disabled = true;
  let conn = null;
  let lastN = 0;
  const hint = Number(new URLSearchParams(location.search).get('b')) || 0;
  const j = joinRoom(code, {
    team: myTeamId,
    brokerHint: hint,
    onOpen: (c) => {
      conn = c;
      $('#menu-msg').textContent = '';
      $('#btn-join').disabled = false;
      c.on('close', onDisconnect);
      c.on('message', (m) => {
        if (m.t === 'reconnected') { c.send({ t: 'sync', n: lastN }); return; }
        if (m.t !== 'state') return;
        if (m.n && m.n <= lastN) return; // repetido
        if (m.n) lastN = m.n;
        if (m.ev && m.ev.type === 'start') {
          if (view) view.destroy();
          closeModal();
          view = new MatchView({ mySide: 1, isHost: false, send: (x) => c.send(x), onRematch: null });
        }
        view && view.onMessage(m);
      });
    },
    onError: (e) => {
      $('#btn-join').disabled = false;
      $('#menu-msg').textContent = errorText(e);
      j.destroy();
    },
  });
  session = { cleanup: () => { if (conn) conn.close(); j.destroy(); } };
}

// ---------- arranque ----------
paintMyTeam();
buildTeamGrid();
$('#btn-team').onclick = () => { buildTeamGrid(); show('screen-teams'); };
document.querySelectorAll('[data-back]').forEach((b) => (b.onclick = () => show('screen-menu')));
$('#btn-cpu').onclick = () => modal(`<h2>Contra la IA</h2>
  <p><b>Fácil:</b> tiene mañas y repite jugadas; si lo lees, le ganas.</p>
  <p><b>Normal:</b> juega suelto y de vez en cuando se anticipa.</p>
  <p><b>Difícil:</b> estudia tus patrones y te los castiga. No repitas jugadas.</p>`,
  [...Object.entries(LEVELS).map(([id, l]) => [l.label, id === 'normal' ? 'primary' : '', () => startCpu(id)]), ['Volver', 'ghost', () => {}]]);
const paintLength = () => document.querySelectorAll('#len-row [data-len]').forEach((b) => b.classList.toggle('on', b.dataset.len === myLength));
document.querySelectorAll('#len-row [data-len]').forEach((b) => (b.onclick = () => {
  myLength = b.dataset.len;
  try { localStorage.setItem('fdm-len', myLength); } catch { /* sin storage */ }
  paintLength();
}));
paintLength();
$('#btn-create').onclick = () => createOnline();
$('#btn-join').onclick = () => joinOnline($('#join-code').value);
$('#join-code').addEventListener('keydown', (e) => { if (e.key === 'Enter') joinOnline(e.target.value); });
$('#btn-help').onclick = () => modal(HELP, [['Entendido', 'primary', () => {}]]);
const muteBtn = $('#btn-mute');
const paintMute = () => muteBtn.classList.toggle('off', audio.isMuted());
paintMute();
muteBtn.onclick = () => { audio.unlock(); audio.setMuted(!audio.isMuted()); paintMute(); };

const params = new URLSearchParams(location.search);
if (params.get('sala')) {
  $('#join-code').value = params.get('sala').toUpperCase();
  $('#menu-msg').textContent = 'Elige tu equipo y toca «Unirse».';
}
if (LENGTHS[params.get('largo')]) { myLength = params.get('largo'); paintLength(); }
if (params.get('demo') === 'cpu') startCpu(params.get('nivel') || 'normal');

// Para pruebas automáticas.
window.__fdm = { get view() { return view; }, get renderer() { return renderer; }, randomChoice, icon };
