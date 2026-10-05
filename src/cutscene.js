// Escena de remate: una animación a pantalla completa vista desde atrás del
// tirador, con el arquero, el arco y la hinchada. Se dibuja en su propio canvas
// a baja resolución y se escala en pixel art.

import { P4 } from './players.js';
import { p4Kit } from './playerkit.js';
import { buildSide } from './sidecam.js';

const LW = 180; // ancho lógico de la escena
// Escalas de los jugadores ilustrados (más chico el número, más grande el dibujo).
const SPR = 8;  // de costado, cerca: carrera, remate y celebración (≈108 px)
const BSC = 16; // el pateador visto desde atrás (≈54 px)
const KSC = 28; // el arquero en el arco (≈30 px)
// Cuánto sigue la cámara de costado después del golpe, según la jugada.
const SIDE_AFTER = { penal: 0.12, remate: 0.3, mano: 0.32, cabezazo: 0.28, libre: 0.5 };
// Rivales de las escenas (la barrera, el defensa que marca).
const DEF_LOOKS = [{ skin: '#9c6440', hair: '#141010', style: 'short' }, { skin: '#f1c7a0', hair: '#7a5530', style: 'fringe' }, { skin: '#c68657', hair: '#2a1a10', style: 'curly' }, { skin: '#e0a77c', hair: '#2a1a10', style: 'buzz' }];
// Poses de costado propias de estas escenas.
const SIDE_POSES = {
  // salto a cabecear: carga con la cabeza atrás y golpe hacia adelante
  hj0: () => ({ lean: 0.05, twist: 0.45, headTilt: -0.25, legs: [{ a: -0.2, k: 1.3, p: 0.6 }, { a: 0.4, k: 1.6, p: 0.6 }], arms: [{ a: 1.4, e: 0.5 }, { a: 0.8, e: 0.9 }] }),
  hj1: () => ({ lean: 0.35, twist: 0.45, headTilt: 0.3, legs: [{ a: -0.35, k: 1.0, p: 0.7 }, { a: 0.2, k: 1.5, p: 0.7 }], arms: [{ a: 1.2, e: 0.6 }, { a: 0.6, e: 1.0 }] }),
  // el defensa salta con los brazos arriba
  dj: () => ({ lean: 0.0, twist: 0.45, headTilt: -0.1, legs: [{ a: 0.1, k: 1.2, p: 0.6 }, { a: 0.3, k: 1.4, p: 0.6 }], arms: [{ a: 2.4, e: 0.3 }, { a: 2.0, e: 0.4 }] }),
  // la barrera: parados con las manos adelante, y el salto
  wall: () => ({ lean: 0.02, twist: 0.45, legs: [{ a: 0.0, k: 0.05, p: 0 }, { a: 0.05, k: 0.05, p: 0 }], arms: [{ a: 0.2, e: 1.5 }, { a: 0.15, e: 1.6 }] }),
  // el arquero achica: se agacha con los brazos abiertos y después se abre en cruz,
  // una pierna estirada hacia la pelota y la otra rodilla abajo, las manos arriba
  gkCharge: () => ({ lean: 0.35, twist: 0.45, headTilt: -0.15, legs: [{ a: 0.5, k: 0.9, p: 0.3 }, { a: -0.1, k: 0.9, p: 0.3 }], arms: [{ a: 1.2, e: 0.2 }, { a: 0.9, e: 0.2 }] }),
  gkSpread: () => ({ lean: 0.3, twist: 0.45, headTilt: -0.1, legs: [{ a: 1.1, k: 0.2, p: 0.3 }, { a: -0.2, k: 1.6, p: 0.3 }], arms: [{ a: 2.3, e: 0.1 }, { a: 1.3, e: 0.2 }] }),
  // la atajada: de rodillas abrazando la pelota; y el saque rápido (carga y suelta)
  gkHold: () => ({ lean: 0.5, twist: 0.45, headTilt: 0.3, legs: [{ a: 1.4, k: 2.2, p: 0.3 }, { a: 0.2, k: 2.2, p: 0.3 }], arms: [{ a: 0.9, e: 1.4 }, { a: 0.7, e: 1.5 }] }),
  gkThrow0: () => ({ lean: -0.15, twist: 0.45, headTilt: -0.1, legs: [{ a: 0.35, k: 0.15, p: 0.1 }, { a: -0.3, k: 0.3, p: 0.2 }], arms: [{ a: 3.4, e: 0.3 }, { a: 1.0, e: 0.4 }] }),
  gkThrow1: () => ({ lean: 0.35, twist: 0.45, headTilt: 0.1, legs: [{ a: 0.5, k: 0.3, p: 0.1 }, { a: -0.5, k: 0.4, p: 0.4 }], arms: [{ a: 1.4, e: 0.05 }, { a: 0.3, e: 0.4 }] }),
  wallJ: () => ({ lean: 0.02, twist: 0.45, legs: [{ a: 0.25, k: 0.9, p: 0.5 }, { a: 0.3, k: 0.95, p: 0.5 }], arms: [{ a: 0.2, e: 1.5 }, { a: 0.15, e: 1.6 }] }),
};
const SPRITES = new Map(); // cuadros ya pintados, se reusan entre escenas
const BALLS = new Map();
const Q = (u, n) => Math.round(Math.max(0, Math.min(1, u)) * n);

const INK = '#14171f';
const SKY = '#0d1424';
const LINE = '#eef0e6';
const NET = '#c9d2dc';
const GRASS = ['#3f9c3b', '#48ab43'];

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => t * t * (3 - 2 * t);
const easeOut = (t) => 1 - (1 - t) * (1 - t);

// Fuente de 3x5 para números y nombres en la espalda y en los carteles.
const FONT = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111',
  F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010',
  K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010',
  P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
  U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010',
  Z: '111001010100111', 0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110',
  4: '101101111001001', 5: '111100110001110', 6: '011100111101111', 7: '111001010010010', 8: '111101111101111',
  9: '111101111001110', '.': '000000000000010', '-': '000000111000000', "'": '010010000000000',
};
const plain = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();

export function text(g, str, x, y, color, k = 1) {
  const s = plain(str);
  g.fillStyle = color;
  for (let c = 0; c < s.length; c++) {
    const gl = FONT[s[c]];
    if (!gl) continue;
    for (let i = 0; i < 15; i++) if (gl[i] === '1') g.fillRect(x + (c * 4 + (i % 3)) * k, y + Math.floor(i / 3) * k, k, k);
  }
}
export const textW = (str, k = 1) => plain(str).length * 4 * k - k;

function seeded(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

export class Cutscene {
  constructor(canvas, card) {
    this.cv = canvas;
    this.g = canvas.getContext('2d');
    this.card = card;
    this.on = false;
  }

  size() {
    const r = this.cv.parentElement.getBoundingClientRect();
    const H = clamp(Math.round((LW * r.height) / Math.max(1, r.width)), 150, 400);
    this.cv.width = LW; this.cv.height = H;
    this.H = H;
    // Plano: arco al 40% del alto; el tirador ocupa la parte baja.
    this.gy = Math.round(H * 0.44);         // línea de gol (pie de los palos)
    this.gTop = this.gy - 40;              // travesaño
    this.gL = 30; this.gR = 150;           // palos
    this.standsB = this.gTop - 12;         // fin de la tribuna
  }

  // o: { kind, att, def, match, outcome, shooter, keeper, kitA, kitD, gkColor, crowd: [colA, colD],
  //      onContact(), onFreeze() }
  async play(o) {
    this.o = o;
    this.size();
    this.buildCrowd();
    this.s = 0; this.speed = 1; this.paused = false; this.shake = 0; this.flash = 0;
    const header = o.kind === 'cabezazo';
    // mano a mano atajado: todo se ve de costado y la pelota le llega enseguida al arquero
    this.manoSave = o.kind === 'mano' && String(o.outcome).startsWith('save');
    this.prepareArt(o, header);
    const runup = { penal: 1.5, cabezazo: 1.3, remate: 1.35, mano: 1.45, libre: 1.75 }[o.kind] || 1.3;
    this.T = { intro: 0.9, kick: 0.9 + runup, F: header ? 0.95 : o.kind === 'penal' ? 0.85 : this.manoSave ? 0.24 : 0.9 };
    this.T.hit = this.T.kick + this.T.F;
    // con gol, la cámara vuelve de costado para la celebración
    this.T.cel = this.T.hit + 1.0;
    this.T.end = o.outcome === 'goal' ? this.T.cel + 2.6 : this.T.hit + (this.manoSave ? 1.7 : 1.2);
    this.showCard();
    this.cv.classList.add('on');
    this.on = true;
    this.last = performance.now();
    const loop = (now) => {
      if (!this.on) return;
      const dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      if (!this.paused) this.s += dt * this.speed;
      this.shake = Math.max(0, this.shake - dt * 3);
      this.flash = Math.max(0, this.flash - dt * 4);
      this.stepParts(this.paused ? 0 : dt * Math.max(this.speed, 0.4));
      this.painted = 0;
      this.draw();
      this.warm(10);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    o.sound('tension');
    await this.until(this.T.intro - 0.1);
    this.hideCard();
    o.sound('heart');
    if (header) {
      await this.until(this.T.kick - 0.75);
      o.sound('longball');
    }
    await this.until(this.T.kick);
    o.sound(header ? 'header' : 'shot');
    this.shake = 0.6;
    this.speed = 0.42; // cámara lenta mientras la pelota viaja
    if (o.match) {
      await this.until(this.T.hit);
      this.speed = 1;
      o.sound('save');
      this.shake = 0.8; this.flash = 0.6;
      o.onContact();
    } else {
      await this.until(this.T.kick + this.T.F * 0.62);
      // Le ganó al arquero: imagen congelada y el dado decide.
      this.paused = true;
      await o.onFreeze();
      this.paused = false;
      this.speed = 0.6;
      await this.until(this.T.hit);
      this.speed = 1;
      if (o.outcome === 'goal') { o.sound('goal'); this.shake = 1.2; this.flash = 1; }
      else if (o.outcome === 'post') { o.sound('post'); this.shake = 0.9; this.flash = 0.5; }
      else { o.sound('kick'); o.sound(String(o.outcome).startsWith('save') ? 'save' : 'miss'); }
    }
    await this.until(this.T.end);
    this.on = false;
  }

  hide() { this.on = false; this.cv.classList.remove('on'); this.hideCard(); }

  until(s) {
    return new Promise((res) => {
      const check = () => { if (this.s >= s || !this.on) res(); else requestAnimationFrame(check); };
      check();
    });
  }

  showCard() {
    const o = this.o;
    const title = { remate: '¡REMATE!', cabezazo: '¡CABEZAZO!', mano: '¡MANO A MANO!', penal: '¡PENAL!', libre: '¡TIRO LIBRE!' }[o.kind] || '¡REMATE!';
    const plate = (p, kit, cls) => `<div class="cut-plate ${cls}" style="--c:${kit.shirt};--c2:${kit.alt2}"><small>${p.team}</small><b>${p.name}</b><i>${p.num}</i></div>`;
    this.card.innerHTML = `${plate(o.shooter, o.kitA, 'a')}<div class="cut-title">${title}</div>${plate(o.keeper, { shirt: o.gkColor, alt2: '#fff' }, 'd')}`;
    this.card.classList.remove('out');
    this.card.classList.add('on');
  }

  hideCard() { this.card.classList.add('out'); setTimeout(() => this.card.classList.remove('on', 'out'), 350); }

  buildCrowd() {
    const [ca, cd] = this.o.crowd;
    this.crowd = [];
    const st = this.o.stadium || { seats: ['#2a2f3a', '#9aa3ad'], features: [] };
    const pal = [ca, ca, cd, '#e8e2d0', st.seats[0], ca, st.seats[1]];
    const f = st.features;
    this.skyH = f.includes('andes') || f.includes('arch') || f.includes('tower') ? 26 : 10;
    for (let y = this.skyH + 2; y < this.standsB - 3; y += 5) {
      for (let x = (y / 5) % 2 ? 0 : 2; x < LW; x += 4) {
        const n = x * 13 + y * 7;
        this.crowd.push({ x, y, c: pal[Math.floor(seeded(n) * pal.length)], skin: seeded(n + 1) < 0.7 ? '#e0a77c' : '#9c6440', ph: seeded(n + 2) * 6.28, fanA: seeded(n + 3) < 0.55 });
      }
    }
  }

  // ---------- jugadores ilustrados ----------
  prepareArt(o, header) {
    if (SPRITES.size > 900) SPRITES.clear();
    this.shKit = p4Kit(o.kitA, false, o.shooter, o.shooter.num);
    this.gkKit = p4Kit({ gk: o.gkColor }, true, o.keeper, o.keeper.num || 1);
    this.GY = this.H - 14;
    const sideKey = `${this.H}|${o.crowd}|${o.stadium && o.stadium.name}`;
    if (!this.sideCam || this.sideKey !== sideKey) { this.sideCam = buildSide(o, LW, this.H, this.GY); this.sideKey = sideKey; }
    this.parts = []; this.lastSpr = {}; this.kicked = false; this.celStarted = false; this.camName = null; this.plant = null;
    const sh = this.shKit, gk = this.gkKit, P = P4.POSES;
    const dir = o.def === 'L' ? -1 : 1;
    const jobs = [];
    const add = (kit, view, sc, key, pose) => jobs.push([kit, view, sc, key, pose]);
    this.dKits = DEF_LOOKS.map((l, i) => p4Kit(o.kitD, false, l, [4, 6, 3, 5][i]));
    // los que miran a la izquierda se dibujan espejados: el número va invertido
    const mir = (k) => ({ ...k, numMirror: true, id: k.id + '|m' });
    this.wKits = this.dKits.map(mir); this.gkKitM = mir(gk);
    const dk = this.dKits[0];
    const runs = (kit) => { for (let i = 0; i < 16; i++) add(kit, 'side', SPR, 'run' + i, () => P.run(i / 16, 0.95)); };
    if (o.kind === 'remate') { runs(dk); add(dk, 'side', SPR, 'slide', () => P.slide()); }
    if (o.kind === 'mano') { const gm = this.gkKitM; runs(dk); runs(gm); add(gm, 'side', SPR, 'gkCharge', SIDE_POSES.gkCharge); for (const k of ['gkSpread', 'gkHold', 'gkThrow0', 'gkThrow1']) add(gm, 'side', SPR, k, SIDE_POSES[k]); }
    if (o.kind === 'cabezazo') { runs(sh); runs(dk); for (const k of ['hj0', 'hj1', 'dj']) add(k === 'dj' ? dk : sh, 'side', SPR, k, SIDE_POSES[k]); add(sh, 'side', SPR, 'idle', () => P.idle()); }
    if (o.kind === 'libre') for (const k of this.wKits) { add(k, 'side', SPR, 'wall', SIDE_POSES.wall); add(k, 'side', SPR, 'wallJ', SIDE_POSES.wallJ); add(k, 'front', 22, 'idleF', () => P.idleFront()); }
    if (!header) {
      add(sh, 'side', SPR, 'idle', () => P.idle());
      for (const i of [0, 5, 12]) add(sh, 'side', SPR, 'kick' + i, () => P.kick(i / 24));
      for (let i = 0; i < 16; i++) add(sh, 'side', SPR, 'run' + i, () => P.run(i / 16, 0.95));
      for (let i = 0; i <= 24; i++) add(sh, 'side', SPR, 'kick' + i, () => P.kick(i / 24));
    } else {
      add(sh, 'back', BSC, 'idle', () => P.idleFront());
      add(sh, 'back', BSC, 'header', () => P.header());
    }
    for (let i = 0; i < 8; i++) add(gk, 'front', KSC, 'kr' + i, () => P.keeperReady(i / 8));
    if (o.def === 'C') add(gk, 'front', KSC, 'up', () => P.armsUp(0.25));
    else for (let i = 0; i <= 16; i++) add(gk, 'front', KSC, `kd${dir}_${i}`, () => P.keeperDive(dir, i / 16));
    if (!header) for (let i = 8; i <= 16; i++) add(sh, 'back', BSC, 'kb' + i, () => P.kickBack(i / 16));
    if (o.outcome === 'goal') for (let i = 0; i <= 24; i++) add(sh, 'side', SPR, 'cel' + i, () => P.celebrate(i / 24));
    this.jobs = jobs;
  }

  // Pinta los cuadros que vienen de a poco, sin trabar la animación.
  warm(ms) {
    const t0 = performance.now();
    while (this.jobs && this.jobs.length && performance.now() - t0 < ms) {
      const [kit, view, sc, key, pose] = this.jobs.shift();
      const k = `${kit.id}|${view}|${sc}|${key}`;
      if (SPRITES.has(k)) continue;
      try { SPRITES.set(k, P4.sprite(pose(), kit, view, sc, null, sc >= 20)); } catch (e) { SPRITES.set(k, null); }
    }
  }

  // Cuadro de un jugador; si falta, se pinta ya (uno por cuadro) o se repite el anterior.
  spr(role, kit, view, sc, key, pose) {
    const k = `${kit.id}|${view}|${sc}|${key}`;
    let s = SPRITES.get(k);
    if (s === undefined) {
      if (this.painted > 0) return this.lastSpr[role] || null;
      this.painted++;
      try { s = P4.sprite(pose(), kit, view, sc, null, sc >= 20); } catch (e) { s = null; }
      SPRITES.set(k, s);
    }
    if (s) this.lastSpr[role] = s;
    return s || this.lastSpr[role] || null;
  }

  ballImg(r, spin) {
    const k = `${Math.round(r * 2)}|${Math.round(spin * 2) % 13}`;
    if (!BALLS.has(k)) BALLS.set(k, P4.ball(Math.round(r * 2) / 2, Math.round(spin * 2) / 2));
    return BALLS.get(k);
  }

  stepParts(dt) {
    if (!this.parts) return;
    for (const p of this.parts) {
      p.life -= dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.g || 0) * dt;
      if (p.wind) p.vx += Math.sin(this.s * 5 + p.y) * dt * 12;
    }
    this.parts = this.parts.filter((p) => p.life > 0);
  }

  drawParts(cam) {
    const g = this.g;
    for (const p of this.parts) {
      if (p.cam !== cam) continue;
      if (p.smoke) { g.fillStyle = `rgba(${hex(p.c).join(',')},${Math.min(0.5, p.life * 0.3)})`; const z = p.life < 1 ? 3 : 2; g.fillRect(Math.round(p.x), Math.round(p.y), z, z); continue; }
      g.fillStyle = p.c; g.fillRect(Math.round(p.x), Math.round(p.y), p.paper && Math.sin(p.life * 9) > 0 ? 2 : 1, p.big ? 2 : 1);
    }
  }

  // ---------- cámara de costado: carrera y remate ----------
  sideKick(i) { return this.spr('side', this.shKit, 'side', SPR, 'kick' + i, () => P4.POSES.kick(i / 24)); }

  // El pateador de costado: carrera hasta la pelota (en x = 0) y el golpe.
  // runLen: largo de la carrera; run0: cuándo arranca a correr.
  kicker(s, runLen = 240, run0) {
    const T = this.T;
    const CONTACT = T.kick, KICK0 = T.kick - 0.27, RUN0 = run0 ?? Math.max(0.15, KICK0 - 1.2);
    // el pie de apoyo queda clavado al lado de la pelota y el empeine llega justo a ella
    if (this.plant == null) {
      const c = SPRITES.get(`${this.shKit.id}|side|${SPR}|kick12`);
      if (c) this.plant = -3 - (c.toe[1][0] - c.ankle[0][0]);
    }
    const plant = this.plant == null ? -24 : this.plant;
    const fromPlant = (sp) => (sp ? plant - (sp.ankle[0][0] - sp.ox) : plant);
    const k0 = SPRITES.get(`${this.shKit.id}|side|${SPR}|kick0`), k5 = SPRITES.get(`${this.shKit.id}|side|${SPR}|kick5`);
    const hipEnd = k5 ? fromPlant(k5) : -40, runEnd = (k0 ? fromPlant(k0) : -60) - 6, hipStart = runEnd - runLen;
    const STRIDE = 175;
    let hip, sp, running = false;
    if (s < RUN0) { hip = hipStart; sp = this.spr('side', this.shKit, 'side', SPR, 'idle', () => P4.POSES.idle()); }
    else if (s < KICK0) {
      const k = (s - RUN0) / (KICK0 - RUN0);
      const e = k < 0.2 ? k * k / 0.4 : k - 0.1; // arranca suave
      hip = hipStart + (runEnd - hipStart) * (e / 0.9);
      // la fase de la carrera sigue la distancia, para que los pies no patinen
      const u0 = 0.4 - ((runEnd - hipStart) / STRIDE) % 1;
      const u = (((u0 + (hip - hipStart) / STRIDE) % 1) + 1) % 1;
      const i = Q(u, 16) % 16;
      sp = this.spr('side', this.shKit, 'side', SPR, 'run' + i, () => P4.POSES.run(i / 16, 0.95));
      running = true;
    } else {
      const u = s < CONTACT ? 0.5 * (s - KICK0) / (CONTACT - KICK0) : Math.min(1, 0.5 + (s - CONTACT) * 1.1);
      sp = this.sideKick(Q(u, 24));
      hip = u < 0.2 ? runEnd + (hipEnd - runEnd) * (u / 0.2) : fromPlant(sp);
      // pasado el remate vuelve a quedarse parado
      if (s > CONTACT + 0.8) sp = this.spr('side', this.shKit, 'side', SPR, 'idle', () => P4.POSES.idle());
    }
    return { hip, sp, hipEnd, runEnd, hipStart, CONTACT, KICK0, RUN0, running };
  }

  drawA(s) { this.sideShot(s, {}); }

  // Un rival de costado: sprite, posición en el mundo, altura del salto y si mira a la izquierda.
  actor(sp, wx, cam, lift = 0, flip = false, shadow = 22, dy = 0) {
    if (!sp) return;
    const g = this.g, GY = this.GY, x = this.sideCam.toScreen(wx, cam);
    g.fillStyle = `rgba(6,22,8,${0.38 - Math.min(0.2, lift * 0.006)})`; g.beginPath(); g.ellipse(x + (flip ? -4 : 4), GY + 1 - dy, shadow - Math.min(8, lift * 0.2), 4, 0, 0, 7); g.fill();
    const y = GY - dy - Math.round(lift) - Math.round(sp.oy);
    if (flip) { g.save(); g.translate(x + Math.round(sp.ox), y); g.scale(-1, 1); g.drawImage(sp.cv, 0, 0); g.restore(); }
    else g.drawImage(sp.cv, x - Math.round(sp.ox), y);
  }

  // Cuadro de carrera según la distancia recorrida (los pies no patinan).
  runSpr(role, kit, dist) {
    const i = Q((((dist / 175) % 1) + 1) % 1, 16) % 16;
    return this.spr(role, kit, 'side', SPR, 'run' + i, () => P4.POSES.run(i / 16, 0.95));
  }

  // Remate de costado con lo que pasa alrededor:
  //   o.runLen / o.run0: la carrera · o.dribble: viene conduciendo la pelota
  //   o.path(k): la pelota después del golpe · o.cam(base, hip): la cámara
  //   o.behind(cam) / o.front(cam): rivales detrás y delante del pateador
  sideShot(s, opt) {
    const g = this.g, GY = this.GY, side = this.sideCam;
    const kk = this.kicker(s, opt.runLen, opt.run0);
    const { hip, sp, hipEnd, CONTACT } = kk;
    let cam = Math.min(hip + 40, hipEnd + 46) + (s > CONTACT ? Math.min(30, (s - CONTACT) * 120) : 0);
    if (opt.cam) cam = opt.cam(cam, hip);
    cam = Math.round(cam);
    side.draw(g, cam, s, 0);
    let bx = 0, by = GY - 6;
    if (s >= CONTACT) { const k = s - CONTACT; [bx, by] = opt.path ? opt.path(k) : [4 + k * 900, GY - 6 - k * 140]; }
    else if (opt.dribble && kk.running) {
      // la lleva pegada: cada paso la toca un poco hacia adelante
      bx = Math.min(0, hip + 30 + Math.abs(Math.sin((hip - kk.hipStart) / 56)) * 9);
    } else if (opt.dribble && s < kk.RUN0) bx = Math.min(0, kk.hipStart + 30);
    const px = side.toScreen(hip, cam), bsx = side.toScreen(bx, cam);
    if (opt.behind) opt.behind(cam);
    g.fillStyle = 'rgba(6,22,8,0.4)'; g.beginPath(); g.ellipse(px + 4, GY + 1, 26, 4, 0, 0, 7); g.fill();
    if (s >= CONTACT && (!opt.trail || opt.trail(s - CONTACT))) for (let i = 1; i < 6; i++) { g.fillStyle = `rgba(255,255,255,${0.22 - i * 0.035})`; g.fillRect(bsx - i * 7 - 4, Math.round(by + i * 1.1) - 3, 7, 6); }
    const air = GY - 6 - by;
    g.fillStyle = `rgba(6,22,8,${Math.max(0.12, 0.35 - air * 0.003)})`; g.beginPath(); g.ellipse(bsx, GY + 1, 6, 2, 0, 0, 7); g.fill();
    if (sp) g.drawImage(sp.cv, px - Math.round(sp.ox), GY - Math.round(sp.oy));
    if (opt.front) opt.front(cam);
    const bi = this.ballImg(6, s >= CONTACT ? (opt.spin ? opt.spin(s - CONTACT) : (s - CONTACT) * 40) : opt.dribble ? -bx / 6 : 0);
    if (s >= CONTACT && s < CONTACT + 0.03) g.drawImage(bi, bsx - bi.width / 2 + 1, by - bi.height / 2 + 2, bi.width - 2, bi.height - 3);
    else g.drawImage(bi, Math.round(bsx - bi.width / 2), Math.round(by - bi.height / 2));
    if (s >= CONTACT && !this.kicked) {
      this.kicked = true;
      for (let i = 0; i < 18; i++) this.parts.push({ cam: 'A', x: bsx - 2, y: GY - 1, vx: (Math.random() - 0.7) * 70, vy: -30 - Math.random() * 60, g: 220, life: 0.9, c: ['#3d8a37', '#5aa64c', '#77803f', '#2d6a2a'][i % 4], big: i % 3 === 0 });
    }
    if (s >= CONTACT && s < CONTACT + 0.1) {
      const r = 8 + (s - CONTACT) * 160;
      g.fillStyle = 'rgba(255,250,220,0.8)';
      for (let a = 0; a < 6.28; a += 0.35) g.fillRect(Math.round(bsx + Math.cos(a) * r), Math.round(by + Math.sin(a) * r * 0.8), 2, 1);
    }
    this.drawParts('A');
    return kk;
  }

  // Remate de jugada: viene conduciendo y un defensa lo persigue y se tira a bloquear.
  drawRemate(s) {
    const T = this.T, GY = this.GY, dk = this.dKits[0];
    this.sideShot(s, {
      runLen: 300, dribble: true,
      path: (k) => [4 + k * 900, GY - 6 - k * 150],
      behind: (cam) => {
        const KICK0 = T.kick - 0.27, RUN0 = Math.max(0.15, KICK0 - 1.2), SL = KICK0 - 0.12;
        const x0 = -390, x1 = -70;
        if (s < SL) {
          const k = clamp((s - RUN0 + 0.15) / (SL - RUN0 + 0.15), 0, 1);
          const wx = lerp(x0, x1, k);
          this.actor(s < RUN0 - 0.15 ? this.spr('def', dk, 'side', SPR, 'run4', () => P4.POSES.run(0.25, 0.95)) : this.runSpr('def', dk, wx), wx, cam);
        } else {
          // la barrida: se desliza y llega tarde, la pelota ya salió
          const k = clamp((s - SL) / 0.55, 0, 1);
          const wx = x1 + easeOut(k) * 120;
          this.actor(this.spr('def', dk, 'side', SPR, 'slide', () => P4.POSES.slide()), wx, cam, 0, false, 30);
          if (k < 0.9 && Math.random() < 0.7) this.parts.push({ cam: 'A', x: this.sideCam.toScreen(wx + 20, cam), y: GY - 1, vx: 20 + Math.random() * 40, vy: -20 - Math.random() * 40, g: 200, life: 0.5, c: ['#3d8a37', '#5aa64c', '#77803f'][(Math.random() * 3) | 0] });
        }
      },
    });
  }

  // Mano a mano: se va solo, el defensa queda atrás y el arquero sale a achicar.
  drawMano(s) {
    const T = this.T, GY = this.GY, dk = this.dKits[0], gk = this.gkKitM;
    const KICK0 = T.kick - 0.27, RUN0 = Math.max(0.15, KICK0 - 1.2);
    const kx = (t) => {
      // el arquero sale corriendo, frena agachado y se abre en cruz cuando le pegan
      if (t < KICK0 - 0.2) return lerp(330, 110, easeOut(clamp((t - RUN0) / (KICK0 - 0.2 - RUN0), 0, 1)));
      return 110 - easeOut(clamp((t - KICK0 + 0.2) / 0.5, 0, 1)) * (this.manoSave ? 14 : 40);
    };
    // atajada: el remate le pega en la mano baja; después se queda con ella, la manda al córner
    // o se levanta y saca rápido para el contragolpe
    const o = this.o, save = this.manoSave, HIT = T.hit - T.kick, THROW = HIT + 0.75;
    const gkPhase = (t) => {
      if (t < KICK0 - 0.2) return 'run';
      if (t < KICK0 - 0.06) return 'gkCharge';
      const k = t - T.kick;
      if (!save || k < HIT + 0.12 || o.outcome === 'save_corner') return 'gkSpread';
      if (o.outcome === 'save_counter') return k < THROW - 0.25 ? 'gkHold' : k < THROW ? 'gkThrow0' : 'gkThrow1';
      return 'gkHold';
    };
    // un punto del dibujo del arquero en el mundo (está espejado: mira a la izquierda)
    const gkAt = (pose, pt, t) => {
      const c = SPRITES.get(`${gk.id}|side|${SPR}|${pose}`);
      if (!c) return [kx(t) - 30, GY - 40];
      const p = pt === 'hold' ? [(c.hand[0][0] + c.hand[1][0]) / 2 - 3, (c.hand[0][1] + c.hand[1][1]) / 2]
        : c.hand.reduce((a, b) => ((pt === 'low' ? b[1] > a[1] : b[1] < a[1]) ? b : a));
      return [kx(t) + c.ox - p[0], GY - c.oy + p[1]];
    };
    const savePath = (k) => {
      const C = gkAt('gkSpread', 'low', T.hit);
      if (k < HIT) { const u = k / HIT; return [lerp(4, C[0], u), lerp(GY - 6, C[1], u) - Math.sin(u * Math.PI) * 6]; }
      const j = k - HIT;
      if (o.outcome === 'save_corner') return [C[0] + j * 170, C[1] - j * 330 + j * j * 420];
      const pose = gkPhase(T.kick + k);
      if (pose === 'gkThrow1') { const H0 = gkAt('gkThrow0', 'high', T.kick + THROW), q = k - THROW; return [H0[0] - q * 420, H0[1] - q * 230 + q * q * 260]; }
      return pose === 'gkSpread' ? C : pose === 'gkThrow0' ? gkAt('gkThrow0', 'high', T.kick + k) : gkAt('gkHold', 'hold', T.kick + k);
    };
    this.sideShot(s, {
      runLen: 300, dribble: true,
      // la pica por arriba del arquero, o el remate que el arquero ataja
      path: (k) => (save ? savePath(k) : [4 + k * 560, GY - 6 - (4 + k * 560) * 1.6 + (4 + k * 560) ** 2 * 0.0034]),
      trail: (k) => !save || k < HIT || (o.outcome === 'save_corner' && k < HIT + 0.4) || (o.outcome === 'save_counter' && k > THROW),
      spin: (k) => (!save || k < HIT ? k * 40 : o.outcome === 'save_corner' ? k * 60 : o.outcome === 'save_counter' && k > THROW ? k * 30 : HIT * 40),
      cam: (base, hip) => Math.min(hip + 45, Math.max(base, (hip + kx(s)) / 2)),
      behind: (cam) => {
        // el defensa corre detrás y no llega
        const wx = lerp(-420, -120, clamp((s - RUN0 + 0.1) / (T.kick + 0.3 - RUN0), 0, 1));
        this.actor(this.runSpr('def', dk, wx), wx, cam);
      },
      front: (cam) => {
        const x = kx(s);
        const ph = gkPhase(s);
        const sp = ph === 'run' ? this.runSpr('gkr', gk, -x) : this.spr('gkr', gk, 'side', SPR, ph, SIDE_POSES[ph]);
        this.actor(sp, x, cam, 0, true, ph === 'gkSpread' ? 30 : 22);
      },
    });
  }

  // Tiro libre: la barrera de cuatro, carrera corta y la pelota pasa por arriba con efecto.
  drawLibre(s) {
    const T = this.T, GY = this.GY;
    const WX = 190; // la barrera, a nueve pasos
    const jump = (i) => { const t = s - T.kick - 0.04 - i * 0.03; return t > 0 && t < 0.62 ? Math.sin((t / 0.62) * Math.PI) * 24 : 0; };
    this.sideShot(s, {
      runLen: 70, run0: T.kick - 0.8,
      // pasa rozando las cabezas de la barrera
      path: (k) => { const x = 4 + k * 620; return [x, GY - 6 - x * 0.9 + x * x * 0.0011]; },
      // antes del golpe se ven el pateador y la pelota; después sigue a la pelota hasta la barrera
      cam: (base, hip) => Math.max(base, hip / 2 + 8) + (s > T.kick ? Math.min(165, (s - T.kick) * 620) : 0),
      front: (cam) => {
        // de atrás hacia adelante, cada uno un poco corrido
        for (let i = 3; i >= 0; i--) {
          const kit = this.wKits[i], h = jump(i);
          const sp = h > 1 ? this.spr('w' + i, kit, 'side', SPR, 'wallJ', SIDE_POSES.wallJ) : this.spr('w' + i, kit, 'side', SPR, 'wall', SIDE_POSES.wall);
          this.actor(sp, WX + i * 9, cam, h, true, 14, i * 4);
        }
      },
    });
  }

  // Cabezazo de costado: el centro llega por el aire, el delantero y el defensa
  // saltan juntos, se empujan y el delantero la toca primero.
  drawHeader(s) {
    const g = this.g, T = this.T, GY = this.GY, side = this.sideCam, sh = this.shKit, dk = this.dKits[0];
    const J0 = T.kick - 0.34, AIR = 0.78, X0 = -14;
    const hJump = (t, peak) => (t > 0 && t < AIR ? Math.sin((t / AIR) * Math.PI) * peak : 0);
    // delantero: corre hasta el punto de salto y sigue un poco en el aire
    const RUN0 = Math.max(0.2, J0 - 1.0);
    let wx, sp, lift = 0;
    if (s < RUN0) { wx = X0 - 230; sp = this.spr('side', sh, 'side', SPR, 'idle', () => P4.POSES.idle()); }
    else if (s < J0) { wx = lerp(X0 - 230, X0, (s - RUN0) / (J0 - RUN0)); sp = this.runSpr('side', sh, wx); }
    else {
      wx = X0 + (s - J0) * 42; lift = hJump(s - J0, 34);
      const pose = s < T.kick - 0.05 ? 'hj0' : s < T.kick + 0.3 ? 'hj1' : s - J0 < AIR ? 'hj0' : 'idle';
      sp = this.spr('side', sh, 'side', SPR, pose, pose === 'idle' ? () => P4.POSES.idle() : SIDE_POSES[pose]);
    }
    // defensa: llega desde atrás, salta un poco después y más bajo, pegado a la espalda
    const D0 = J0 + 0.05;
    let dx, dsp, dl = 0;
    if (s < D0) { dx = lerp(X0 - 300, X0 - 16, clamp((s - RUN0 + 0.05) / (D0 - RUN0 + 0.05), 0, 1)); dsp = this.runSpr('def', dk, dx); }
    else { dx = X0 - 16 + (s - D0) * 30; dl = hJump(s - D0, 26); dsp = this.spr('def', dk, 'side', SPR, dl > 2 ? 'dj' : 'run4', dl > 2 ? SIDE_POSES.dj : () => P4.POSES.run(0.25, 0.95)); }
    // la cabeza del delantero en el momento del golpe (se mide en el dibujo)
    const hj1 = SPRITES.get(`${sh.id}|side|${SPR}|hj1`);
    const head = hj1 ? topOf(hj1) : [8, 6];
    const cx = X0 + (T.kick - J0) * 42 - (hj1 ? hj1.ox : 30) + head[0] + 3, cy = GY - hJump(T.kick - J0, 34) - (hj1 ? hj1.oy : 108) + head[1] + 4;
    const cam = Math.round(Math.max(wx + 30, Math.min(X0 + 40, wx + 60)) + (s > T.kick ? Math.min(50, (s - T.kick) * 200) : 0));
    side.draw(g, cam, s, 0);
    // pelota: el centro desde la izquierda, y después el cabezazo hacia abajo
    let bx, by;
    const C0 = T.kick - 1.0;
    if (s < T.kick) { const p = clamp((s - C0) / 1.0, 0, 1); bx = lerp(cx - 360, cx, p); by = lerp(cy - 40, cy, p) - Math.sin(p * Math.PI) * 22; }
    else { const k = s - T.kick; bx = cx + k * 820; by = cy + k * 260; }
    this.actor(dsp, dx, cam, dl);
    this.actor(sp, wx, cam, lift, false, 26);
    // el choque en el aire: un par de chispas al juntarse
    if (s > T.kick - 0.08 && s < T.kick + 0.08) { g.fillStyle = 'rgba(255,250,220,0.85)'; const x = side.toScreen(dx + 26, cam), y = GY - dl - 70; g.fillRect(x, y, 2, 1); g.fillRect(x + 3, y - 3, 1, 2); g.fillRect(x - 2, y + 4, 1, 1); }
    if (s >= C0) {
      const bsx = side.toScreen(bx, cam);
      // estela: también en el centro, para que se lea contra la tribuna
      for (let i = 1; i < 6; i++) { g.fillStyle = `rgba(255,255,255,${0.22 - i * 0.035})`; g.fillRect(bsx - i * 7 - 4, Math.round(by - i * (s >= T.kick ? 2 : -0.6)) - 3, 7, 6); }
      const bi = this.ballImg(6, (s - C0) * 25);
      g.drawImage(bi, Math.round(bsx - bi.width / 2), Math.round(by - bi.height / 2));
      if (s >= T.kick && s < T.kick + 0.1) {
        const r = 8 + (s - T.kick) * 160;
        g.fillStyle = 'rgba(255,250,220,0.8)';
        for (let a = 0; a < 6.28; a += 0.35) g.fillRect(Math.round(bsx + Math.cos(a) * r), Math.round(by + Math.sin(a) * r * 0.8), 2, 1);
      }
    }
    this.drawParts('A');
  }

  // ---------- cámara de costado: la celebración ----------
  // corre, salta con los brazos en alto y cae de rodillas deslizándose por el pasto
  drawC(s) {
    const g = this.g, GY = this.GY, side = this.sideCam, o = this.o;
    const k = s - this.T.cel;
    const top = side.standsTop;
    if (!this.celStarted) {
      this.celStarted = true;
      this.bengalas = [[40, top + 96], [150, top + 96]];
      const cols = [o.kitA.shirt, o.kitA.alt2 || '#f4f4f4', '#ffd23f'].map((c) => (c.startsWith('#') && c.length === 7 ? c : '#f4f4f4'));
      for (let i = 0; i < 140; i++) this.parts.push({ cam: 'C', x: Math.random() * LW, y: top - Math.random() * 120, vx: (Math.random() - 0.5) * 10, vy: 14 + Math.random() * 18, life: 6, wind: true, c: cols[(Math.random() * 3) | 0], paper: true });
    }
    const RUN_T = 0.45, CEL_T = 1.7, v0 = 300;
    let wx, sp, sliding = false;
    if (k < RUN_T) {
      wx = 120 + v0 * k;
      const i = Q((((wx / 175) % 1) + 1) % 1, 16) % 16;
      sp = this.spr('side', this.shKit, 'side', SPR, 'run' + i, () => P4.POSES.run(i / 16, 0.95));
    } else {
      const u = Math.min(1, (k - RUN_T) / CEL_T);
      // en el aire sigue a la misma velocidad; al apoyar las rodillas frena de a poco
      const tAir = 0.3 * CEL_T, tk = k - RUN_T;
      const slideT = Math.max(0, tk - tAir), dec = v0 / (0.55 * CEL_T);
      const slideD = slideT < v0 / dec ? v0 * slideT - dec * slideT * slideT / 2 : v0 * v0 / (2 * dec);
      wx = 120 + v0 * RUN_T + v0 * Math.min(tk, tAir) + slideD;
      sliding = slideT > 0 && slideT < v0 / dec;
      const i = Q(u, 24);
      sp = this.spr('side', this.shKit, 'side', SPR, 'cel' + i, () => P4.POSES.celebrate(i / 24));
    }
    const cam = Math.max(330, wx - 20);
    side.draw(g, cam, s, 1);
    for (const b of this.bengalas) if (Math.random() < 0.8) this.parts.push({ cam: 'C', x: b[0] + (Math.random() - 0.5) * 3, y: b[1] - 4, vx: (Math.random() - 0.5) * 6, vy: -10 - Math.random() * 12, life: 1.5 + Math.random(), smoke: true, c: Math.random() < 0.5 ? '#c8c2c8' : '#9e98a6' });
    const px = side.toScreen(wx, cam);
    if (sliding) for (let i = 0; i < 3; i++) this.parts.push({ cam: 'C', x: px - 10 - Math.random() * 20, y: GY - 2, vx: -20 - Math.random() * 50, vy: -25 - Math.random() * 45, g: 200, life: 0.6, c: ['#3d8a37', '#5aa64c', '#77803f', '#e8ecef'][(Math.random() * 4) | 0], big: Math.random() < 0.4 });
    this.drawParts('C');
    for (const b of this.bengalas) { g.fillStyle = Math.random() < 0.5 ? '#ff4a2a' : '#ffb04a'; g.fillRect(b[0], b[1] - 5, 2, 2); g.fillStyle = 'rgba(255,90,40,0.25)'; g.fillRect(b[0] - 3, b[1] - 8, 8, 8); }
    g.fillStyle = 'rgba(6,22,8,0.4)'; g.beginPath(); g.ellipse(px + 4, GY + 1, 28, 4, 0, 0, 7); g.fill();
    // la marca de las rodillas en el pasto
    if (k > RUN_T + 0.3 * CEL_T) { g.fillStyle = 'rgba(30,70,30,0.35)'; const x0 = side.toScreen(120 + v0 * RUN_T + v0 * 0.3 * CEL_T, cam); g.fillRect(x0, GY - 1, Math.max(0, px - x0), 2); }
    if (sp) g.drawImage(sp.cv, px - Math.round(sp.ox), GY - Math.round(sp.oy));
    // resplandor de las bengalas
    g.globalCompositeOperation = 'screen';
    const rg = g.createRadialGradient(LW / 2, top + 50, 5, LW / 2, top + 50, 130);
    rg.addColorStop(0, 'rgba(255,80,40,0.1)'); rg.addColorStop(1, 'rgba(255,80,40,0)');
    g.fillStyle = rg; g.fillRect(0, 0, LW, this.H);
    g.globalCompositeOperation = 'source-over';
  }

  // ---------- trayectorias ----------
  // Puntos en pantalla según el lado (en el marco del atacante = pantalla, vista desde atrás).
  target(side) {
    const x = { L: this.gL + 16, C: 90, R: this.gR - 16 }[side];
    const y = side === 'C' ? this.gTop + 15 : this.gTop + 12;
    return [x, y];
  }

  ballStart() {
    const H = this.H;
    return this.o.kind === 'cabezazo' ? [90, H - 92] : [93, H - 36];
  }

  // Posición de la pelota en el tiempo de escena s → [x, y, r, behindGoal]
  ball(s) {
    const o = this.o, T = this.T, H = this.H;
    const start = this.ballStart();
    if (s < T.kick) {
      if (o.kind === 'cabezazo') {
        // centro que llega desde la izquierda
        const p = clamp((s - (T.kick - 0.75)) / 0.75, 0, 1);
        if (p <= 0) return null;
        const x = lerp(-10, start[0], p), y = lerp(H * 0.5, start[1], p) - Math.sin(p * Math.PI) * 30;
        return [x, y, lerp(2.4, 3.2, p), false];
      }
      return [start[0], start[1], 3.4, false];
    }
    const aim = this.target(o.att);
    const end = this.finalPoint();
    const p = clamp((s - T.kick) / T.F, 0, 1);
    const k = 0.62;
    let x, y;
    if (o.match || p <= k) {
      const goal = o.match ? end : aim;
      const q = easeOut(p);
      x = lerp(start[0], goal[0], q); y = lerp(start[1], goal[1], q) - Math.sin(p * Math.PI) * 18;
    } else {
      const qk = easeOut(k);
      const mx = lerp(start[0], aim[0], qk), my = lerp(start[1], aim[1], qk) - Math.sin(k * Math.PI) * 18;
      const q = (p - k) / (1 - k);
      x = lerp(mx, end[0], q); y = lerp(my, end[1], q) - Math.sin(Math.PI * (k + q * (1 - k))) * 18 * (1 - q);
    }
    let r = lerp(3.4, 1.4, easeOut(p));
    if (s <= T.hit) return [x, y, r, false];
    // Después del contacto.
    const a = clamp((s - T.hit) / 0.9, 0, 1);
    switch (o.outcome) {
      case 'goal': {
        const drop = easeOut(clamp((s - T.hit - 0.15) / 0.6, 0, 1));
        return [end[0] + (end[0] - 90) * 0.04 * a, lerp(end[1] - 2, this.gy - 3, drop), 1.9, true];
      }
      case 'post': {
        const out = end[0] < 90 ? -1 : 1;
        return [end[0] + out * 34 * a, end[1] + 60 * a * a - Math.sin(a * Math.PI) * 14, lerp(1.4, 2.6, a), false];
      }
      case 'clear': {
        // Un defensor la saca en la línea: rebota hacia la cancha.
        const out = end[0] < 90 ? 1 : -1;
        return [end[0] + out * 26 * a, end[1] + 70 * a - Math.sin(a * Math.PI) * 26, lerp(1.6, 3.2, a), false];
      }
      case 'wide': {
        return [end[0] + (end[0] - 90) * 0.35 * a, end[1] - 22 * a, lerp(1.4, 0.8, a), true];
      }
      case 'save_corner': {
        const out = end[0] < 90 ? -1 : 1;
        return [end[0] + out * (40 * a), end[1] - Math.sin(a * Math.PI) * 16 + a * 10, 1.4, a > 0.5];
      }
      default: {
        // la retiene
        const h = this.keeperHands(s);
        return [h[0], h[1], 1.4, false];
      }
    }
  }

  finalPoint() {
    const o = this.o;
    const aim = this.target(o.att);
    if (o.match) return aim;
    if (o.outcome === 'goal' || o.outcome === 'clear') return [aim[0] + (o.att === 'L' ? -4 : o.att === 'R' ? 4 : 0), aim[1] - 2];
    if (o.outcome === 'post') return o.att === 'C' ? [96, this.gTop] : [o.att === 'L' ? this.gL + 1 : this.gR - 1, this.gTop + 14];
    // afuera
    if (o.att === 'C') return [100, this.gTop - 12];
    return [o.att === 'L' ? this.gL - 12 : this.gR + 12, this.gTop + 8];
  }

  // Arquero: estado en s → { x, y, pose, dir, lift }
  keeper(s) {
    const o = this.o, T = this.T;
    const x0 = 90, y0 = this.gy - 1;
    const start = T.kick + T.F * 0.22;
    if (s < start) {
      const bounce = Math.abs(Math.sin(s * 7)) * 2;
      const sway = Math.sin(s * 2.3) * 4;
      return { x: x0 + sway, y: y0 - (s > T.intro ? bounce : 0), pose: 'ready' };
    }
    const p = clamp((s - start) / (T.F * 0.7), 0, 1);
    if (o.def === 'C') {
      return { x: x0, y: y0 - Math.sin(Math.min(p, 1) * Math.PI * 0.5) * 6, pose: 'up' };
    }
    const dir = o.def === 'L' ? -1 : 1;
    // El centro del cuerpo termina de modo que las manos lleguen al rincón.
    const aim = this.target(o.def);
    const tx = aim[0] - dir * 24;
    if (p < 0.18) return { x: x0 + dir * 3, y: y0 + 1, pose: 'load', dir, p };
    const q = easeOut((p - 0.18) / 0.82);
    const peak = this.gy - 10 - aim[1];
    const lift = Math.sin(clamp(q, 0, 1) * Math.PI * 0.75) * peak;
    const fall = s > T.hit + 0.15 ? clamp((s - T.hit - 0.15) / 0.45, 0, 1) : 0;
    return { x: lerp(x0, tx, q), y: this.gy - 10 - lift * (1 - fall) + fall * 4, pose: 'dive', dir, p };
  }

  keeperHands(s) {
    const k = this.keeper(s);
    if (k.pose === 'dive') return [k.x + k.dir * 17, k.y - 3];
    if (k.pose === 'up') return [k.x, k.y - 34];
    return [k.x, k.y - 17];
  }

  // ---------- dibujo ----------
  draw() {
    const g = this.g, H = this.H, s = this.s, o = this.o, T = this.T;
    // De costado para la carrera y el remate, desde atrás mientras la pelota
    // viaja al arco y, si es gol, otra vez de costado para la celebración.
    const camName = this.manoSave || s < T.kick + (SIDE_AFTER[o.kind] ?? 0.12) ? 'A' : o.outcome === 'goal' && s > T.cel ? 'C' : 'B';
    if (camName !== this.camName) { if (this.camName) this.flash = Math.max(this.flash, 0.45); this.camName = camName; }
    if (camName !== 'B') {
      g.save();
      g.fillStyle = '#05060a'; g.fillRect(0, 0, LW, H);
      if (this.shake > 0) g.translate(Math.round((Math.random() - 0.5) * 4 * this.shake), Math.round((Math.random() - 0.5) * 3 * this.shake));
      if (camName === 'A') {
        if (o.kind === 'cabezazo') this.drawHeader(s);
        else if (o.kind === 'remate') this.drawRemate(s);
        else if (o.kind === 'mano') this.drawMano(s);
        else if (o.kind === 'libre') this.drawLibre(s);
        else this.drawA(s);
      } else this.drawC(s);
      g.restore();
    } else this.drawBack();

    // viñeta y destello
    this.overlays();
  }

  drawBack() {
    const g = this.g, H = this.H, s = this.s, o = this.o, T = this.T;
    g.save();
    // Cámara: entra desde un plano abierto y se acerca al arco.
    const intro = ease(clamp(s / T.intro, 0, 1));
    const z = lerp(1.35, 1.16, intro) + (s > T.kick ? 0.5 * ease(clamp((s - T.kick) / T.F, 0, 1)) : 0);
    const fy = s > T.kick ? lerp(H * 0.5, this.gy - 14, ease(clamp((s - T.kick) / T.F, 0, 1))) : H * 0.5;
    const sh = this.shake > 0 ? Math.round((Math.random() - 0.5) * 4 * this.shake) : 0;
    g.translate(LW / 2 + sh, H * 0.5);
    g.scale(z, z);
    g.translate(-LW / 2, -fy + (this.shake > 0 ? Math.round((Math.random() - 0.5) * 3 * this.shake) : 0));

    this.drawStands(s);
    this.drawPitch();
    const b = this.ball(s);
    const goalSide = o.outcome === 'goal' && s > T.hit;
    this.drawNet(goalSide ? b : null, s);
    if (b && b[3]) this.drawBall(b, s);
    this.drawKeeper(this.keeper(s));
    this.drawPosts();
    if (b && !b[3]) {
      // sombra
      if (s >= T.kick || o.kind !== 'cabezazo') {
        const shY = s < T.kick ? b[1] + 3 : lerp(this.ballStart()[1] + 3, this.gy + 4, clamp((s - T.kick) / T.F, 0, 1));
        g.fillStyle = 'rgba(0,0,0,.28)';
        g.fillRect(Math.round(b[0] - b[2]), Math.round(Math.min(shY, H - 2)), Math.round(b[2] * 2), 1);
      }
      this.drawBall(b, s);
    }
    this.drawShooter(s);
    g.restore();
  }

  overlays() {
    const g = this.g, H = this.H, s = this.s, T = this.T;
    const vg = g.createRadialGradient(LW / 2, H * 0.45, H * 0.25, LW / 2, H * 0.45, H * 0.8);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)');
    g.fillStyle = vg; g.fillRect(0, 0, LW, H);
    if (this.rain) {
      // lluvia en pixel art: tono frío y gotas en diagonal
      g.fillStyle = 'rgba(40,55,80,.22)'; g.fillRect(0, 0, LW, H);
      const t = performance.now() / 1000;
      g.fillStyle = 'rgba(200,215,235,.5)';
      for (let i = 0; i < 70; i++) {
        const r1 = (i * 0.618) % 1, r2 = (i * 0.377 + 0.13) % 1, v = 0.8 + ((i * 0.29) % 0.6);
        const y = Math.round(((r2 + t * v * 1.4) % 1) * (H + 12)) - 6;
        const x = Math.round((((r1 - t * v * 0.2) % 1) + 1) % 1 * (LW + 6));
        g.fillRect(x, y, 1, 3); g.fillRect(x - 1, y + 3, 1, 2);
      }
    }
    if (s > T.kick && s < T.hit + 0.2 && this.speed < 1) {
      g.fillStyle = 'rgba(40,60,120,.12)'; g.fillRect(0, 0, LW, H);
    }
    if (this.flash > 0) { g.fillStyle = `rgba(255,255,255,${this.flash * 0.6})`; g.fillRect(0, 0, LW, H); }
  }

  drawStands(s) {
    const g = this.g, o = this.o, T = this.T;
    const st = o.stadium || { seats: ['#2a2f3a', '#3a404d'], features: [], sky: 'night', name: 'CALCCIOPOLI' };
    const f = st.features, skyH = this.skyH;
    // cielo
    const sky = { night: ['#070b16', '#16203a'], dusk: ['#3b2a5a', '#e08a5a'], day: ['#5f9fd8', '#b8dcf2'] }[st.sky] || ['#070b16', '#16203a'];
    const gr = g.createLinearGradient(0, -40, 0, this.standsB);
    gr.addColorStop(0, sky[0]); gr.addColorStop(1, sky[1]);
    g.fillStyle = gr; g.fillRect(-40, -60, LW + 80, this.standsB + 60);
    if (f.includes('andes')) {
      // la cordillera detrás de la tribuna, con nieve en las cumbres
      for (let x = -40; x < LW + 40; x++) {
        const h = 10 + Math.sin(x * 0.07) * 5 + Math.sin(x * 0.19 + 1) * 3 + Math.sin(x * 0.031 + 2) * 6;
        const top = Math.round(skyH - h);
        g.fillStyle = st.sky === 'day' ? '#6a7a96' : '#4a3f63'; g.fillRect(x, top, 1, skyH - top + 2);
        g.fillStyle = '#f4f2f0'; g.fillRect(x, top, 1, Math.max(1, Math.round(h / 5)));
      }
    }
    if (f.includes('arch')) {
      // arco de Wembley cruzando el cielo
      g.fillStyle = '#f4f6f8';
      for (let x = -30; x < LW + 30; x++) { const t = (x - LW / 2) / (LW / 2 + 30); g.fillRect(x, Math.round(2 + t * t * (skyH + 4)), 1, 2); }
    }
    // techo sobre la tribuna
    const standTop = skyH;
    g.fillStyle = tone(st.seats[0], -0.55);
    g.fillRect(-40, standTop, LW + 80, this.standsB - standTop);
    for (let y = standTop; y < this.standsB; y += 3) { g.fillStyle = tone(st.seats[0], (y / 3) % 2 ? -0.35 : -0.45); g.fillRect(-40, y, LW + 80, 1); }
    if (st.roof) {
      g.fillStyle = st.roof; g.fillRect(-40, standTop - 3, LW + 80, 4);
      g.fillStyle = tone(st.roof, -0.3);
      for (let x = -40; x < LW + 40; x += 8) g.fillRect(x, standTop - 3, 1, 4);
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(-40, standTop + 1, LW + 80, 2);
    }
    if (f.includes('trusses')) {
      g.fillStyle = '#b3261e';
      for (const x of [-6, LW - 6]) g.fillRect(x, standTop - 10, 12, this.standsB - standTop + 10);
      g.fillRect(-40, standTop - 6, LW + 80, 2);
    }
    // focos
    if (st.sky !== 'day') for (let i = 0; i < 4; i++) {
      const x = 14 + i * 50;
      g.fillStyle = '#fffbe0'; g.fillRect(x, standTop - 6, 8, 3);
      g.fillStyle = 'rgba(255,250,210,.06)'; g.fillRect(x - 6, standTop - 3, 20, this.standsB);
    }
    const goalJump = o.outcome === 'goal' && s > T.hit;
    const tense = s > T.kick && s < T.hit;
    for (const p of this.crowd) {
      let dy = Math.sin(s * 3 + p.ph) > 0.6 ? -1 : 0;
      if (goalJump && p.fanA) dy = Math.sin(s * 14 + p.ph) > 0 ? -3 : 0;
      if (tense) dy = 0;
      g.fillStyle = p.c; g.fillRect(p.x, p.y + 2 + dy, 3, 3);
      g.fillStyle = p.skin; g.fillRect(p.x + 1, p.y + dy, 2, 2);
      if (goalJump && p.fanA && dy < 0) { g.fillStyle = p.skin; g.fillRect(p.x, p.y - 2 + dy, 1, 2); g.fillRect(p.x + 3, p.y - 2 + dy, 1, 2); }
    }
    if (f.includes('tower')) {
      // Torre de los Homenajes asomando detrás de la tribuna
      const x = 128;
      g.fillStyle = '#e9e7df'; g.fillRect(x, -30, 10, this.standsB + 30 - 2);
      g.fillStyle = '#c9c6bc'; g.fillRect(x + 7, -30, 3, this.standsB + 28);
      for (let y = -24; y < this.standsB - 6; y += 6) { g.fillStyle = '#9aa3ad'; g.fillRect(x + 2, y, 4, 2); }
      g.fillStyle = '#75aadb'; g.fillRect(x - 1, -34, 12, 4);
    }
    // carteles con el nombre del estadio
    const by = this.standsB;
    for (let i = 0; i < 7; i++) {
      const x = i * 32 - ((s * 6) % 32) - 8;
      g.fillStyle = i % 2 ? tone(st.seats[0], -0.2) : '#14171f';
      g.fillRect(Math.round(x), by, 32, 10);
    }
    const label = st.name || 'CALCCIOPOLI';
    const w = textW(label);
    g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(Math.round(LW / 2 - w / 2) - 3, by + 1, w + 6, 8);
    text(g, label, Math.round(LW / 2 - w / 2), by + 3, '#ffffff');
    g.fillStyle = INK; g.fillRect(-20, by + 10, LW + 40, 1);
  }

  drawPitch() {
    const g = this.g, H = this.H;
    const top = this.standsB + 11;
    const n = 9;
    for (let i = 0; i < n; i++) {
      const y0 = top + (H - top) * Math.pow(i / n, 1.5);
      const y1 = top + (H - top) * Math.pow((i + 1) / n, 1.5);
      g.fillStyle = GRASS[i % 2];
      g.fillRect(-20, Math.floor(y0), LW + 40, Math.ceil(y1 - y0) + 1);
    }
    const gy = this.gy;
    g.fillStyle = LINE;
    g.fillRect(-20, gy, LW + 40, 1);
    // área chica y área grande en perspectiva
    const box = (wNear, depth, wFar) => {
      const yF = gy + depth;
      g.fillRect(Math.round(90 - wNear), yF, Math.round(wNear * 2), 1);
      for (let y = gy; y <= yF; y++) {
        const t = (y - gy) / depth;
        const w = lerp(wFar, wNear, t);
        g.fillRect(Math.round(90 - w), y, 1, 1);
        g.fillRect(Math.round(90 + w), y, 1, 1);
      }
    };
    box(52, 14, 46);
    box(108, 44, 86);
    g.fillRect(89, gy + 32, 3, 1);
  }

  drawNet(ball, s) {
    const g = this.g, gL = this.gL, gR = this.gR, gTop = this.gTop, gy = this.gy;
    const back = 8; // fondo del arco hacia arriba en pantalla
    g.fillStyle = 'rgba(10,14,22,.35)';
    g.fillRect(gL + 2, gTop - back + 2, gR - gL - 4, gy - gTop + back - 2);
    // abombado de la red con el gol
    let bx = -99, by = -99, amp = 0;
    if (ball) {
      bx = ball[0]; by = ball[1];
      amp = Math.max(0, 1 - (s - this.T.hit) / 1.2) * 5;
    }
    g.fillStyle = NET;
    for (let x = gL + 3; x < gR - 1; x += 4) {
      for (let y = gTop - back + 3; y < gy; y++) {
        const d = Math.hypot(x - bx, y - by);
        const off = d < 18 ? Math.round((1 - d / 18) * amp * Math.sign(x - bx || 1)) : 0;
        g.fillRect(x + off, y, 1, 1);
      }
    }
    for (let y = gTop - back + 3; y < gy; y += 4) {
      for (let x = gL + 3; x < gR - 1; x++) {
        const d = Math.hypot(x - bx, y - by);
        const off = d < 18 ? Math.round((1 - d / 18) * amp * 0.6) : 0;
        g.fillRect(x, y - off, 1, 1);
      }
    }
    // laterales del fondo
    g.fillStyle = '#aab3bd';
    g.fillRect(gL + 2, gTop - back + 2, gR - gL - 4, 1);
    for (let i = 0; i < back; i++) { g.fillRect(gL + 2 + Math.round(i * 0.25), gTop - back + 2 + i, 1, 1); g.fillRect(gR - 3 - Math.round(i * 0.25), gTop - back + 2 + i, 1, 1); }
  }

  drawPosts() {
    const g = this.g, gL = this.gL, gR = this.gR, gTop = this.gTop, gy = this.gy;
    g.fillStyle = '#9aa3ad';
    g.fillRect(gL + 2, gTop + 2, 1, gy - gTop - 2); g.fillRect(gR - 3, gTop + 2, 1, gy - gTop - 2);
    g.fillStyle = '#ffffff';
    g.fillRect(gL - 1, gTop - 1, 3, gy - gTop + 1);
    g.fillRect(gR - 2, gTop - 1, 3, gy - gTop + 1);
    g.fillRect(gL - 1, gTop - 1, gR - gL + 2, 3);
    g.fillStyle = 'rgba(0,0,0,.25)';
    g.fillRect(gL - 1, gy, 4, 1); g.fillRect(gR - 2, gy, 4, 1);
  }

  drawBall(b, s) {
    const g = this.g;
    const [x, y, r] = b;
    // estela durante el vuelo
    if (s > this.T.kick && s < this.T.hit + 0.3) {
      for (let k = 1; k <= 4; k++) {
        const pb = this.ball(s - k * 0.035);
        if (!pb) continue;
        g.fillStyle = `rgba(255,255,255,${0.22 - k * 0.045})`;
        const rr = Math.max(1, Math.round(pb[2] * 0.8));
        g.fillRect(Math.round(pb[0] - rr), Math.round(pb[1] - rr), rr * 2, rr * 2);
      }
    }
    // la pelota oficial, girando mientras vuela
    const bi = this.ballImg(Math.max(1.5, r), s > this.T.kick ? (s - this.T.kick) * 30 : 0);
    g.drawImage(bi, Math.round(x - bi.width / 2), Math.round(y - bi.height / 2));
  }

  // Arquero ilustrado de frente: atento en las puntas de los pies o volando.
  drawKeeper(k) {
    const g = this.g, P = P4.POSES, kit = this.gkKit;
    // sombra
    g.fillStyle = 'rgba(0,0,0,.3)';
    g.fillRect(Math.round(k.x) - (k.pose === 'dive' ? 18 : 10), this.gy, k.pose === 'dive' ? 36 : 20, 2);
    let sp, center = false;
    if (k.pose === 'ready') {
      const i = Math.floor(((this.s * 1.6) % 1) * 8);
      sp = this.spr('gk', kit, 'front', KSC, 'kr' + i, () => P.keeperReady(i / 8));
    } else if (k.pose === 'up') {
      sp = this.spr('gk', kit, 'front', KSC, 'up', () => P.armsUp(0.25));
    } else {
      const i = Q(k.p, 16), dir = k.dir;
      sp = this.spr('gk', kit, 'front', KSC, `kd${dir}_${i}`, () => P.keeperDive(dir, i / 16));
      center = k.pose === 'dive';
    }
    if (!sp) return;
    // parado se apoya en los pies; volando se ubica por el centro del cuerpo
    if (center) g.drawImage(sp.cv, Math.round(k.x - sp.c[0]), Math.round(k.y - 3 - sp.c[1]));
    else g.drawImage(sp.cv, Math.round(k.x - sp.ox), Math.round(k.y - sp.oy));
  }

  // El pateador visto desde atrás (ilustrado, con el dorsal en la espalda).
  drawShooter(s) {
    const g = this.g, o = this.o, T = this.T, H = this.H, P = P4.POSES, kit = this.shKit;
    const header = o.kind === 'cabezazo';
    let x, y, jump = 0, sp;
    if (header) {
      x = 86; y = H - 8;
      const j = clamp((s - (T.kick - 0.45)) / 0.9, 0, 1);
      jump = Math.sin(j * Math.PI) * 26;
      sp = jump > 2 ? this.spr('sh', kit, 'back', BSC, 'header', () => P.header()) : this.spr('sh', kit, 'back', BSC, 'idle', () => P.idleFront());
    } else {
      // remató de costado: acá ya está terminando el golpe, detrás de la pelota
      x = 84; y = H - 12;
      const i = Q(0.5 + (s - T.kick) / 0.6 * 0.5, 16);
      if (i < 8) return;
      sp = this.spr('sh', kit, 'back', BSC, 'kb' + i, () => P.kickBack(i / 16));
    }
    g.fillStyle = 'rgba(0,0,0,.3)';
    g.fillRect(Math.round(x - 12), Math.round(y + 1), 24, 3);
    if (sp) g.drawImage(sp.cv, Math.round(x - sp.ox), Math.round(y - jump - sp.oy));
  }
}

// El punto más alto del dibujo (la cabeza), en coordenadas del sprite.
function topOf(sp) {
  if (sp.top) return sp.top;
  const d = sp.cv.getContext('2d').getImageData(0, 0, sp.cv.width, sp.cv.height).data, w = sp.cv.width;
  for (let y = 0; y < sp.cv.height; y++) {
    let xs = 0, n = 0;
    for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 100) { xs += x; n++; }
    if (n >= 3) return (sp.top = [Math.round(xs / n), y]);
  }
  return (sp.top = [w >> 1, 0]);
}

function hex(c) { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function tone(c, k) {
  if (c.startsWith('rgb')) return c;
  return shade(c, k);
}
function shade(c, k) {
  const [r, g, b] = hex(c);
  const f = (v) => Math.round(clamp(k < 0 ? v * (1 + k) : v + (255 - v) * k, 0, 255));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}
