import { TEAMS, teamById, matchKits } from './teams.js';
import { optionsFor, SHOT_TITLES, TURN_SECONDS, fmtMinute, commentary, diceReason, diceFaces, DIE_LABELS, LENGTHS, randomChoice } from './game.js';
import { Host, Cpu, LEVELS } from './host.js';
import { createRoom, joinRoom } from './net.js';
import { LeagueHost } from './league.js';
import { LEAGUES } from './leagues/index.js';
import { newCareer, myFixture, playRound, seasonOver, totalRounds, table, topScorers, nextSeason, resultFrom } from './career.js';
import { newCup, myMatch, teamsLeft, champion, finishRound, resultOf, levelFor, ROUND_NAMES } from './cup.js';
import { Renderer } from './render.js';
import { CARDS, activeEffects } from './situations.js';
import * as audio from './audio.js';
import { icon, iconFor } from './icons.js';
import { playerName } from './squads.js';

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
    b.className = 'team-btn' + (t.id === myTeamId ? ' sel' : '') + (Math.max(...t.name.split(' ').map((w) => w.length)) > 10 ? ' long' : '');
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
<li>Si le ganas al arquero, la imagen se congela con la pelota en el aire y el dado decide: 4 caras de gol, 1 de palo y 1 afuera. Igual para cualquier remate.</li>
<li>Una gambeta exitosa puede terminar en <b>penal</b>.</li>
</ul>
<h3>Situaciones de juego</h3>
<p>Dos mazos de cartas traen lo impredecible de un partido real. Las cartas nunca tocan el duelo de adivinar: solo cambian caras del dado, y los dos ven la carta y el dado cambiado.</p>
<ul>
<li><b>Mazo de partido</b> (40 cartas, 14 situaciones): sale cuatro veces por partido, dos por tiempo. Por ejemplo, Genialidad del crack, Lesión, Lluvia, Arquero inspirado, Decisión polémica o Golazo de chilena. A quién le toca depende de la jugada: quién tiene la pelota, quién va perdiendo o los dos.</li>
<li><b>Mazo de disciplina</b> (20 cartas): sale con cada falta. Amarilla (la segunda es roja), tiro libre directo o roja (con uno menos, al defender una cara «recupera» pasa a falta o córner).</li>
</ul>
<h3>Duración</h3>
<p>En el menú eliges partido <b>corto</b> (unos 3 a 5 minutos), <b>normal</b> (5 a 8) o <b>largo</b> (10 a 14). En una sala manda la duración de quien la crea.</p>
<h3>Empate y penales</h3>
<p>Si el partido termina empatado, se define por penales: cinco por lado y, si siguen iguales, muerte súbita. Cada penal es un duelo de remate contra arquero, con el mismo dado si el arquero no adivina.</p>
<h3>Estadio</h3>
<p>Juegas de local en una versión pixelada del estadio de tu equipo. Al final ves los goleadores, la figura del partido y las estadísticas.</p>
<h3>Torneo</h3>
<p>Eliminación directa de 8 o 16 equipos contra la IA, entre clubes o entre selecciones según tu equipo. Los empates se definen por penales y la IA se pone más difícil en cada ronda. El torneo queda guardado en tu celular para seguirlo después.</p>
<h3>Modo carrera</h3>
<p>Elige una liga real y un equipo, y juega la temporada completa contra la IA: solo ida o ida y vuelta, con tabla, goleadores y temporadas siguientes. Puedes simular tus partidos si quieres avanzar rápido. Cada liga guarda su propia carrera en tu celular.</p>
<h3>Liga</h3>
<p>Crea una liga y comparte el código: entran hasta 4 jugadores y se enfrentan todos contra todos (con 2, ida y vuelta). Con 4 los dos partidos de cada fecha se juegan al mismo tiempo; con 3, el que descansa mira el otro partido en vivo. Gana 3 puntos, empata 1 (en la liga no hay penales). Por defecto los partidos son cortos.</p>
<h3>Salas</h3>
<p>Crea una sala, comparte el código o el enlace, y tu rival entra desde su celular. Tienes ${TURN_SECONDS} segundos para cada carta: si se acaba el tiempo, se elige sola.</p>`;

// Describe una elección desde la pantalla de quien mira (su equipo ataca hacia arriba).
function describe(sit, role, id, iAttack) {
  const mirror = { L: 'R', C: 'C', R: 'L' };
  const side = (lane) => ({ L: 'izquierda', C: 'centro', R: 'derecha' })[iAttack ? lane : mirror[lane]];
  if (sit === 'build') return role === 'att' ? (id === 'C' ? 'Salida por el centro' : `Salida por la ${side(id)}`) : (id === 'C' ? 'Cierra el centro' : `Cierra la ${side(id)}`);
  if (sit === 'shot' || sit === 'penalty' || sit === 'shootout') {
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
  shootout: ['¿Será gol?', '¿Ataja tu arquero?'],
  corner: ['¿Ganas por arriba?', '¿Despejas el córner?'],
};

// ---------- vista del partido ----------
class MatchView {
  // spectator: sólo mira (la liga, cuando no te toca jugar). endButtons: botones
  // propios para el cuadro final.
  constructor({ mySide, send, isHost, onRematch, spectator = false, endButtons = null }) {
    this.mySide = mySide;
    this.spectator = spectator;
    this.endButtons = endButtons;
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
    this.clearCards(spectator ? 'Mirando el partido…' : 'Preparando la cancha…');
    document.body.classList.toggle('watching', spectator);
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
      try {
        // Entrar a mirar un partido ya empezado: se arma la cancha con el estado actual.
        if (!this.kits && m.ev.type !== 'start') this.joinLive(m.state);
        else await this.handle(m.state, m.ev);
      } catch (e) { console.error(e); }
    }
    this.busy = false;
  }

  names() { return this.state.teams.map((id) => teamById(id).name); }

  joinLive(state) {
    this.state = state;
    const teams = state.teams.map(teamById);
    this.kits = matchKits(teams[0], teams[1]);
    renderer.setup(teams, this.kits, this.mySide);
    renderer.kickoffNow(state.poss);
    this.paintHud(state);
    this.paintPens(state);
    this.paintFx(state);
    this.feed(`En vivo: ${teams[0].name} vs ${teams[1].name}.`);
    if (this.spectator) this.watchingPanel(state.phase === 'toss' ? 'Sorteo inicial…' : 'Los dos eligen su carta…');
    if (state.phase === 'end') this.showEnd(state);
  }

  async handle(state, ev) {
    this.state = state;
    if (ev.type === 'start') {
      const teams = state.teams.map(teamById);
      this.kits = matchKits(teams[0], teams[1]);
      renderer.setup(teams, this.kits, this.mySide);
      renderer.kickoffNow(0);
      this.paintHud(state);
      this.paintPens(state);
      this.paintFx(state);
      this.lastSeq = -1;
      const st = renderer.stadium;
      const len = state.length && state.length !== 'normal' ? ` Partido ${LENGTHS[state.length].label.toLowerCase()}.` : '';
      this.feed(`¡Bienvenidos! Se juega en ${st.name}${st.city ? `, ${st.city}` : ''}.${len}`);
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
      if (this.dead) return;
      this.feed(this.shotText(ev) || commentary(ev, this.names()));
      this.paintHud(state);
      this.paintFx(state);
      this.paintPens(state);
      if (ev.shootoutEnd) {
        audio.sound('whistle3');
        await ui.banner(`${this.names()[state.winner].toUpperCase()} GANA`, { hold: 2200 });
        return this.showEnd(state);
      }
      if (ev.halfEnd) {
        audio.sound('whistle3');
        await ui.banner(ev.halfEnd === 1 ? 'ENTRETIEMPO' : 'FINAL', { hold: 1800 });
        if (ev.shootoutStart) {
          await ui.banner('¡PENALES!', { hold: 1800 });
          this.feed(`Empate: se define por penales. Patea primero ${this.names()[state.poss]}.`);
          this.paintPens(state);
          return this.prompt(state);
        }
        if (ev.halfEnd === 2) return this.showEnd(state);
        this.feed(`Arranca el segundo tiempo. Saca ${this.names()[state.poss]}.`);
        await renderer.kickoff(ev.kickoffAfter);
        audio.sound('whistle');
      } else if (ev.outcome === 'goal' && ev.kickoffAfter != null) {
        await renderer.kickoff(ev.kickoffAfter);
        audio.sound('whistle');
      }
      if (ev.card) await this.situationCard(ev.card, state);
      if (this.dead) return;
      if (ev.card && ev.card.id === 'freekick') await renderer.cardMove(state.poss, state.situation);
      this.paintFx(state);
      return this.prompt(state);
    }
  }

  // Carta de situación de juego: aparece grande sobre la cancha unos segundos.
  async situationCard(card, state) {
    const info = CARDS[card.id];
    const teams = state.teams.map(teamById);
    const both = card.side < 0;
    const t = teams[both ? 0 : card.side];
    let who;
    if (both) who = 'Para los dos equipos';
    else if (card.deck === 'disciplina' && card.id !== 'freekick') who = `${playerName(t.id, card.player)} (${t.short})`;
    else who = this.spectator ? t.name : card.side === this.mySide ? `${t.name} (tú)` : `${t.name} (rival)`;
    // Para quién es buena noticia: las tarjetas son malas para quien las recibe,
    // y lluvia, lesión y error del DT son malas para el equipo al que le tocan.
    const bad = card.deck === 'disciplina' ? card.id !== 'freekick' : ['lesion', 'errordt'].includes(card.id);
    const good = bad ? card.side !== this.mySide : card.side === this.mySide;
    const title = card.second ? 'Segunda amarilla: ¡roja!' : info.title;
    const el = $('#sitcard');
    el.className = `sitcard ${card.deck} k-${card.id}${this.spectator || both ? '' : good ? ' good' : ' bad'}`;
    el.innerHTML = `<div class="sc-box"><small>${card.deck === 'partido' ? 'SITUACIÓN DE JUEGO' : 'DISCIPLINA'}</small><div class="sc-art"><i></i></div><b>${title}</b><em>${who}</em><p>${info.text}</p></div>`;
    audio.sound(card.id === 'red' || card.id === 'yellow' ? 'whistle' : 'card');
    requestAnimationFrame(() => el.classList.add('show'));
    this.feed(both ? `${title}: afecta a los dos equipos.` : `${title}: ${bad ? 'en contra de' : 'a favor de'} ${card.deck === 'disciplina' && card.id !== 'freekick' ? who : t.name}.`);
    await wait(2900);
    el.classList.remove('show');
    await wait(250);
  }

  // Efectos que siguen activos (cartas por usar y expulsados), sobre la cancha.
  paintFx(state) {
    const el = $('#fxbar');
    if (!el) return;
    const shorts = state.teams.map((id) => teamById(id).short);
    const chips = activeEffects(state).map((f) => `<span class="fx-chip k-${f.id}"><b>${shorts[f.side]}</b>${f.title}</span>`);
    const reds = state.sit ? state.sit.reds : [0, 0];
    [0, 1].forEach((side) => { for (let k = 0; k < reds[side]; k++) chips.push(`<span class="fx-chip k-red"><i></i><b>${shorts[side]}</b>con uno menos</span>`); });
    el.innerHTML = chips.join('');
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
    const shorts = this.state.teams.map((id) => teamById(id).short);
    const tagMe = this.spectator ? shorts[this.mySide] : 'TÚ', tagThem = this.spectator ? shorts[1 - this.mySide] : 'RIVAL';
    $('#cards').innerHTML = `
      <div class="duel-card mine ${myRole}"><div class="card ${myRole}">${cardHtml(me, myRole, tagMe)}</div></div>
      <div class="vs">VS</div>
      <div class="duel-card theirs ${theirRole}"><div class="flip"><div class="face back"><img src="${icon('back')}" alt=""><span>${tagThem}</span></div><div class="face front card ${theirRole}">${cardHtml(them, theirRole, tagThem)}</div></div></div>
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
    if (this.spectator) {
      const winSide = ev.match ? 1 - ev.poss : ev.poss;
      $('#panel-title').textContent = ev.outcome === 'goal' ? `¡Gol de ${this.names()[ev.poss]}!` : `${this.names()[winSide]} gana el duelo.`;
      const r = $('#panel-role'); r.textContent = 'EN VIVO'; r.className = 'role live';
      return;
    }
    const goal = ev.outcome === 'goal';
    const text = goal ? (iAttack ? '¡GOOOL!' : 'GOL EN CONTRA') : won ? '¡GANASTE EL DUELO!' : 'PERDISTE EL DUELO';
    const stamp = $('#stamp');
    if (stamp) { stamp.textContent = text; stamp.className = 'stamp show ' + (won ? 'good' : 'bad'); }
    $('#panel-title').textContent = won ? (iAttack ? 'El rival no lo vio venir.' : '¡Le leíste la jugada!') : (iAttack ? 'El rival te leyó la jugada.' : 'No adivinaste.');
    const r = $('#panel-role'); r.textContent = won ? 'GANASTE' : 'PERDISTE'; r.className = 'role ' + (won ? 'good' : 'bad');
    audio.sound(won ? 'win-duel' : 'lose-duel');
  }

  // Relato de remates con los nombres de quien patea y quien ataja.
  shotText(ev) {
    if (ev.situation !== 'shot' && ev.situation !== 'penalty' && ev.situation !== 'shootout') return '';
    const sh = renderer.lastShooter, kp = renderer.lastKeeper;
    if (!sh || !kp) return '';
    const A = this.names()[ev.poss];
    if (ev.situation === 'shootout') {
      if (ev.outcome === 'goal') return `${sh.name} no perdona: gol de ${A}.`;
      if (ev.outcome === 'save') return `¡${kp.name} le ataja el penal a ${sh.name}!`;
      return ev.outcome === 'post' ? `¡${sh.name} la estrella en el palo!` : `¡${sh.name} la tira afuera!`;
    }
    if (ev.outcome === 'goal') return `¡GOOOL de ${A}! Anota ${sh.name}.`;
    if (ev.outcome === 'post') return `¡${sh.name} la pega en el palo!`;
    if (ev.outcome === 'wide') return `Remata ${sh.name}... ¡afuera por poco!`;
    if (ev.outcome === 'save_corner') return `¡Atajadón de ${kp.name}! Al córner.`;
    if (ev.outcome === 'save_counter') return `¡Ataja ${kp.name} y sale rápido de contra!`;
    return `¡Ataja ${kp.name}! Le adivinó el remate a ${sh.name}.`;
  }

  // Marcador de la tanda: un casillero por penal, en el orden de pantalla.
  paintPens(state) {
    const el = $('#pens');
    if (!state.pens) { el.classList.remove('on'); return; }
    const teams = state.teams.map(teamById);
    const order = this.mySide === 0 ? [0, 1] : [1, 0];
    const row = (side) => {
      const log = state.pens.log[side];
      const n = Math.max(5, log.length, state.pens.log[1 - side].length);
      const cells = Array.from({ length: n }, (_, k) => (k < log.length ? (log[k] ? '<i class="g"></i>' : '<i class="x"></i>') : '<i></i>')).join('');
      return `<div><b>${teams[side].short}</b>${cells}<em>${state.pens.goals[side]}</em></div>`;
    };
    el.innerHTML = order.map(row).join('');
    el.classList.add('on');
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
    $('#hud-min').textContent = state.pens ? 'PENALES' : (state.half === 1 ? '1T ' : '2T ') + fmtMinute(Math.max(state.minute, state.half === 2 ? 45 : 0), state.half);
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
    const r = $('#panel-role');
    if (this.spectator) { r.textContent = 'EN VIVO'; r.className = 'role live'; } else { r.textContent = ''; r.className = 'role'; }
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
    if (this.spectator) { this.watchingPanel('Sorteo inicial…'); return; }
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
    if (this.dead || state.phase !== 'play') return;
    if (this.spectator) { this.watchingPanel('Los dos eligen su carta…'); return; }
    const att = state.poss === this.mySide;
    const role = att ? 'att' : 'def';
    const sit = state.situation;
    const def = optionsFor(sit);
    let opts = def[role].map((o) => ({ ...o }));
    let title = att ? def.attTitle : def.defTitle;
    if (att && (sit === 'shot' || sit === 'penalty')) title = SHOT_TITLES[state.shotKind] || title;
    if (!att && sit === 'penalty') title = '¡Penal en contra! ¿Hacia dónde se tira tu arquero?';
    if (sit === 'shootout') {
      const n = state.pens.kicks[state.poss] + 1;
      title = att ? `Penal ${n} de la tanda: ¿a dónde pateas?` : `Penal ${n} del rival: ¿hacia dónde te tiras?`;
    }
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

  // Panel de quien mira: no hay cartas que elegir.
  watchingPanel(text) {
    this.clearCards(text);
    const t = this.state.teams.map((id) => teamById(id).short);
    $('#panel-title').textContent = `Mirando ${t[0]} vs ${t[1]}`;
  }

  showEnd(state) {
    if (this.dead) return;
    this.stopTimer();
    this.clearCards('Partido terminado');
    const teams = state.teams.map(teamById);
    const [a, b] = state.score;
    const me = this.mySide;
    const winner = state.pens ? state.winner : a === b ? -1 : a > b ? 0 : 1;
    const res = this.spectator ? (winner === -1 ? 'Final: empate' : `Gana ${teams[winner].name}`) : winner === -1 ? 'Empate' : winner === me ? '¡Ganaste!' : 'Perdiste';
    if (res === '¡Ganaste!') audio.sound('win');
    const st = state.stats;
    const row = (label, k) => `<tr><td>${st[k][0]}</td><td>${label}</td><td>${st[k][1]}</td></tr>`;
    const pens = state.pens ? `<p class="pens-line">Penales: ${state.pens.goals[0]} - ${state.pens.goals[1]}</p>` : '';
    // Goles con autor y minuto, por equipo.
    const name = (side, i) => playerName(teams[side].id, i);
    const goalList = (side) => (state.goals || []).filter((g) => g.side === side)
      .map((g) => `<li>${fmtMinute(g.minute, g.half)} ${name(side, g.i)}${g.kind === 'penal' ? ' (p)' : ''}${g.assist != null ? `<small>asist. ${name(side, g.assist)}</small>` : ''}</li>`).join('') || '<li class="none">—</li>';
    // Figura del partido: la mejor nota.
    const ratings = [];
    if (state.players) {
      for (let side = 0; side < 2; side++) {
        state.players[side].forEach((p, i) => {
          const conceded = state.score[1 - side];
          let r = 6 + p.g * 1.4 + p.a * 0.8 + p.st * 0.35 + p.ot * 0.25 + p.sh * 0.05 + p.ps * 0.6;
          if (i === 0) r += p.sv * 0.6 - conceded * 0.35;
          if (winner === side) r += 0.3;
          ratings.push({ side, i, p, r: Math.max(3, Math.min(10, r)) });
        });
      }
      ratings.sort((x, y) => y.r - x.r);
    }
    const mvp = ratings[0];
    const mvpLine = (m) => {
      const bits = [];
      if (m.p.g) bits.push(`${m.p.g} ${m.p.g === 1 ? 'gol' : 'goles'}`);
      if (m.p.a) bits.push(`${m.p.a} ${m.p.a === 1 ? 'asistencia' : 'asistencias'}`);
      if (m.i === 0 && m.p.sv) bits.push(`${m.p.sv} ${m.p.sv === 1 ? 'atajada' : 'atajadas'}`);
      if (m.p.ps) bits.push(`${m.p.ps} ${m.p.ps === 1 ? 'penal atajado' : 'penales atajados'}`);
      if (m.p.st) bits.push(`${m.p.st} ${m.p.st === 1 ? 'recuperación' : 'recuperaciones'}`);
      return bits.join(' · ') || 'partidazo';
    };
    const kit = (side) => this.kits ? swatchCss(this.kits[side]) : '#888';
    const mvpHtml = mvp ? `<div class="mvp"><span class="kit-swatch" style="background:${kit(mvp.side)}"></span><div><small>FIGURA DEL PARTIDO</small><b>${name(mvp.side, mvp.i)}</b><em>${teams[mvp.side].short} · ${mvpLine(mvp)}</em></div><strong>${mvp.r.toFixed(1)}</strong></div>` : '';
    const best = (key, label) => {
      const top = ratings.filter((x) => x.p[key] > 0).sort((x, y) => y.p[key] - x.p[key])[0];
      return top ? `<li><span>${label}</span><b>${name(top.side, top.i)} (${teams[top.side].short})</b><i>${top.p[key]}</i></li>` : '';
    };
    const html = `<h2>${res}</h2>
      <div class="final-score"><div>${teams[0].short}<small>${teams[0].name}</small></div><div>${a} - ${b}</div><div>${teams[1].short}<small>${teams[1].name}</small></div></div>
      ${pens}
      <div class="scorers"><ul>${goalList(0)}</ul><ul>${goalList(1)}</ul></div>
      ${mvpHtml}
      <ul class="leaders">${best('st', 'Más recuperaciones')}${best('sv', 'Más atajadas')}${best('sh', 'Más remates')}</ul>
      <table class="stats">${row('Remates', 'shots')}${row('Al arco', 'onTarget')}${row('Córners', 'corners')}${row('Recuperaciones', 'steals')}${st.yellows && st.yellows[0] + st.yellows[1] ? row('Amarillas', 'yellows') : ''}${st.reds && st.reds[0] + st.reds[1] ? row('Rojas', 'reds') : ''}</table>`;
    if (this.endButtons) { modal(html, this.endButtons(state)); return; }
    const btns = [];
    if (this.onRematch) btns.push(['Revancha', 'primary', () => { this.onRematch(); }]);
    btns.push(['Volver al menú', 'ghost', () => { leaveMatch(); }]);
    modal(html, btns);
  }

  destroy() { this.dead = true; this.stopTimer(); this.queue = []; document.body.classList.remove('watching'); }
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
    // El dado gira y va frenando, para que se alcance a seguir.
    for (let i = 0; i < 12; i++) { face(faces[Math.floor(Math.random() * 6)]); await wait(70 + i * 12); }
    const k = faces[value - 1];
    face(k); die.classList.remove('rolling');
    legend.querySelector(`.chip[data-k="${k}"]`)?.classList.add('hit');
    $('#dice-text').textContent = reason;
    await wait(3000);
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
  cupPlaying = false;
  careerPlaying = false;
  paintCupButton();
  if (view) view.destroy();
  view = null;
  // Limpia lo que haya quedado a medio mostrar (escena, dado, carteles).
  if (renderer && renderer.cut) renderer.cut.hide();
  ['#dice', '#coin'].forEach((q) => $(q).classList.remove('show'));
  $('#fade').classList.remove('on');
  $('#pens').classList.remove('on');
  document.querySelector('.pitch-wrap').classList.remove('cinema');
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

let lastHost = null;
function startCpu(level = 'normal', awayId = pickCpuOpponent()) {
  audio.unlock();
  let host, cpu;
  const deliver = (m) => setTimeout(() => { view && view.onMessage(m); cpu.onMessage(m); }, 0);
  host = new Host({ home: myTeamId, away: awayId, callerSide: 0, broadcast: deliver, length: myLength });
  cpu = new Cpu(1, (m) => host.receive(1, m), level);
  lastHost = host;
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
    if (m.t === 'quit') { onRivalQuit(); return; }
    if (m.t === 'choice' || m.t === 'call') host.receive(1, m);
    // El rival volvió de una desconexión corta: le reenviamos el último estado.
    if (m.t === 'sync' && lastMsg && lastMsg.n > (m.n || 0)) conn.send(lastMsg);
    if (m.t === 'reconnected' && lastMsg) conn.send(lastMsg);
  });
  begin();
}

// Abandonar: contra la IA vuelve al menú; en una sala le avisa al rival.
function confirmQuit() {
  if (cupPlaying && cup) { confirmQuitCup(); return; }
  if (careerPlaying && career) { confirmQuitCareer(); return; }
  if (league) {
    if (view && view.spectator) showTable();
    else confirmLeaveLeague();
    return;
  }
  if (!session && !view) { show('screen-menu'); return; }
  modal('<h2>¿Abandonar el partido?</h2><p>Si abandonas, el partido se da por perdido.</p>', [
    ['Abandonar', 'primary', () => quitMatch()],
    ['Seguir jugando', 'ghost', () => {}],
  ]);
}

function quitMatch() {
  if (session && session.send) { try { session.send({ t: 'quit' }); } catch { /* sin conexión */ } }
  // Un momento para que el aviso salga antes de cerrar la conexión.
  setTimeout(leaveMatch, session && session.send ? 300 : 0);
}

function onRivalQuit() {
  if (!view) return;
  view.destroy();
  view = null;
  audio.sound('win');
  modal('<h2>Tu rival abandonó</h2><p>¡Ganas por abandono!</p>', [['Volver al menú', 'primary', () => leaveMatch()]]);
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
  session = { cleanup: () => { if (conn) conn.close(); room.destroy(); }, send: (m) => conn && conn.send(m) };
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
    onOpen: (c, welcome) => {
      conn = c;
      $('#menu-msg').textContent = '';
      $('#btn-join').disabled = false;
      if (welcome && welcome.mode === 'league') { joinLeague(c, welcome, j); return; }
      c.on('close', onDisconnect);
      c.on('message', (m) => {
        if (m.t === 'quit') { onRivalQuit(); return; }
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
  session = { cleanup: () => { if (conn) conn.close(); j.destroy(); }, send: (m) => conn && conn.send(m) };
}

// ---------- liga ----------
// Hasta 4 jugadores, todos contra todos. Quien crea la liga es la autoridad
// (LeagueHost); los demás reciben la fecha, juegan o miran, y ven la tabla.
let league = null;

const teamOfPlayer = (id) => {
  const p = league && league.players.find((x) => x.id === id);
  return teamById(p ? p.team : 'rac');
};

function createLeague() {
  audio.unlock();
  const guests = new Map();
  league = { isHost: true, me: 'h', players: [{ id: 'h', team: myTeamId }], length: 'short', live: [], lastByMid: {}, table: null, partial: null, lh: null, guests };
  const lg = league;
  // Entrega a un jugador: al anfitrión en el mismo celular, al resto por la sala.
  const sendTo = (id, msg) => {
    if (id === 'h') { setTimeout(() => league === lg && leagueMsg(msg), 0); return; }
    const g = guests.get(id);
    if (!g) return;
    const out = { ...msg, n: ++g.n };
    g.hist.push(out);
    if (g.hist.length > 120) g.hist.shift();
    g.conn.send(out);
  };
  lg.sendTo = sendTo;
  lg.up = (m) => lg.lh && lg.lh.receive('h', m);
  const lobby = () => lg.players.forEach((p) => sendTo(p.id, { t: 'lg', kind: 'lobby', players: lg.players, length: lg.length }));
  lg.lobby = lobby;
  const gone = (id) => {
    if (!guests.has(id)) return;
    if (lg.lh) { lg.lh.leave(id); return; }
    guests.delete(id);
    lg.players = lg.players.filter((p) => p.id !== id);
    lobby();
  };
  const room = createRoom({
    max: 3,
    mode: 'league',
    onReady: (code, broker) => {
      $('#lg-code').textContent = code;
      const url = `${location.origin}${location.pathname}?sala=${code}&b=${broker}`;
      $('#lg-share').onclick = async () => {
        const text = `¡Súmate a mi liga de Calcciopoli! Entra con el código ${code}`;
        try {
          if (navigator.share) await navigator.share({ title: 'Calcciopoli', text, url });
          else { await navigator.clipboard.writeText(`${text}: ${url}`); $('#lg-msg').textContent = 'Enlace copiado.'; }
        } catch { /* cancelado */ }
      };
    },
    onGuest: (conn, hello) => {
      const id = conn.guestId;
      // Cada jugador con un equipo distinto: si ya está tomado, se le asigna otro.
      let team = teamById(hello.team).id;
      const used = new Set(lg.players.map((p) => p.team));
      if (used.has(team)) {
        const free = TEAMS.filter((t) => !used.has(t.id));
        team = free[Math.floor(Math.random() * free.length)].id;
      }
      guests.set(id, { conn, n: 0, hist: [] });
      lg.players.push({ id, team });
      conn.on('message', (m) => {
        if (m.t === 'sync') { guests.get(id)?.hist.filter((x) => x.n > (m.n || 0)).forEach((x) => conn.send(x)); return; }
        if (m.t === 'reconnected') { guests.get(id)?.hist.slice(-10).forEach((x) => conn.send(x)); return; }
        if (m.t === 'quit') { gone(id); return; }
        if (lg.lh) lg.lh.receive(id, m);
      });
      conn.on('close', () => gone(id));
      lobby();
    },
    onError: (e) => { $('#lg-msg').textContent = errorText(e); },
  });
  lg.room = room;
  lg.cleanup = () => {
    if (lg.lh) lg.lh.matches.forEach((m) => clearTimeout(m.timer));
    guests.forEach((g) => g.conn.close());
    room.destroy();
  };
  session = { cleanup: () => { lg.cleanup(); if (league === lg) league = null; }, send: null };
  $('#lg-code').textContent = '·····';
  $('#lg-msg').textContent = '';
  renderLobby();
  show('screen-league');
}

function startLeague() {
  const lg = league;
  if (!lg || !lg.isHost || lg.lh || lg.players.length < 2) return;
  lg.room.lock();
  lg.lh = new LeagueHost({ players: lg.players, length: lg.length, send: lg.sendTo });
  lg.lh.start();
}

// Invitado: entró con el código a una sala que es una liga.
function joinLeague(c, welcome, j) {
  let lastN = 0;
  league = { isHost: false, me: welcome.to, players: [], length: 'short', live: [], lastByMid: {}, table: null, partial: null, up: (m) => c.send(m) };
  const lg = league;
  c.on('message', (m) => {
    if (m.t === 'reconnected') { c.send({ t: 'sync', n: lastN }); return; }
    if (m.n) { if (m.n <= lastN) return; lastN = m.n; }
    if (league === lg) leagueMsg(m);
  });
  c.on('close', () => { if (league === lg) leagueClosed('Se perdió la conexión con quien creó la liga.'); });
  session = { cleanup: () => { c.close(); j.destroy(); if (league === lg) league = null; }, send: (m) => c.send(m) };
  renderLobby();
  show('screen-league');
}

function leagueMsg(m) {
  const lg = league;
  if (m.t === 'state') {
    lg.lastByMid[m.mid] = m;
    if (m.state.phase === 'end') lg.live = lg.live.filter((x) => x !== m.mid);
    if (view && view.mid === m.mid) view.onMessage(m);
    return;
  }
  if (m.t !== 'lg') return;
  if (m.players) lg.players = m.players;
  if (m.kind === 'lobby') { lg.length = m.length; renderLobby(); return; }
  if (m.kind === 'round') {
    Object.assign(lg, { round: m.round, total: m.total, fixtures: m.fixtures, resting: m.resting, live: m.fixtures.map((f) => f.mid), lastByMid: {}, table: null });
    if (m.play) playLeagueMatch(m.play.mid, m.play.side);
    else if (m.watch) watchLeagueMatch(m.watch);
    else showTable();
    return;
  }
  if (m.kind === 'wait') {
    lg.partial = m.table;
    lg.live = [m.watch];
    if (!view) renderTable();
    return;
  }
  if (m.kind === 'table') {
    lg.table = m; lg.partial = m.table; lg.live = [];
    if (!view) showTable();
    return;
  }
  if (m.kind === 'walkover') {
    if (view && view.mid === m.mid && !view.spectator) {
      view.destroy(); view = null;
      audio.sound('win');
      modal(`<h2>Tu rival abandonó</h2><p>${teamById(m.team).name} dejó la liga. Ganas 3 a 0.</p>`, [['Ver tabla', 'primary', () => showTable()]]);
    }
    return;
  }
  if (m.kind === 'closed') leagueClosed('Quien creó la liga la cerró.');
}

function clearPitch() {
  if (view) view.destroy();
  view = null;
  if (renderer && renderer.cut) renderer.cut.hide();
  ['#dice', '#coin'].forEach((q) => $(q).classList.remove('show'));
  $('#fade').classList.remove('on');
  $('#pens').classList.remove('on');
  document.querySelector('.pitch-wrap').classList.remove('cinema');
  closeModal();
}

function leagueEndButtons() {
  const other = league && league.live.find((x) => !view || x !== view.mid);
  const btns = [];
  if (other) btns.push(['Mirar el otro partido', 'primary', () => watchLeagueMatch(other)]);
  btns.push(['Ver tabla', other ? 'ghost' : 'primary', () => showTable()]);
  return btns;
}

function playLeagueMatch(mid, side) {
  clearPitch();
  const lg = league;
  view = new MatchView({ mySide: side, isHost: lg.isHost, send: (x) => lg.up({ ...x, mid }), endButtons: leagueEndButtons });
  view.mid = mid;
  const fx = lg.fixtures.find((f) => f.mid === mid);
  $('#feed').textContent = `Liga, fecha ${lg.round + 1}: ${teamOfPlayer(fx.home).name} vs ${teamOfPlayer(fx.away).name}.`;
  if (lg.lastByMid[mid]) view.onMessage(lg.lastByMid[mid]);
}

function watchLeagueMatch(mid) {
  clearPitch();
  view = new MatchView({ mySide: 0, isHost: false, send: () => {}, spectator: true, endButtons: leagueEndButtons });
  view.mid = mid;
  const last = league.lastByMid[mid];
  if (last) view.onMessage(last);
}

function showTable() {
  if (!league) return;
  clearPitch();
  renderTable();
  show('screen-table');
}

function renderLobby() {
  const lg = league;
  if (!lg) return;
  $('#lg-code-box').hidden = !lg.isHost;
  $('#lg-title').textContent = lg.isHost ? 'Liga creada' : 'Liga';
  $('#lg-players').innerHTML = lg.players.map((p, k) => {
    const t = teamById(p.team);
    const tags = [p.id === lg.me ? 'tú' : '', k === 0 ? 'anfitrión' : ''].filter(Boolean).join(', ');
    return `<li><span class="kit-swatch" style="background:${swatchCss(t.kit)}"></span><b>${t.name}</b>${tags ? `<small>${tags}</small>` : ''}</li>`;
  }).join('') + Array.from({ length: 4 - lg.players.length }, () => '<li class="empty">Lugar libre</li>').join('');
  document.querySelectorAll('#lg-len [data-len]').forEach((b) => {
    b.classList.toggle('on', b.dataset.len === lg.length);
    b.disabled = !lg.isHost;
  });
  const n = lg.players.length;
  $('#lg-start').hidden = !lg.isHost;
  $('#lg-start').disabled = n < 2;
  $('#lg-start').textContent = n < 2 ? 'Empezar liga' : `Empezar liga (${n} jugadores)`;
  $('#lg-wait').innerHTML = `<span class="ball-spin"></span> ${lg.isHost ? (n < 4 ? 'Esperando jugadores…' : 'Liga completa.') : 'Esperando que el anfitrión empiece la liga…'}`;
}

function renderTable() {
  const lg = league;
  if (!lg) return;
  const t = lg.table;
  const final = t && t.final;
  const rows = (t && t.table) || lg.partial || lg.players.map((p) => ({ id: p.id, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, pts: 0 }));
  const gone = (id) => lg.players.find((p) => p.id === id)?.gone;
  $('#tb-title').textContent = final ? 'Liga terminada' : `Fecha ${lg.round + 1} de ${lg.total}`;
  if (final) {
    // Igualados en puntos, diferencia y goles: el título se comparte.
    const same = (r) => r.pts === rows[0].pts && r.gf - r.gc === rows[0].gf - rows[0].gc && r.gf === rows[0].gf;
    const top = rows.filter(same);
    const mine = top.some((r) => r.id === lg.me);
    const sw = (r) => `<span class="kit-swatch" style="background:${swatchCss(teamOfPlayer(r.id).kit)}"></span>`;
    $('#tb-champ').innerHTML = `<div class="champ"><small>${top.length > 1 ? 'CAMPEONES' : 'CAMPEÓN'}</small><div class="champ-sw">${top.map(sw).join('')}</div><b>${top.map((r) => teamOfPlayer(r.id).name).join(' y ')}</b><em>${top.length > 1 ? `Empate en la cima con ${rows[0].pts} puntos` : mine ? '¡Eres el campeón!' : `${rows[0].pts} puntos`}</em></div>`;
    if (mine && !lg.cheered) { lg.cheered = true; audio.sound('win'); }
  } else $('#tb-champ').innerHTML = '';
  const dg = (r) => (r.gf - r.gc > 0 ? '+' : '') + (r.gf - r.gc);
  $('#tb-table').innerHTML = '<tr><th></th><th>Equipo</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>DG</th><th>Pts</th></tr>' + rows.map((r, k) => {
    const tm = teamOfPlayer(r.id);
    return `<tr class="${r.id === lg.me ? 'me' : ''}${gone(r.id) ? ' gone' : ''}"><td>${k + 1}</td><td><span class="kit-swatch" style="background:${swatchCss(tm.kit)}"></span>${tm.short}${gone(r.id) ? ' <small>se fue</small>' : ''}</td><td>${r.pj}</td><td>${r.pg}</td><td>${r.pe}</td><td>${r.pp}</td><td>${dg(r)}</td><td><b>${r.pts}</b></td></tr>`;
  }).join('');
  const line = (h, a, mid) => `<span>${teamOfPlayer(h).short}</span>${mid}<span>${teamOfPlayer(a).short}</span>`;
  const results = (t ? t.results : []);
  $('#tb-results').innerHTML = results.length ? `<h3>Resultados de la fecha</h3>${results.map((r) => `<p class="fx">${line(r.home, r.away, `<b>${r.hs} - ${r.as}</b>`)}${r.walkover ? '<small>abandono</small>' : ''}</p>`).join('')}` : '';
  const live = lg.live[0] && lg.fixtures && lg.fixtures.find((f) => f.mid === lg.live[0]);
  $('#tb-live').innerHTML = live ? `<h3>En juego</h3><p class="fx">${line(live.home, live.away, '<b>vs</b>')}</p><button class="btn" id="tb-watch">Mirar en vivo</button>` : '';
  if (live) $('#tb-watch').onclick = () => watchLeagueMatch(live.mid);
  const next = t && t.next;
  $('#tb-next').innerHTML = next ? `<h3>Próxima fecha</h3>${next.map((f) => (f.away ? `<p class="fx">${line(f.home, f.away, '<b>vs</b>')}</p>` : `<p class="fx rest">Descansa ${teamOfPlayer(f.home).name}</p>`)).join('')}` : '';
  const act = $('#tb-actions');
  act.innerHTML = '';
  const btn = (txt, cls, fn) => { const b = document.createElement('button'); b.className = 'btn ' + cls; b.textContent = txt; b.onclick = fn; act.appendChild(b); };
  if (final) btn('Volver al menú', 'primary', () => leaveLeague());
  else {
    if (t && lg.isHost) btn('Siguiente fecha', 'primary', () => lg.lh.nextRound());
    else if (t) act.insertAdjacentHTML('beforeend', '<p class="waiting"><span class="ball-spin"></span> Esperando que el anfitrión arranque la fecha…</p>');
    else if (!live) act.insertAdjacentHTML('beforeend', '<p class="waiting"><span class="ball-spin"></span> Terminando la fecha…</p>');
    btn('Salir de la liga', 'ghost', () => confirmLeaveLeague());
  }
}

function confirmLeaveLeague() {
  const text = league.isHost ? 'Si sales, se termina la liga para todos.' : 'Pierdes 3 a 0 el partido en curso y los que te queden.';
  modal(`<h2>¿Salir de la liga?</h2><p>${text}</p>`, [['Salir', 'primary', () => leaveLeague()], ['Seguir', 'ghost', () => {}]]);
}

function leaveLeague() {
  const lg = league;
  if (!lg) { leaveMatch(); return; }
  const done = lg.table && lg.table.final;
  if (lg.isHost) { if (!done) lg.players.forEach((p) => p.id !== 'h' && lg.sendTo(p.id, { t: 'lg', kind: 'closed' })); }
  else if (!done) lg.up({ t: 'quit' });
  league = null;
  setTimeout(leaveMatch, 300);
}

function leagueClosed(text) {
  if (view) view.destroy();
  view = null;
  league = null;
  modal(`<h2>Liga terminada</h2><p>${text}</p>`, [['Volver al menú', 'primary', () => leaveMatch()]]);
}

// ---------- torneo contra la IA ----------
// Eliminación directa; se guarda en el celular para seguirlo después.
let cup = null;
let cupPlaying = false;

function saveCup() { try { if (cup) localStorage.setItem('fdm-cup', JSON.stringify(cup)); else localStorage.removeItem('fdm-cup'); } catch { /* sin storage */ } }
function loadCup() { try { const c = JSON.parse(localStorage.getItem('fdm-cup')); return c && c.v === 1 && c.rounds ? c : null; } catch { return null; } }
function paintCupButton() {
  const saved = loadCup();
  const b = $('#btn-cup-continue');
  b.hidden = !saved || !!champion(saved);
  if (saved) b.textContent = `Continuar torneo con ${teamById(saved.me).short}`;
}

function cupMenu() {
  const mine = teamById(myTeamId);
  const national = mine.group === 'Selecciones';
  const saved = loadCup();
  const warn = saved && !champion(saved) ? '<p class="note">Empezar uno nuevo borra el torneo que tienes guardado.</p>' : '';
  modal(`<h2>Torneo</h2>
    <p>Eliminación directa contra la IA con ${mine.name}, entre ${national ? 'selecciones' : 'clubes'}. Si empatas, se define por penales. La IA se pone más difícil en cada ronda.</p>${warn}`,
  [['8 equipos', 'primary', () => startCup(8)], ['16 equipos', '', () => startCup(16)], ['Volver', 'ghost', () => {}]]);
}

function startCup(size) {
  audio.unlock();
  const national = teamById(myTeamId).group === 'Selecciones';
  const pool = TEAMS.filter((t) => (t.group === 'Selecciones') === national).map((t) => t.id);
  cup = newCup({ me: myTeamId, pool, size: Math.min(size, pool.length - (pool.length % 2)), length: myLength });
  saveCup();
  showCup();
}

function cupResultLine(m) {
  const A = teamById(m.a), B = teamById(m.b);
  const mine = m.a === cup.me || m.b === cup.me;
  const mid = m.res ? `<b>${m.res.ga} - ${m.res.gb}</b>` : '<b>vs</b>';
  const pens = m.res && m.res.pens ? `<small>penales ${m.res.pens[0]} - ${m.res.pens[1]}</small>` : '';
  const w = (id) => (m.res && m.res.winner === id ? ' class="win"' : m.res ? ' class="lose"' : '');
  return `<p class="fx${mine ? ' mine' : ''}"><span${w(m.a)}>${A.short}</span>${mid}<span${w(m.b)}>${B.short}</span>${pens}</p>`;
}

function showCup() {
  if (!cup) return;
  const left = teamsLeft(cup);
  const champ = champion(cup);
  const me = teamById(cup.me);
  const m = myMatch(cup);
  const playing = !cup.out && m && !m.res;
  let head;
  if (champ) {
    const c = teamById(champ);
    head = `<div class="champ"><small>CAMPEÓN</small><span class="kit-swatch" style="background:${swatchCss(c.kit)}"></span><b>${c.name}</b><em>${champ === cup.me ? '¡Ganaste el torneo!' : cup.out ? `Quedaste fuera en ${ROUND_NAMES[cup.out].toLowerCase()}.` : ''}</em></div>`;
    if (champ === cup.me && !cup.cheered) { cup.cheered = true; audio.sound('win'); }
  } else if (playing) {
    const rival = teamById(m.a === cup.me ? m.b : m.a);
    head = `<div class="next-match"><small>${ROUND_NAMES[left].toUpperCase()}</small>
      <div class="vsrow"><span><i class="kit-swatch" style="background:${swatchCss(me.kit)}"></i>${me.short}</span><b>vs</b><span><i class="kit-swatch" style="background:${swatchCss(rival.kit)}"></i>${rival.short}</span></div>
      <em>${rival.name} · IA ${LEVELS[levelFor(left)].label.toLowerCase()}</em></div>`;
  } else {
    head = `<div class="next-match out"><small>ELIMINADO</small><b>${me.name} quedó fuera en ${ROUND_NAMES[cup.out].toLowerCase()}.</b></div>`;
  }
  $('#cup-title').textContent = champ ? 'Torneo terminado' : `${ROUND_NAMES[left]}`;
  $('#cup-head').innerHTML = head;
  // El cuadro, de la ronda actual hacia atrás.
  $('#cup-rounds').innerHTML = cup.rounds.map((r) => `<h3>${ROUND_NAMES[r.length * 2]}</h3>${r.map(cupResultLine).join('')}`).reverse().join('');
  const act = $('#cup-actions');
  act.innerHTML = '';
  const btn = (txt, cls, fn) => { const b = document.createElement('button'); b.className = 'btn ' + cls; b.textContent = txt; b.onclick = fn; act.appendChild(b); };
  if (playing) btn('Jugar partido', 'primary', () => playCupMatch());
  else if (!champ) btn('Simular hasta el final', 'primary', () => { while (!champion(cup)) finishRound(cup, null); saveCup(); showCup(); });
  if (champ) btn('Nuevo torneo', 'primary', () => cupMenu());
  btn(champ || !playing ? 'Volver al menú' : 'Salir (queda guardado)', 'ghost', () => { if (champion(cup)) { cup = null; saveCup(); } show('screen-menu'); paintCupButton(); });
  show('screen-cup');
}

function playCupMatch() {
  const m = myMatch(cup);
  const rival = m.a === cup.me ? m.b : m.a;
  const level = levelFor(teamsLeft(cup));
  audio.unlock();
  let host, cpu;
  const deliver = (x) => setTimeout(() => { view && view.onMessage(x); cpu.onMessage(x); }, 0);
  host = new Host({ home: cup.me, away: rival, callerSide: 0, broadcast: deliver, length: cup.length });
  cpu = new Cpu(1, (x) => host.receive(1, x), level);
  lastHost = host;
  cupPlaying = true;
  view = new MatchView({ mySide: 0, isHost: true, send: (x) => host.receive(0, x), endButtons: (state) => [['Continuar', 'primary', () => cupAfterMatch(resultOf(state, cup.me, rival))]] });
  session = { cleanup: () => { host.broadcast = () => {}; } };
  $('#feed').textContent = `${ROUND_NAMES[teamsLeft(cup)]} contra ${teamById(rival).name}.`;
  host.start();
}

// Tu resultado (visto desde tu equipo) se guarda en el sentido del cuadro.
function cupAfterMatch(r) {
  const m = myMatch(cup);
  const res = m.a === cup.me ? r : { ga: r.gb, gb: r.ga, pens: r.pens && [r.pens[1], r.pens[0]], winner: r.winner };
  cupPlaying = false;
  clearPitch();
  if (session) { try { session.cleanup(); } catch { /* ya cerrada */ } }
  session = null;
  finishRound(cup, res);
  saveCup();
  showCup();
}

function confirmQuitCup() {
  modal('<h2>¿Abandonar el partido?</h2><p>Si abandonas, pierdes 3 a 0 y quedas eliminado del torneo.</p>', [
    ['Abandonar', 'primary', () => {
      const m = myMatch(cup);
      const rival = m.a === cup.me ? m.b : m.a;
      cupAfterMatch({ ga: 0, gb: 3, pens: null, winner: rival });
    }],
    ['Seguir jugando', 'ghost', () => {}],
  ]);
}

// ---------- modo carrera ----------
// Una carrera guardada por liga, en el celular.
let career = null;
let careerPlaying = false;

function loadCareers() { try { return JSON.parse(localStorage.getItem('fdm-careers')) || {}; } catch { return {}; } }
function saveCareer() {
  try {
    const all = loadCareers();
    if (career) all[career.league] = career;
    localStorage.setItem('fdm-careers', JSON.stringify(all));
  } catch { /* sin storage */ }
}
function dropCareer(id) { try { const all = loadCareers(); delete all[id]; localStorage.setItem('fdm-careers', JSON.stringify(all)); } catch { /* sin storage */ } }
const leagueOf = (c) => LEAGUES.find((l) => l.id === c.league);

function showCareerPick() {
  const saved = loadCareers();
  $('#career-leagues').innerHTML = '';
  for (const l of LEAGUES) {
    const c = saved[l.id];
    const b = document.createElement('button');
    b.className = 'league-btn';
    const sub = c ? `${teamById(c.me).name} · Temporada ${c.season} · ${seasonOver(c) ? 'terminada' : `fecha ${c.round + 1} de ${totalRounds(c)}`}` : `${l.teams.length} equipos`;
    b.innerHTML = `<b>${l.name}</b><small>${l.country}</small><em>${sub}</em>`;
    if (c) b.classList.add('saved');
    b.onclick = () => {
      if (!c) { pickCareerTeam(l); return; }
      modal(`<h2>${l.name}</h2><p>Tienes una carrera con ${teamById(c.me).name}, temporada ${c.season}.</p>`, [
        ['Continuar', 'primary', () => { career = c; showCareer(); }],
        ['Empezar de nuevo', '', () => { setTimeout(() => pickCareerTeam(l), 0); }],
        ['Volver', 'ghost', () => {}],
      ]);
    };
    $('#career-leagues').appendChild(b);
  }
  show('screen-career-pick');
}

function pickCareerTeam(l) {
  $('#career-team-title').textContent = l.name;
  const grid = $('#career-team-grid');
  grid.innerHTML = '';
  for (const id of l.teams) {
    const t = teamById(id);
    const b = document.createElement('button');
    b.className = 'team-btn' + (Math.max(...t.name.split(' ').map((w) => w.length)) > 10 ? ' long' : '');
    b.innerHTML = `<span class="kit-swatch"></span><span>${t.name}</span>`;
    b.querySelector('.kit-swatch').style.background = swatchCss(t.kit);
    b.onclick = () => careerOptions(l, id);
    grid.appendChild(b);
  }
  show('screen-career-teams');
}

function careerOptions(l, me) {
  const opt = { double: false, level: 'normal', length: 'short' };
  const row = (key, label, items) => `<div class="len-row opt-row" data-key="${key}"><small>${label}</small>${items.map(([v, t]) => `<button data-v="${v}">${t}</button>`).join('')}</div>`;
  const n = l.teams.length - 1;
  modal(`<h2>${teamById(me).name}</h2>
    <p>Temporada de ${l.name} contra la IA. En la liga no hay penales: el empate da un punto.</p>
    ${row('double', 'Ruedas', [['0', `Solo ida (${n})`], ['1', `Ida y vuelta (${n * 2})`]])}
    ${row('level', 'IA', Object.entries(LEVELS).map(([k, v]) => [k, v.label]))}
    ${row('length', 'Partidos', Object.entries(LENGTHS).map(([k, v]) => [k, v.label]))}`,
  [['Empezar temporada', 'primary', () => {
    career = newCareer({ league: l, me, ...opt });
    saveCareer();
    showCareer();
  }], ['Volver', 'ghost', () => {}]]);
  const paint = () => document.querySelectorAll('#modal-box .opt-row').forEach((r) => r.querySelectorAll('button').forEach((b) => {
    const v = r.dataset.key === 'double' ? String(Number(opt.double)) : opt[r.dataset.key];
    b.classList.toggle('on', b.dataset.v === v);
  }));
  document.querySelectorAll('#modal-box .opt-row button').forEach((b) => (b.onclick = () => {
    const key = b.parentElement.dataset.key;
    opt[key] = key === 'double' ? b.dataset.v === '1' : b.dataset.v;
    paint();
  }));
  paint();
}

function showCareer() {
  const c = career;
  if (!c) return;
  const l = leagueOf(c);
  const me = teamById(c.me);
  const t = table(c, l.teams);
  const over = seasonOver(c);
  const pos = t.findIndex((r) => r.id === c.me) + 1;
  $('#career-title').textContent = `${l.name} · Temporada ${c.season}`;
  let head;
  if (over) {
    const champ = teamById(t[0].id);
    const mine = t[0].id === c.me;
    head = `<div class="champ"><small>CAMPEÓN</small><span class="kit-swatch" style="background:${swatchCss(champ.kit)}"></span><b>${champ.name}</b><em>${mine ? '¡Campeón con tu equipo!' : `${me.short} terminó ${pos}° con ${t[pos - 1].pts} puntos.`}</em></div>`;
    if (mine && c.cheered !== c.season) { c.cheered = c.season; audio.sound('win'); saveCareer(); }
  } else {
    const m = myFixture(c);
    const home = teamById(m.h), away = teamById(m.a);
    const sw = (tm) => `<i class="kit-swatch" style="background:${swatchCss(tm.kit)}"></i>`;
    head = `<div class="next-match"><small>FECHA ${c.round + 1} DE ${totalRounds(c)}</small>
      <div class="vsrow"><span>${sw(home)}${home.short}</span><b>vs</b><span>${sw(away)}${away.short}</span></div>
      <em>${m.h === c.me ? `De local ante ${away.name}` : `De visita ante ${home.name}`}${c.round ? ` · vas ${pos}°` : ''}</em></div>`;
  }
  $('#career-head').innerHTML = head;
  const act = $('#career-actions');
  act.innerHTML = '';
  const btn = (txt, cls, fn) => { const b = document.createElement('button'); b.className = 'btn ' + cls; b.textContent = txt; b.onclick = fn; act.appendChild(b); };
  if (over) btn('Nueva temporada', 'primary', () => { nextSeason(c, l); saveCareer(); showCareer(); });
  else {
    btn('Jugar partido', 'primary', () => playCareerMatch());
    btn('Simular mi partido', '', () => { playRound(c, null); saveCareer(); showCareer(); });
  }
  btn('Salir (queda guardado)', 'ghost', () => { career = null; show('screen-menu'); });
  // Tabla completa.
  const dg = (r) => (r.gf - r.gc > 0 ? '+' : '') + (r.gf - r.gc);
  $('#career-table').innerHTML = '<tr><th></th><th>Equipo</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>DG</th><th>Pts</th></tr>' + t.map((r, k) => {
    const tm = teamById(r.id);
    return `<tr class="${r.id === c.me ? 'me' : ''}"><td>${k + 1}</td><td><span class="kit-swatch" style="background:${swatchCss(tm.kit)}"></span>${tm.short}</td><td>${r.pj}</td><td>${r.pg}</td><td>${r.pe}</td><td>${r.pp}</td><td>${dg(r)}</td><td><b>${r.pts}</b></td></tr>`;
  }).join('');
  const last = c.round > 0 ? c.rounds[c.round - 1] : null;
  const line = (m) => `<p class="fx${m.h === c.me || m.a === c.me ? ' mine' : ''}"><span>${teamById(m.h).short}</span><b>${m.res ? `${m.res.hs} - ${m.res.as}` : 'vs'}</b><span>${teamById(m.a).short}</span></p>`;
  $('#career-last').innerHTML = last ? `<h3>Fecha ${c.round}</h3>${last.map(line).join('')}` : '';
  const sc = topScorers(c);
  $('#career-scorers').innerHTML = sc.length ? `<h3>Goleadores</h3><ul class="leaders">${sc.map((s) => `<li><span>${teamById(s.team).short}</span><b>${playerName(s.team, s.i)}</b><i>${s.g}</i></li>`).join('')}</ul>` : '';
  const hist = c.history.length ? `<h3>Temporadas anteriores${c.titles ? ` · ${c.titles} ${c.titles === 1 ? 'título' : 'títulos'}` : ''}</h3>${c.history.map((h) => `<p class="fx rest">Temporada ${h.season}: ${h.pos}° con ${h.pts} pts${h.pos === 1 ? ' · campeón' : ` · campeón ${teamById(h.champion).short}`}</p>`).join('')}` : '';
  $('#career-history').innerHTML = hist;
  show('screen-career');
}

function playCareerMatch() {
  const c = career;
  const m = myFixture(c);
  const mySide = m.h === c.me ? 0 : 1;
  audio.unlock();
  let host, cpu;
  const deliver = (x) => setTimeout(() => { view && view.onMessage(x); cpu.onMessage(x); }, 0);
  host = new Host({ home: m.h, away: m.a, callerSide: mySide, broadcast: deliver, length: c.length, shootout: false });
  cpu = new Cpu(1 - mySide, (x) => host.receive(1 - mySide, x), c.level);
  lastHost = host;
  careerPlaying = true;
  view = new MatchView({ mySide, isHost: true, send: (x) => host.receive(mySide, x), endButtons: (state) => [['Continuar', 'primary', () => careerAfterMatch(resultFrom(state))]] });
  session = { cleanup: () => { host.broadcast = () => {}; } };
  $('#feed').textContent = `${leagueOf(c).name}, fecha ${c.round + 1}.`;
  host.start();
}

function careerAfterMatch(res) {
  careerPlaying = false;
  clearPitch();
  if (session) { try { session.cleanup(); } catch { /* ya cerrada */ } }
  session = null;
  playRound(career, res);
  saveCareer();
  showCareer();
}

function confirmQuitCareer() {
  modal('<h2>¿Abandonar el partido?</h2><p>Si abandonas, pierdes 3 a 0.</p>', [
    ['Abandonar', 'primary', () => {
      const m = myFixture(career);
      careerAfterMatch(m.h === career.me ? { hs: 0, as: 3, goals: [] } : { hs: 3, as: 0, goals: [] });
    }],
    ['Seguir jugando', 'ghost', () => {}],
  ]);
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
$('#btn-quit').onclick = () => confirmQuit();
$('#btn-create').onclick = () => createOnline();
$('#btn-league').onclick = () => createLeague();
$('#btn-cup').onclick = () => cupMenu();
$('#btn-career').onclick = () => showCareerPick();
$('#career-team-back').onclick = () => showCareerPick();
$('#btn-cup-continue').onclick = () => { cup = loadCup(); if (cup) showCup(); };
paintCupButton();
$('#lg-start').onclick = () => startLeague();
$('#lg-leave').onclick = () => leaveLeague();
document.querySelectorAll('#lg-len [data-len]').forEach((b) => (b.onclick = () => {
  if (!league || !league.isHost || league.lh) return;
  league.length = b.dataset.len;
  league.lobby();
}));
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
window.__fdm = { get career() { return career; }, get cup() { return cup; }, get view() { return view; }, get league() { return league; }, get renderer() { return renderer; }, get host() { return lastHost; }, randomChoice, icon };
