// Calcciopoli · la previa en película (unos 20 segundos antes de cada partido).
// Toma aérea del estadio → camarín → salida del túnel → himnos → banderas en la
// cancha. Usa el estadio, la hora, el clima y las camisetas de la previa.
// Se salta tocando la pantalla (en una sala, se salta en los dos celulares).
import { Aerial } from './aerial.js';
import { Locker } from './locker.js';
import { Tunnel } from './tunnel.js';
import { Anthem } from './anthem.js';
import { Flags } from './flags.js';
import { Cast } from './cast.js';
import { text as pxText, textW as pxTextW } from '../cutscene.js';
import { stadiumFor } from '../stadiums.js';
import { clamp, ease, canvas } from './common.js';

const LW = 180;
// Planos: [nombre, desde, hasta] en segundos de película.
const SHOTS = [['aerial', 1.0, 5.6], ['locker', 5.6, 10.2], ['tunnel', 10.2, 14.6], ['anthem', 14.6, 18.4], ['flags', 18.4, 21.8]];
export const INTRO_LEN = 21.8;
// Cuándo suena cada cosa.
const CUES = [[1.0, 'start'], [5.6, 'locker'], [8.75, 'laces'], [10.2, 'tunnel'], [14.0, 'emerge'], [14.7, 'anthem'], [18.4, 'flags'], [21.15, 'whistle']];

const WHEN = { morning: 'MAÑANA', afternoon: 'TARDE', night: 'NOCHE' };
const SKYW = { clear: 'DESPEJADO', cloudy: 'NUBLADO', rain: 'LLUVIA' };

export class Intro {
  // o: { teams: [equipo local, visita], kits: [camisetas del partido], setup, mySide, cue(nombre), onSkip() }
  constructor(o) {
    this.o = o;
    this.cast = new Cast();
    const { teams, kits, setup } = o;
    const me = o.mySide === 1 ? 1 : 0;
    this.aerial = new Aerial({ setup, kits });
    this.shots = {
      aerial: { draw: (g, W, H, t) => this.aerial.draw(g, W, H, t, t / 4.6) },
      locker: new Locker({ team: teams[me], kit: kits[me], side: me, cast: this.cast, at: 5.6 }),
      tunnel: new Tunnel({ teams, kits, setup, cast: this.cast, at: 10.2 }),
      anthem: new Anthem({ teams, kits, setup, cast: this.cast, at: 14.6 }),
      flags: new Flags({ teams, kits, setup, aerial: this.aerial }),
    };
    this.cast.sort();
    this.st = stadiumFor(setup.stadium);
  }

  // Muestra la película; resuelve al terminar o al saltarla.
  play() {
    const wrap = this.wrap = document.createElement('div');
    wrap.className = 'intro-film';
    const cv = this.cv = document.createElement('canvas');
    wrap.appendChild(cv);
    document.body.appendChild(wrap);
    const size = () => {
      const r = wrap.getBoundingClientRect();
      const H = clamp(Math.round((LW * r.height) / Math.max(1, r.width)), 300, 400);
      if (cv.height !== H) { cv.width = LW; cv.height = H; }
      this.cast.W = LW; this.cast.H = H;
      cv.style.aspectRatio = `${LW} / ${H}`;
    };
    size();
    this.g = cv.getContext('2d');
    this.g.imageSmoothingEnabled = false;
    const tap = () => { if (this.t > 0.6) this.skip(true); };
    wrap.addEventListener('pointerdown', tap);
    this.onResize = size;
    window.addEventListener('resize', size);
    return new Promise((resolve) => {
      this.resolve = resolve;
      this.t = 0; this.cued = 0;
      let last = performance.now();
      const loop = (now) => {
        if (this.done) return;
        const dt = Math.min(0.1, (now - last) / 1000);
        last = now;
        // si el estadio todavía no está armado, la película espera en el título
        if (this.t < 1.0 || this.aerial.ready) this.t += dt;
        else this.t = Math.min(this.t, 1.0);
        const t = this.t;
        while (this.cued < CUES.length && t >= CUES[this.cued][0]) { this.o.cue && this.o.cue(CUES[this.cued][1]); this.cued++; }
        const t0 = performance.now();
        try { this.frame(t); } catch (e) { console.error(e); }
        // con lo que sobra del cuadro se arma lo que viene
        const used = performance.now() - t0;
        const budget = t < 1.0 ? 22 : Math.max(4, 13 - used * 0.5);
        if (!this.aerial.ready) this.aerial.buildStep(budget);
        else this.cast.warm(budget);
        if (t >= INTRO_LEN) { this.finish(false); return; }
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    });
  }

  frame(t) {
    const g = this.g, W = this.cv.width, H = this.cv.height;
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    const shot = SHOTS.find(([, a, b]) => t >= a && t < b);
    if (!shot) return this.title(g, W, H, t);
    const [id, a, b] = shot;
    const lt = t - a;
    this.shots[id].draw(g, W, H, lt);
    this.overlay(g, W, H, id, lt, t);
    // fundidos entre planos (del túnel a los himnos se viene del blanco)
    const fadeIn = clamp(1 - lt / (id === 'aerial' ? 0.6 : 0.18), 0, 1);
    if (fadeIn > 0) { g.fillStyle = id === 'anthem' ? `rgba(255,252,244,${fadeIn})` : `rgba(0,0,0,${fadeIn})`; g.fillRect(0, 0, W, H); }
    const fadeOut = id === 'tunnel' ? 0 : clamp((lt - (b - a - (id === 'flags' ? 0.45 : 0.12))) / (id === 'flags' ? 0.45 : 0.12), 0, 1);
    if (fadeOut > 0) { g.fillStyle = `rgba(0,0,0,${fadeOut})`; g.fillRect(0, 0, W, H); }
    this.bars(g, W, H, t);
  }

  // Título sobre negro mientras se arma el estadio.
  title(g, W, H, t) {
    const a = clamp(t / 0.4, 0, 1) * clamp((1.0 - t) / 0.3, 0, 1);
    g.globalAlpha = a;
    const s = 'CALCCIOPOLI', w = pxTextW(s, 2);
    pxText(g, s, Math.round(W / 2 - w / 2), Math.round(H / 2 - 8), '#ffd23f', 2);
    const p = 'PRESENTA', pw = pxTextW(p);
    pxText(g, p, Math.round(W / 2 - pw / 2), Math.round(H / 2 + 6), '#c9ccd6');
    g.globalAlpha = 1;
    this.bars(g, W, H, t);
  }

  // Franjas negras de cine arriba y abajo, y el aviso para saltar.
  bars(g, W, H, t) {
    const b = 7;
    g.fillStyle = '#000'; g.fillRect(0, 0, W, b); g.fillRect(0, H - b, W, b);
    const hint = clamp((t - 1.2) / 0.4, 0, 1) * clamp((7 - t) / 0.6, 0, 1);
    if (hint > 0) {
      g.globalAlpha = hint * 0.85;
      const s = 'TOCA PARA SALTAR', w = pxTextW(s);
      pxText(g, s, W - w - 4, H - b + 1, '#9aa0ae');
      g.globalAlpha = 1;
    }
  }

  // Gráficos de la transmisión.
  overlay(g, W, H, id, lt, t) {
    const { teams, setup } = this.o;
    if (id === 'aerial') {
      // «EN VIVO» con punto rojo, y el nombre del estadio abajo
      g.fillStyle = 'rgba(10,12,20,0.75)'; g.fillRect(6, 11, 38, 9);
      g.fillStyle = Math.floor(t * 2) % 2 ? '#ff3b3b' : '#a01818'; g.fillRect(9, 13, 5, 5);
      pxText(g, 'EN VIVO', 16, 13, '#ffffff');
      const vs = `${teams[0].short} - ${teams[1].short}`;
      const vw = pxTextW(vs) + 8;
      g.fillStyle = 'rgba(10,12,20,0.75)'; g.fillRect(W - vw - 6, 11, vw, 9);
      pxText(g, vs, W - vw - 2, 13, '#ffd23f');
      const show = clamp((lt - 0.7) / 0.35, 0, 1) * clamp((4.3 - lt) / 0.3, 0, 1);
      if (show > 0) {
        const name = this.st.name.toUpperCase(), sub = `${(this.st.city || '').toUpperCase()}  ${WHEN[setup.time]}  ${SKYW[setup.weather]}`;
        const w = Math.max(pxTextW(name), pxTextW(sub)) + 14;
        const x = Math.round(-w + (w + 8) * ease(show)), y = H - 40;
        g.fillStyle = 'rgba(10,12,20,0.82)'; g.fillRect(x, y, w, 21);
        g.fillStyle = '#ffd23f'; g.fillRect(x, y, 3, 21);
        pxText(g, name, x + 7, y + 4, '#ffffff');
        pxText(g, sub, x + 7, y + 12, '#aab3c6');
      }
    }
    if (id === 'flags') {
      const vs = `${teams[0].short}  VS  ${teams[1].short}`;
      const w = pxTextW(vs) + 10;
      const show = clamp((lt - 0.3) / 0.3, 0, 1);
      g.globalAlpha = show;
      g.fillStyle = 'rgba(10,12,20,0.8)'; g.fillRect(Math.round(W / 2 - w / 2), 12, w, 10);
      pxText(g, vs, Math.round(W / 2 - w / 2) + 5, 14, '#ffffff');
      g.globalAlpha = 1;
    }
  }

  skip(mine) {
    if (this.done) return;
    if (mine && this.o.onSkip) this.o.onSkip();
    this.finish(true);
  }

  finish(skipped) {
    if (this.done) return;
    this.done = true;
    this.o.cue && this.o.cue('stop');
    window.removeEventListener('resize', this.onResize);
    const wrap = this.wrap;
    wrap.classList.add('out');
    setTimeout(() => wrap.remove(), 350);
    this.resolve && this.resolve(skipped ? 'skipped' : 'done');
  }
}
