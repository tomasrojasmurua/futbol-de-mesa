import { TEAMS, teamById, matchKits } from './teams.js';
import { optionsFor, SHOT_TITLES, TURN_SECONDS, fmtMinute, commentary, diceReason, diceFaces, DIE_LABELS, LENGTHS, randomChoice } from './game.js';
import { Host, Cpu, LEVELS } from './host.js';
import { createRoom, joinRoom } from './net.js';
import { LeagueHost } from './league.js';
import { LEAGUES } from './leagues/index.js';
import { newCareer, myFixture, playRound, seasonOver, totalRounds, table, topScorers, nextSeason, resultFrom } from './career.js';
import { newCup, myMatch, teamsLeft, champion, finishRound, resultOf, levelFor, ROUND_NAMES } from './cup.js';
import { Renderer } from './render.js';
import { CARDS, activeEffects, fxInPlay, BASE_DICE } from './situations.js';
import * as audio from './audio.js';
import { icon, iconFor } from './icons.js';
import { rollDice, tossCoin, coinFaceUrl } from './dice.js';
import { playerName } from './squads.js';
import { fxTipHtml, cardArt, cardBodyHtml, VIEW_MINE, VIEW_THEIRS, VIEW_NEUTRAL } from './cardinfo.js';
import { paintGrass, paintLogo, paintIcon } from './titleart.js';
import { playTitleIntro } from './titleintro.js';
import { paintFlag, GROUP_FLAG, teamFlag, flagUrl } from './flags.js';
import { paintMap } from './maps.js';
import { defaultSetup, dayLine } from './matchday.js';
import { openPrematch } from './prematch.js';
import { Intro } from './intro/index.js';
import { crestOf } from './crests.js';
import { COMPS, FREE_CUP, TROPHY_LIST, trophyCanvas, loadTrophies, addTrophy, paintRoom } from './trophies.js';

const $ = (s) => document.querySelector(s);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- preferencias ----------
let myTeamId = 'rac';
try { myTeamId = localStorage.getItem('fdm-team') || 'rac'; } catch { /* sin storage */ }
let myLength = 'normal';
try { myLength = LENGTHS[localStorage.getItem('fdm-len')] ? localStorage.getItem('fdm-len') : 'normal'; } catch { /* sin storage */ }
let myLevel = 'normal';
try { myLevel = LEVELS[localStorage.getItem('fdm-level')] ? localStorage.getItem('fdm-level') : 'normal'; } catch { /* sin storage */ }
function saveLength(len) {
  if (!LENGTHS[len]) return;
  myLength = len;
  try { localStorage.setItem('fdm-len', len); } catch { /* sin storage */ }
}

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

// Muestra de un equipo: la bandera si es selección, su escudo si lo tiene, o su camiseta.
const isNation = (t) => t && t.group === 'Selecciones' && teamFlag(t.id);
const crestUrls = {};
function crestUrl(t) {
  if (!t || isNation(t)) return null;
  if (!(t.short in crestUrls)) { const c = crestOf(t.short); crestUrls[t.short] = c ? c.toDataURL() : null; }
  return crestUrls[t.short];
}
const crestBg = (u) => `url(${u}) center / contain no-repeat`;
function swatchAttrs(t) {
  const u = crestUrl(t);
  if (u) return `class="kit-swatch crest" style="background:${crestBg(u)}"`;
  return isNation(t) ? `class="kit-swatch flag" style="background:url(${flagUrl(teamFlag(t.id))}) center / 100% 100%"` : `class="kit-swatch" style="background:${swatchCss(t.kit)}"`;
}
function paintSwatch(el, t) {
  const u = crestUrl(t);
  el.classList.toggle('flag', !!isNation(t));
  el.classList.toggle('crest', !!u);
  el.style.background = u ? crestBg(u) : isNation(t) ? `url(${flagUrl(teamFlag(t.id))}) center / 100% 100%` : swatchCss(t.kit);
}

function paintMyTeam() {
  paintHome();
}

// Portada: pasto en píxeles grandes del tamaño justo de la pantalla, y el logo.
let homeSize = '';
function paintHome(force = true) {
  const cv = $('#title-art');
  if (!cv) return;
  const vw = innerWidth, vh = innerHeight;
  const k = Math.max(2, Math.round(vw / 200));
  const W = Math.ceil(vw / k) + 1, H = Math.ceil(vh / k) + 1;
  if (force || homeSize !== `${W}x${H}`) {
    homeSize = `${W}x${H}`;
    try { paintGrass(cv, W, H); cv.style.width = `${W * k}px`; cv.style.height = `${H * k}px`; } catch (e) { console.warn('pasto', e); }
  }
  const logo = $('#logo-art');
  try {
    const { W: lw } = paintLogo(logo);
    const lk = Math.max(2, Math.floor(Math.min(vw - 40, 440) / lw));
    logo.style.width = `${logo.width * lk}px`; logo.style.height = `${logo.height * lk}px`;
    logo.parentElement.classList.add('drawn');
  } catch (e) { console.warn('logo', e); }
}
let homeTimer = 0;
addEventListener('resize', () => { clearTimeout(homeTimer); homeTimer = setTimeout(() => paintHome(false), 200); });
let trophyTimer = 0;
addEventListener('resize', () => { if ($('#screen-trophies')?.classList.contains('active')) { clearTimeout(trophyTimer); trophyTimer = setTimeout(() => showTrophies(), 200); } });

// Elegir equipo en dos pasos: primero la liga (o grupo), después el equipo.
const teamGroups = () => [...new Set(TEAMS.map((t) => t.group))];
const longName = (t) => Math.max(...t.name.split(' ').map((w) => w.length)) > 10;

// Cada modo lleva a elegir el equipo antes de jugar; `teamNext` es lo que
// sigue al elegirlo (empezar el partido, crear la sala…).
let teamNext = () => {};
let teamFrom = 'screen-play';
let teamTaken = new Set();

// `taken`: equipos que ya eligieron otros jugadores de la liga.
function pickTeam(next, from = 'screen-play', taken = []) {
  teamNext = next;
  teamFrom = from;
  teamTaken = new Set(taken);
  buildTeamGrid();
  show('screen-teams');
}

function buildTeamGrid() {
  $('#teams-title').textContent = 'Elige la liga';
  $('#teams-back').onclick = () => show(teamFrom);
  $('#team-grid').hidden = true;
  const list = $('#team-groups');
  list.hidden = false;
  list.innerHTML = '';
  const mine = teamById(myTeamId);
  for (const g of teamGroups()) {
    const teams = TEAMS.filter((t) => t.group === g);
    const b = document.createElement('button');
    b.className = 'league-btn flag-btn' + (mine?.group === g ? ' saved' : '');
    b.append(paintFlag(document.createElement('canvas'), GROUP_FLAG[g]));
    b.insertAdjacentHTML('beforeend', `<b>${g}</b><small>${teams.length} equipos</small>${mine?.group === g ? `<em>Último equipo: ${mine.name}</em>` : ''}`);
    b.onclick = () => buildGroupTeams(g);
    list.appendChild(b);
  }
  list.scrollTop = 0;
}

function buildGroupTeams(g) {
  $('#teams-title').textContent = g;
  $('#teams-back').onclick = () => buildTeamGrid();
  $('#team-groups').hidden = true;
  const grid = $('#team-grid');
  grid.hidden = false;
  grid.innerHTML = '';
  for (const t of TEAMS.filter((x) => x.group === g)) {
    const b = document.createElement('button');
    b.className = 'team-btn' + (t.id === myTeamId ? ' sel' : '') + (longName(t) ? ' long' : '');
    b.innerHTML = `<span class="kit-swatch"></span><span>${t.name}</span>`;
    paintSwatch(b.querySelector('.kit-swatch'), t);
    b.disabled = teamTaken.has(t.id);
    b.onclick = () => {
      myTeamId = t.id;
      try { localStorage.setItem('fdm-team', t.id); } catch { /* sin storage */ }
      paintMyTeam();
      show(teamFrom);
      teamNext();
    };
    grid.appendChild(b);
  }
  grid.scrollTop = 0;
}

// ---------- modal ----------
function modal(html, buttons = [], cls = '') {
  const box = $('#modal-box');
  box.className = 'modal-box' + (cls ? ' ' + cls : '');
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
<p>El atacante elige <b>centro al área</b>, <b>pase filtrado</b> o <b>gambeta</b>. El defensor elige <b>cerrar bandas</b> (para el centro), <b>achicar espacios</b> (para el pase filtrado) o <b>doble marca</b> (para la gambeta). Si el defensor acierta, corta el ataque.</p>
<h3>3. El remate</h3>
<p>El atacante patea a un palo o al medio; el arquero elige hacia dónde se tira. Si adivina, ataja. Si no... ¡casi siempre es gol!</p>
<h3>El dado</h3>
<p>En los momentos clave se tira un dado especial: cada cara trae un símbolo de lo que pasa y debajo ves cuántas caras tiene cada resultado. Las reglas son las mismas para los dos equipos.</p>
<ul>
<li>Cuando la defensa adivina en la salida, recupera la pelota salvo dos caras: una <b>falta</b> (sigue el que ataca) y un <b>contragolpe</b> para el que defiende. En el último tercio hay además un <b>córner</b>: falta, córner, tres de recupera y contragolpe. Si la falta es en un centro o una gambeta, que terminan dentro del área, es <b>penal</b>.</li>
<li>Si el arquero adivina, ataja; una cara da rebote al córner y otra un saque rápido de contra.</li>
<li>Si le ganas al arquero, la imagen se congela con la pelota en el aire y el dado decide: 4 caras de gol, 1 de palo y 1 afuera. Igual para cualquier remate.</li>
<li>Una gambeta exitosa puede terminar en <b>penal</b>.</li>
</ul>
<h3>Situaciones de juego</h3>
<p>Dos mazos de cartas traen lo impredecible de un partido real. Las cartas nunca tocan el duelo de adivinar: solo cambian caras del dado, y los dos ven la carta y el dado cambiado.</p>
<ul>
<li><b>Mazo de partido</b> (55 cartas, 19 situaciones): sale cuatro veces por partido, dos por tiempo. Por ejemplo, Genialidad del crack, Lesión, Fortuna de arquero, Remate de primera, Defensa sólida o Despeje en la línea. Duran una jugada y, si no se usan, vencen al terminar el tiempo. A quién le toca depende de la jugada: quién tiene la pelota, quién va perdiendo o los dos.</li>
<li><b>Mazo de disciplina</b>: sale con cada falta. Advertencia del árbitro (sigue el partido), amarilla (la segunda es roja), tiro libre directo (solo con faltas en el último tercio; en la salida el árbitro solo advierte) o roja (con uno menos, al defender una cara «recupera» pasa a falta o córner). Hay un mazo para cada duración, así que en cualquier partido sale más o menos una roja cada 5 partidos.</li>
</ul>
<h3>Duración</h3>
<p>Después de elegir equipo llegas a la <b>previa del partido</b>: ahí eliges partido <b>corto</b> (unos 3 a 5 minutos), <b>normal</b> (5 a 8) o <b>largo</b> (10 a 14). En una sala manda la previa de quien la crea.</p>
<h3>Empate y penales</h3>
<p>Si el partido termina empatado, se define por penales: cinco por lado y, si siguen iguales, muerte súbita. Cada penal es un duelo de remate contra arquero, con el mismo dado si el arquero no adivina.</p>
<h3>Estadio</h3>
<p>En la previa eliges el estadio (de entrada, el del local), la hora (mañana, tarde o noche), el clima (soleado, nublado o lluvia) y la camiseta de cada equipo: titular o de recambio. Nada de eso cambia el juego, solo cómo se ve. Al final ves los goleadores, la figura del partido y las estadísticas.</p>
<h3>Torneo</h3>
<p>Eliminación directa de 8 o 16 equipos contra la IA, entre clubes o entre selecciones según tu equipo. Los empates se definen por penales y la IA se pone más difícil en cada ronda. El torneo queda guardado en tu celular para seguirlo después.</p>
<h3>Modo carrera</h3>
<p>Elige una liga real y un equipo, y juega la temporada completa contra la IA: solo ida o ida y vuelta, con tabla, goleadores y temporadas siguientes. Puedes simular tus partidos si quieres avanzar rápido. Cada liga guarda su propia carrera en tu celular.</p>
<h3>Liga</h3>
<p>Crea una liga y comparte el código: entran hasta 4 jugadores y se enfrentan todos contra todos (con 2, ida y vuelta). Con 4 los dos partidos de cada fecha se juegan al mismo tiempo; con 3, el que descansa mira el otro partido en vivo. Gana 3 puntos, empata 1 (en la liga no hay penales). Por defecto los partidos son cortos.</p>
<h3>Salas</h3>
<p>Crea una sala, comparte el código o el enlace, y tu rival entra desde su celular. Tienes ${TURN_SECONDS} segundos para cada carta: si se acaba el tiempo, se elige sola.</p>`;

// En los remates los lados se nombran siempre desde el pateador: el arquero que
// se tira a la izquierda tapa el remate a la izquierda.
const SHOT_SITS = ['shot', 'penalty', 'shootout'];

// Describe una elección desde la pantalla de quien mira (su equipo ataca hacia arriba).
function describe(sit, role, id, iAttack) {
  const mirror = { L: 'R', C: 'C', R: 'L' };
  const side = (lane) => ({ L: 'izquierda', C: 'centro', R: 'derecha' })[iAttack || SHOT_SITS.includes(sit) ? lane : mirror[lane]];
  if (sit === 'build') return role === 'att' ? (id === 'C' ? 'Salida por el centro' : `Salida por la ${side(id)}`) : (id === 'C' ? 'Cierra el centro' : `Cierra la ${side(id)}`);
  if (sit === 'shot' || sit === 'penalty' || sit === 'shootout') {
    if (role === 'att') return id === 'C' ? 'Remate al medio' : `Remate a la ${side(id)}`;
    return id === 'C' ? 'Arquero al medio' : `Arquero a la ${side(id)}`;
  }
  const o = optionsFor(sit)[role].find((x) => x.id === id);
  return o ? o.label : id;
}

const MIRROR = { L: 'R', C: 'C', R: 'L' };

// De qué es el dado que se tira.
function diceTitle(ev) {
  if (ev.die === 'buildWin' || ev.die === 'attackWin') return 'Dado de la defensa';
  if (ev.situation === 'build') return 'Dado de la salida';
  if (ev.situation === 'attack') return ev.att === 'dribble' && !ev.match ? 'Dado de la gambeta' : 'Dado del último tercio';
  if (['shot', 'penalty', 'shootout'].includes(ev.situation)) return ev.match ? 'Dado de la atajada' : 'Dado del remate';
  return 'El dado decide';
}

// Datos de una carta vista desde la pantalla de quien mira.
function cardInfo(sit, role, id, iAttack) {
  const screen = iAttack || SHOT_SITS.includes(sit) ? id : MIRROR[id];
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

// ---------- tutorial ----------
// Consejos que aparecen la primera vez que pasa cada cosa en el partido guiado.
const COACH = {
  welcome: ['¡Bienvenido a Calciopoli!', 'Cada jugada es un duelo: tú y tu rival eligen una carta al mismo tiempo, sin ver la del otro. Si el que defiende adivina, corta la jugada. Este es un partido corto contra una IA fácil y sin reloj: tómate tu tiempo.'],
  toss: ['El sorteo', 'Elige cara o sello. Quien gana el sorteo saca primero.'],
  'build-att': ['La salida', 'Tienes la pelota. Elige por dónde sales: izquierda, centro o derecha. Si el rival cierra esa zona, casi siempre te la quita. Si no, llegas al último tercio.'],
  'build-def': ['Defender la salida', 'El rival sale jugando. Elige qué zona cierras. Si adivinas por dónde sale, casi siempre recuperas la pelota.'],
  'attack-att': ['El último tercio', 'Elige centro al área, pase filtrado o gambeta. Cada uno tiene su defensa: cerrar bandas frena el centro, achicar espacios frena el pase y la doble marca frena la gambeta. Si no te adivinan, vas al remate.'],
  'attack-def': ['Defender el área', 'Elige tu defensa: cerrar bandas frena el centro, achicar espacios frena el pase filtrado y la doble marca frena la gambeta.'],
  'shot-att': ['El remate', 'Patea a la izquierda, al medio o a la derecha, mirando desde el pateador. Si el arquero no adivina, casi siempre es gol.'],
  'shot-def': ['Tu arquero', 'Elige hacia dónde se tira tu arquero, mirando desde el que patea. Si adivinas, atajas.'],
  'penalty-att': ['¡Penal!', 'Igual que un remate: elige el lado. Si el arquero no adivina, casi siempre es gol.'],
  'penalty-def': ['Penal en contra', 'Elige hacia dónde se tira tu arquero. Si adivinas, lo atajas.'],
  'corner-att': ['El córner', 'Elige a dónde va el centro: primer palo, punto penal o segundo palo. Si el rival no adivina, vas al cabezazo.'],
  'corner-def': ['Defender el córner', 'Elige qué zona marcas. Si adivinas a dónde va el centro, despejas.'],
  'shootout-att': ['Penales', 'Cinco por lado y luego muerte súbita. Es el mismo duelo: pateador contra arquero.'],
  'shootout-def': ['Penales', 'Cinco por lado y luego muerte súbita. Elige hacia dónde se tira tu arquero.'],
  dice: ['El dado', 'Cuando alguien adivina, o cuando le ganas al arquero, un dado decide el detalle. Arriba ves sus caras: cuántas hay de cada resultado. Las reglas son las mismas para los dos.'],
  card: ['Situación de juego', 'Cuatro veces por partido sale una carta que cambia caras del dado por una jugada, como una lesión o un tiro colocado. Toca la ficha sobre la cancha para ver qué hace.'],
  disciplina: ['La falta', 'Con cada falta el árbitro saca una carta: advertencia, amarilla, tiro libre o roja. Con una roja, el equipo juega con uno menos el resto del partido.'],
};

// ---------- el diario del día después ----------
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

// Titular según cómo fue el partido: goleada, remontada, sobre la hora, penales...
function headline(state, teams, winner) {
  const [a, b] = state.score;
  const goals = state.goals || [];
  const N = (i) => teams[i].name;
  if (state.pens) {
    const w = state.winner, p = state.pens.goals;
    return { kicker: `Definición por penales (${p[w]}-${p[1 - w]})`, title: `¡${N(w)} lo gana desde los doce pasos!` };
  }
  if (winner === -1) {
    if (a === 0) return { kicker: 'Sin goles', title: `${N(0)} y ${N(1)} no se sacan ventaja` };
    if (a >= 3) return { kicker: 'Partidazo', title: `Lluvia de goles y nadie gana: ${a} a ${b}` };
    return { kicker: 'Reparto de puntos', title: `${N(0)} y ${N(1)} igualan ${a} a ${b}` };
  }
  const w = winner, l = 1 - winner, gw = state.score[w], gl = state.score[l], diff = gw - gl;
  const first = goals[0], last = goals.filter((g) => g.side === w).pop();
  if (first && first.side === l && gl > 0) return { kicker: 'Remontada', title: `¡${N(w)} lo da vuelta ante ${N(l)}!` };
  if (diff >= 3) return { kicker: 'Goleada', title: `¡${N(w)} golea ${gw} a ${gl} a ${N(l)}!` };
  if (diff === 1 && last && last.half === 2 && last.minute >= 80) return { kicker: 'Sobre la hora', title: `${N(w)} lo gana en el final` };
  if (gl === 0) return { kicker: 'Valla invicta', title: `${N(w)} se impone y no recibe goles` };
  return { kicker: diff === 1 ? 'Por la mínima' : 'Victoria clara', title: `${N(w)} vence a ${N(l)}` };
}

function newspaper({ state, teams, res, winner, name, mvp, mvpLine, best, stadium, day, tutorial }) {
  const [a, b] = state.score;
  const st = state.stats;
  const h = headline(state, teams, winner);
  const now = new Date();
  const date = `${now.getDate()} de ${MESES[now.getMonth()]} de ${now.getFullYear()}`;
  const log = (state.sit && state.sit.log) || [];
  // Bajada: la figura y lo que marcó el partido.
  const bits = [];
  if (mvp) bits.push(`${name(mvp.side, mvp.i)} (${teams[mvp.side].short}) fue la figura: ${mvpLine(mvp)}.`);
  if (day && day.weather === 'rain') bits.push(`Se jugó bajo la lluvia${day.time === 'night' ? ', de noche' : ''}.`);
  [0, 1].forEach((side) => { if (st.reds && st.reds[side]) bits.push(`${teams[side].name} terminó con ${st.reds[side] === 1 ? 'uno' : st.reds[side]} menos.`); });
  const goalList = (side) => (state.goals || []).filter((g) => g.side === side)
    .map((g) => `<li><b>${fmtMinute(g.minute, g.half)}</b> ${name(side, g.i)}${g.kind === 'penal' ? ' (p)' : ''}${g.assist != null ? `<small>asist. ${name(side, g.assist)}</small>` : ''}</li>`).join('') || '<li class="none">Sin goles</li>';
  const who = (l) => {
    if (l.side === -1) return 'los dos';
    const t = teams[l.side].short;
    return l.player != null && CARDS[l.id].deck === 'disciplina' && l.id !== 'freekick' ? `${name(l.side, l.player)} (${t})` : t;
  };
  const claves = log.length
    ? log.map((l) => `<li><b>${fmtMinute(l.minute ?? 0, l.half)}</b> ${CARDS[l.id].title}<small>${l.id === 'freekick' ? 'para ' : ''}${who(l)}</small></li>`).join('')
    : '<li class="none">Partido sin sobresaltos.</li>';
  const row = (label, k) => `<tr><td>${st[k][0]}</td><td>${label}</td><td>${st[k][1]}</td></tr>`;
  const pens = state.pens ? `<p class="np-pens">Penales: ${state.pens.goals[0]} - ${state.pens.goals[1]}</p>` : '';
  return `<article class="np">
    <div class="np-stamp">${tutorial ? 'Tutorial completado' : res}</div>
    <header class="np-mast"><h1>El Calciopolitano</h1>
      <p><span>${date}</span><span>${stadium ? stadium.name : 'Edición deportiva'}</span><span>$ 500</span></p></header>
    <p class="np-kicker">${h.kicker}</p>
    <h2 class="np-title">${h.title}</h2>
    <div class="np-score"><div><i ${swatchAttrs(teams[0])}></i><b>${teams[0].short}</b><small>${teams[0].name}</small></div><strong>${a} - ${b}</strong><div><i ${swatchAttrs(teams[1])}></i><b>${teams[1].short}</b><small>${teams[1].name}</small></div></div>
    ${pens}
    <p class="np-lead">${bits.join(' ')}</p>
    <div class="np-cols">
      <section><h3>Los goles</h3><ul class="np-goals">${goalList(0)}</ul><ul class="np-goals np-r">${goalList(1)}</ul></section>
      <section><h3>Las claves del partido</h3><ul class="np-keys">${claves}</ul></section>
    </div>
    <section><h3>Los números</h3>
      <table class="np-stats"><tr><th>${teams[0].short}</th><th></th><th>${teams[1].short}</th></tr>${row('Remates', 'shots')}${row('Al arco', 'onTarget')}${row('Córners', 'corners')}${row('Recuperaciones', 'steals')}${st.yellows && st.yellows[0] + st.yellows[1] ? row('Amarillas', 'yellows') : ''}${st.reds && st.reds[0] + st.reds[1] ? row('Rojas', 'reds') : ''}</table>
      <ul class="np-leaders">${best('st', 'Más recuperaciones')}${best('sv', 'Más atajadas')}${best('sh', 'Más remates')}</ul>
    </section>
    ${mvp ? `<aside class="np-mvp"><small>La figura</small><b>${name(mvp.side, mvp.i)}</b><em>${teams[mvp.side].short} · ${mvpLine(mvp)}</em><strong>${mvp.r.toFixed(1)}</strong></aside>` : ''}
  </article>`;
}

// ---------- vista del partido ----------
class MatchView {
  // spectator: sólo mira (la liga, cuando no te toca jugar). endButtons: botones
  // propios para el cuadro final.
  // intro: antes del partido pasa la película de la previa; peer: avisa al otro
  // celular (en una sala, si uno salta la película, se salta en los dos).
  constructor({ mySide, send, isHost, onRematch, spectator = false, endButtons = null, tutorial = false, intro = false, peer = null }) {
    this.mySide = mySide;
    this.introOn = intro;
    this.peer = peer;
    this.tutorial = tutorial;
    this.coachSeen = new Set();
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
    audio.stadium(true);
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
    this.kits = matchKits(teams[0], teams[1], state.setup && state.setup.kits);
    renderer.setup(teams, this.kits, this.mySide, state.setup);
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
      this.kits = matchKits(teams[0], teams[1], state.setup && state.setup.kits);
      renderer.setup(teams, this.kits, this.mySide, state.setup);
      renderer.kickoffNow(0);
      this.paintHud(state);
      this.paintPens(state);
      this.paintFx(state);
      this.lastSeq = -1;
      const st = renderer.stadium;
      const len = state.length && state.length !== 'normal' ? ` Partido ${LENGTHS[state.length].label.toLowerCase()}.` : '';
      this.feed(`¡Bienvenidos! Se juega en ${st.name}${st.city ? `, ${st.city}` : ''}, en ${dayLine(renderer.day)}.${len}`);
      if (this.introOn) await this.playIntro(teams);
      if (this.dead) return;
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
      ev.diceTitle = diceTitle(ev);
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
      if (ev.card) { await this.coach(ev.card.deck === 'disciplina' ? 'disciplina' : 'card'); await this.situationCard(ev.card, state); }
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
    // y lesión y error del DT son malas para el equipo al que le tocan.
    const bad = card.deck === 'disciplina' ? card.id !== 'freekick' : ['lesion', 'errordt'].includes(card.id);
    const good = bad ? card.side !== this.mySide : card.side === this.mySide;
    const title = card.second ? 'Segunda amarilla: ¡roja!' : info.title;
    // La carta se cuenta desde el lado de quien juega: si le salió a él o al
    // rival, y si lo ayuda o lo perjudica. Quien solo mira ve la versión neutra.
    const view = this.spectator ? VIEW_NEUTRAL : both || card.side === this.mySide ? VIEW_MINE : VIEW_THEIRS;
    const tone = this.spectator || both || card.id === 'warning' ? 'amb' : good ? 'fav' : 'con';
    const deckName = card.deck === 'partido' ? 'SITUACIÓN DE JUEGO' : 'DISCIPLINA';
    const ribbon = tone === 'fav' ? 'A TU FAVOR' : tone === 'con' ? 'EN TU CONTRA' : both ? 'PARA LOS DOS' : deckName;
    const sub = this.spectator ? (both ? 'Afecta a los dos equipos' : '') : both ? 'Afecta a los dos equipos' : card.side === this.mySide ? 'Te salió a ti' : 'Le salió al rival';
    if (both) who = `${teams[0].name} y ${teams[1].name}`;
    // La franja ya dice de quién es; el nombre solo hace falta para quien mira
    // o para saber qué jugador vio la tarjeta.
    const showWho = this.spectator || (card.deck === 'disciplina' && card.id !== 'freekick');
    const el = $('#sitcard');
    el.className = `sitcard ${card.deck} k-${card.id} ${tone}`;
    el.innerHTML = `<div class="sc-box"><div class="sc-ribbon">${ribbon}${sub ? `<span>${sub}</span>` : ''}</div><div class="sc-art"><i></i></div><b>${title}</b>${showWho ? `<em>${who}</em>` : ''}${cardBodyHtml(card.second ? 'red' : card.id, view, both, false)}<u class="sc-tap">${this.spectator ? '' : 'Toca para seguir'}</u></div>`;
    // La ilustración con las camisetas del partido (si no se pudo pintar, queda el símbolo).
    const art = renderer && renderer.kits ? cardArt(card.id, renderer.kits, card.side, CARDS.chilena && CARDS.chilena.who === 'def') : null;
    if (art) { const box = el.querySelector('.sc-art'); box.textContent = ''; box.classList.add('pic'); box.appendChild(art); }
    audio.sound(card.id === 'red' || card.id === 'yellow' ? 'whistle' : 'card');
    if (card.id === 'red' || card.id === 'yellow') audio.sound('boo');
    requestAnimationFrame(() => el.classList.add('show'));
    this.feed(both ? `${title}: afecta a los dos equipos.` : `${title}: ${bad ? 'en contra de' : 'a favor de'} ${card.deck === 'disciplina' && card.id !== 'freekick' ? who : t.name}.`);
    // La carta queda hasta que el jugador la toca, para que alcance a leerla.
    // Quien sólo mira el partido no toca nada: se va sola.
    await new Promise((resolve) => {
      const shownAt = performance.now();
      const done = () => {
        clearTimeout(auto);
        el.onclick = null;
        document.removeEventListener('keydown', onKey);
        this.dismissCard = null;
        resolve();
      };
      // Un toque que ya venía de antes no la cierra sin leerla.
      const tap = () => { if (performance.now() - shownAt > 500) { audio.sound('card'); done(); } };
      const onKey = (e) => { if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') { e.preventDefault(); tap(); } };
      const auto = this.spectator ? setTimeout(done, 4500) : null;
      el.onclick = tap;
      document.addEventListener('keydown', onKey);
      this.dismissCard = done;
    });
    el.classList.remove('show');
    await wait(250);
  }

  // Efectos que siguen activos (cartas por usar y expulsados), sobre la cancha.
  paintFx(state) {
    const el = $('#fxbar');
    if (!el) return;
    const shorts = state.teams.map((id) => teamById(id).short);
    const chips = activeEffects(state).map((f) => `<button class="fx-chip k-${f.id}" data-id="${f.id}" data-side="${f.side}"><b>${shorts[f.side]}</b>${f.title}</button>`);
    const reds = state.sit ? state.sit.reds : [0, 0];
    [0, 1].forEach((side) => { for (let k = 0; k < reds[side]; k++) chips.push(`<button class="fx-chip k-red" data-id="red" data-side="${side}"><i></i><b>${shorts[side]}</b>con uno menos</button>`); });
    el.innerHTML = chips.join('');
    // Si la ficha que se estaba leyendo ya no está activa, se cierra su recuadro.
    if (this.fxOpen && !el.querySelector(`.fx-chip[data-id="${this.fxOpen.id}"][data-side="${this.fxOpen.side}"]`)) this.closeFxTip();
  }

  // Al tocar una ficha de efecto activo: un recuadro con lo que hace.
  toggleFxTip(chip) {
    const id = chip.dataset.id, side = +chip.dataset.side;
    if (this.fxOpen && this.fxOpen.id === id && this.fxOpen.side === side) { this.closeFxTip(); return; }
    const info = CARDS[id];
    if (!info || !this.state) return;
    const team = teamById(this.state.teams[side]);
    const mine = this.spectator ? '' : side === this.mySide ? ' (tú)' : ' (rival)';
    const tip = $('#fxtip');
    if (id === 'red') tip.innerHTML = fxTipHtml(this.state, info, id, side, `${team.name}${mine}`);
    else {
      // La misma lectura que la carta: desde tu lado y con a quién ayuda.
      const both = side < 0;
      const view = this.spectator ? VIEW_NEUTRAL : both || side === this.mySide ? VIEW_MINE : VIEW_THEIRS;
      const helps = ['lesion', 'errordt'].includes(id) ? side !== this.mySide : side === this.mySide;
      const tag = this.spectator ? `<em>${team.name}</em>` : both ? '<em>Para los dos equipos</em>' : `<em class="${helps ? 'g' : 'r'}">${helps ? '▲ A tu favor' : '▼ En tu contra'} · ${side === this.mySide ? 'te salió a ti' : 'le salió al rival'}</em>`;
      tip.innerHTML = `<b>${info.title}</b>${tag}<div class="sc-tip">${cardBodyHtml(id, view, both)}</div>`;
    }
    const wrap = document.querySelector('.pitch-wrap').getBoundingClientRect();
    const r = chip.getBoundingClientRect();
    tip.style.top = `${r.bottom - wrap.top + 6}px`;
    tip.style.left = `${Math.max(6, Math.min(r.left - wrap.left, wrap.width - 254))}px`;
    tip.classList.add('show');
    document.querySelectorAll('.fx-chip.open').forEach((c) => c.classList.remove('open'));
    chip.classList.add('open');
    this.fxOpen = { id, side };
  }
  closeFxTip() {
    $('#fxtip').classList.remove('show');
    document.querySelectorAll('.fx-chip.open').forEach((c) => c.classList.remove('open'));
    this.fxOpen = null;
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
    if (ev.outcome === 'clear') return `Remata ${sh.name}... ¡la sacan en la línea!`;
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
    if ($('#remind')) $('#remind').innerHTML = '';
    document.querySelectorAll('.fx-chip.live').forEach((c) => c.classList.remove('live'));
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
    // En el tutorial no hay reloj.
    if (this.tutorial) { $('#timer-bar').style.width = '100%'; $('#timer-bar').classList.remove('low'); return; }
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

  // Tutorial: muestra el consejo una sola vez y espera a que lo cierren.
  coach(key) {
    if (!this.tutorial || this.dead || this.coachSeen.has(key) || !COACH[key]) return Promise.resolve();
    this.coachSeen.add(key);
    const [title, text] = COACH[key];
    const el = $('#coach');
    el.innerHTML = `<div class="coach-box"><small>Tutorial</small><h3>${title}</h3><p>${text}</p><button class="btn primary">Entendido</button></div>`;
    el.classList.add('show');
    return new Promise((done) => {
      el.querySelector('button').onclick = () => { audio.unlock(); el.classList.remove('show'); el.innerHTML = ''; done(); };
    });
  }

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
    this.coach('welcome').then(() => this.coach('toss'));
    if (state.callerSide !== this.mySide) {
      this.clearCards('El rival elige cara o sello…');
      $('#panel-title').textContent = 'Sorteo inicial';
      return;
    }
    this.renderCards('Sorteo: ¿cara o sello?', 'MONEDA', 'coin', [
      { id: 'cara', label: 'Cara', img: coinFaceUrl('cara') },
      { id: 'sello', label: 'Sello', img: coinFaceUrl('sello') },
    ], (call) => this.send({ t: 'call', call }));
  }

  prompt(state) {
    if (this.dead || state.phase !== 'play') return;
    if (this.spectator) { this.watchingPanel('Los dos eligen su carta…'); return; }
    const att = state.poss === this.mySide;
    const role = att ? 'att' : 'def';
    this.coach(`${state.situation}-${role}`);
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
    const shotSit = SHOT_SITS.includes(sit);
    if (!att && opts[0].lane && shotSit) {
      // Remates: izquierda y derecha del pateador, igual que en la escena del remate.
      const name = { L: 'izquierda', R: 'derecha' };
      opts = ['L', 'C', 'R'].map((id) => ({ ...opts.find((x) => x.id === id), label: id === 'C' ? 'Quedarse al medio' : `Volar a la ${name[id]}` }));
    } else if (!att && opts[0].lane) {
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
    opts = opts.map((o) => ({ ...o, img: iconFor(sit, role, o.id, att || shotSit ? o.id : MIRROR[o.id]) }));
    const seq = state.seq;
    this.renderCards(title, att ? 'ATACAS' : 'DEFIENDES', role, opts, (choice) => this.send({ t: 'choice', seq, choice }));
    this.remindFx(state);
  }

  // En la tirada: qué cartas cambiaron este dado (franja arriba) y qué caras puso cada una.
  diceCards(ev, faces) {
    const cards = (ev.dieCards || []).filter((c) => CARDS[c.id]);
    const base = BASE_DICE[ev.die];
    if (!cards.length || !base) return {};
    const count = (l, k) => l.filter((x) => x === k).length;
    const marked = [...new Set(faces)].filter((k) => count(faces, k) > count(base, k));
    const band = document.createElement('div');
    band.className = 'cardbands';
    for (const c of cards) {
      const both = c.side < 0;
      const mine = c.side === this.mySide;
      const bad = c.id === 'red' || ['lesion', 'errordt'].includes(c.id);
      const tone = this.spectator || both ? 'amb' : (bad ? !mine : mine) ? 'fav' : 'con';
      const team = teamById(this.state.teams[c.side]);
      const who = both ? 'los dos' : this.spectator ? team.short : mine ? 'tuya' : 'del rival';
      const title = c.id === 'red' ? 'Con uno menos' : CARDS[c.id].title;
      const el = document.createElement('div');
      el.className = `cardband ${tone}`;
      el.innerHTML = `★ <b>${title}</b> (${who})`;
      band.appendChild(el);
    }
    return { band, marked };
  }

  // Antes de decidir: qué cartas se juegan en esta jugada, contadas desde tu lado.
  remindFx(state) {
    const live = fxInPlay(state);
    document.querySelectorAll('.fx-chip').forEach((c) => c.classList.toggle('live', live.some((f) => f.id === c.dataset.id && f.side === +c.dataset.side)));
    $('#remind').innerHTML = live.map((f) => {
      const mine = f.side === this.mySide;
      const good = ['lesion', 'errordt'].includes(f.id) ? !mine : mine;
      return `<div class="remind ${good ? 'fav' : 'con'}">★ En juego: <b>${CARDS[f.id].title}</b> ${mine ? '(tuya)' : '(del rival)'}</div>`;
    }).join('');
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
    // Goles con autor y minuto, por equipo.
    const name = (side, i) => playerName(teams[side].id, i);
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
    const best = (key, label) => {
      const top = ratings.filter((x) => x.p[key] > 0).sort((x, y) => y.p[key] - x.p[key])[0];
      return top ? `<li><span>${label}</span><b>${name(top.side, top.i)} (${teams[top.side].short})</b><i>${top.p[key]}</i></li>` : '';
    };
    const html = newspaper({ state, teams, res, winner, name, mvp, mvpLine, best, stadium: renderer && renderer.stadium, day: renderer && renderer.day, tutorial: this.tutorial });
    if (this.endButtons) { modal(html, this.endButtons(state), 'news'); return; }
    const btns = [];
    if (this.onRematch) btns.push(['Revancha', 'primary', () => { this.onRematch(); }]);
    btns.push(['Volver al menú', 'ghost', () => { leaveMatch(); }]);
    modal(html, btns, 'news');
  }

  // La película de la previa (estadio, camarín, túnel, himnos y banderas).
  async playIntro(teams) {
    if (this.skipPending || params.get('film') === '0') return;
    this.intro = new Intro({
      teams, kits: this.kits, setup: renderer.day, mySide: this.mySide,
      cue: (c) => audio.intro(c),
      onSkip: () => this.peer && this.peer({ t: 'intro-skip' }),
    });
    try { await this.intro.play(); } catch (e) { console.error(e); }
    this.intro = null;
  }

  // El otro celular saltó la película.
  skipIntro() {
    if (this.intro) this.intro.skip(false);
    else if (!this.state || this.state.phase === 'toss') this.skipPending = true;
  }

  destroy() {
    if (this.intro) this.intro.finish(true);
    this.dead = true; this.stopTimer(); this.queue = [];
    document.body.classList.remove('watching');
    if (this.dismissCard) this.dismissCard();
    $('#sitcard').classList.remove('show');
    $('#coach').classList.remove('show');
    this.closeFxTip();
    audio.stadium(false);
  }
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
  async dice(value, reason, faces, title, ev) {
    if (view) await view.coach('dice');
    const extra = view && ev ? view.diceCards(ev, faces) : {};
    await rollDice($('#dice'), { value, faces, labels: DIE_LABELS, title, reason, sound: (n) => audio.sound(n), ...extra });
  },
  async coin(result, text) {
    await tossCoin($('#coin'), { result, text, sound: (n) => audio.sound(n) });
  },
  fadeOut() { $('#fade').classList.add('on'); return wait(260); },
  fadeIn() { $('#fade').classList.remove('on'); return wait(260); },
};

// ---------- sesiones ----------
let renderer = null;
let view = null;
let session = null; // { cleanup }

function leaveMatch() {
  closeSalaPre();
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

// Partido rápido: elegido el equipo, la previa con el rival que tocó.
function cpuPrematch(awayId = pickCpuOpponent()) {
  openPrematch({
    home: myTeamId, away: awayId, setup: defaultSetup(myTeamId, awayId), length: myLength, level: myLevel, showLevel: true,
    onBack: () => show('screen-play'),
    onStart: ({ setup, length, level }) => {
      saveLength(length);
      myLevel = level;
      try { localStorage.setItem('fdm-level', level); } catch { /* sin storage */ }
      startCpu(level, awayId, setup);
    },
  });
}

function pickCpuOpponent() {
  const pool = TEAMS.filter((t) => t.id !== myTeamId);
  return pool[Math.floor(Math.random() * pool.length)].id;
}

let lastHost = null;
function startCpu(level = 'normal', awayId = pickCpuOpponent(), setup = null) {
  audio.unlock();
  let host, cpu;
  const deliver = (m) => setTimeout(() => { view && view.onMessage(m); cpu.onMessage(m); }, 0);
  host = new Host({ home: myTeamId, away: awayId, callerSide: 0, broadcast: deliver, length: myLength, setup });
  cpu = new Cpu(1, (m) => host.receive(1, m), level);
  lastHost = host;
  view = new MatchView({ mySide: 0, isHost: true, intro: true, send: (m) => host.receive(0, m), onRematch: () => { leaveMatch(); startCpu(level, awayId, setup); } });
  session = { cleanup: () => { host.broadcast = () => {}; } };
  $('#feed').textContent = `Contra la IA (${LEVELS[level].label}). ¡Bienvenidos al estadio!`;
  host.start();
}

// Partido guiado: corto, contra la IA fácil, sin reloj y con consejos.
function startTutorial() {
  audio.unlock();
  closeModal();
  let host, cpu;
  const deliver = (m) => setTimeout(() => { view && view.onMessage(m); cpu.onMessage(m); }, 0);
  host = new Host({ home: myTeamId, away: pickCpuOpponent(), callerSide: 0, broadcast: deliver, length: 'short' });
  cpu = new Cpu(1, (m) => host.receive(1, m), 'easy');
  lastHost = host;
  view = new MatchView({
    mySide: 0, isHost: true, send: (m) => host.receive(0, m), tutorial: true,
    endButtons: () => [['Jugar contra la IA', 'primary', () => { leaveMatch(); startCpu('normal'); }], ['Volver al menú', 'ghost', () => { leaveMatch(); }]],
  });
  session = { cleanup: () => { host.broadcast = () => {}; } };
  $('#feed').textContent = 'Tutorial: partido corto contra la IA fácil.';
  host.start();
}

function startHostGame(conn, guestTeam, homeTeam = myTeamId, setup = null, length = myLength) {
  let host, n = 0, lastMsg = null;
  const deliver = (m) => {
    lastMsg = { ...m, n: ++n };
    conn.send(lastMsg);
    setTimeout(() => view && view.onMessage(m), 0);
  };
  const begin = () => {
    host = new Host({ home: homeTeam, away: guestTeam, callerSide: 1, broadcast: deliver, length, setup });
    host.start();
  };
  const rematch = () => {
    closeModal();
    view.destroy();
    view = makeView();
    begin();
    return false;
  };
  const makeView = () => new MatchView({ mySide: 0, isHost: true, intro: true, peer: (m) => conn.send(m), send: (m) => host.receive(0, m), onRematch: rematch });
  view = makeView();
  conn.on('message', (m) => {
    if (m.t === 'quit') { onRivalQuit(); return; }
    if (m.t === 'intro-skip') { if (view) view.skipIntro(); return; }
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
  if (!view) {
    if (sala) { sala.closed = true; renderSala(); }
    return;
  }
  view.destroy();
  modal('<h2>Conexión perdida</h2><p>Se cortó la conexión con tu rival. Pueden crear una sala nueva.</p>', [['Volver al menú', 'primary', () => leaveMatch()]]);
}

// Sala 1 vs 1: los dos entran, eligen su equipo en la sala y el anfitrión
// arma la previa (duración, estadio, hora y clima) cuando ambos eligieron. En la
// previa cada uno elige su camiseta y el anfitrión empieza el partido.
let sala = null;
let pre = null; // la previa abierta en la sala

function closeSalaPre() { if (pre) { pre.close(); pre = null; } }

const playerRow = (team, tags) => {
  const tg = tags ? `<small>${tags}</small>` : '';
  if (!team) return `<li class="choosing"><span class="kit-swatch"></span><b>Eligiendo equipo…</b>${tg}</li>`;
  const t = teamById(team);
  return `<li><span ${swatchAttrs(t)}></span><b>${t.name}</b>${tg}</li>`;
};

function renderSala() {
  const s = sala;
  if (!s) return;
  const mine = s.isHost ? s.home : s.away;
  $('#lobby-title').textContent = s.isHost ? 'Sala creada' : 'Sala 1 vs 1';
  $('#lobby-code-box').hidden = !s.isHost || s.joined;
  $('#lobby-players').innerHTML = playerRow(s.home, s.isHost ? 'tú, anfitrión' : 'anfitrión')
    + (s.joined ? playerRow(s.away, s.isHost ? 'rival' : 'tú') : '<li class="empty">Esperando al rival…</li>');
  const ready = s.joined && s.home && s.away && !s.closed;
  $('#lobby-team').hidden = !!s.closed;
  $('#lobby-team').textContent = mine ? 'Cambiar equipo' : 'Elegir tu equipo';
  $('#lobby-start').hidden = !(ready && (s.isHost || s.pre));
  $('#lobby-start').textContent = s.isHost ? 'Previa del partido' : 'Ver la previa';
  let wait = '';
  if (s.closed) wait = '';
  else if (!s.joined) wait = 'Esperando al rival…';
  else if (!ready) wait = 'Esperando que ambos elijan equipo…';
  else if (!s.isHost && !s.pre) wait = 'Esperando que el anfitrión arme la previa…';
  $('#lobby-wait').innerHTML = wait ? `<span class="ball-spin"></span> ${wait}` : '';
  $('#lobby-msg').textContent = s.closed ? (s.isHost ? 'Tu rival salió de la sala. Crea una sala nueva.' : 'Se cerró la sala.') : '';
}

function createOnline() {
  audio.unlock();
  $('#room-code').textContent = '·····';
  let conn = null;
  const s = sala = { isHost: true, home: null, away: null, joined: false };
  const sync = () => {
    if (!conn) return;
    conn.send({ t: 'sala', home: s.home, away: s.away });
    if (s.pre) conn.send({ t: 'pre', open: true, ...s.pre });
  };
  const room = createRoom({
    onReady: (code, broker) => {
      $('#room-code').textContent = code;
      const url = `${location.origin}${location.pathname}?sala=${code}&b=${broker}`;
      $('#btn-share').onclick = async () => {
        const text = `¡Te desafío a un partido de Calciopoli! Entra con el código ${code}`;
        try {
          if (navigator.share) await navigator.share({ title: 'Calciopoli', text, url });
          else { await navigator.clipboard.writeText(`${text}: ${url}`); $('#lobby-msg').textContent = 'Enlace copiado.'; }
        } catch { /* cancelado */ }
      };
    },
    onGuest: (c) => {
      conn = c;
      s.joined = true;
      c.on('close', onDisconnect);
      c.on('message', (m) => {
        if (view || sala !== s) return;
        if (m.t === 'team' && teamById(m.team)?.id === m.team) {
          // Si el rival cambia de equipo, la previa se vuelve a armar.
          if (m.team !== s.away && s.pre) { s.pre = null; closeSalaPre(); show('screen-lobby'); conn.send({ t: 'pre', open: false }); }
          s.away = m.team; renderSala(); sync();
        }
        if (m.t === 'kit' && s.pre && (m.kit === 0 || m.kit === 1)) {
          s.pre.setup.kits[1] = m.kit;
          if (pre) pre.update({ side: 1, kit: m.kit });
          sync();
        }
        if (m.t === 'sync' || m.t === 'reconnected') sync();
      });
      sync();
      renderSala();
    },
    onError: (e) => { $('#lobby-msg').textContent = errorText(e); },
  });
  session = { cleanup: () => { if (conn) conn.close(); room.destroy(); if (sala === s) sala = null; }, send: (m) => conn && conn.send(m) };
  $('#lobby-team').onclick = () => pickTeam(() => {
    if (s.home !== myTeamId) s.pre = null;
    s.home = myTeamId; renderSala(); sync();
  }, 'screen-lobby');
  $('#lobby-start').onclick = () => {
    if (view || !conn || !s.home || !s.away) return;
    if (!s.pre) s.pre = { setup: defaultSetup(s.home, s.away), length: myLength };
    pre = openPrematch({
      home: s.home, away: s.away, setup: s.pre.setup, length: s.pre.length, kitSides: [true, false],
      onChange: (st) => { s.pre = { setup: st.setup, length: st.length }; sync(); },
      onBack: () => { pre = null; s.pre = null; conn.send({ t: 'pre', open: false }); renderSala(); show('screen-lobby'); },
      onStart: (st) => {
        pre = null;
        if (view || !conn) return;
        saveLength(st.length);
        s.pre = null;
        startHostGame(conn, s.away, s.home, st.setup, st.length);
      },
    });
    sync();
  };
  $('#btn-cancel').onclick = () => leaveMatch();
  renderSala();
  show('screen-lobby');
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
    team: null,
    brokerHint: hint,
    onOpen: (c, welcome) => {
      conn = c;
      $('#menu-msg').textContent = '';
      $('#btn-join').disabled = false;
      if (welcome && welcome.mode === 'league') { joinLeague(c, welcome, j); return; }
      const s = sala = { isHost: false, home: null, away: null, joined: true };
      $('#lobby-team').onclick = () => pickTeam(() => { s.away = myTeamId; renderSala(); c.send({ t: 'team', team: myTeamId }); }, 'screen-lobby');
      // La previa del anfitrión: el invitado la ve y elige su camiseta.
      const openGuestPre = () => {
        if (!s.pre || view) return;
        pre = openPrematch({
          home: s.home, away: s.away, setup: s.pre.setup, length: s.pre.length, canEdit: false, kitSides: [false, true],
          waitText: 'Esperando que el anfitrión empiece el partido…',
          onChange: (st) => { s.pre.setup.kits[1] = st.setup.kits[1]; c.send({ t: 'kit', kit: st.setup.kits[1] }); },
          onBack: () => { pre = null; s.preHidden = true; renderSala(); show('screen-lobby'); },
        });
      };
      $('#lobby-start').onclick = () => { s.preHidden = false; openGuestPre(); };
      $('#btn-cancel').onclick = () => leaveMatch();
      renderSala();
      show('screen-lobby');
      c.on('close', onDisconnect);
      c.on('message', (m) => {
        if (m.t === 'quit') { onRivalQuit(); return; }
        if (m.t === 'reconnected') { c.send({ t: 'sync', n: lastN }); return; }
        if (m.t === 'pre') {
          if (view || sala !== s) return;
          if (!m.open) { s.pre = null; s.preHidden = false; closeSalaPre(); renderSala(); show('screen-lobby'); return; }
          const mine = s.pre ? s.pre.setup.kits[1] : null;
          s.pre = { setup: { ...m.setup, kits: [...m.setup.kits] }, length: m.length };
          if (mine != null) s.pre.setup.kits[1] = mine;
          if (pre && pre.alive) pre.update({ setup: s.pre.setup, length: s.pre.length });
          else if (!pre && !s.preHidden) openGuestPre();
          renderSala();
          return;
        }
        if (m.t === 'sala') {
          if (view || sala !== s) return;
          s.home = m.home;
          // Si el aviso llega antes que mi elección, no borra el equipo que acabo de elegir.
          if (m.away || !s.away) s.away = m.away;
          renderSala();
          return;
        }
        if (m.t === 'intro-skip') { if (view) view.skipIntro(); return; }
        if (m.t !== 'state') return;
        if (m.n && m.n <= lastN) return; // repetido
        if (m.n) lastN = m.n;
        if (m.ev && m.ev.type === 'start') {
          closeSalaPre();
          if (view) view.destroy();
          closeModal();
          view = new MatchView({ mySide: 1, isHost: false, intro: true, peer: (x) => c.send(x), send: (x) => c.send(x), onRematch: null });
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
  session = { cleanup: () => { if (conn) conn.close(); j.destroy(); sala = null; }, send: (m) => conn && conn.send(m) };
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
  league = { isHost: true, me: 'h', players: [{ id: 'h', team: null }], length: 'short', live: [], lastByMid: {}, table: null, partial: null, lh: null, guests };
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
  // Cada jugador con un equipo distinto: si otro ya lo tomó, no cambia.
  const setLeagueTeam = (id, team) => {
    const p = lg.players.find((x) => x.id === id);
    if (p && teamById(team)?.id === team && !lg.players.some((x) => x.id !== id && x.team === team)) p.team = team;
    lobby();
  };
  lg.setTeam = setLeagueTeam;
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
        const text = `¡Súmate a mi liga de Calciopoli! Entra con el código ${code}`;
        try {
          if (navigator.share) await navigator.share({ title: 'Calciopoli', text, url });
          else { await navigator.clipboard.writeText(`${text}: ${url}`); $('#lg-msg').textContent = 'Enlace copiado.'; }
        } catch { /* cancelado */ }
      };
    },
    onGuest: (conn) => {
      const id = conn.guestId;
      // Cada uno elige su equipo ya dentro de la sala.
      guests.set(id, { conn, n: 0, hist: [] });
      lg.players.push({ id, team: null });
      conn.on('message', (m) => {
        if (m.t === 'team' && !lg.lh) { setLeagueTeam(id, m.team); return; }
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
  if (!lg || !lg.isHost || lg.lh || lg.players.length < 2 || lg.players.some((p) => !p.team)) return;
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
    const tags = [p.id === lg.me ? 'tú' : '', k === 0 ? 'anfitrión' : ''].filter(Boolean).join(', ');
    return playerRow(p.team, tags);
  }).join('') + Array.from({ length: 4 - lg.players.length }, () => '<li class="empty">Lugar libre</li>').join('');
  document.querySelectorAll('#lg-len [data-len]').forEach((b) => {
    b.classList.toggle('on', b.dataset.len === lg.length);
    b.disabled = !lg.isHost;
  });
  const me = lg.players.find((p) => p.id === lg.me);
  $('#lg-team').textContent = me && me.team ? 'Cambiar equipo' : 'Elegir tu equipo';
  const n = lg.players.length;
  const ready = n >= 2 && lg.players.every((p) => p.team);
  $('#lg-start').hidden = !lg.isHost || !ready;
  $('#lg-start').textContent = `Empezar liga (${n} jugadores)`;
  const wait = n < 2 ? 'Esperando jugadores…'
    : !ready ? 'Esperando que todos elijan equipo…'
      : lg.isHost ? (n < 4 ? 'Pueden entrar más jugadores.' : 'Liga completa.') : 'Esperando que el anfitrión empiece la liga…';
  $('#lg-wait').innerHTML = `${ready && lg.isHost ? '' : '<span class="ball-spin"></span> '}${wait}`;
}

// Elegir (o cambiar) el equipo propio dentro de la liga.
function pickLeagueTeam() {
  const lg = league;
  if (!lg || lg.lh || lg.round != null) return;
  const taken = lg.players.filter((p) => p.id !== lg.me && p.team).map((p) => p.team);
  pickTeam(() => {
    if (league !== lg) return;
    if (lg.isHost) lg.setTeam('h', myTeamId);
    else {
      const me = lg.players.find((p) => p.id === lg.me);
      if (me) me.team = myTeamId;
      renderLobby();
      lg.up({ t: 'team', team: myTeamId });
    }
  }, 'screen-league', taken);
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
    const sw = (r) => `<span ${swatchAttrs(teamOfPlayer(r.id))}></span>`;
    $('#tb-champ').innerHTML = `<div class="champ"><small>${top.length > 1 ? 'CAMPEONES' : 'CAMPEÓN'}</small><div class="champ-sw">${top.map(sw).join('')}</div><b>${top.map((r) => teamOfPlayer(r.id).name).join(' y ')}</b><em>${top.length > 1 ? `Empate en la cima con ${rows[0].pts} puntos` : mine ? '¡Eres el campeón!' : `${rows[0].pts} puntos`}</em></div>`;
    if (mine && !lg.cheered) { lg.cheered = true; audio.sound('win'); }
  } else $('#tb-champ').innerHTML = '';
  const dg = (r) => (r.gf - r.gc > 0 ? '+' : '') + (r.gf - r.gc);
  $('#tb-table').innerHTML = '<tr><th></th><th>Equipo</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>DG</th><th>Pts</th></tr>' + rows.map((r, k) => {
    const tm = teamOfPlayer(r.id);
    return `<tr class="${r.id === lg.me ? 'me' : ''}${gone(r.id) ? ' gone' : ''}"><td>${k + 1}</td><td><span ${swatchAttrs(tm)}></span>${tm.short}${gone(r.id) ? ' <small>se fue</small>' : ''}</td><td>${r.pj}</td><td>${r.pg}</td><td>${r.pe}</td><td>${r.pp}</td><td>${dg(r)}</td><td><b>${r.pts}</b></td></tr>`;
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
// En el menú de modos: cuántas copas llevas en la sala de trofeos.
function paintCupButton() {
  const won = loadTrophies();
  const n = TROPHY_LIST.filter((t) => (won[t.id] || []).length).length;
  const total = Object.values(won).reduce((k, l) => k + l.length, 0);
  $('#trophy-count').textContent = total ? `${n} de ${TROPHY_LIST.length} copas distintas · ${total} títulos` : 'Aún no ganas copas';
}

const compOf = (c) => COMPS.find((x) => x.id === c.comp) || FREE_CUP;

// Lista de torneos. Si tienes uno a medias, aparece primero para retomarlo.
function cupMenu() {
  const list = $('#cup-list');
  list.innerHTML = '';
  const saved = loadCup();
  const add = (comp, sub, em, cls, fn) => {
    const b = document.createElement('button');
    b.className = 'league-btn cup-btn' + (cls ? ' ' + cls : '');
    const cv = trophyCanvas(comp.id === 'calc' ? 'calc' : comp.id);
    const img = document.createElement('canvas');
    img.width = cv.width; img.height = cv.height; img.getContext('2d').drawImage(cv, 0, 0);
    b.append(img);
    b.insertAdjacentHTML('beforeend', `<b>${comp.name}</b><small>${sub}</small>${em ? `<em>${em}</em>` : ''}`);
    b.onclick = fn;
    list.appendChild(b);
  };
  if (saved && !champion(saved)) {
    const comp = compOf(saved);
    add(comp, '▸', `Continuar con ${teamById(saved.me).name} · ${ROUND_NAMES[teamsLeft(saved)]}`, 'resume', () => { cup = saved; showCup(); });
  }
  const won = loadTrophies();
  const times = (id) => (won[id] || []).length;
  for (const comp of COMPS) add(comp, `${comp.size} equipos`, `${comp.sub}${times(comp.id) ? ` · ganada ${times(comp.id)} ${times(comp.id) === 1 ? 'vez' : 'veces'}` : ''}`, '', () => pickCupTeam(comp));
  add(FREE_CUP, '8 o 16', `${FREE_CUP.sub}${times('calc') ? ` · ganada ${times('calc')} ${times('calc') === 1 ? 'vez' : 'veces'}` : ''}`, '', () => pickTeam(() => freeCupMenu(), 'screen-cups'));
  list.scrollTop = 0;
  show('screen-cups');
}

// Selecciones por confederación, en el orden en que se muestran, con el mapa de su región.
const CONFED = [
  ['Sudamérica', 'sa', ['arg', 'bra', 'uru', 'col', 'chi', 'per', 'ecu', 'par', 'ven', 'bol']],
  ['Norte y Centroamérica', 'na', ['mex', 'usa', 'can']],
  ['Europa', 'eu', ['esp', 'fra', 'ger', 'eng', 'ita', 'por', 'ned', 'cro', 'bel', 'sui', 'den']],
  ['África', 'af', ['mar', 'sen']],
  ['Asia', 'as', ['jpn', 'kor']],
];

// Equipos de esa copa como en la selección de equipo, en dos pasos: los clubes
// por liga con su bandera y las selecciones por confederación con el mapa de su
// región. Si la copa es de un solo grupo (la Eurocopa), va directo a los equipos.
function pickCupTeam(comp) {
  const pool = new Set(comp.pool);
  const teams = TEAMS.filter((t) => pool.has(t.id));
  const groups = teams.every((t) => t.group === 'Selecciones')
    ? CONFED.map(([name, map, ids]) => ({ name, ids: ids.filter((id) => pool.has(id)), paint: (cv) => paintMap(cv, map) })).filter((g) => g.ids.length)
    : [...new Set(teams.map((t) => t.group))].map((name) => ({ name, ids: teams.filter((t) => t.group === name).map((t) => t.id), paint: (cv) => paintFlag(cv, GROUP_FLAG[name]) }));
  const grid = $('#cup-team-grid');
  const list = $('#cup-team-groups');
  const groupTeams = (g) => {
    $('#cup-team-title').textContent = g.name;
    $('#cup-team-back').onclick = groups.length > 1 ? cupGroups : cupMenu;
    list.hidden = true;
    grid.hidden = false;
    grid.innerHTML = '';
    for (const id of g.ids) {
      const t = teamById(id);
      const b = document.createElement('button');
      b.className = 'team-btn' + (id === myTeamId ? ' sel' : '') + (longName(t) ? ' long' : '');
      b.innerHTML = `<span class="kit-swatch"></span><span>${t.name}</span>`;
      paintSwatch(b.querySelector('.kit-swatch'), t);
      b.onclick = () => confirmCup(comp, id);
      grid.appendChild(b);
    }
    grid.scrollTop = 0;
  };
  function cupGroups() {
    $('#cup-team-title').textContent = comp.name;
    $('#cup-team-back').onclick = cupMenu;
    grid.hidden = true;
    list.hidden = false;
    list.innerHTML = '';
    const mine = teams.find((t) => t.id === myTeamId);
    for (const g of groups) {
      const has = mine && g.ids.includes(mine.id);
      const b = document.createElement('button');
      b.className = 'league-btn flag-btn' + (has ? ' saved' : '');
      b.append(g.paint(document.createElement('canvas')));
      b.insertAdjacentHTML('beforeend', `<b>${g.name}</b><small>${g.ids.length} ${g.ids.length === 1 ? 'equipo' : 'equipos'}</small>${has ? `<em>Último equipo: ${mine.name}</em>` : ''}`);
      b.onclick = () => groupTeams(g);
      list.appendChild(b);
    }
    list.scrollTop = 0;
  }
  if (groups.length > 1) cupGroups();
  else groupTeams({ ...groups[0], name: comp.name });
  show('screen-cup-teams');
}

function confirmCup(comp, me) {
  const saved = loadCup();
  const warn = saved && !champion(saved) ? '<p class="note">Empezar uno nuevo borra el torneo que tienes guardado.</p>' : '';
  const size = Math.min(comp.size, comp.pool.length - (comp.pool.length % 2));
  modal(`<h2>${comp.name}</h2>
    <p>${teamById(me).name} contra la IA, eliminación directa desde ${ROUND_NAMES[size].toLowerCase()}. Si empatas, se define por penales. La IA se pone más difícil en cada ronda.</p>${warn}`,
  [['Empezar', 'primary', () => startCup({ comp: comp.id, me, pool: comp.pool, size })], ['Volver', 'ghost', () => {}]]);
}

// Torneo libre con tu equipo: clubes o selecciones, de 8 o 16.
function freeCupMenu() {
  const mine = teamById(myTeamId);
  const national = mine.group === 'Selecciones';
  const saved = loadCup();
  const warn = saved && !champion(saved) ? '<p class="note">Empezar uno nuevo borra el torneo que tienes guardado.</p>' : '';
  const pool = TEAMS.filter((t) => (t.group === 'Selecciones') === national).map((t) => t.id);
  modal(`<h2>${FREE_CUP.name}</h2>
    <p>Eliminación directa contra la IA con ${mine.name}, entre ${national ? 'selecciones' : 'clubes'}. Si empatas, se define por penales. La IA se pone más difícil en cada ronda.</p>${warn}`,
  [['8 equipos', 'primary', () => startCup({ comp: 'calc', me: myTeamId, pool, size: 8 })], ['16 equipos', '', () => startCup({ comp: 'calc', me: myTeamId, pool, size: 16 })], ['Volver', 'ghost', () => {}]]);
}

function startCup({ comp, me, pool, size }) {
  audio.unlock();
  cup = newCup({ me, pool, size: Math.min(size, pool.length - (pool.length % 2)), length: myLength });
  cup.comp = comp;
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
    head = `<div class="champ"><small>CAMPEÓN · ${compOf(cup).name.toUpperCase()}</small><span ${swatchAttrs(c)}></span><b>${c.name}</b><em>${champ === cup.me ? `¡Ganaste la ${compOf(cup).name}! Ya está en tu sala de trofeos.` : cup.out ? `Quedaste fuera en ${ROUND_NAMES[cup.out].toLowerCase()}.` : ''}</em></div>`;
    if (champ === cup.me && !cup.cheered) { cup.cheered = true; addTrophy(cup.comp || 'calc', cup.me); saveCup(); audio.sound('win'); }
  } else if (playing) {
    const rival = teamById(m.a === cup.me ? m.b : m.a);
    head = `<div class="next-match"><small>${ROUND_NAMES[left].toUpperCase()}</small>
      <div class="vsrow"><span><i ${swatchAttrs(me)}></i>${me.short}</span><b>vs</b><span><i ${swatchAttrs(rival)}></i>${rival.short}</span></div>
      <em>${rival.name} · IA ${LEVELS[levelFor(left)].label.toLowerCase()}</em></div>`;
  } else {
    head = `<div class="next-match out"><small>ELIMINADO</small><b>${me.name} quedó fuera en ${ROUND_NAMES[cup.out].toLowerCase()}.</b></div>`;
  }
  $('#cup-title').textContent = champ ? compOf(cup).name : `${compOf(cup).name} · ${ROUND_NAMES[left]}`;
  $('#cup-head').innerHTML = head;
  // El cuadro, de la ronda actual hacia atrás.
  $('#cup-rounds').innerHTML = cup.rounds.map((r) => `<h3>${ROUND_NAMES[r.length * 2]}</h3>${r.map(cupResultLine).join('')}`).reverse().join('');
  const act = $('#cup-actions');
  act.innerHTML = '';
  const btn = (txt, cls, fn) => { const b = document.createElement('button'); b.className = 'btn ' + cls; b.textContent = txt; b.onclick = fn; act.appendChild(b); };
  if (playing) btn('Jugar partido', 'primary', () => playCupMatch());
  else if (!champ) btn('Simular hasta el final', 'primary', () => { while (!champion(cup)) finishRound(cup, null); saveCup(); showCup(); });
  if (champ) btn('Nuevo torneo', 'primary', () => { cup = null; saveCup(); cupMenu(); });
  if (champ && champ === cup.me) btn('Ver la sala de trofeos', '', () => { cup = null; saveCup(); showTrophies(); });
  btn(champ || !playing ? 'Volver al menú' : 'Salir (queda guardado)', 'ghost', () => { if (champion(cup)) { cup = null; saveCup(); } show('screen-play'); paintCupButton(); });
  show('screen-cup');
}

function playCupMatch() {
  const m = myMatch(cup);
  const rival = m.a === cup.me ? m.b : m.a;
  openPrematch({
    home: cup.me, away: rival, setup: defaultSetup(cup.me, rival), length: cup.length,
    title: ROUND_NAMES[teamsLeft(cup)],
    onBack: () => showCup(),
    onStart: ({ setup, length }) => { cup.length = length; saveCup(); startCupMatch(rival, setup); },
  });
}

function startCupMatch(rival, setup) {
  const level = levelFor(teamsLeft(cup));
  audio.unlock();
  let host, cpu;
  const deliver = (x) => setTimeout(() => { view && view.onMessage(x); cpu.onMessage(x); }, 0);
  host = new Host({ home: cup.me, away: rival, callerSide: 0, broadcast: deliver, length: cup.length, setup });
  cpu = new Cpu(1, (x) => host.receive(1, x), level);
  lastHost = host;
  cupPlaying = true;
  view = new MatchView({ mySide: 0, isHost: true, intro: true, send: (x) => host.receive(0, x), endButtons: (state) => [['Continuar', 'primary', () => cupAfterMatch(resultOf(state, cup.me, rival))]] });
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

// ---------- sala de trofeos ----------
const HOW_TO = { calc: 'Gana un torneo libre (Copa Calciopoli) en Torneo.' };
function trophyHint(id) {
  if (HOW_TO[id]) return HOW_TO[id];
  const comp = COMPS.find((c) => c.id === id);
  if (comp) return `Gana la ${comp.name} en Torneo.`;
  const l = LEAGUES.find((x) => `lg_${x.id}` === id);
  return l ? `Sale campeón de ${l.name} en el modo Carrera.` : '';
}
function showTrophies() {
  const won = loadTrophies();
  const cv = $('#trophy-canvas');
  const room = paintRoom(cv, won, teamById(myTeamId).kit);
  // En el celular la vitrina ocupa todo el ancho; en pantallas grandes, todo el alto.
  const fitW = innerWidth / room.W, fitH = (innerHeight - 96) / room.H;
  const k = innerWidth <= 700 ? fitW : Math.min(fitW, fitH);
  cv.style.width = `${room.W * k}px`; cv.style.height = `${room.H * k}px`;
  const wrap = $('#trophy-room');
  wrap.querySelectorAll('button').forEach((b) => b.remove());
  for (const s of room.slots) {
    const t = TROPHY_LIST.find((x) => x.id === s.id);
    const n = (won[s.id] || []).length;
    const b = document.createElement('button');
    b.style.cssText = `left:${s.x * k}px;top:${s.y * k}px;width:${s.w * k}px;height:${s.h * k}px`;
    b.setAttribute('aria-label', t.name + (n ? `, ganada ${n}` : ', sin ganar'));
    if (n > 1) b.innerHTML = `<i>×${n}</i>`;
    b.onclick = () => trophyDetail(s.id);
    wrap.appendChild(b);
  }
  const kinds = TROPHY_LIST.filter((t) => (won[t.id] || []).length).length;
  const total = Object.values(won).reduce((a, l) => a + l.length, 0);
  $('#trophy-sum').innerHTML = total ? `<b>${kinds} de ${TROPHY_LIST.length}</b> copas distintas · <b>${total}</b> ${total === 1 ? 'título' : 'títulos'}. Toca una para ver el detalle.` : 'Gana torneos y ligas para llenar la vitrina. Toca una copa para ver cómo se consigue.';
  show('screen-trophies');
}
function trophyDetail(id) {
  const t = TROPHY_LIST.find((x) => x.id === id);
  const list = loadTrophies()[id] || [];
  const big = document.createElement('canvas');
  const src = trophyCanvas(id, { sil: !list.length });
  big.width = src.width; big.height = src.height; big.getContext('2d').drawImage(src, 0, 0);
  const fmt = (ts) => new Date(ts).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
  const body = list.length
    ? `<p>Ganada ${list.length} ${list.length === 1 ? 'vez' : 'veces'}.</p><ul>${list.slice().reverse().map((w) => `<li>${teamById(w.team)?.name || w.team} · ${fmt(w.at)}</li>`).join('')}</ul>`
    : `<p>Aún no la ganas. ${trophyHint(id)}</p>`;
  modal(`<div class="trophy-detail"><div id="td-art"></div><h2>${t.name}</h2>${body}</div>`, [['Cerrar', 'primary', () => {}]]);
  $('#td-art').appendChild(big);
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
    b.className = 'league-btn cup-btn';
    const sub = c ? `${teamById(c.me).name} · Temporada ${c.season} · ${seasonOver(c) ? 'terminada' : `fecha ${c.round + 1} de ${totalRounds(c)}`}` : `${l.teams.length} equipos`;
    const cv = trophyCanvas(`lg_${l.id}`);
    const img = document.createElement('canvas');
    img.width = cv.width; img.height = cv.height; img.getContext('2d').drawImage(cv, 0, 0);
    b.append(img);
    b.insertAdjacentHTML('beforeend', `<b>${l.name}</b><small>${l.country}</small><em>${sub}</em>`);
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
    paintSwatch(b.querySelector('.kit-swatch'), t);
    b.onclick = () => careerOptions(l, id);
    grid.appendChild(b);
  }
  show('screen-career-teams');
}

function careerOptions(l, me) {
  const opt = { double: false, level: myLevel, length: myLength };
  const row = (key, label, items) => `<div class="len-row opt-row" data-key="${key}"><small>${label}</small>${items.map(([v, t]) => `<button data-v="${v}">${t}</button>`).join('')}</div>`;
  const n = l.teams.length - 1;
  modal(`<h2>${teamById(me).name}</h2>
    <p>Temporada de ${l.name} contra la IA. En la liga no hay penales: el empate da un punto.</p>
    ${row('double', 'Ruedas', [['0', `Solo ida (${n})`], ['1', `Ida y vuelta (${n * 2})`]])}
    ${row('level', 'IA', Object.entries(LEVELS).map(([k, v]) => [k, v.label]))}
    <p class="note">La duración, el estadio, la hora y el clima se eligen antes de cada partido.</p>`,
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
    head = `<div class="champ"><small>CAMPEÓN</small><span ${swatchAttrs(champ)}></span><b>${champ.name}</b><em>${mine ? '¡Campeón con tu equipo! La copa ya está en tu sala de trofeos.' : `${me.short} terminó ${pos}° con ${t[pos - 1].pts} puntos.`}</em></div>`;
    if (mine && c.cheered !== c.season) { c.cheered = c.season; addTrophy(`lg_${c.league}`, c.me); audio.sound('win'); saveCareer(); }
  } else {
    const m = myFixture(c);
    const home = teamById(m.h), away = teamById(m.a);
    const sw = (tm) => `<i ${swatchAttrs(tm)}></i>`;
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
  btn('Salir (queda guardado)', 'ghost', () => { career = null; show('screen-play'); paintCupButton(); });
  // Tabla completa.
  const dg = (r) => (r.gf - r.gc > 0 ? '+' : '') + (r.gf - r.gc);
  $('#career-table').innerHTML = '<tr><th></th><th>Equipo</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>DG</th><th>Pts</th></tr>' + t.map((r, k) => {
    const tm = teamById(r.id);
    return `<tr class="${r.id === c.me ? 'me' : ''}"><td>${k + 1}</td><td><span ${swatchAttrs(tm)}></span>${tm.short}</td><td>${r.pj}</td><td>${r.pg}</td><td>${r.pe}</td><td>${r.pp}</td><td>${dg(r)}</td><td><b>${r.pts}</b></td></tr>`;
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
  openPrematch({
    home: m.h, away: m.a, setup: defaultSetup(m.h, m.a), length: c.length, level: c.level, showLevel: true,
    title: `Fecha ${c.round + 1}`,
    onBack: () => showCareer(),
    onStart: ({ setup, length, level }) => { c.length = length; c.level = level; saveCareer(); startCareerMatch(setup); },
  });
}

function startCareerMatch(setup) {
  const c = career;
  const m = myFixture(c);
  const mySide = m.h === c.me ? 0 : 1;
  audio.unlock();
  let host, cpu;
  const deliver = (x) => setTimeout(() => { view && view.onMessage(x); cpu.onMessage(x); }, 0);
  host = new Host({ home: m.h, away: m.a, callerSide: mySide, broadcast: deliver, length: c.length, shootout: false, setup });
  cpu = new Cpu(1 - mySide, (x) => host.receive(1 - mySide, x), c.level);
  lastHost = host;
  careerPlaying = true;
  view = new MatchView({ mySide, isHost: true, intro: true, send: (x) => host.receive(mySide, x), endButtons: (state) => [['Continuar', 'primary', () => careerAfterMatch(resultFrom(state))]] });
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
document.querySelectorAll('[data-back]').forEach((b) => (b.onclick = () => show(b.dataset.back || 'screen-menu')));
$('#btn-play').onclick = () => show('screen-play');
$('#btn-room').onclick = () => { const o = $('#room-opts'); o.hidden = !o.hidden; $('#btn-room').classList.toggle('open', !o.hidden); };
document.querySelectorAll('canvas[data-icon]').forEach((c) => paintIcon(c, c.dataset.icon));
$('#btn-cpu').onclick = () => pickTeam(() => cpuPrematch());
$('#btn-quit').onclick = () => confirmQuit();
$('#btn-create').onclick = () => createOnline();
$('#btn-league').onclick = () => createLeague();
$('#btn-cup').onclick = () => cupMenu();
$('#btn-career').onclick = () => showCareerPick();
$('#career-team-back').onclick = () => showCareerPick();
$('#cup-team-back').onclick = () => cupMenu();
$('#btn-trophies').onclick = () => showTrophies();
{ const ic = $('#trophy-icon'), t = trophyCanvas('wc'); ic.width = t.width; ic.height = t.height; ic.getContext('2d').drawImage(t, 0, 0); }
paintCupButton();
$('#lg-start').onclick = () => startLeague();
$('#lg-team').onclick = () => pickLeagueTeam();
$('#lg-leave').onclick = () => leaveLeague();
document.querySelectorAll('#lg-len [data-len]').forEach((b) => (b.onclick = () => {
  if (!league || !league.isHost || league.lh) return;
  league.length = b.dataset.len;
  league.lobby();
}));
$('#btn-join').onclick = () => joinOnline($('#join-code').value);
$('#join-code').addEventListener('keydown', (e) => { if (e.key === 'Enter') joinOnline(e.target.value); });
$('#btn-help').onclick = () => modal(HELP, [['Jugar el tutorial', 'primary', () => startTutorial()], ['Entendido', 'ghost', () => {}]]);
$('#btn-tutorial').onclick = () => startTutorial();
// Fichas de efectos activos: al tocarlas se abre un recuadro con su efecto.
$('#fxbar').addEventListener('click', (e) => {
  const chip = e.target.closest('.fx-chip');
  if (chip && view) { e.stopPropagation(); view.toggleFxTip(chip); }
});
document.addEventListener('click', (e) => {
  if (view && view.fxOpen && !e.target.closest('#fxtip')) view.closeFxTip();
});
const muteBtn = $('#btn-mute');
const paintMute = () => { muteBtn.classList.toggle('off', audio.isMuted()); if ($('#btn-home-mute')) $('#btn-home-mute').classList.toggle('off', audio.isMuted()); };
paintMute();
muteBtn.onclick = () => { audio.unlock(); audio.setMuted(!audio.isMuted()); paintMute(); };
const homeMute = $('#btn-home-mute');
const paintHomeMute = () => homeMute.classList.toggle('off', audio.isMuted());
paintHomeMute();
homeMute.onclick = () => { audio.unlock(); audio.setMuted(!audio.isMuted()); paintHomeMute(); paintMute(); };

const params = new URLSearchParams(location.search);
if (params.get('sala')) {
  $('#join-code').value = params.get('sala').toUpperCase();
  $('#menu-msg').textContent = 'Toca «Unirse» para entrar a la sala.';
  $('#room-opts').hidden = false; $('#btn-room').classList.add('open');
  show('screen-play');
}
if (LENGTHS[params.get('largo')]) myLength = params.get('largo');
if (params.get('demo') === 'cpu') startCpu(params.get('nivel') || 'normal');
// Al abrir el juego en la portada, la entrada animada antes de JUGAR (?intro=0 la omite).
// La portada viene oculta desde el HTML para que no se vea un instante antes.
if (params.get('intro') !== '0' && $('#screen-menu').classList.contains('active')) {
  try { playTitleIntro($('#screen-menu'), $('#logo-art')); } catch (e) { console.warn('entrada', e); $('#screen-menu').classList.remove('intro'); }
} else $('#screen-menu').classList.remove('intro');

// Para pruebas automáticas.
window.__fdm = { get career() { return career; }, get cup() { return cup; }, get view() { return view; }, get league() { return league; }, get renderer() { return renderer; }, get host() { return lastHost; }, randomChoice, icon, cupResult: (r) => cupAfterMatch(r) };
