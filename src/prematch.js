// La previa del partido: después de elegir equipo se decide la duración, el
// estadio, la hora, el clima y (contra la IA) la dificultad. A los costados
// está un jugador de cada equipo con la camiseta elegida, parado en el pasto del
// estadio, que se ve con la luz y el clima que se elijan. Desde acá se empieza.
import { P4 } from './players.js';
import { p4Kit } from './playerkit.js';
import { teamById, kitsClash, hexRgb } from './teams.js';
import { STADIUMS, stadiumFor, stadiumCountry, COUNTRIES, CONTINENTS } from './stadiums.js';
import { flagUrl, teamFlag } from './flags.js';
import { crestOf } from './crests.js';
import { LENGTHS } from './game.js';
import { LEVELS } from './host.js';
import { TIMES, WEATHERS, weatherLabel, LIGHT } from './matchday.js';
import { text as pxText, textW as pxTextW } from './cutscene.js';

const $ = (s, el = document) => el.querySelector(s);
const PX = 2;    // cada píxel del dibujo ocupa 2 px de pantalla
const SC = 12;   // escala de los jugadores (≈72 px de alto)

// ---------- íconos en pixel art (12×12) ----------
const ICON_PAL = { y: '#ffd23f', o: '#f29a1f', r: '#e0603a', m: '#e9eef8', s: '#b9c6e6', c: '#eef1f6', d: '#aab3c2', b: '#7fc4ff', g: '#3f9c3b', w: '#f4f1e6', k: '#5b6475' };
const ICONS = {
  morning: ['............', '.....y......', '..y.....y...', '............', '....oooo....', '...oyyyyo...', '..oyyyyyyo..', 'wwwwwwwwwwww', 'gggggggggggg', '.g.g.g.g.g.g', '............', '............'],
  afternoon: ['............', '............', '...o.......o', '.....rrr....', '....roooor..', '...rooyyoor.', '...royyyyor.', '...royyyyor.', 'kkkkkkkkkkkk', 'k.k.k.k.k.k.', '............', '............'],
  night: ['.....mmm....', '...mmm......', '..mmm....s..', '..mm........', '.mmm........', '.mmm.....s..', '.mmm........', '..mmm.......', '..mmmm...mm.', '...mmmmmmm..', '.....mmm....', '............'],
  clear: ['....y..y....', '.y........y.', '....oooo....', '...oyyyyo...', '..oyyyyyyo..', 'y.oyyyyyyo.y', '..oyyyyyyo..', '...oyyyyo...', '....oooo....', '.y........y.', '....y..y....', '............'],
  clearNight: ['............', '..s.....s...', '.....mmm....', '...mmm......', '..mmm.......', '..mm.....s..', '..mmm.......', '...mmm..mm..', '....mmmmm...', '.s..........', '.......s....', '............'],
  cloudy: ['............', '............', '....ccc.....', '...ccccc.cc.', '.ccccccccccc', 'cccccccccccc', 'cccccccccccc', '.dddddddddd.', '............', '..ccc.......', '.ccccc......', '..ddd.......'],
  rain: ['............', '....ccc.....', '...ccccc.cc.', '.ccccccccccc', 'cccccccccccc', '.dddddddddd.', '............', '..b...b...b.', '.b...b...b..', '............', '...b...b....', '..b...b.....'],
};
function iconSvg(name) {
  const rows = ICONS[name];
  let r = '';
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.') r += `<rect x="${x}" y="${y}" width="1" height="1" fill="${ICON_PAL[ch]}"/>`; }));
  return `<svg viewBox="0 0 12 12" shape-rendering="crispEdges" aria-hidden="true">${r}</svg>`;
}

// ---------- utilidades de color ----------
const rgb = (c) => hexRgb(c.startsWith('#') ? c : '#888');
const css = (v) => `rgb(${v.map((n) => Math.max(0, Math.min(255, Math.round(n)))).join(',')})`;
const mix = (a, b, t) => css(rgb(a).map((v, i) => v + (rgb(b)[i] - v) * t));
const dark = (c, k) => css(rgb(c).map((v) => v * (1 - k)));
const seeded = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// Cielos en franjas (de arriba hacia el horizonte), como un degradé de pixel art.
const SKY = {
  morning: { clear: ['#78acdf', '#8dbbe6', '#a6caeb', '#c3daee', '#dfe8ec', '#f2e5cc'], cloudy: ['#8a929d', '#949ca6', '#a0a7b0', '#acb2ba', '#b8bdc4', '#c3c7cd'], rain: ['#6f7887', '#7a8391', '#868e9b', '#9198a4', '#9ca2ad', '#a6acb6'] },
  afternoon: { clear: ['#3b3366', '#55406f', '#7a4b74', '#a85a6c', '#d6765c', '#f0a256'], cloudy: ['#57505f', '#655c69', '#776a72', '#8a7a7c', '#9c8a84', '#ad998b'], rain: ['#46465a', '#504f62', '#5d5a6b', '#6a6673', '#76717b', '#837c83'] },
  night: { clear: ['#04060d', '#070b16', '#0b1120', '#0f172b', '#141e37', '#1a2644'], cloudy: ['#090b10', '#0c0f15', '#10141b', '#141922', '#181e28', '#1c232f'], rain: ['#07090e', '#0a0d13', '#0e1219', '#12171f', '#161c25', '#1a212c'] },
};

// Escena de fondo: cielo, tribuna con hinchada, carteles, pasto y los dos jugadores.
function paintScene(cv, o, t) {
  const W = cv.width, H = cv.height, g = cv.getContext('2d');
  g.imageSmoothingEnabled = false;
  const { time, weather } = o.setup;
  const st = stadiumFor(o.setup.stadium);
  const night = time === 'night', wet = weather !== 'clear';
  const skyB = Math.round(H * 0.26), standB = Math.round(H * 0.6), boardB = standB + 6;
  // cielo
  const bands = SKY[time][weather];
  for (let i = 0; i < bands.length; i++) {
    const y0 = Math.round((skyB * i) / bands.length), y1 = Math.round((skyB * (i + 1)) / bands.length);
    g.fillStyle = bands[i]; g.fillRect(0, y0, W, y1 - y0 + 1);
    // borde tramado entre franjas
    if (i) { g.fillStyle = bands[i - 1]; for (let x = (i % 2); x < W; x += 2) g.fillRect(x, y0, 1, 1); }
  }
  if (night && !wet) {
    for (let i = 0; i < 40; i++) {
      const x = Math.floor(seeded(i * 3 + 1) * W), y = Math.floor(seeded(i * 3 + 2) * (skyB - 4));
      const tw = Math.sin(t * 2 + i) > 0.85 ? '#ffffff' : '#9fb0d6';
      g.fillStyle = tw; g.fillRect(x, y, 1, 1);
    }
    // luna creciente
    const mx = W - 34, my = 12;
    for (let y = -6; y <= 6; y++) for (let x = -6; x <= 6; x++) {
      if (x * x + y * y > 36 || (x - 3) ** 2 + (y + 1) ** 2 <= 26) continue;
      g.fillStyle = x + y < -3 ? '#ffffff' : '#dfe6f4'; g.fillRect(mx + x, my + y, 1, 1);
    }
  }
  if (!wet && !night) {
    // sol: de mañana alto a la izquierda, de tarde bajo y grande a la derecha
    const morning = time === 'morning';
    const sx = morning ? 22 : W - 30, sy = morning ? Math.round(skyB * 0.55) : skyB - 6, r = morning ? 6 : 9;
    const halo = morning ? 'rgba(255,244,200,0.35)' : 'rgba(255,170,90,0.35)';
    for (let y = -r - 4; y <= r + 4; y++) for (let x = -r - 4; x <= r + 4; x++) {
      const d = Math.hypot(x, y);
      if (d <= r) { g.fillStyle = morning ? (d < r - 2 ? '#fffbe6' : '#ffe99a') : (d < r - 3 ? '#ffd27a' : '#ff9a4a'); g.fillRect(sx + x, sy + y, 1, 1); }
      else if (d <= r + 4 && (x + y) % 2 === 0) { g.fillStyle = halo; g.fillRect(sx + x, sy + y, 1, 1); }
    }
  }
  // nubes que pasan
  {
    const n = wet ? 9 : night ? 0 : 3;
    const top = wet ? (night ? '#262b36' : time === 'afternoon' ? '#8f8089' : '#c9ced5') : time === 'afternoon' ? '#f4b38c' : '#ffffff';
    const body = wet ? (night ? '#1a1e27' : time === 'afternoon' ? '#6d6573' : '#a2a9b3') : time === 'afternoon' ? '#b4708a' : '#dbe7f2';
    const belly = wet ? (night ? '#14171e' : time === 'afternoon' ? '#5a5363' : '#8d95a1') : time === 'afternoon' ? '#8f5a7a' : '#c3d4e6';
    for (let i = 0; i < n; i++) {
      const w = 26 + Math.round(seeded(i * 5 + 3) * 34);
      const x0 = ((Math.round(seeded(i * 5 + 4) * (W + 80) + t * (wet ? 3 : 1.5) * (0.6 + seeded(i) * 0.6)) % (W + 80))) - 60;
      const yb = Math.round(6 + seeded(i * 5 + 5) * (skyB - 4));
      for (let x = 0; x < w; x++) {
        const u = x / w, h = Math.round(3 + Math.sin(u * Math.PI) * (4 + seeded(i) * 5) + Math.sin(u * 8 + i) * 1.4);
        g.fillStyle = body; g.fillRect(x0 + x, yb - h, 1, h);
        g.fillStyle = top; g.fillRect(x0 + x, yb - h, 1, Math.max(1, Math.round(h / 3)));
        g.fillStyle = belly; g.fillRect(x0 + x, yb - 1, 1, 1);
      }
    }
  }
  // torres de iluminación a los dos lados
  const lightsOn = night || wet || time === 'afternoon';
  for (const px of [10, W - 16]) {
    g.fillStyle = '#2a2f3b'; g.fillRect(px + 2, 4, 2, standB - 4);
    g.fillStyle = '#1b1f28'; g.fillRect(px - 2, 0, 10, 6);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) {
      g.fillStyle = lightsOn ? ((i + j) % 2 ? '#fff6c8' : '#ffffff') : '#596173';
      g.fillRect(px - 1 + i * 2, 1 + j * 2, 1, 1);
    }
    if (lightsOn && night) { g.fillStyle = 'rgba(255,248,214,0.10)'; g.fillRect(px - 8, 0, 22, 10); }
  }
  // tribuna: techo, gradas y la hinchada de los dos equipos
  const seat = st.seats[0];
  const roofY = skyB - (st.roof ? 4 : 0);
  if (st.roof) {
    g.fillStyle = st.roof; g.fillRect(0, roofY, W, 4);
    g.fillStyle = dark(st.roof, 0.3); for (let x = 0; x < W; x += 8) g.fillRect(x, roofY, 1, 4);
    g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(0, skyB, W, 2);
  }
  g.fillStyle = dark(seat, 0.55); g.fillRect(0, skyB, W, standB - skyB);
  for (let y = skyB; y < standB; y += 3) { g.fillStyle = dark(seat, (y / 3) % 2 ? 0.35 : 0.45); g.fillRect(0, y, W, 1); }
  const homeK = o.kits[0], awayK = o.kits[1];
  const pal = [homeK.shirt, homeK.shirt, homeK.alt2, awayK.shirt, awayK.alt2, '#e8e2d0', st.seats[0], st.seats[1], '#3a3a3a'];
  for (let y = skyB + 3; y < standB - 2; y += 4) {
    for (let x = (y / 4) % 2 ? 0 : 2; x < W; x += 4) {
      const n = x * 13 + y * 7;
      if (seeded(n + 9) < 0.07) continue;
      // cada hinchada en su mitad, con mezcla en el medio
      const side = x < W / 2 ? (seeded(n) < 0.8 ? 0 : 1) : (seeded(n) < 0.8 ? 1 : 0);
      const c = seeded(n + 4) < 0.7 ? (side ? pal[3 + Math.floor(seeded(n + 1) * 2)] : pal[Math.floor(seeded(n + 1) * 3)]) : pal[5 + Math.floor(seeded(n + 2) * 4)];
      const hop = Math.sin(t * 3 + seeded(n + 3) * 6.28) > 0.85 ? -1 : 0;
      g.fillStyle = c; g.fillRect(x, y + 2 + hop, 3, 2);
      g.fillStyle = seeded(n + 5) < 0.7 ? '#e0a77c' : '#9c6440'; g.fillRect(x + 1, y + hop, 2, 2);
    }
  }
  // letras del estadio en la grada
  if (st.letters) {
    const k = 1, w = pxTextW(st.letters, k) + 6, x = Math.round(W / 2 - w / 2), y = skyB + 4;
    g.fillStyle = dark(seat, 0.1); g.fillRect(x, y - 2, w, 9);
    pxText(g, st.letters, x + 3, y, st.seats[1] === st.seats[0] ? '#ffffff' : st.seats[1], k);
  }
  // carteles con el nombre del estadio
  for (let i = 0; i * 34 < W + 34; i++) {
    const x = i * 34 - Math.round((t * 4) % 34);
    g.fillStyle = i % 2 ? '#14171f' : dark(seat, 0.2); g.fillRect(x, standB, 34, 6);
  }
  const label = st.name.toUpperCase();
  const lw = pxTextW(label);
  g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(Math.round(W / 2 - lw / 2) - 3, standB, lw + 6, 6);
  pxText(g, label, Math.round(W / 2 - lw / 2), standB + 1, '#ffffff');
  // pasto con franjas de corte en perspectiva
  for (let i = 0; i < 9; i++) {
    const y0 = boardB + Math.round((H - boardB) * Math.pow(i / 9, 1.4)), y1 = boardB + Math.round((H - boardB) * Math.pow((i + 1) / 9, 1.4));
    g.fillStyle = i % 2 ? '#3f9c3b' : '#48ab43'; g.fillRect(0, y0, W, y1 - y0);
  }
  for (let i = 0; i < 260; i++) {
    const x = Math.floor(seeded(i * 7 + 11) * W), y = boardB + Math.floor(seeded(i * 7 + 12) * (H - boardB));
    g.fillStyle = seeded(i) < 0.5 ? 'rgba(0,30,0,0.12)' : 'rgba(255,255,200,0.08)'; g.fillRect(x, y, 1, 1);
  }
  g.fillStyle = 'rgba(246,246,236,0.85)'; g.fillRect(0, boardB + 3, W, 1);
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, boardB, W, 2);
  // sombra de la tribuna con sol: cubre el fondo del pasto y corta en diagonal
  if (!wet && !night) {
    const morning = time === 'morning';
    g.fillStyle = morning ? 'rgba(40,60,120,0.25)' : 'rgba(80,40,120,0.3)';
    const h0 = Math.round((H - boardB) * (morning ? 0.18 : 0.38));
    for (let x = 0; x < W; x++) {
      const u = morning ? 1 - x / W : x / W;
      const h = Math.round(h0 * (0.55 + u * 0.9));
      g.fillRect(x, boardB, 1, h);
      if (x % 2) g.fillRect(x, boardB + h, 1, 1);
    }
  }
  // luz del día sobre tribuna y pasto
  const [tStand, tGrass] = LIGHT[time][weather];
  g.save();
  if (wet) { g.globalCompositeOperation = 'saturation'; g.fillStyle = 'rgba(128,128,128,0.3)'; g.fillRect(0, skyB, W, H - skyB); }
  g.globalCompositeOperation = 'multiply';
  g.fillStyle = tStand; g.fillRect(0, roofY, W, standB - roofY);
  g.fillStyle = tGrass; g.fillRect(0, standB, W, H - standB);
  if (night) {
    // los focos caen al centro de la cancha
    g.globalCompositeOperation = 'screen';
    const gr = g.createRadialGradient(W / 2, H * 0.85, 4, W / 2, H * 0.85, W * 0.7);
    gr.addColorStop(0, 'rgba(255,246,210,0.22)'); gr.addColorStop(1, 'rgba(255,246,210,0)');
    g.fillStyle = gr; g.fillRect(0, standB, W, H - standB);
  }
  g.restore();
  // los dos jugadores, cada uno en su columna
  o.players.forEach((p, side) => {
    if (!p.spr) return;
    const s = p.spr, x = Math.round(p.x), y = Math.round(p.y || H - 6);
    // sombra según la luz
    g.fillStyle = 'rgba(0,0,0,0.32)';
    g.fillRect(x - 9, y - 1, 18, 2);
    if (!wet && !night) { g.fillStyle = 'rgba(0,0,0,0.22)'; const len = time === 'morning' ? 14 : 22; g.fillRect(time === 'morning' ? x + 9 : x - 9 - len, y - 2, len, 2); }
    if (night) { g.fillStyle = 'rgba(0,0,0,0.1)'; g.fillRect(x - 16, y, 8, 1); g.fillRect(x + 8, y, 8, 1); }
    const im = p.lit;
    g.drawImage(im, Math.round(x - s.ox), Math.round(y - s.oy));
    if (side === 0 && o.ball) g.drawImage(o.ball, x + 7, y - o.ball.height + 1);
  });
  // lluvia
  if (weather === 'rain') {
    g.fillStyle = 'rgba(40,55,85,0.18)'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 130; i++) {
      const v = 0.8 + seeded(i * 3) * 0.6;
      const y = Math.round(((seeded(i * 3 + 1) + t * v * 0.9) % 1) * (H + 10)) - 5;
      const x = Math.round(((((seeded(i * 3 + 2) - t * v * 0.15) % 1) + 1) % 1) * (W + 6));
      g.fillStyle = i % 3 ? 'rgba(205,220,240,0.55)' : 'rgba(235,242,252,0.8)';
      g.fillRect(x, y, 1, 3); g.fillRect(x - 1, y + 3, 1, 2);
    }
    for (let i = 0; i < 24; i++) {
      const f = (t * 1.6 + seeded(i * 5)) % 1;
      if (f > 0.18) continue;
      const k = Math.floor(t * 1.6 + seeded(i * 5));
      const x = Math.floor(seeded(i * 5 + k * 17) * W), y = boardB + 4 + Math.floor(seeded(i * 5 + k * 23 + 1) * (H - boardB - 6));
      g.fillStyle = 'rgba(225,235,250,0.7)';
      if (f < 0.07) g.fillRect(x, y - 1, 1, 1); else { g.fillRect(x - 1, y, 1, 1); g.fillRect(x + 1, y, 1, 1); }
    }
  }
}

// Primera fila con píxeles del dibujo (el sprite trae aire arriba de la cabeza).
function topRow(cv) {
  const { width: w, height: h } = cv, d = cv.getContext('2d').getImageData(0, 0, w, h).data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 40) return y;
  return 0;
}

// El jugador iluminado como la escena (un poco menos, para que se luzca la camiseta).
function litSprite(spr, setup) {
  const c = document.createElement('canvas');
  c.width = spr.cv.width; c.height = spr.cv.height;
  const g = c.getContext('2d');
  g.drawImage(spr.cv, 0, 0);
  const tint = mix(LIGHT[setup.time][setup.weather][1], '#ffffff', setup.time === 'night' ? 0.25 : 0.45);
  g.globalCompositeOperation = 'multiply'; g.fillStyle = tint; g.fillRect(0, 0, c.width, c.height);
  g.globalCompositeOperation = 'destination-in'; g.drawImage(spr.cv, 0, 0);
  return c;
}

// Lista de estadios: los de los dos equipos primero, después todos (sin repetir).
function stadiumList(homeId, awayId) {
  const seen = new Set(), out = [];
  const add = (id) => { const s = STADIUMS[id]; if (!s) return; const k = `${s.name}|${s.city}`; if (seen.has(k)) return; seen.add(k); out.push(id); };
  add(homeId); add(awayId);
  Object.keys(STADIUMS).sort((a, b) => STADIUMS[a].name.localeCompare(STADIUMS[b].name, 'es')).forEach(add);
  return out;
}

const LOOKS = [
  { skin: '#e0a77c', hair: '#3a2414', style: 'curly' }, { skin: '#9c6440', hair: '#141010', style: 'buzz' }, { skin: '#f1c7a0', hair: '#7a5530', style: 'fringe' },
  { skin: '#c68657', hair: '#2a1a10', style: 'short' }, { skin: '#6e4428', hair: '#111111', style: 'short' }, { skin: '#f5d3b5', hair: '#d9b25a', style: 'long' },
];
const lookFor = (id, side) => LOOKS[([...id].reduce((a, c) => a + c.charCodeAt(0), 0) + side * 3) % LOOKS.length];
const kitOf = (team, k) => (k ? team.away : team.kit);

// ---------- la pantalla ----------
// o: { home, away, setup, length, level, showLevel, canEdit, kitSides, title,
//      startLabel, waitText, onChange(state), onStart(state), onBack() }
// state: { setup, length, level }
export function openPrematch(o) {
  const el = $('#screen-pre');
  const home = teamById(o.home), away = teamById(o.away);
  const teams = [home, away];
  const st = { setup: { ...o.setup, kits: [...o.setup.kits] }, length: o.length, level: o.level || 'normal' };
  const canEdit = o.canEdit !== false;
  const kitSides = o.kitSides || [true, true];
  const stadia = stadiumList(home.id, away.id);
  if (!stadia.includes(st.setup.stadium)) stadia.unshift(st.setup.stadium);
  let raf = 0, alive = true, last = 0;
  const cv = $('#pre-scene');
  const scene = { setup: st.setup, kits: [], players: [{}, {}], ball: P4.ball(3, 0.4) };

  $('#pre-title').textContent = o.title || 'Previa del partido';
  $('#pre-start').textContent = o.startLabel || '¡A la cancha!';
  $('#pre-start').hidden = !o.onStart;
  $('#pre-wait').textContent = o.onStart ? '' : (o.waitText || '');
  [0, 1].forEach((side) => {
    const box = $(`.pre-side[data-side="${side}"]`, el);
    $('.pre-team', box).textContent = teams[side].name;
    $('.pre-role', box).textContent = side === 0 ? 'Local' : 'Visita';
  });

  const seg = (key, entries, cur) => `<div class="pre-seg" data-key="${key}">${entries.map(([id, label, ic]) => `<button data-v="${id}" class="${id === cur ? 'on' : ''}"${canEdit ? '' : ' disabled'}>${ic ? `<i class="pre-ic">${iconSvg(ic)}</i>` : ''}<span>${label}</span></button>`).join('')}</div>`;
  const renderOpts = () => {
    const s = st.setup, sd = stadiumFor(s.stadium);
    const idx = stadia.indexOf(s.stadium);
    const tag = s.stadium === home.id ? 'De local' : s.stadium === away.id ? 'De la visita' : 'Neutral';
    $('#pre-opts').innerHTML = `
      <div class="pre-row"><small>Duración</small>${seg('length', Object.entries(LENGTHS).map(([k, v]) => [k, v.label]), st.length)}</div>
      <div class="pre-row"><small>Estadio</small><div class="pre-stadium">
        <button data-step="-1"${canEdit ? '' : ' disabled'} aria-label="Estadio anterior">◂</button>
        <button class="pre-st-name"${canEdit ? '' : ' disabled'}><b>${sd.name}</b><em>${sd.city ? `${sd.city} · ` : ''}${tag}</em></button>
        <button data-step="1"${canEdit ? '' : ' disabled'} aria-label="Estadio siguiente">▸</button>
      </div><i class="pre-count">${idx + 1} de ${stadia.length}</i></div>
      <div class="pre-row"><small>Hora</small>${seg('time', Object.entries(TIMES).map(([k, v]) => [k, v.label, k]), s.time)}</div>
      <div class="pre-row"><small>Clima</small>${seg('weather', Object.keys(WEATHERS).map((k) => [k, weatherLabel(k, s.time), k === 'clear' && s.time === 'night' ? 'clearNight' : k]), s.weather)}</div>
      ${o.showLevel ? `<div class="pre-row"><small>Dificultad de la IA</small>${seg('level', Object.entries(LEVELS).map(([k, v]) => [k, v.label]), st.level)}</div>` : ''}`;
  };
  const renderKits = () => {
    [0, 1].forEach((side) => {
      const box = $(`.pre-side[data-side="${side}"]`, el);
      $('.pre-kits', box).innerHTML = [0, 1].map((k) => {
        const kit = kitOf(teams[side], k);
        return `<button data-kit="${k}" class="${st.setup.kits[side] === k ? 'on' : ''}"${kitSides[side] ? '' : ' disabled'}><i class="kit-swatch" style="background:${swatch(kit)}"></i><span>${k ? 'Recambio' : 'Titular'}</span></button>`;
      }).join('');
    });
    const k0 = kitOf(home, st.setup.kits[0]), k1 = kitOf(away, st.setup.kits[1]);
    $('#pre-msg').textContent = kitsClash(k0, k1) ? 'Ojo: las dos camisetas se parecen mucho.' : '';
  };
  const buildPlayers = () => {
    scene.kits = [kitOf(home, st.setup.kits[0]), kitOf(away, st.setup.kits[1])];
    scene.players = [0, 1].map((side) => {
      const kit = p4Kit(scene.kits[side], false, lookFor(teams[side].id, side), 10);
      const spr = P4.sprite(P4.POSES.idleFront(), kit, 'front', SC, 'pre');
      const old = scene.players[side] || {};
      return { spr, lit: litSprite(spr, st.setup), x: old.x || 0, y: old.y || 0 };
    });
    paintCrests();
  };
  // El escudo del club (o la bandera de la selección) sobre la cabeza de cada jugador.
  const paintCrests = () => {
    [0, 1].forEach((side) => {
      const t = teams[side], box = $(`.pre-side[data-side="${side}"] .pre-crest`, el);
      const nat = t.group === 'Selecciones' && teamFlag(t.id);
      const c = nat ? null : crestOf(t.short);
      const url = nat ? flagUrl(teamFlag(t.id)) : c ? c.toDataURL() : null;
      box.innerHTML = url ? `<img src="${url}" alt="${t.name}" class="${nat ? 'flag' : ''}">` : '';
      const { spr } = scene.players[side];
      box.style.bottom = `${(spr.oy - topRow(spr.cv)) * PX + 14}px`;
    });
  };
  const layout = () => {
    const r = el.querySelector('.pre-stage').getBoundingClientRect();
    const w = Math.max(60, Math.round(r.width / PX)), h = Math.max(60, Math.round(r.height / PX));
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    cv.style.width = `${w * PX}px`; cv.style.height = `${h * PX}px`;
    [0, 1].forEach((side) => {
      const b = $(`.pre-side[data-side="${side}"] .pre-fig`, el).getBoundingClientRect();
      scene.players[side].x = (b.left - r.left + b.width / 2) / PX;
      scene.players[side].y = (b.bottom - r.top) / PX - 2;
    });
  };
  const changed = () => { if (o.onChange) o.onChange(snapshot()); };
  const snapshot = () => ({ setup: { ...st.setup, kits: [...st.setup.kits] }, length: st.length, level: st.level });

  const frame = (now) => {
    if (!alive) return;
    raf = requestAnimationFrame(frame);
    if (now - last < 50) return;
    last = now;
    paintScene(cv, scene, now / 1000);
  };

  el.onclick = (e) => {
    const b = e.target.closest('button');
    if (!b || b.disabled) return;
    if (b.id === 'pre-back') { close(); o.onBack && o.onBack(); return; }
    if (b.id === 'pre-start') { if (o.onStart) { const s = snapshot(); close(); o.onStart(s); } return; }
    const segEl = b.closest('.pre-seg');
    if (segEl && canEdit) {
      const key = segEl.dataset.key, v = b.dataset.v;
      if (key === 'length') st.length = v;
      else if (key === 'level') st.level = v;
      else st.setup[key] = v;
      if (key === 'time' || key === 'weather') buildPlayers();
      renderOpts(); layout(); changed(); return;
    }
    if (b.dataset.step && canEdit) {
      const i = stadia.indexOf(st.setup.stadium);
      st.setup.stadium = stadia[(i + Number(b.dataset.step) + stadia.length) % stadia.length];
      renderOpts(); layout(); changed(); return;
    }
    if (b.classList.contains('pre-st-name') && canEdit) { openList(); return; }
    const kitBtn = b.closest('[data-kit]');
    if (kitBtn) {
      const side = Number(kitBtn.closest('.pre-side').dataset.side);
      if (!kitSides[side]) return;
      st.setup.kits[side] = Number(kitBtn.dataset.kit);
      buildPlayers(); layout(); renderKits(); changed();
      return;
    }
    const pick = b.closest('[data-stadium]');
    if (pick) { st.setup.stadium = pick.dataset.stadium; closeList(); renderOpts(); layout(); changed(); return; }
    if (b.id === 'pre-list-close') closeList();
    if (b.dataset.country) openList(b.dataset.country);
    if (b.hasAttribute('data-countries')) openList();
  };
  // Todos los estadios, separados por continente y país (como los equipos).
  const openList = (country) => {
    const box = $('#pre-list');
    const cur = st.setup.stadium;
    const row = (id) => { const sd = STADIUMS[id]; return `<button data-stadium="${id}" class="${id === cur ? 'on' : ''}"><b>${sd.name}</b><small>${sd.city || ''}</small></button>`; };
    const flag = (c) => `<img class="pre-flag" src="${flagUrl(COUNTRIES[c][0])}" alt="">`;
    if (country) {
      const ids = stadia.filter((id) => stadiumCountry(id) === country);
      box.innerHTML = `<header><button data-countries aria-label="Volver">◂</button>${flag(country)}<b>${country}</b><button id="pre-list-close" aria-label="Cerrar">✕</button></header><div>${ids.map(row).join('')}</div>`;
    } else {
      const count = {};
      for (const id of stadia) { const c = stadiumCountry(id); if (c) count[c] = (count[c] || 0) + 1; }
      const mineC = stadiumCountry(cur);
      const groups = CONTINENTS.map((k) => {
        const cs = Object.keys(count).filter((c) => COUNTRIES[c][1] === k).sort((x, y) => x.localeCompare(y, 'es'));
        return cs.length ? `<h4>${k}</h4><div class="pre-countries">${cs.map((c) => `<button data-country="${c}" class="${c === mineC ? 'on' : ''}">${flag(c)}<b>${c}</b><small>${count[c]}</small></button>`).join('')}</div>` : '';
      }).join('');
      box.innerHTML = `<header><b>Elige el estadio</b><button id="pre-list-close" aria-label="Cerrar">✕</button></header><div>
        <h4>De los equipos</h4>${stadia.slice(0, 2).map(row).join('')}${groups}</div>`;
    }
    box.hidden = false;
    box.querySelector('div').scrollTop = 0;
    const on = country && box.querySelector('[data-stadium].on');
    if (on) on.scrollIntoView({ block: 'center' });
  };
  const closeList = () => { $('#pre-list').hidden = true; };
  const onResize = () => layout();
  function close() {
    alive = false;
    cancelAnimationFrame(raf);
    removeEventListener('resize', onResize);
    closeList();
    el.onclick = null;
  }

  buildPlayers(); renderOpts(); renderKits(); closeList();
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s === el));
  layout();
  addEventListener('resize', onResize);
  raf = requestAnimationFrame(frame);

  return {
    get state() { return snapshot(); },
    // Cambios que llegan del otro teléfono (la sala): la previa del anfitrión o
    // la camiseta del rival.
    update(next) {
      if (!alive) return;
      if (next.setup) {
        const kits = st.setup.kits;
        st.setup = { ...next.setup, kits: [...(next.setup.kits || kits)] };
        kitSides.forEach((mine, i) => { if (mine) st.setup.kits[i] = kits[i]; });
        scene.setup = st.setup;
      }
      if (next.length) st.length = next.length;
      if (next.kit != null && next.side != null && !kitSides[next.side]) st.setup.kits[next.side] = next.kit;
      buildPlayers(); layout(); renderOpts(); renderKits();
    },
    close,
    get alive() { return alive; },
  };
}

// Muestra de la camiseta (la misma idea que el botón de equipo).
function swatch(kit) {
  const { shirt, alt2, pattern, shorts } = kit;
  const body = {
    stripes: `repeating-linear-gradient(90deg, ${shirt} 0 4px, ${alt2} 4px 8px)`,
    hoops: `repeating-linear-gradient(180deg, ${shirt} 0 4px, ${alt2} 4px 8px)`,
    band: `linear-gradient(180deg, ${shirt} 0 30%, ${alt2} 30% 48%, ${shirt} 48%)`,
    sash: `linear-gradient(135deg, ${shirt} 0 38%, ${alt2} 38% 58%, ${shirt} 58%)`,
    center: `linear-gradient(90deg, ${shirt} 0 34%, ${alt2} 34% 66%, ${shirt} 66%)`,
    sleeves: `linear-gradient(90deg, ${alt2} 0 18%, ${shirt} 18% 82%, ${alt2} 82%)`,
  }[pattern] || shirt;
  return `linear-gradient(180deg, transparent 0 70%, ${shorts} 70%), ${body}`;
}
