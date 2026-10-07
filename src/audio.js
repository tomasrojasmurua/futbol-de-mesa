// Sonidos sintetizados con WebAudio (sin archivos): silbato, patadas y el estadio
// entero: murmullo de la hinchada y sus reacciones al gol, al palo, a la
// atajada y a las tarjetas. En el partido, sin banda ni cánticos; la banda y
// la conversación de la gente suenan sólo en los menús (más abajo).
let ctx = null;
let muted = false;
let master = null; // todo pasa por aquí: el botón de silencio lo baja a 0
let stadiumBus = null; // hinchada: lejana y con eco de estadio
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
  swell(bedLevel(), 0, 1);
  buildMenu();
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

let stadiumOn = false;

// Ambiente de estadio: durante el partido el murmullo sube un poco y no hay
// cánticos ni banda (pedido de Tomás); fuera del partido el murmullo queda
// suave y suenan la banda y la conversación de los menús.
export function stadium(on) {
  if (stadiumOn === on) return;
  stadiumOn = on;
  if (ctx) { swell(bedLevel(), 0, 1); menuLevel(on ? 0.25 : 1.5); }
}

// Una «G» gritada: golpe de aire grave antes de la vocal.
function plosive(t, vol = 0.25) {
  const src = ctx.createBufferSource(); src.buffer = noise;
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
  src.connect(f).connect(g).connect(stadiumBus);
  src.start(t, Math.random() * 2, 0.1);
}

// Miles de voces gritan «¡Gol! ¡Gol! ¡Goooooool!»: dos cortos y uno largo que
// sube, en tres coros un poco desfasados para que suene a multitud.
function golShout(t) {
  const shout = [
    { m: 62, d: 0.32, v: 'o' }, { m: 60, d: 0.08, v: 'u' }, { m: null, d: 0.12 },
    { m: 62, d: 0.32, v: 'o' }, { m: 60, d: 0.08, v: 'u' }, { m: null, d: 0.12 },
    { m: 62, d: 2.8, v: 'o', slide: 3, legato: true }, { m: 64, d: 0.35, v: 'u', slide: -4 },
  ];
  for (const [dt, shift, n, vol] of [[0, 0, 20, 0.075], [0.04, -12, 16, 0.06], [0.07, 5, 12, 0.04]]) {
    choir(t + dt, shout.map((x) => ({ ...x, m: x.m == null ? null : x.m + shift })), { n, vol });
  }
  for (const at of [0, 0.52, 1.04]) plosive(t + at);
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
      // ¡GOL! ¡GOL! ¡GOOOOOL!: el estadio entero grita, aplaude y queda eufórico.
      swell(0.26, 0, 0.06); swell(0.16, 4.5, 1.2); swell(bedLevel() * 1.6, 7, 1.5); swell(bedLevel(), 12, 2);
      golShout(t);
      applause(0.2, 5, 0.26);
      applause(4.6, 4, 0.16);
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
    // Dado de madera: rebota 3 o 4 veces sobre la mesa, cada vez más rápido y suave.
    case 'dice': {
      let at = 0, gap = 0.07 + Math.random() * 0.04, v = 0.6;
      const pitch = 750 + Math.random() * 450;
      for (let b = 0, n = 3 + Math.floor(Math.random() * 2); b < n; b++) {
        burst({ dur: 0.02, freq: 2600 + Math.random() * 600, vol: v * 0.8, type: 'bandpass', q: 2.5, at });
        tone({ freq: pitch, dur: 0.03, vol: v * 0.12, type: 'triangle', at, slide: -pitch * 0.1 });
        at += gap; gap *= 0.62; v *= 0.62;
      }
      break;
    }
    // Dado chocando en la mano mientras se agita.
    case 'clack': for (let i = 0, n = 1 + Math.floor(Math.random() * 2); i < n; i++) burst({ dur: 0.022, freq: 1400 + Math.random() * 1300, vol: 0.12, type: 'bandpass', q: 4, at: i * 0.02 }); break;
    case 'throw': burst({ dur: 0.18, freq: 900, vol: 0.12, type: 'bandpass', q: 0.8 }); break;
    // El dado rueda (un golpecito por cara) y cae.
    case 'roll': burst({ dur: 0.03, freq: 2500, vol: 0.18, type: 'bandpass', q: 2 }); tone({ freq: 300 + Math.random() * 400, dur: 0.03, vol: 0.04 }); break;
    case 'land': burst({ dur: 0.09, freq: 600, vol: 0.5 }); tone({ freq: 880, dur: 0.15, vol: 0.06, type: 'triangle' }); break;
    case 'coin': tone({ freq: 2400, dur: 0.05, vol: 0.05, type: 'triangle' }); tone({ freq: 1500, dur: 0.6, vol: 0.05, type: 'triangle', slide: 400, at: 0.03 }); break;
    // La moneda pica en el pasto: un tintineo metálico corto.
    case 'clink': [3150, 4720].forEach((f, i) => tone({ freq: f, dur: 0.18 - i * 0.06, vol: 0.05, type: 'sine' })); burst({ dur: 0.02, freq: 3000, vol: 0.12, type: 'bandpass', q: 3 }); break;
    case 'win': [0, 0.2, 0.4, 0.6].forEach((at, i) => tone({ freq: [392, 523, 659, 784][i], dur: 0.3, vol: 0.08, at })); break;
  }
}

// ---------- portada y menús ----------
// Fuera del partido suena la banda de la barra (bombos, redoblantes, platillos
// y trompetas) y mucha conversación de la gente en las tribunas. Se calla al
// empezar el partido, donde vuelve el murmullo de siempre. Las dos cosas se
// pintan una vez en un buffer (OfflineAudioContext) y quedan en bucle.
let menuBus = null;   // todo el ambiente de los menús (pasa por el eco del estadio)
let bandBus = null;
let bandBuf = null, bandSrc = null, bandAt = null;
let bandHold = false; // la entrada de la portada decide cuándo entra la banda

const rnd = (a, b) => a + Math.random() * (b - a);
function mkNoise(c, sec = 2) {
  const b = c.createBuffer(1, c.sampleRate * sec, c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}
// golpe de ruido filtrado
function hit(c, out, noise, t, { dur = 0.08, freq = 900, q = 1, vol = 0.4, type = 'lowpass' }) {
  const s = c.createBufferSource(); s.buffer = noise;
  const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = c.createGain();
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  s.connect(f).connect(g).connect(out);
  s.start(t, Math.random() * (noise.duration - dur - 0.06), dur + 0.05);
}
// tono que cae (o sube) y se apaga
function blip(c, out, t, { freq = 200, to = freq, dur = 0.1, vol = 0.2, type = 'sine' }) {
  const o = c.createOscillator(); o.type = type;
  o.frequency.setValueAtTime(freq, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  o.connect(g).connect(out);
  o.start(t); o.stop(t + dur + 0.02);
}
// lo que sobra después del final del bucle se suma al principio, para que no se note el corte
function fold(rendered, len) {
  const c = rendered.numberOfChannels, sr = rendered.sampleRate, n = Math.floor(len * sr);
  const b = new AudioBuffer({ numberOfChannels: c, length: n, sampleRate: sr });
  for (let ch = 0; ch < c; ch++) {
    const src = rendered.getChannelData(ch), dst = b.getChannelData(ch);
    dst.set(src.subarray(0, n));
    for (let i = n; i < src.length; i++) dst[i - n] += src[i];
  }
  return b;
}
function normalize(b, rms) {
  let s = 0, n = 0;
  for (let ch = 0; ch < b.numberOfChannels; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < d.length; i += 7) { s += d[i] * d[i]; n++; } }
  const k = rms / Math.sqrt(s / n || 1e-9);
  for (let ch = 0; ch < b.numberOfChannels; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < d.length; i++) d[i] *= k; }
  return b;
}

// Conversación: veintitantas personas que hablan a la vez, cada una con su voz
// (grave o aguda), frases con entonación, sílabas con vocales que cambian,
// pausas, y de vez en cuando alguna risa. Repartidas a lo ancho de la tribuna.
const CHAT_LEN = 14;
const VOW = Object.values(VOWELS);
export async function renderChatter(sr) {
  const c = new OfflineAudioContext(2, Math.ceil(sr * (CHAT_LEN + 1.5)), sr);
  const noise = mkNoise(c, 3);
  for (let v = 0; v < 26; v++) {
    const high = Math.random() < 0.38;
    const pitch = high ? rnd(185, 240) : rnd(98, 140), fk = high ? 1.17 : 1;
    const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = pitch;
    const ns = c.createBufferSource(); ns.buffer = noise; ns.loop = true;
    const nsg = c.createGain(); nsg.gain.value = 0.35;
    const mix = c.createGain(); o.connect(mix); ns.connect(nsg).connect(mix);
    const f1 = c.createBiquadFilter(), f2 = c.createBiquadFilter();
    f1.type = f2.type = 'bandpass'; f1.Q.value = 5; f2.Q.value = 7;
    const env = c.createGain(); env.gain.value = 0;
    const g2 = c.createGain(); g2.gain.value = 0.55;
    mix.connect(f1).connect(env); mix.connect(f2).connect(g2).connect(env);
    const far = c.createGain(); far.gain.value = rnd(0.25, 1);
    const pan = c.createStereoPanner(); pan.pan.value = rnd(-0.85, 0.85);
    env.connect(far).connect(pan).connect(c.destination);
    let t = rnd(-1.5, 1.2);
    while (t < CHAT_LEN + 1.2) {
      const laugh = Math.random() < 0.07;
      const end = t + (laugh ? rnd(0.5, 0.9) : rnd(0.7, 2.6));
      const p0 = pitch * (laugh ? 1.35 : rnd(1.02, 1.18));
      if (t >= 0) { o.frequency.setValueAtTime(p0, t); o.frequency.linearRampToValueAtTime(pitch * (laugh ? 1.1 : 0.88), end); }
      while (t < end) {
        const syl = laugh ? rnd(0.1, 0.13) : rnd(0.08, 0.22);
        if (t >= 0) {
          const [a, b] = laugh ? VOWELS.a : VOW[Math.floor(Math.random() * VOW.length)];
          f1.frequency.setTargetAtTime(a * fk, t, 0.02); f2.frequency.setTargetAtTime(b * fk, t, 0.02);
          env.gain.setTargetAtTime(rnd(0.45, 1), t, 0.014);
          env.gain.setTargetAtTime(laugh ? 0.02 : rnd(0.04, 0.2), t + syl * rnd(0.55, 0.8), 0.018);
        }
        t += syl;
      }
      if (t >= 0) env.gain.setTargetAtTime(0, t, 0.05);
      t += rnd(0.25, 1.9);
    }
    o.start(0); ns.start(0, Math.random() * 2);
  }
  return normalize(fold(await c.startRendering(), CHAT_LEN), 0.12);
}

// La banda: 8 compases a 126 por minuto. Bombo en 3-3-2, redoblante con
// fantasmas, platillos de murga en el 2 y el 4, redobles al cerrar cada cuatro
// compases, y en la segunda mitad entran las trompetas con un trombón abajo.
const BPM = 126, BEAT = 60 / BPM, BAR = BEAT * 4;
export const BAND_LEN = BAR * 8;
const BOMBO = [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0];
const REDO = [0, 0.25, 1, 0, 0.25, 0, 0.8, 1, 0, 0.25, 1, 0, 0.3, 1, 0.8, 0];
const TUNE = [
  [62, 1], [62, 0.5], [65, 0.5], [69, 1], [67, 0.5], [65, 0.5],
  [64, 1], [60, 1], [62, 1.5], [null, 0.5],
  [62, 0.5], [62, 0.5], [65, 0.5], [69, 0.5], [72, 1], [69, 1],
  [70, 0.5], [69, 0.5], [67, 0.5], [64, 0.5], [62, 1.5], [null, 0.5],
];
export function bombo(c, out, noise, t, v = 1) {
  blip(c, out, t, { freq: 115, to: 46, dur: 0.42, vol: 0.9 * v });
  hit(c, out, noise, t, { dur: 0.07, freq: 380, vol: 0.45 * v });
}
export function redo(c, out, noise, t, v = 1) {
  hit(c, out, noise, t, { dur: 0.12, freq: 2600, q: 0.7, vol: 0.55 * v, type: 'bandpass' });
  hit(c, out, noise, t, { dur: 0.05, freq: 5200, vol: 0.2 * v, type: 'highpass' });
  blip(c, out, t, { freq: 220, to: 170, dur: 0.06, vol: 0.22 * v, type: 'triangle' });
}
function platillo(c, out, noise, t, v = 1) {
  hit(c, out, noise, t, { dur: 0.5, freq: 5600, vol: 0.28 * v, type: 'highpass' });
  hit(c, out, noise, t, { dur: 0.22, freq: 8200, q: 2, vol: 0.14 * v, type: 'bandpass' });
}
function brass(c, out, t, m, dur, v) {
  const f = mtof(m);
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 1.4;
  lp.frequency.setValueAtTime(450, t); lp.frequency.linearRampToValueAtTime(3000, t + 0.05); lp.frequency.setTargetAtTime(1700, t + 0.07, 0.12);
  const g = c.createGain();
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.03); g.gain.setTargetAtTime(v * 0.72, t + 0.05, 0.1);
  g.gain.setTargetAtTime(0, t + dur * 0.9, 0.025);
  lp.connect(g).connect(out);
  const vib = c.createOscillator(); vib.frequency.value = 5.6;
  const vg = c.createGain(); vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(dur > 0.4 ? 14 : 4, t + Math.min(0.3, dur));
  vib.connect(vg);
  for (const dt of [-9, 0, 8]) {
    const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = dt;
    vg.connect(o.detune); o.connect(lp); o.start(t); o.stop(t + dur + 0.2);
  }
  vib.start(t); vib.stop(t + dur + 0.2);
}
export async function renderBand(sr) {
  const c = new OfflineAudioContext(2, Math.ceil(sr * (BAND_LEN + 2)), sr);
  const noise = mkNoise(c, 2);
  // cada instrumento en su lugar de la tribuna
  const at = (p, g = 1) => { const pn = c.createStereoPanner(); pn.pan.value = p; const gg = c.createGain(); gg.gain.value = g; gg.connect(pn).connect(c.destination); return gg; };
  const bombos = at(-0.15), redos = at(0.25, 0.8), plats = at(0.4, 0.75), horns = at(-0.3, 0.16), bone = at(0.1, 0.12);
  const s16 = BEAT / 4;
  for (let bar = 0; bar < 8; bar++) {
    const t0 = bar * BAR, fill = bar % 4 === 3;
    for (let i = 0; i < 16; i++) {
      const t = Math.max(0, t0 + i * s16 + rnd(-0.004, 0.004));
      if (fill && i >= 8) { redo(c, redos, noise, t, 0.45 + (i - 8) * 0.07); if (i % 2 === 0) bombo(c, bombos, noise, t, 0.85); continue; }
      if (BOMBO[i]) bombo(c, bombos, noise, t, i === 0 ? 1 : 0.85);
      if (REDO[i]) redo(c, redos, noise, t, REDO[i] * rnd(0.85, 1));
      if (i === 4 || i === 12 || (i === 0 && bar % 4 === 0)) platillo(c, plats, noise, t, i === 0 ? 1.2 : 0.8);
    }
  }
  let t = BAR * 4;
  for (const [m, d] of TUNE) {
    if (m != null) { brass(c, horns, t, m + 12, d * BEAT, 1); brass(c, bone, t, m, d * BEAT, 1); }
    t += d * BEAT;
  }
  return normalize(fold(await c.startRendering(), BAND_LEN), 0.16);
}

function buildMenu() {
  menuBus = ctx.createGain(); menuBus.gain.value = 0;
  menuBus.connect(stadiumBus);
  bandBus = ctx.createGain(); bandBus.gain.value = 0.45;
  bandBus.connect(menuBus);
  const chatBus = ctx.createGain(); chatBus.gain.value = 0.62;
  chatBus.connect(menuBus);
  renderChatter(ctx.sampleRate).then((b) => {
    const s = ctx.createBufferSource(); s.buffer = b; s.loop = true; s.connect(chatBus); s.start();
  }).catch((e) => console.warn('conversación', e));
  renderBand(ctx.sampleRate).then((b) => { bandBuf = b; if (bandAt != null) playBand(bandAt); }).catch((e) => console.warn('banda', e));
  menuLevel(1.2);
  if (!bandHold) startBand(2);
}
function menuLevel(tau) {
  if (menuBus) menuBus.gain.setTargetAtTime(stadiumOn ? 0 : 1, ctx.currentTime, tau);
}
function playBand(at) {
  if (bandSrc) return;
  bandSrc = ctx.createBufferSource(); bandSrc.buffer = bandBuf; bandSrc.loop = true;
  bandSrc.connect(bandBus); bandSrc.start(Math.max(at, ctx.currentTime));
}
// La banda arranca (una sola vez; después sigue en bucle y sólo se baja en el partido).
export function startBand(delay = 0) {
  if (!ctx || bandSrc) return;
  const at = ctx.currentTime + delay;
  if (!bandBuf) { if (bandAt == null || at < bandAt) bandAt = at; return; }
  playBand(at);
}
export function holdBand(h) { bandHold = h; }
// Espera a que el audio esté andando (o se rinde a los `ms`).
export function whenRunning(ms = 500) {
  return new Promise((ok) => {
    const t0 = performance.now();
    const check = () => (!ctx || ctx.state === 'running' || performance.now() - t0 > ms ? ok() : setTimeout(check, 20));
    check();
  });
}

// Efectos de la entrada de la portada, a tiempo con la animación (en segundos
// desde que empieza): se prenden los focos, caen las letras, patean la pelota
// que pica y rueda, brilla el nombre, aplauden y la banda entra con un redoble.
export const INTRO_BAND = 3.3;
export function introSfx(c, near, far, noise, t) {
  // focos: el relé que salta (clic y golpe) y el zumbido eléctrico
  [[0.125, 1], [0.3, 0.85], [0.52, 0.7]].forEach(([dt, v]) => {
    hit(c, near, noise, t + dt, { dur: 0.03, freq: 2300, q: 3, vol: 0.35 * v, type: 'bandpass' });
    blip(c, near, t + dt + 0.012, { freq: 85, to: 42, dur: 0.22, vol: 0.5 * v });
    hit(c, far, noise, t + dt + 0.012, { dur: 0.14, freq: 420, vol: 0.35 * v });
  });
  const hum = c.createGain(); hum.gain.value = 0;
  const hb = c.createBiquadFilter(); hb.type = 'bandpass'; hb.frequency.value = 320; hb.Q.value = 0.8;
  hb.connect(hum).connect(far);
  for (const f of [100, 150.4, 49.8]) { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.connect(hb); o.start(t); o.stop(t + 3); }
  [[0.125, 0.06], [0.17, 0.01], [0.3, 0.07], [0.35, 0.03], [0.52, 0.06]].forEach(([dt, v]) => hum.gain.setTargetAtTime(v, t + dt, 0.01));
  hum.gain.setTargetAtTime(0, t + 1.1, 0.45);
  // letras: un golpe seco por letra, cada una un poco más aguda
  for (let i = 0; i < 11; i++) {
    const tt = t + 0.72 + i * 0.07, f = 230 * Math.pow(2, i / 14);
    blip(c, near, tt, { freq: f, to: f * 0.62, dur: 0.08, vol: 0.2, type: 'triangle' });
    hit(c, near, noise, tt, { dur: 0.04, freq: 1600, vol: 0.22 });
  }
  // la pelota: la patean de lejos, pica tres veces y rueda en el pasto
  hit(c, far, noise, t + 1.12, { dur: 0.11, freq: 520, vol: 0.6 });
  blip(c, far, t + 1.12, { freq: 130, to: 62, dur: 0.12, vol: 0.35 });
  [[1.58, 1], [1.955, 0.6], [2.18, 0.35]].forEach(([dt, v]) => {
    blip(c, near, t + dt, { freq: 155, to: 82, dur: 0.13, vol: 0.5 * v });
    hit(c, near, noise, t + dt, { dur: 0.06, freq: 700, vol: 0.35 * v });
    hit(c, near, noise, t + dt, { dur: 0.02, freq: 2600, vol: 0.1 * v, type: 'bandpass' });
  });
  const roll = c.createBufferSource(); roll.buffer = noise; roll.loop = true;
  const rf = c.createBiquadFilter(); rf.type = 'bandpass'; rf.frequency.value = 1300; rf.Q.value = 0.6;
  const rg = c.createGain(); rg.gain.value = 0;
  roll.connect(rf).connect(rg).connect(near);
  rg.gain.setValueAtTime(0, t + 2.18); rg.gain.linearRampToValueAtTime(0.07, t + 2.24);
  rg.gain.linearRampToValueAtTime(0.012, t + 2.72); rg.gain.linearRampToValueAtTime(0.03, t + 2.85);
  rg.gain.linearRampToValueAtTime(0, t + 3.12);
  roll.start(t + 2.1); roll.stop(t + 3.3);
  // brillo del nombre: campanitas que suben
  [1568, 2093, 2637, 3136, 4186].forEach((f, i) => {
    blip(c, near, t + 3.14 + i * 0.06, { freq: f, dur: 0.55, vol: 0.05 - i * 0.006, type: 'triangle' });
    blip(c, near, t + 3.14 + i * 0.06, { freq: f * 2.01, dur: 0.3, vol: 0.012, type: 'sine' });
  });
  // la banda anuncia que entra: redoble que crece hasta el primer golpe
  for (let i = 0; i < 8; i++) redo(c, far, noise, t + INTRO_BAND - 0.48 + i * 0.06, 0.25 + i * 0.08);
}

let introStop = null;
// Suena la entrada desde ahora; devuelve cómo cortarla si el jugador la salta.
export function introSounds() {
  if (!ctx || ctx.state !== 'running' || muted) return () => {};
  const near = ctx.createGain(), far = ctx.createGain();
  near.connect(master); far.connect(stadiumBus);
  const t = ctx.currentTime + 0.02;
  introSfx(ctx, near, far, noise, t);
  if (claps) applause(INTRO_BAND - 0.1, 3.5, 0.12);
  startBand(INTRO_BAND);
  introStop = () => {
    introStop = null;
    near.gain.setTargetAtTime(0, ctx.currentTime, 0.04);
    far.gain.setTargetAtTime(0, ctx.currentTime, 0.04);
    startBand(0.15);
  };
  return () => introStop && introStop();
}

// Con la pestaña oculta o el teléfono bloqueado no sigue sonando.
document.addEventListener('visibilitychange', () => {
  if (!ctx) return;
  if (document.hidden) ctx.suspend(); else ctx.resume();
});
