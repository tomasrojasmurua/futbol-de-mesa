// Sonidos sintetizados con WebAudio (sin archivos): silbato, patadas, hinchada.
let ctx = null;
let muted = false;
let crowdGain = null;

try { muted = localStorage.getItem('fdm-muted') === '1'; } catch { /* sin storage */ }

export function isMuted() { return muted; }
export function setMuted(m) {
  muted = m;
  try { localStorage.setItem('fdm-muted', m ? '1' : '0'); } catch { /* sin storage */ }
  if (crowdGain) crowdGain.gain.value = m ? 0 : 0.035;
}

export function unlock() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  startCrowd();
}

function noiseBuffer(sec) {
  const b = ctx.createBuffer(1, ctx.sampleRate * sec, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

function startCrowd() {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(3);
  src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = 'bandpass'; f.frequency.value = 600; f.Q.value = 0.6;
  crowdGain = ctx.createGain();
  crowdGain.gain.value = muted ? 0 : 0.035;
  src.connect(f).connect(crowdGain).connect(ctx.destination);
  src.start();
}

function burst({ dur = 0.08, freq = 900, q = 1, vol = 0.4, type = 'lowpass' }) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(dur);
  const f = ctx.createBiquadFilter();
  f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  src.connect(f).connect(g).connect(ctx.destination);
  src.start();
}

function tone({ freq = 440, dur = 0.2, vol = 0.15, type = 'square', at = 0, slide = 0 }) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  const t0 = ctx.currentTime + at;
  o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.linearRampToValueAtTime(freq + slide, t0 + dur);
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  o.connect(g).connect(ctx.destination);
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
  o.connect(g).connect(ctx.destination);
  o.start(t0); lfo.start(t0); o.stop(t0 + dur + 0.05); lfo.stop(t0 + dur + 0.05);
}

export function sound(name) {
  if (!ctx || muted) return;
  switch (name) {
    case 'kick': burst({ dur: 0.07, freq: 700, vol: 0.5 }); break;
    case 'shot': burst({ dur: 0.12, freq: 500, vol: 0.8 }); break;
    case 'header': burst({ dur: 0.06, freq: 1200, vol: 0.4 }); break;
    case 'tackle': burst({ dur: 0.15, freq: 300, vol: 0.5 }); break;
    case 'save': burst({ dur: 0.1, freq: 400, vol: 0.6 }); break;
    case 'post': tone({ freq: 1200, dur: 0.4, vol: 0.12, type: 'triangle' }); tone({ freq: 1800, dur: 0.3, vol: 0.06, type: 'triangle' }); break;
    case 'whistle': whistle(); break;
    case 'whistle3': whistle(0, 0.3); whistle(0.4, 0.3); whistle(0.8, 0.8); break;
    case 'goal':
      burst({ dur: 2.8, freq: 800, q: 0.4, vol: 0.5, type: 'bandpass' });
      [0, 0.15, 0.3, 0.45].forEach((at, i) => tone({ freq: [523, 659, 784, 1046][i], dur: 0.25, vol: 0.08, at }));
      break;
    case 'longball': burst({ dur: 0.1, freq: 450, vol: 0.6 }); break;
    case 'trap': burst({ dur: 0.05, freq: 900, vol: 0.3 }); break;
    case 'tension': tone({ freq: 220, dur: 0.9, vol: 0.05, type: 'sawtooth', slide: 220 }); break;
    case 'heart': tone({ freq: 60, dur: 0.12, vol: 0.25, type: 'sine' }); tone({ freq: 55, dur: 0.14, vol: 0.2, type: 'sine', at: 0.18 }); tone({ freq: 60, dur: 0.12, vol: 0.25, type: 'sine', at: 0.75 }); tone({ freq: 55, dur: 0.14, vol: 0.2, type: 'sine', at: 0.93 }); break;
    case 'win-duel': tone({ freq: 660, dur: 0.1, vol: 0.07, at: 0 }); tone({ freq: 990, dur: 0.18, vol: 0.07, at: 0.09 }); break;
    case 'lose-duel': tone({ freq: 300, dur: 0.15, vol: 0.07, type: 'triangle' }); tone({ freq: 200, dur: 0.25, vol: 0.07, type: 'triangle', at: 0.13 }); break;
    case 'card': tone({ freq: 660, dur: 0.06, vol: 0.06 }); break;
    case 'tick': tone({ freq: 1000, dur: 0.03, vol: 0.04 }); break;
    case 'dice': for (let i = 0; i < 6; i++) tone({ freq: 300 + Math.random() * 400, dur: 0.03, vol: 0.05, at: i * 0.1 }); break;
    case 'coin': tone({ freq: 1500, dur: 0.6, vol: 0.06, type: 'triangle', slide: 400 }); break;
    case 'win': [0, 0.2, 0.4, 0.6].forEach((at, i) => tone({ freq: [392, 523, 659, 784][i], dur: 0.3, vol: 0.08, at })); break;
  }
}
