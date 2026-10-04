// Sonidos sintetizados con WebAudio (sin archivos): silbato, patadas y el estadio
// entero: murmullo, cánticos de la hinchada, la banda (bombo, redoblante,
// trompeta) y sus reacciones al gol, al palo, a la atajada y a las tarjetas.
let ctx = null;
let muted = false;
let master = null; // todo pasa por aquí: el botón de silencio lo baja a 0
let stadiumBus = null; // hinchada y banda: lejanas y con eco de estadio
let bedGain = null; // murmullo de fondo
let noise = null;
let claps = null;

try { muted = localStorage.getItem('fdm-muted') === '1'; } catch { /* sin storage */ }

export function isMuted() { return muted; }
export function setMuted(m) {
  muted = m;
  try { localStorage.setItem('fdm-muted', m ? '1' : '0'); } catch { /* sin storage */ }
  if (master) master.gain.setTargetAtTime(m ? 0 : 1, ctx.currentTime, 0.05);
}

export function unlock() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 1;
  master.connect(ctx.destination);
  noise = noiseBuffer(3);
  buildStadium();
  if (stadiumOn) startChants();
}

function noiseBuffer(sec) {
  const b = ctx.createBuffer(1, ctx.sampleRate * sec, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

// Aplausos: miles de palmas cortas repartidas al azar.
function clapBuffer(sec) {
  const sr = ctx.sampleRate;
  const b = ctx.createBuffer(1, sr * sec, sr);
  const d = b.getChannelData(0);
  const len = Math.floor(sr * 0.012);
  for (let k = 0; k < sec * 260; k++) {
    const at = Math.floor(Math.random() * (d.length - len));
    const amp = 0.2 + Math.random() * 0.5;
    for (let i = 0; i < len; i++) d[at + i] += (Math.random() * 2 - 1) * amp * Math.exp(-i / (len / 5));
  }
  return b;
}

// Eco de estadio: una respuesta al impulso inventada (ruido que se apaga).
function reverbImpulse(sec) {
  const sr = ctx.sampleRate;
  const b = ctx.createBuffer(2, sr * sec, sr);
  for (let c = 0; c < 2; c++) {
    const d = b.getChannelData(c);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
  }
  return b;
}

function buildStadium() {
  // Bus del estadio: suena lejos (sin agudos) y con eco.
  stadiumBus = ctx.createGain();
  stadiumBus.gain.value = 0.9;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 3200;
  const verb = ctx.createConvolver();
  verb.buffer = reverbImpulse(2.4);
  const wet = ctx.createGain(); wet.gain.value = 0.45;
  stadiumBus.connect(lp);
  lp.connect(master);
  lp.connect(verb).connect(wet).connect(master);

  // Murmullo: ruido filtrado como miles de voces lejanas.
  bedGain = ctx.createGain();
  bedGain.gain.value = 0.03;
  [[520, 0.7, 1], [260, 0.9, 0.8]].forEach(([freq, q, v]) => {
    const src = ctx.createBufferSource();
    src.buffer = noise; src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain(); g.gain.value = v;
    src.connect(f).connect(g).connect(bedGain);
    src.start(0, Math.random() * 2);
  });
  bedGain.connect(stadiumBus);
  claps = clapBuffer(4);
}

// El murmullo sube o baja (al acercarse al arco, después de un gol…).
function swell(level, at = 0, tau = 0.4) {
  if (!bedGain) return;
  bedGain.gain.setTargetAtTime(level, ctx.currentTime + at, tau);
}
const bedLevel = () => (stadiumOn ? 0.055 : 0.03);

function burst({ dur = 0.08, freq = 900, q = 1, vol = 0.4, type = 'lowpass', at = 0, out = master }) {
  const src = ctx.createBufferSource();
  src.buffer = noise;
  const f = ctx.createBiquadFilter();
  f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = ctx.createGain();
  const t0 = ctx.currentTime + at;
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  src.connect(f).connect(g).connect(out);
  src.start(t0, Math.random() * Math.max(0, 2.9 - dur), dur + 0.05);
}

function tone({ freq = 440, dur = 0.2, vol = 0.15, type = 'square', at = 0, slide = 0, out = master }) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  const t0 = ctx.currentTime + at;
  o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.linearRampToValueAtTime(freq + slide, t0 + dur);
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  o.connect(g).connect(out);
  o.start(t0); o.stop(t0 + dur + 0.02);
}

function whistle(at = 0, dur = 0.35) {
  const o = ctx.createOscillator();
  const lfo = ctx.createOscillator();
  const lg = ctx.createGain();
  const g = ctx.createGain();
  const t0 = ctx.currentTime + at;
  o.type = 'sine'; o.frequency.value = 2900;
  lfo.frequency.value = 38; lg.gain.value = 140;
  lfo.connect(lg).connect(o.frequency);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(0.12, t0 + 0.02);
  g.gain.setValueAtTime(0.12, t0 + dur - 0.05);
  g.gain.linearRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(master);
  o.start(t0); lfo.start(t0); o.stop(t0 + dur + 0.05); lfo.stop(t0 + dur + 0.05);
}

// ---------- la hinchada canta ----------
const VOWELS = { a: [730, 1090], e: [530, 1840], i: [300, 2200], o: [500, 860], u: [320, 800] };
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

// Un coro de muchas gargantas: osciladores desafinados y desfasados, pasados
// por filtros de vocal. notes: [{ m: nota MIDI | null (silencio), d: segundos, v: vocal, slide }]
function choir(t0, notes, { n = 10, vol = 0.03, out = stadiumBus } = {}) {
  const sum = ctx.createGain();
  const f1 = ctx.createBiquadFilter(), f2 = ctx.createBiquadFilter();
  f1.type = f2.type = 'bandpass'; f1.Q.value = 5; f2.Q.value = 7;
  const g2 = ctx.createGain(); g2.gain.value = 0.6;
  const outG = ctx.createGain(); outG.gain.value = vol;
  sum.connect(f1).connect(outG);
  sum.connect(f2).connect(g2).connect(outG);
  outG.connect(out);
  let t = t0;
  for (const nt of notes) {
    const [a, b] = VOWELS[nt.v || 'o'];
    f1.frequency.setTargetAtTime(a, t, 0.03);
    f2.frequency.setTargetAtTime(b, t, 0.03);
    t += nt.d;
  }
  const end = t;
  const vib = ctx.createOscillator(); vib.frequency.value = 5.2;
  const vibG = ctx.createGain(); vibG.gain.value = 12;
  vib.connect(vibG);
  vib.start(t0); vib.stop(end + 0.3);
  for (let i = 0; i < n; i++) {
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = mtof(notes.find((x) => x.m != null).m);
    o.detune.value = (Math.random() - 0.5) * 45;
    vibG.connect(o.detune);
    const g = ctx.createGain();
    g.gain.value = 0;
    o.connect(g).connect(sum);
    const jit = Math.random() * 0.06;
    let tt = t0;
    for (const nt of notes) {
      if (nt.m != null) {
        const s = tt + jit;
        o.frequency.setTargetAtTime(mtof(nt.m), s, 0.02);
        if (nt.slide) o.frequency.setTargetAtTime(mtof(nt.m + nt.slide), s + nt.d * 0.3, nt.d * 0.35);
        g.gain.setTargetAtTime(1, s, 0.03);
        g.gain.setTargetAtTime(0, s + nt.d * (nt.legato ? 0.98 : 0.82), 0.04);
      }
      tt += nt.d;
    }
    o.start(t0); o.stop(end + 0.4);
  }
  // Aire: también se oye el soplido de tantas voces juntas.
  const br = ctx.createBufferSource(); br.buffer = noise; br.loop = true;
  const bg = ctx.createGain(); bg.gain.value = 0;
  br.connect(bg).connect(sum);
  bg.gain.setTargetAtTime(0.35, t0, 0.05);
  bg.gain.setTargetAtTime(0, end - 0.05, 0.08);
  br.start(t0, Math.random()); br.stop(end + 0.5);
  return end;
}

// ---------- la banda ----------
function bombo(t, vol = 0.5, out = stadiumBus) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(95, t);
  o.frequency.exponentialRampToValueAtTime(42, t + 0.18);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
  o.connect(g).connect(out);
  o.start(t); o.stop(t + 0.4);
}
function redoblante(t, vol = 0.12, out = stadiumBus) {
  const src = ctx.createBufferSource(); src.buffer = noise;
  const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 1500;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  src.connect(f).connect(g).connect(out);
  src.start(t, Math.random() * 2, 0.15);
}
function platillo(t, vol = 0.05, out = stadiumBus) {
  const src = ctx.createBufferSource(); src.buffer = noise;
  const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 5000;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
  src.connect(f).connect(g).connect(out);
  src.start(t, Math.random() * 1.5, 1.3);
}
// Trompeta: dos sierras un poco desafinadas con vibrato, por un filtro de bronce.
function trompeta(t0, notes, vol = 0.03, out = stadiumBus) {
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1400; f.Q.value = 1.2;
  const g = ctx.createGain(); g.gain.value = 0;
  f.connect(g).connect(out);
  const vib = ctx.createOscillator(); vib.frequency.value = 5.5;
  const vg = ctx.createGain(); vg.gain.value = 10; vib.connect(vg);
  const os = [-6, 6].map((d) => {
    const o = ctx.createOscillator(); o.type = 'sawtooth'; o.detune.value = d;
    vg.connect(o.detune); o.connect(f); return o;
  });
  let t = t0;
  for (const nt of notes) {
    if (nt.m != null) {
      os.forEach((o) => o.frequency.setValueAtTime(mtof(nt.m + 12), t));
      g.gain.setTargetAtTime(vol, t, 0.015);
      g.gain.setTargetAtTime(0, t + nt.d * 0.85, 0.03);
    }
    t += nt.d;
  }
  os.forEach((o) => { o.start(t0); o.stop(t + 0.3); });
  vib.start(t0); vib.stop(t + 0.3);
}

// Ritmo de murga: bombo marcado, redoblante en las corcheas.
function drums(t0, beats, beat, vol = 1, out = stadiumBus) {
  for (let b = 0; b < beats; b++) {
    const t = t0 + b * beat;
    if (b % 4 === 0 || b % 4 === 2) bombo(t, 0.45 * vol, out);
    if (b % 4 === 3) { bombo(t, 0.3 * vol, out); bombo(t + beat / 2, 0.35 * vol, out); }
    redoblante(t + beat / 2, 0.08 * vol, out);
    if (b % 2 === 1) redoblante(t, 0.11 * vol, out);
    if (b % 8 === 0) platillo(t, 0.04 * vol, out);
  }
}

// Cánticos (melodías propias, en negras: 1 = un tiempo).
const CHANTS = [
  // «Olé, olé, olé, olé…»
  [[52, 1, 'o'], [48, 1, 'e'], [null, 0.5], [52, 0.5, 'o'], [48, 0.5, 'e'], [52, 0.5, 'o'], [48, 2, 'e'],
   [50, 1, 'o'], [47, 1, 'e'], [null, 0.5], [50, 0.5, 'o'], [47, 0.5, 'e'], [50, 0.5, 'o'], [52, 2, 'e']],
  // «Va-mos, va-mos, mu-cha-chos…»
  [[55, 0.5, 'a'], [55, 0.5, 'o'], [55, 0.5, 'a'], [55, 0.5, 'o'], [57, 0.5, 'u'], [55, 0.5, 'a'], [53, 0.5, 'o'], [52, 1.5, 'o'], [null, 0.5],
   [53, 0.5, 'a'], [53, 0.5, 'o'], [53, 0.5, 'a'], [53, 0.5, 'o'], [55, 0.5, 'e'], [53, 0.5, 'a'], [52, 0.5, 'e'], [50, 1.5, 'o'], [null, 0.5]],
  // «Da-le, da-le, da-le…» que va subiendo.
  [[50, 0.5, 'a'], [50, 0.5, 'e'], [52, 0.5, 'a'], [52, 0.5, 'e'], [53, 0.5, 'a'], [53, 0.5, 'e'], [55, 1, 'o'],
   [53, 0.5, 'a'], [53, 0.5, 'e'], [52, 0.5, 'a'], [52, 0.5, 'e'], [50, 0.5, 'a'], [48, 0.5, 'e'], [50, 1, 'o']],
  // «Oh, oh, oh, a-le-a-le-ó» con los brazos arriba.
  [[48, 1, 'o', 1], [52, 1, 'o', 1], [55, 1.5, 'o', 1], [53, 0.5, 'a'], [52, 0.5, 'e'], [50, 0.5, 'a'], [52, 0.5, 'e'], [48, 2, 'o', 1], [null, 1]],
];
const toNotes = (ch, beat) => ch.map(([m, d, v, legato]) => ({ m, d: d * beat, v, legato }));
const lengthOf = (ch, beat) => ch.reduce((s, x) => s + x[1] * beat, 0);

let stadiumOn = false;
let chantTimer = null;
let segment = null; // { gain } del cántico que suena ahora
let excited = 0; // después de un gol la hinchada canta más fuerte un rato

function stopSegment(fade = 0.4) {
  if (!segment) return;
  const g = segment;
  g.gain.setTargetAtTime(0, ctx.currentTime, fade / 3);
  setTimeout(() => g.disconnect(), fade * 1000 + 500);
  segment = null;
}

// Programa el próximo trozo del estadio: un cántico con la banda, la banda
// sola, o sólo el murmullo. Después se vuelve a llamar sola.
function nextSegment() {
  clearTimeout(chantTimer);
  if (!stadiumOn || !ctx) return;
  if (muted || document.hidden) { chantTimer = setTimeout(nextSegment, 2000); return; }
  const hot = excited > 0;
  excited = Math.max(0, excited - 1);
  const beat = 60 / (hot ? 138 : 124 + Math.random() * 8);
  const g = ctx.createGain();
  g.gain.value = hot ? 1.4 : 0.9 + Math.random() * 0.3;
  g.connect(stadiumBus);
  segment = g;
  const t0 = ctx.currentTime + 0.15;
  const r = Math.random();
  let dur;
  if (hot || r < 0.6) {
    const ch = CHANTS[Math.floor(Math.random() * CHANTS.length)];
    const reps = 2 + Math.floor(Math.random() * 2);
    const one = lengthOf(ch, beat);
    for (let k = 0; k < reps; k++) {
      choir(t0 + k * one, toNotes(ch, beat), { n: hot ? 14 : 10, vol: hot ? 0.04 : 0.028, out: g });
      if (hot || k > 0 || Math.random() < 0.5) trompeta(t0 + k * one, toNotes(ch, beat), 0.022, g);
    }
    dur = reps * one;
    drums(t0, Math.round(dur / beat), beat, hot ? 1.2 : 1, g);
  } else if (r < 0.85) {
    dur = 16 * beat;
    drums(t0, 16, beat, 0.9, g);
  } else {
    dur = 4 + Math.random() * 3;
  }
  chantTimer = setTimeout(nextSegment, (dur + 2 + Math.random() * 5) * 1000);
}

function startChants() {
  swell(bedLevel(), 0, 1);
  clearTimeout(chantTimer);
  chantTimer = setTimeout(nextSegment, 1500);
}

// Ambiente de estadio durante el partido (cánticos y banda); fuera del partido
// queda sólo el murmullo suave.
export function stadium(on) {
  if (stadiumOn === on) return;
  stadiumOn = on;
  if (!ctx) return;
  if (on) startChants();
  else { clearTimeout(chantTimer); stopSegment(1); excited = 0; swell(bedLevel(), 0, 1); }
}

function applause(at = 0, dur = 3, vol = 0.18) {
  const src = ctx.createBufferSource(); src.buffer = claps;
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2000; f.Q.value = 0.5;
  const g = ctx.createGain();
  const t0 = ctx.currentTime + at;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + 0.3);
  g.gain.setTargetAtTime(0, t0 + dur - 0.8, 0.4);
  src.connect(f).connect(g).connect(stadiumBus);
  src.start(t0, 0, Math.min(dur, 4));
}

// El estadio reacciona a lo que pasa en la cancha.
function react(kind) {
  if (!stadiumBus) return;
  const t = ctx.currentTime + 0.05;
  switch (kind) {
    case 'goal':
      // ¡GOOOL! Grito, aplausos, y después la hinchada canta a todo pulmón.
      stopSegment(0.3);
      swell(0.2, 0, 0.08); swell(bedLevel() * 1.6, 3.5, 1.5); swell(bedLevel(), 9, 2);
      choir(t, [{ m: 50, d: 0.35, v: 'o' }, { m: 55, d: 2.6, v: 'o', slide: 2, legato: true }, { m: 52, d: 0.6, v: 'a' }], { n: 18, vol: 0.06 });
      applause(0.3, 4, 0.22);
      for (let k = 0; k < 6; k++) bombo(t + 0.4 + k * 0.25, 0.5);
      platillo(t + 0.4, 0.08);
      excited = 2;
      clearTimeout(chantTimer);
      if (stadiumOn) chantTimer = setTimeout(nextSegment, 4200);
      break;
    case 'post':
      // «¡Uyyyy!»: sube de golpe y se cae.
      swell(0.13, 0, 0.05); swell(bedLevel(), 1.2, 0.6);
      choir(t, [{ m: 52, d: 0.25, v: 'u' }, { m: 60, d: 1.3, v: 'i', slide: -7, legato: true }], { n: 16, vol: 0.05 });
      break;
    case 'save':
      // «¡Ohhh!» del estadio.
      swell(0.1, 0, 0.08); swell(bedLevel(), 1.3, 0.6);
      choir(t, [{ m: 57, d: 1.4, v: 'o', slide: -6, legato: true }], { n: 14, vol: 0.04 });
      applause(0.8, 2, 0.08);
      break;
    case 'miss':
      // Se lamentan: «aaah…».
      swell(0.09, 0, 0.1); swell(bedLevel(), 1.2, 0.6);
      choir(t, [{ m: 55, d: 1.3, v: 'a', slide: -5, legato: true }], { n: 12, vol: 0.035 });
      break;
    case 'boo':
      // Silbidos y abucheo a la tarjeta.
      choir(t, [{ m: 45, d: 1.6, v: 'u', slide: -1, legato: true }], { n: 12, vol: 0.03 });
      for (let k = 0; k < 5; k++) tone({ freq: 1800 + Math.random() * 900, dur: 0.5 + Math.random() * 0.6, vol: 0.012, type: 'sine', at: Math.random() * 0.8, slide: -300, out: stadiumBus });
      break;
    case 'tension':
      // Se acerca al arco: el murmullo crece.
      swell(0.11, 0, 0.5); swell(bedLevel(), 4, 1.2);
      break;
    case 'end':
      stopSegment(0.6);
      applause(0.2, 4, 0.2);
      swell(0.12, 0, 0.2); swell(bedLevel(), 3, 1.5);
      break;
  }
}

export function sound(name) {
  if (!ctx || muted) return;
  switch (name) {
    case 'kick': burst({ dur: 0.07, freq: 700, vol: 0.5 }); break;
    case 'shot': burst({ dur: 0.12, freq: 500, vol: 0.8 }); break;
    case 'header': burst({ dur: 0.06, freq: 1200, vol: 0.4 }); break;
    case 'tackle': burst({ dur: 0.15, freq: 300, vol: 0.5 }); break;
    case 'save': burst({ dur: 0.1, freq: 400, vol: 0.6 }); react('save'); break;
    case 'post': tone({ freq: 1200, dur: 0.4, vol: 0.12, type: 'triangle' }); tone({ freq: 1800, dur: 0.3, vol: 0.06, type: 'triangle' }); react('post'); break;
    case 'miss': react('miss'); break;
    case 'boo': react('boo'); break;
    case 'whistle': whistle(); break;
    case 'whistle3': whistle(0, 0.3); whistle(0.4, 0.3); whistle(0.8, 0.8); react('end'); break;
    case 'goal':
      burst({ dur: 2.8, freq: 800, q: 0.4, vol: 0.5, type: 'bandpass' });
      [0, 0.15, 0.3, 0.45].forEach((at, i) => tone({ freq: [523, 659, 784, 1046][i], dur: 0.25, vol: 0.08, at }));
      react('goal');
      break;
    case 'longball': burst({ dur: 0.1, freq: 450, vol: 0.6 }); break;
    case 'trap': burst({ dur: 0.05, freq: 900, vol: 0.3 }); break;
    case 'tension': tone({ freq: 220, dur: 0.9, vol: 0.05, type: 'sawtooth', slide: 220 }); react('tension'); break;
    case 'heart': tone({ freq: 60, dur: 0.12, vol: 0.25, type: 'sine' }); tone({ freq: 55, dur: 0.14, vol: 0.2, type: 'sine', at: 0.18 }); tone({ freq: 60, dur: 0.12, vol: 0.25, type: 'sine', at: 0.75 }); tone({ freq: 55, dur: 0.14, vol: 0.2, type: 'sine', at: 0.93 }); break;
    case 'win-duel': tone({ freq: 660, dur: 0.1, vol: 0.07, at: 0 }); tone({ freq: 990, dur: 0.18, vol: 0.07, at: 0.09 }); break;
    case 'lose-duel': tone({ freq: 300, dur: 0.15, vol: 0.07, type: 'triangle' }); tone({ freq: 200, dur: 0.25, vol: 0.07, type: 'triangle', at: 0.13 }); break;
    case 'card': tone({ freq: 660, dur: 0.06, vol: 0.06 }); break;
    case 'tick': tone({ freq: 1000, dur: 0.03, vol: 0.04 }); break;
    case 'dice': for (let i = 0; i < 6; i++) tone({ freq: 300 + Math.random() * 400, dur: 0.03, vol: 0.05, at: i * 0.1 }); break;
    // El dado rueda (un golpecito por cara) y cae.
    case 'roll': burst({ dur: 0.03, freq: 2500, vol: 0.18, type: 'bandpass', q: 2 }); tone({ freq: 300 + Math.random() * 400, dur: 0.03, vol: 0.04 }); break;
    case 'land': burst({ dur: 0.09, freq: 600, vol: 0.5 }); tone({ freq: 880, dur: 0.15, vol: 0.06, type: 'triangle' }); break;
    case 'coin': tone({ freq: 1500, dur: 0.6, vol: 0.06, type: 'triangle', slide: 400 }); break;
    case 'win': [0, 0.2, 0.4, 0.6].forEach((at, i) => tone({ freq: [392, 523, 659, 784][i], dur: 0.3, vol: 0.08, at })); break;
  }
}
