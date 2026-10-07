// Motor visual: estadio pixelado, 22 jugadores con IA de posicionamiento,
// pelota con altura y estela, cámara de TV con cámara lenta, partículas y
// guiones animados para cada jugada (con un momento de suspenso antes de
// revelar quién ganó el duelo).
import { hexRgb } from './teams.js';
import { playerName } from './squads.js';
import { Cutscene, text as pxText, textW as pxTextW } from './cutscene.js';
import { cleanSetup, stadiumWith, LIGHT } from './matchday.js';
import { P4 } from './players.js';
const FAR_BALLS = new Map();
import { p4Kit, HAIR_STYLES } from './playerkit.js';

const PW = 68, PL = 105;           // cancha en metros
const S = 4;                        // píxeles por metro (resolución interna)
const MX = 22, MY = 36;             // estadio alrededor
export const WW = PW * S + MX * 2;  // 316
export const WH = PL * S + MY * 2;  // 492

const LANE_U = { L: 12, C: 34, R: 56 };
const GOAL_U = { L: 31.3, C: 34, R: 36.7 };

const FORMATION = [
  [34, 4],
  [8, 20], [25, 16], [43, 16], [60, 20],
  [9, 38], [27, 34], [41, 34], [59, 38],
  [29, 52], [39, 50],
];
// Números de camiseta por puesto en la formación.
const NUMS = [1, 3, 4, 2, 6, 11, 8, 5, 7, 9, 10];
const ROW = (i) => (i === 0 ? 'G' : i <= 4 ? 'D' : i <= 8 ? 'M' : 'F');

const SKINS = ['#f1c7a0', '#e0a77c', '#c68657', '#9c6440', '#6e4428', '#f5d3b5'];
const HAIRS = ['#2a1a10', '#4a2e18', '#111111', '#7a5530', '#d9b25a', '#1c1c1c', '#5b3a1e', '#a0522d'];

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => t * t * (3 - 2 * t);
const rnd = (a, b) => a + Math.random() * (b - a);
// Penal en el partido, en coordenadas del que patea (por número de camiseta).
const PEN_ATT = { 0: [34, 4], 1: [13, 64], 2: [27, 56], 3: [41, 56], 4: [55, 64], 5: [16, 87.3], 6: [31, 77], 7: [39, 74.5], 8: [52, 87.3], 9: [28, 85.3], 10: [40, 85.3] };
const PEN_DEF = { 0: [34, 104.4], 1: [18.5, 88], 2: [24, 86.2], 3: [44, 86.2], 4: [49.5, 88], 5: [12.5, 86.4], 6: [30.5, 79], 7: [37.5, 79.5], 8: [55.5, 86.4], 9: [33, 55], 10: [47, 70] };
const pickR = (a) => a[Math.floor(Math.random() * a.length)];
// Puntos alrededor de un jugador donde puede recibir (u, v; v positivo = hacia el arco rival).
const SPOT_OFFSETS = [[0, 0], [0, 4], [3, 3], [-3, 3], [5, 0], [-5, 0], [0, 7], [4, 6], [-4, 6], [7, 3], [-7, 3], [0, 10], [5, 9], [-5, 9], [0, -3], [4, -2], [-4, -2]];

function seeded(n) {
  const x = Math.sin(n * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function shade(hex, f) {
  const [r, g, b] = hexRgb(hex);
  const m = (c) => Math.round(f < 1 ? c * f : c + (255 - c) * (f - 1));
  return `rgb(${m(r)},${m(g)},${m(b)})`;
}
// Aclara (k > 0) u oscurece (k < 0) un color.
function tone(c, k) {
  const [r, g, b] = hexRgb(c);
  const f = (v) => Math.round(Math.max(0, Math.min(255, k < 0 ? v * (1 + k) : v + (255 - v) * k)));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}
function lum(hex) { const [r, g, b] = hexRgb(hex); return 0.299 * r + 0.587 * g + 0.114 * b; }
// ---------- jugadores ilustrados de la vista de lejos ----------
// La misma ilustración de la escena del tiro, reducida a unos 16 px de alto:
// proporciones reales y sin ojos ni números, como se ven desde la cámara de TV.
// Se pintan de a poco entre cuadros; mientras tanto se usa el sprite simple.
const HD_SCALE = 56;
const RUN_FRAMES = 16;
// Festejo en el lugar: rodilla arriba y brazos en alto (8 cuadros).
const cheerPose = (u) => ({ lift: Math.max(0, Math.sin(u * 6.28)) * 20, legs: [{ a: 0.12, f: 0, k: 0.1 }, { a: 0.12, f: 0.9, k: 1.6 }], arms: [{ a: 2.6 + Math.sin(u * 6.28) * 0.15, e: 0.2 }, { a: 2.75, e: 0.1 }] });

// ---------- sprites (7x13) ----------
// h pelo · s piel · S piel sombra · e ojos · t camiseta · T camiseta sombra
// n dorsal · p short · P short sombra · k medias · b botines · g guantes/manos
const BODY = {
  front: [
    '..hhh..',
    '.hhhhh.',
    '.heseh.',
    '..sSs..',
    '.ttttT.',
    'tttttTT',
    'ttttttT',
    'gttttTg',
    '.ppppP.',
    '.pp.pP.',
  ],
  back: [
    '..hhh..',
    '.hhhhh.',
    '.hhhhh.',
    '..hSh..',
    '.ttttT.',
    'ttnnnTT',
    'ttnnnTT',
    'gttttTg',
    '.ppppP.',
    '.pp.pP.',
  ],
  side: [
    '..hhh..',
    '.hhhhs.',
    '.hhsse.',
    '..sSs..',
    '..tttT.',
    '.ttttT.',
    '.tTttT.',
    '..gtT..',
    '..ppP..',
    '..pPP..',
  ],
  jump: [
    'g.hhh.g',
    'thhhhhT',
    'theseht',
    '.tsSsT.',
    '.ttttT.',
    '.ttttT.',
    '.ttttT.',
    '.ttttT.',
    '.ppppP.',
    '.pp.pP.',
  ],
};
const LEGS = {
  front: [
    ['..s.s..', '..k.k..', '.bb.bb.'],
    ['..s.s..', '.k...k.', 'bb....b'],
    ['...ss..', '...kk..', '..bbb..'],
    ['..s.s..', '.k...k.', 'b....bb'],
  ],
  side: [
    ['..s.s..', '..k.k..', '..bbbb.'],
    ['.s...s.', '.k...k.', 'bb....b'],
    ['..s.s..', '..kk...', '..bbb..'],
    ['.s..s..', 'k...k..', 'b...bb.'],
  ],
  jump: [['..s.s..', '..k.k..', '..b.b..']],
};
// Poses horizontales (mirando a la derecha).
const POSES = {
  slide: [
    '.............',
    '.hh......s...',
    'hhsttTpp.k...',
    'hsstttTppkkbb',
    '.g.ttT..s....',
  ],
  dive: [
    '.........hhh..',
    'bkkpPttttThesg',
    'bkkpPTtttTtssg',
    '......ttT.....',
  ],
  fallen: [
    'hh..........',
    'hsstttTppkkb',
    '.s.tTTPpkkb.',
  ],
};

function isAlt(pattern, r, c) {
  switch (pattern) {
    case 'stripes': return c === 2 || c === 4;
    case 'band': return r === 6;
    case 'hoops': return r === 5 || r === 7;
    case 'sash': return c === 9 - r;
    case 'sleeves': return c === 0 || c === 6;
    case 'center': return c === 3;
    case 'checks': return (r + c) % 2 === 1;
    default: return false;
  }
}

export class Renderer {
  constructor(canvas, ui) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d');
    this.ui = ui;
    const cut = document.getElementById('cut');
    this.cut = cut ? new Cutscene(cut, document.getElementById('cut-card')) : null;
    this.tag = document.getElementById('carrier');
    this.tagKey = '';
    this.world = document.createElement('canvas');
    this.world.width = WW; this.world.height = WH;
    this.wctx = this.world.getContext('2d');
    this.spriteCache = new Map();
    this.hd = new Map(); this.hdKits = new Map();
    this.hdNow = []; this.hdLater = []; this.hdQueued = new Set();
    this.mySide = 0;
    this.kits = null;
    this.players = [[], []];
    this.ball = { x: 34, y: 52.5, z: 0, owner: null, flight: null, head: false, spin: 0 };
    this.trail = [];
    this.particles = [];
    this.ref = { x: 30, y: 60, vx: 0, vy: 0, anim: 0, facing: 1, fx: 0 };
    this.possSide = 0;
    this.focus = [null, null];
    this.defStyle = [null, null];
    this.cam = { x: WW / 2, y: WH / 2, zoom: 1, tzoom: 1, punch: 0, follow: null, shake: 0 };
    this.ts = 1; this.tsTarget = 1;
    this.timers = [];
    this.netShake = [0, 0];
    this.crowd = [];
    this.crowdJump = { side: -1, t: 0 };
    this.flash = 0;
    this.boardT = 0;
    this.last = performance.now();
    this.resize();
    // Al girar el celular, el evento resize puede llegar antes de que el
    // navegador termine de acomodar la pantalla (sobre todo en iPhone), y el
    // canvas quedaba con las medidas viejas y la cancha estirada. Por eso
    // también se revisa el tamaño real en cada cuadro.
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 300));
    if (window.ResizeObserver) new ResizeObserver(() => this.resize()).observe(this.cv);
    requestAnimationFrame((t) => this.loop(t));
  }

  // ---------- coordenadas ----------
  W(side, u, v) { return side === 0 ? [u, PL - v] : [PW - u, v]; }
  U(side, x, y) { return side === 0 ? [x, PL - y] : [PW - x, y]; }
  px(x, y) {
    if (this.mySide === 1) { x = PW - x; y = PL - y; }
    return [MX + x * S, MY + y * S];
  }

  setup(teams, kits, mySide, setup) {
    this.teams = teams;
    this.kits = kits;
    this.mySide = mySide;
    this.spriteCache.clear();
    // La previa: estadio, hora y clima (solo cambian cómo se ve).
    this.day = cleanSetup(setup, teams[0].id, teams[1].id);
    this.stadium = stadiumWith(this.day);
    this.rain = this.day.weather === 'rain';
    this.noCrowd = [];
    this.bg = this.buildBackground();
    this.overlay = this.buildOverlay();
    this.buildLight();
    this.buildCrowd();
    this.boards = this.buildBoards();
    for (let s = 0; s < 2; s++) {
      this.players[s] = FORMATION.map(([u, v], i) => {
        const [x, y] = this.W(s, u, Math.min(v, 48));
        const seed = s * 31 + i * 7 + teams[s].id.length * 13 + teams[s].id.charCodeAt(0);
        return {
          side: s, i, x, y, vx: 0, vy: 0, tx: x, ty: y, anim: 0, facing: s === 0 ? -1 : 1, fx: 0, z: 0,
          skin: SKINS[Math.floor(seeded(seed) * SKINS.length)],
          hair: HAIRS[Math.floor(seeded(seed + 3) * HAIRS.length)],
          style: HAIR_STYLES[Math.floor(seeded(seed + 5) * HAIR_STYLES.length)],
          ov: null, lock: null, boost: 1, fallen: 0, dive: null, pose: null, jump: null, cheer: 0, stance: null,
        };
      });
    }
    this.ball.owner = null;
    this.ball.x = 34; this.ball.y = 52.5; this.ball.z = 0;
    this.prewarmPlayers();
  }

  // ---------- jugadores ilustrados ----------
  hdKit(p, kit, isGK) {
    const key = `${kit.shirt}${kit.alt2}${kit.pattern}${kit.shorts}${isGK ? kit.gk : ''}|${p.skin}${p.hair}${p.style || ''}`;
    let k = this.hdKits.get(key);
    if (!k) { k = p4Kit(kit, isGK, p); this.hdKits.set(key, k); }
    return k;
  }

  // Devuelve el cuadro si ya está pintado; si no, lo encarga (now: lo antes posible).
  hdGet(kk, view, key, pose, now) {
    const k = `${kk.id}|${view}|${key}`;
    const s = this.hd.get(k);
    if (s !== undefined) return s;
    const tag = now ? k + '!' : k;
    if (!this.hdQueued.has(tag)) {
      (now ? this.hdNow : this.hdLater).push({ k, kk, view, pose });
      this.hdQueued.add(tag);
    }
    return null;
  }

  hdWork(ms) {
    const t0 = performance.now();
    while ((this.hdNow.length || this.hdLater.length) && performance.now() - t0 < ms) {
      const j = this.hdNow.length ? this.hdNow.shift() : this.hdLater.shift();
      if (this.hd.has(j.k)) continue;
      let s = false;
      try { s = P4.sprite(j.pose(), j.kk, j.view, HD_SCALE, null, true); } catch (e) { console.warn('sprite', e); }
      this.hd.set(j.k, s);
      this.hdQueued.delete(j.k); this.hdQueued.delete(j.k + '!');
    }
  }

  // Encarga de antemano la carrera y la postura quieta de los 22.
  prewarmPlayers() {
    if (this.hd.size > 6000) this.hd.clear();
    this.hdNow.length = 0; this.hdLater.length = 0; this.hdQueued.clear();
    const all = this.players.flat();
    for (const p of all) {
      const kk = this.hdKit(p, this.kits[p.side], p.i === 0);
      if (p.i === 0) for (const v of ['front', 'back']) for (let i = 0; i < 8; i++) this.hdGet(kk, v, 'ready' + i, () => P4.POSES.keeperReady(i / 8));
      else { this.hdGet(kk, 'side', 'idle', () => P4.POSES.idle()); for (const v of ['front', 'back']) this.hdGet(kk, v, 'idle', () => P4.POSES.idleFront()); }
    }
    for (let i = 0; i < RUN_FRAMES; i++) for (const p of all) {
      const kk = this.hdKit(p, this.kits[p.side], p.i === 0), u = i / RUN_FRAMES;
      this.hdGet(kk, 'side', 'r' + i, () => P4.POSES.run(u, 0.9));
      for (const v of ['front', 'back']) this.hdGet(kk, v, 'r' + i, () => P4.POSES.runFront(u, 0.9));
    }
  }

  // Elige vista, cuadro y postura del jugador ilustrado. dir < 0 = espejado.
  hdPick(p, isGK, fx, facing, flipDir, now) {
    const fb = facing < -0.2 ? 'back' : 'front';
    if (p.dive && p.dive.dir !== 0) {
      const i = Math.round(clamp(p.dive.t / p.dive.dur, 0, 1) * 16), dir = flipDir(p.dive.dir);
      return { view: fb, key: `dive${dir}_${i}`, pose: () => P4.POSES.keeperDive(dir, i / 16), dir: 1, dive: i / 16 };
    }
    if (p.pose && p.pose.kind === 'slide') return { view: 'side', key: 'slide', pose: () => P4.POSES.slide(), dir: flipDir(p.pose.dir) };
    if (p.fallen > 0) return { view: 'side', key: 'fallen', pose: () => P4.POSES.fallen(), dir: fx >= 0 ? 1 : -1 };
    if (p.dive) return { view: fb, key: 'catch', pose: () => P4.POSES.armsUp(0.25), dir: 1 };
    if (p.jump) return { view: fb, key: 'header', pose: () => P4.POSES.header(), dir: 1 };
    if (p.stance && p.stance !== 'linked') return { view: 'side', key: p.stance, pose: () => P4.POSES[p.stance](), dir: p.stanceDir || 1 };
    if (p.stance === 'linked' && !(p.cheer > 0)) return { view: fb, key: 'linked', pose: () => P4.POSES.linked(), dir: 1 };
    if (p.cheer > 0) {
      const i = Math.floor((((now / 1000) * 1.4 + p.i * 0.37) % 1) * 8);
      return { view: fb, key: 'cheer' + i, pose: () => cheerPose(i / 8), dir: 1 };
    }
    const side = Math.abs(fx) > 0.75, dir = fx > 0 ? 1 : -1;
    if (Math.hypot(p.vx, p.vy) > 0.5) {
      const i = Math.floor((((p.anim * 1.7) / 4) % 1) * RUN_FRAMES) % RUN_FRAMES, u = i / RUN_FRAMES;
      return side ? { view: 'side', key: 'r' + i, pose: () => P4.POSES.run(u, 0.9), dir } : { view: fb, key: 'r' + i, pose: () => P4.POSES.runFront(u, 0.9), dir: 1 };
    }
    if (isGK) {
      const i = Math.floor((((now / 1000) * 1.6) % 1) * 8);
      return { view: fb, key: 'ready' + i, pose: () => P4.POSES.keeperReady(i / 8), dir: 1 };
    }
    return side ? { view: 'side', key: 'idle', pose: () => P4.POSES.idle(), dir } : { view: fb, key: 'idle', pose: () => P4.POSES.idleFront(), dir: 1 };
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const w = Math.max(1, Math.round(this.cv.clientWidth * dpr));
    const h = Math.max(1, Math.round(this.cv.clientHeight * dpr));
    if (w === this.cv.width && h === this.cv.height) return;
    this.cv.width = w;
    this.cv.height = h;
    this.ctx.imageSmoothingEnabled = false;
    this.vignette = null;
  }

  // ---------- tiempo ----------
  // Las esperas usan el tiempo del partido: en cámara lenta, todo se estira.
  wait(sec) { return new Promise((res) => this.timers.push({ t: sec, res })); }

  loop(now) {
    const real = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    // Un error en un cuadro no debe frenar el dibujo para siempre (la cancha quedaba negra).
    try {
      this.ts = lerp(this.ts, this.tsTarget, Math.min(1, real * 7));
      this.update(real * this.ts, real);
      if (this.cv.clientWidth) this.resize();
      this.draw(now);
      this.hdWork(7);
    } catch (e) { console.error(e); }
    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt, real) {
    for (const tm of this.timers) tm.t -= dt;
    const done = this.timers.filter((t) => t.t <= 0);
    this.timers = this.timers.filter((t) => t.t > 0);
    done.forEach((t) => t.res());
    this.boardT += real;
    if (!this.kits) return;
    this.updateTag();

    this.updateBall(dt);
    this.computeTargets();
    for (const team of this.players) for (const p of team) { this.movePlayer(p, dt); if (p.i === 0 && !this.freeKeepers) this.keepInBox(p); }
    this.moveRef(dt);
    this.updateParticles(dt);
    this.netShake = this.netShake.map((n) => Math.max(0, n - real));
    this.flash = Math.max(0, this.flash - real);
    this.cam.shake = Math.max(0, this.cam.shake - real * 2);
    if (this.crowdJump.t > 0) this.crowdJump.t -= real;

    // Cámara (en tiempo real, para que el zoom de suspenso se sienta)
    const target = this.cam.follow || this.ball;
    const [bx, by] = this.px(target.x, target.y - (this.cam.follow ? 0 : this.ball.z * 0.5));
    const k = Math.min(1, real * 3.2);
    this.cam.x = lerp(this.cam.x, bx, k);
    this.cam.y = lerp(this.cam.y, by, k);
    this.cam.zoom = lerp(this.cam.zoom, this.cam.tzoom + this.cam.punch, Math.min(1, real * 2.4));
  }

  updateBall(dt) {
    const b = this.ball;
    if (b.flight) {
      const f = b.flight;
      f.t += dt;
      const t = clamp(f.t / f.dur, 0, 1);
      const tt = f.ground ? 1 - (1 - t) * (1 - t) * 0.6 - 0.4 * (1 - t) : t;
      b.x = lerp(f.from[0], f.to[0], clamp(tt, 0, 1));
      b.y = lerp(f.from[1], f.to[1], clamp(tt, 0, 1));
      b.z = lerp(f.z0 || 0, f.z1 || 0, t) + 4 * f.h * t * (1 - t);
      b.spin += dt * 24;
      if (t >= 1) { b.flight = null; f.done && f.done(); }
    } else if (b.owner && !b.rest) {
      const p = b.owner;
      if (b.head) { b.x = p.x; b.y = p.y; b.z = 2.1 + p.z; }
      else {
        const sp = Math.hypot(p.vx, p.vy);
        // el rumbo se suaviza: parado o casi parado, la pelota no salta de un lado a otro
        const w = clamp((sp - 0.2) / 0.8, 0, 1);
        let ax = lerp(p.fx, sp > 0.01 ? p.vx / sp : p.fx, w), ay = lerp(p.facing, sp > 0.01 ? p.vy / sp : p.facing, w);
        const al = Math.hypot(ax, ay) || 1; ax /= al; ay /= al;
        if (b.dx == null || b.owner !== b.dOwner) { b.dx = ax; b.dy = ay; b.dOwner = p; }
        b.dx = lerp(b.dx, ax, Math.min(1, dt * 6)); b.dy = lerp(b.dy, ay, Math.min(1, dt * 6));
        const dl = Math.hypot(b.dx, b.dy) || 1, dx = b.dx / dl, dy = b.dy / dl;
        // en los pies: un poco adelante y al costado del pie que la lleva, con toquecitos
        // al correr; hacia arriba/abajo de la pantalla el adelanto se acorta para que
        // la pelota quede a la altura de los botines y no de las rodillas
        b.touch = (b.touch || 0) + sp * dt * 1.4;
        const lead = 0.8 + (sp > 0.3 ? Math.abs(Math.sin(b.touch)) * 0.35 : 0);
        b.x = lerp(b.x, p.x + dx * lead - dy * 0.3, Math.min(1, dt * 18));
        b.y = lerp(b.y, p.y + dy * lead * 0.45 + dx * 0.3, Math.min(1, dt * 18));
        b.z = Math.max(0, b.z - dt * 8);
        b.spin += sp * dt * 3;
      }
    }
    // estela cuando la pelota va rápido o alta
    const [sx, sy] = this.px(b.x, b.y);
    const last = this.trail[this.trail.length - 1];
    if (b.flight && (!last || Math.hypot(last.x - sx, last.y - sy + last.z - b.z * S * 0.9) > 1.5)) {
      this.trail.push({ x: sx, y: sy, z: b.z * S * 0.9, a: 1 });
    }
    for (const t of this.trail) t.a -= dt * 2.6;
    this.trail = this.trail.filter((t) => t.a > 0).slice(-14);
  }

  computeTargets() {
    // Pelota parada (córner o penal): todos quietos en su lugar hasta que se patea.
    if (this.hold) return;
    const b = this.ball;
    const now = performance.now();
    for (let s = 0; s < 2; s++) {
      const inPoss = this.possSide === s;
      const [bu, bv] = this.U(s, b.x, b.y);
      const team = this.players[s];
      const shiftV = inPoss ? clamp((bv - 40) * 0.75, -10, 40) : clamp((bv - 48) * 0.7, -30, 12);
      const style = !inPoss ? this.defStyle[s] : null;
      for (const p of team) {
        if (p.lock || p.ov) continue;
        const [fu, fv] = FORMATION[p.i];
        const row = ROW(p.i);
        let u, v;
        if (row === 'G') {
          u = clamp(34 + (bu - 34) * 0.12, 30.5, 37.5);
          v = bv < 25 ? 2.8 : 1.6;
        } else {
          const w = row === 'D' ? 0.85 : row === 'M' ? 1 : 1.05;
          v = fv + shiftV * w;
          u = fu + (bu - 34) * (inPoss ? 0.25 : 0.4);
          if (inPoss) {
            u = 34 + (u - 34) * 1.1;
            if (row === 'F') v = Math.max(v, Math.min(bv + 7, 97));
            if (row === 'M') v = Math.max(v, bv - 14);
          } else {
            u = 34 + (u - 34) * 0.8;
            if (row === 'D') v = Math.min(v, Math.max(bv - 4, 6));
            if (this.focus[s] != null) u += (this.focus[s] - 34) * 0.38;
            if (style === 'cross' && (p.i === 1 || p.i === 4 || p.i === 5 || p.i === 8)) u = 34 + (u - 34) * 1.35;
            if (style === 'through' && row === 'D') v += 6;
          }
          u += Math.sin(now / 900 + p.i * 1.7 + s * 3) * 0.9;
          v += Math.cos(now / 1100 + p.i) * 0.6;
        }
        u = clamp(u, 1.5, 66.5); v = clamp(v, 1.5, 103.5);
        [p.tx, p.ty] = this.W(s, u, v);
      }
      if (!inPoss && this.kits) {
        const opp = this.players[1 - s];
        if (bv < 38) {
          const taken = new Set();
          for (const p of team) {
            if (p.i === 0 || p.lock || p.ov) continue;
            let best = null, bd = 16;
            for (const o of opp) {
              if (o.i === 0 || taken.has(o)) continue;
              const d = Math.hypot(o.x - p.tx, o.y - p.ty);
              if (d < bd) { bd = d; best = o; }
            }
            if (best) {
              taken.add(best);
              const [gx, gy] = this.W(s, 34, 0);
              const dx = gx - best.x, dy = gy - best.y, dl = Math.hypot(dx, dy) || 1;
              p.tx = lerp(p.tx, best.x + (dx / dl) * 1.6, 0.6);
              p.ty = lerp(p.ty, best.y + (dy / dl) * 1.6, 0.6);
            }
          }
        }
        const pressers = this.nearestN(s, b.x, b.y, style === 'dribble' ? 2 : 1, true);
        pressers.forEach((p, k) => {
          if (p.lock || p.ov) return;
          const [gx, gy] = this.W(s, 34, 0);
          const dx = gx - b.x, dy = gy - b.y, dl = Math.hypot(dx, dy) || 1;
          const off = k === 0 ? 2.2 : 3;
          p.tx = b.x + (dx / dl) * off + (k === 1 ? 1.8 : 0);
          p.ty = b.y + (dy / dl) * off;
        });
      }
    }
    const o = b.owner;
    if (o && !o.lock && !o.ov) { o.tx = o.x; o.ty = o.y; }
  }

  // El arquero no sale del área: a lo más hasta el punto penal (11 m) y sin
  // abrirse más allá del ancho del área chica.
  keepInBox(p) {
    const [u, v] = this.U(p.side, p.x, p.y);
    const cu = clamp(u, 34 - 10, 34 + 10), cv = Math.min(v, 11);
    if (cu !== u || cv !== v) {
      [p.x, p.y] = this.W(p.side, cu, cv);
      if (p.lock) p.lock = null;
    }
  }

  movePlayer(p, dt) {
    if (p.jump) {
      const j = p.jump; j.t += dt;
      const t = clamp(j.t / j.dur, 0, 1);
      p.z = 4 * j.h * t * (1 - t);
      if (t >= 1) { p.jump = null; p.z = 0; }
    }
    if (p.pose) {
      p.pose.t += dt;
      if (p.pose.t > p.pose.dur) { const k = p.pose.kind; p.pose = null; if (k === 'slide') p.fallen = Math.max(p.fallen, 0.35); }
    }
    if (p.cheer > 0) p.cheer -= dt;
    if (p.stance && p.stance !== 'linked' && !p.lock) { p.vx = p.vy = 0; return; }
    if (p.fallen > 0 && !p.lock) { p.fallen -= dt; p.vx *= 0.9; p.vy *= 0.9; p.x += p.vx * dt; p.y += p.vy * dt; return; }
    if (p.dive) {
      const d = p.dive;
      d.t += dt;
      const t = clamp(d.t / d.dur, 0, 1);
      p.x = lerp(d.from[0], d.to[0], ease(t));
      p.y = lerp(d.from[1], d.to[1], ease(t));
      p.z = d.up ? Math.sin(t * Math.PI) * d.up : 0;
      if (d.t > d.dur + d.hold) { p.dive = null; p.vx = p.vy = 0; p.z = 0; }
      return;
    }
    if (p.lock) {
      const L = p.lock;
      L.t += dt;
      const t = clamp(L.t / L.dur, 0, 1);
      const e = L.linear ? t : ease(t);
      let x = lerp(L.from[0], L.to[0], e), y = lerp(L.from[1], L.to[1], e);
      if (L.zig) {
        const dx = L.to[0] - L.from[0], dy = L.to[1] - L.from[1], dl = Math.hypot(dx, dy) || 1;
        const off = Math.sin(t * Math.PI * L.zig) * 2.6 * Math.sin(t * Math.PI);
        x += (-dy / dl) * off; y += (dx / dl) * off;
      }
      p.vx = (x - p.x) / Math.max(dt, 1e-4); p.vy = (y - p.y) / Math.max(dt, 1e-4);
      p.x = x; p.y = y;
      if (!p.pose) this.faceFromVel(p);
      p.anim += Math.hypot(p.vx, p.vy) * dt * 0.9;
      if (t >= 1) { p.lock = null; p.vx = p.vy = 0; L.done && L.done(); }
      return;
    }
    const tx = p.ov ? p.ov[0] : p.tx, ty = p.ov ? p.ov[1] : p.ty;
    const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy);
    const max = (p.i === 0 ? 6 : 7.2) * p.boost;
    const sp = Math.min(max, d * 2.2);
    const dvx = d > 0.05 ? (dx / d) * sp : 0, dvy = d > 0.05 ? (dy / d) * sp : 0;
    const k = Math.min(1, dt * 5);
    p.vx += (dvx - p.vx) * k; p.vy += (dvy - p.vy) * k;
    p.x += p.vx * dt; p.y += p.vy * dt;
    const v = Math.hypot(p.vx, p.vy);
    if (v > 0.4) this.faceFromVel(p);
    else if (this.ball.owner !== p) {
      // quieto mira la pelota (salvo el que la tiene: si no, la pelota y la mirada
      // se persiguen y la pelota tiembla en sus pies)
      const bx = this.ball.x - p.x, by = this.ball.y - p.y, bl = Math.hypot(bx, by) || 1;
      p.fx = bx / bl; p.facing = by / bl;
    }
    p.anim += v * dt * 0.9;
  }

  faceFromVel(p) {
    const v = Math.hypot(p.vx, p.vy);
    if (v > 0.1) { p.fx = p.vx / v; p.facing = p.vy / v; }
  }

  moveRef(dt) {
    const r = this.ref, b = this.ball;
    const tx = clamp(b.x + (b.x < 34 ? 9 : -9), 3, 65), ty = clamp(b.y + 7, 3, 102);
    const dx = tx - r.x, dy = ty - r.y, d = Math.hypot(dx, dy);
    const sp = Math.min(6.5, d * 1.5);
    r.vx = d > 0.1 ? (dx / d) * sp : 0; r.vy = d > 0.1 ? (dy / d) * sp : 0;
    r.x += r.vx * dt; r.y += r.vy * dt;
    r.anim += sp * dt * 0.9;
    if (sp > 0.3) { r.fx = r.vx / sp; r.facing = r.vy / sp; }
  }

  nearestN(side, x, y, n, outfield = false, exclude = []) {
    return this.players[side]
      .filter((p) => !(outfield && p.i === 0) && !exclude.includes(p))
      .map((p) => [p, Math.hypot(p.x - x, p.y - y)])
      .sort((a, b) => a[1] - b[1]).slice(0, n).map((a) => a[0]);
  }
  nearest(side, x, y, outfield = true, exclude = []) { return this.nearestN(side, x, y, 1, outfield, exclude)[0]; }

  // ---------- partículas ----------
  burst(x, y, kind, n = 10) {
    const cols = {
      grass: ['#2f7a2c', '#4fb348', '#6cc35f', '#3a8c35'],
      dust: ['#c9b48a', '#a8916a', '#e0d2b0'],
      spark: ['#ffffff', '#fff3b0'],
    }[kind];
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = rnd(1, kind === 'spark' ? 7 : 4);
      this.particles.push({ x, y, z: 0.1, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, vz: rnd(1, 4), life: rnd(0.4, 0.9), c: cols[i % cols.length] });
    }
  }

  confetti(side) {
    const k = this.kits[side];
    const cols = [k.shirt, k.alt2, '#ffffff', '#ffd23f'];
    for (let i = 0; i < 90; i++) {
      this.particles.push({ x: rnd(0, PW), y: rnd(0, PL), z: rnd(8, 18), vx: rnd(-1, 1), vy: rnd(-1, 1), vz: rnd(-1, 0), life: rnd(2, 3.5), c: cols[i % cols.length], conf: true });
    }
  }

  updateParticles(dt) {
    for (const p of this.particles) {
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.conf) { p.vz = Math.max(p.vz - dt * 1.5, -2.5); p.vx += Math.sin(p.life * 6) * dt * 2; }
      else p.vz -= dt * 14;
      p.z = Math.max(0, p.z + p.vz * dt);
      if (p.z === 0 && !p.conf) { p.vx *= 0.8; p.vy *= 0.8; }
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  // ---------- acciones del guion ----------
  give(p) {
    this.ball.owner = p; this.ball.flight = null; this.ball.head = false; this.ball.rest = false;
    this.possSide = p.side;
  }

  clearOverrides() {
    // en la tanda de penales nadie vuelve a su puesto: cada uno queda donde está
    if (this.so) { for (const t of this.players) for (const p of t) if (!p.ov) p.ov = [p.x, p.y]; return; }
    for (const t of this.players) for (const p of t) { p.ov = null; p.boost = 1; }
  }

  // Mueve a un jugador por un camino fijo (sirve para coreografías exactas).
  moveTo(p, to, dur, opts = {}) {
    p.ov = null;
    p.lock = { from: [p.x, p.y], to, t: 0, dur, ...opts };
  }

  launch(to, { dur = 0.8, h = 0.4, z1 = 0, ground } = {}) {
    const b = this.ball;
    b.owner = null; b.head = false; b.rest = false;
    b.flight = { from: [b.x, b.y], to, t: 0, dur, h, z0: b.z, z1, ground: ground ?? h < 0.5 };
  }

  climax() {
    this.tsTarget = 0.28;
    this.cam.punch = 0.3;
    this.ui.cinema(true);
    this.ui.sound('tension');
  }

  release() {
    this.tsTarget = 1;
    this.cam.punch = 0;
    this.ui.cinema(false);
  }

  reveal(ev) {
    if (ev._revealed) return;
    ev._revealed = true;
    this.ui.reveal(ev.orig || ev);
  }

  async pass(side, uv, { dur = 0.8, h = 0.4, recv = null, z1 = 0 } = {}) {
    const to = this.W(side, uv[0], uv[1]);
    const passer = this.ball.owner;
    const r = recv || this.nearest(side, to[0], to[1], true, passer ? [passer] : []);
    r.ov = to; r.boost = 1.5;
    this.launch(to, { dur, h, z1 });
    this.ui.sound('kick');
    await this.wait(dur);
    // si el que recibe todavía no llega, la pelota rueda un poco más hacia él
    // (nunca queda quieta esperando); solo en el peor caso se acomoda de golpe
    let d = Math.hypot(r.x - to[0], r.y - to[1]);
    for (let t = 0; d > 1.2 && t < 0.8; t += 0.05) {
      this.ball.x = lerp(this.ball.x, r.x, 0.12); this.ball.y = lerp(this.ball.y, r.y, 0.12);
      await this.wait(0.05);
      d = Math.hypot(r.x - this.ball.x, r.y - this.ball.y);
    }
    r.ov = null; r.boost = 1;
    if (d > 1.2) { r.x = lerp(r.x, this.ball.x, 0.7); r.y = lerp(r.y, this.ball.y, 0.7); }
    this.give(r);
    return r;
  }

  // Pase a un compañero elegido (si ya la tiene él, no hace nada).
  async passTo(side, p, uv, opts = {}) {
    if (!p || p === this.ball.owner) return p;
    return this.pass(side, uv, { ...opts, recv: p });
  }

  // Compañero por número de puesto que no sea ninguno de `not`.
  mate(side, nums, not = []) {
    for (const n of nums) { const p = this.byNum(side, n); if (p && !not.includes(p)) return p; }
    return null;
  }

  // Desmarques: compañeros que pican al espacio mientras se arma la jugada.
  runs(side, list, boost = 1.3) {
    for (const [p, u, v] of list) if (p && p !== this.ball.owner) { p.ov = this.W(side, u, v); p.boost = boost; }
  }

  // Qué tan cerca está el rival más cercano de un punto (en metros).
  oppDist(A, pt) {
    let m = Infinity;
    for (const o of this.players[1 - A]) m = Math.min(m, Math.hypot(o.x - pt[0], o.y - pt[1]));
    return m;
  }

  // Qué tan cerca pasa un rival de la línea de pase de `a` a `b`.
  laneDist(A, a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1;
    let m = Infinity;
    for (const o of this.players[1 - A]) {
      const t = clamp(((o.x - a[0]) * dx + (o.y - a[1]) * dy) / L2, 0.12, 1);
      m = Math.min(m, Math.hypot(o.x - (a[0] + dx * t), o.y - (a[1] + dy * t)));
    }
    return m;
  }

  // Un espacio libre al alcance de `p` (en coordenadas del equipo A), cerca de
  // `want`: el punto más lejos de los rivales sin irse demasiado del plan.
  openSpot(A, p, want, reach = 6) {
    let best = null;
    for (const [du, dv] of SPOT_OFFSETS) {
      const uv = [clamp(want[0] + du, 4, 64), clamp(want[1] + dv, 4, 92)];
      const to = this.W(A, uv[0], uv[1]);
      if (Math.hypot(to[0] - p.x, to[1] - p.y) > reach) continue;
      const s = Math.min(9, this.oppDist(A, to)) - Math.hypot(du, dv) * 0.25;
      if (!best || s > best.s) best = { s, uv };
    }
    return best ? best.uv : want;
  }

  // Los compañeros que no tienen la pelota se ofrecen: cada uno se corre a
  // un espacio libre cerca de su puesto (lejos de las marcas).
  offerSupport(A) {
    const owner = this.ball.owner;
    for (const p of this.players[A]) {
      if (p === owner || p.i === 0 || p.lock) continue;
      const [tu, tv] = this.U(A, p.tx, p.ty);
      p.ov = this.W(A, ...this.openSpot(A, p, [tu, tv], 9));
      p.boost = 1.1;
    }
  }

  // Pase con sentido: entre los compañeros `cands` elige al que está mejor
  // ubicado (línea de pase limpia, espacio para recibir, que avance hacia
  // `toward`) y le juega a un espacio libre al que llega a tiempo, así la
  // pelota nunca queda quieta esperando cerca de un rival.
  async smartPass(A, cands, { adv = 9, toward = null, h = 0.25, minGain = -20, len = 15 } = {}) {
    const owner = this.ball.owner;
    const from = [this.ball.x, this.ball.y];
    const [, fv] = this.U(A, from[0], from[1]);
    let best = null;
    // no se la devuelve al que se la acaba de dar (salvo en una pared)
    const prev = this.prevPasser;
    for (const p of cands) {
      if (!p || p === owner || p.i === 0 || (p === prev && cands.length > 2)) continue;
      const [pu, pv] = this.U(A, p.x, p.y);
      const dur = clamp(Math.hypot(p.x - from[0], p.y - from[1]) / 17, 0.5, 1.05);
      const reach = 7.2 * 1.4 * Math.max(0.25, dur - 0.3);
      for (const [du, dv] of SPOT_OFFSETS) {
        if (Math.hypot(du, dv) > reach) continue;
        const uv = [clamp(pu + du, 4, 64), clamp(pv + dv, 4, 90)];
        const gain = uv[1] - fv;
        if (gain < minGain) continue;
        const to = this.W(A, uv[0], uv[1]);
        const plen = Math.hypot(to[0] - from[0], to[1] - from[1]);
        if (plen < 6) continue;
        let sc = Math.min(9, this.oppDist(A, to)) + Math.min(6, this.laneDist(A, from, to)) * 1.5
          + clamp(gain, -8, adv) * 0.7 - Math.abs(plen - len) * 0.08;
        if (toward != null) sc -= Math.abs(uv[0] - toward) * 0.05;
        sc += Math.random() * 1.5;
        if (!best || sc > best.sc) best = { sc, p, uv, dur };
      }
    }
    if (!best) return null;
    this.prevPasser = owner;
    return this.passTo(A, best.p, best.uv, { dur: best.dur, h });
  }

  async dribble(side, uv, dur = 1, zig = 0) {
    let p = this.ball.owner;
    if (!p) return;
    if (p.i === 0 && !this.freeKeepers) {
      // el arquero no sale jugando: se la da a un central y sigue él
      const cb = this.nearest(p.side, p.x, p.y, true);
      const [cu, cv] = this.U(side, cb.x, cb.y);
      await this.passTo(side, cb, [cu, cv], { dur: 0.6, h: 0.3 });
      p = this.ball.owner;
      if (!p || p.i === 0) return;
    }
    // si la había ganado de cabeza, la baja con el pecho y sigue con los pies
    this.ball.head = false; this.ball.rest = false;
    this.moveTo(p, this.W(side, uv[0], uv[1]), dur, { zig });
    await this.wait(dur);
  }

  // Punto a `dist` metros de `to`, del lado desde donde viene `p`.
  short(p, to, dist) {
    const dx = p.x - to[0], dy = p.y - to[1], dl = Math.hypot(dx, dy) || 1;
    return [to[0] + (dx / dl) * dist, to[1] + (dy / dl) * dist];
  }

  // Duelo por una pelota en el aire o por el piso: un compañero y un rival
  // corren al mismo punto. Hasta el final no se sabe quién llega.
  async duelPass(ev, A, uv, { h = 0.3, dur = 1, defWins, style = 'slide', recv = null, def = null, z1 = 0 }) {
    const D = 1 - A;
    const to = this.W(A, uv[0], uv[1]);
    const passer = this.ball.owner;
    // nunca se la pasa a sí mismo: si el elegido es el que la tiene, va el compañero más cercano
    const r = recv && recv !== passer ? recv : this.nearest(A, to[0], to[1], true, passer ? [passer] : []);
    const d = def || this.nearest(D, to[0], to[1], true);
    const header = style === 'header';
    const rEnd = defWins ? this.short(r, to, header ? 1.1 : 1.8) : to;
    const dEnd = defWins ? to : this.short(d, to, header ? 1.1 : 2.2);
    this.moveTo(r, rEnd, dur * 0.97, { linear: true });
    this.moveTo(d, dEnd, dur * (header ? 0.97 : 0.8), { linear: true });
    if (passer) passer.cheer = 0;
    this.launch(to, { dur, h, z1: header ? 2.2 : z1 });
    this.ui.sound(h > 1.5 ? 'longball' : 'kick');
    this.burst(this.ball.x, this.ball.y, 'grass', 4);
    await this.wait(dur * 0.4);
    this.climax();
    if (header) {
      await this.wait(dur * 0.42);
      r.jump = { t: 0, dur: 0.5, h: 0.9 }; d.jump = { t: 0, dur: 0.5, h: 0.9 };
      await this.wait(dur * 0.18);
    } else {
      await this.wait(dur * 0.4);
      // barrida del defensor
      const dir = (to[0] - d.x) >= 0 ? 1 : -1;
      d.pose = { kind: 'slide', t: 0, dur: 0.55, dir };
      this.moveTo(d, [to[0] + (to[0] - d.x) * 0.25, to[1] + (to[1] - d.y) * 0.25], dur * 0.25, { linear: true });
      this.burst(d.x, d.y, 'dust', 6);
      await this.wait(dur * 0.2);
    }
    if (defWins) {
      this.give(d);
      this.ui.sound(header ? 'header' : 'tackle');
      this.burst(to[0], to[1], header ? 'spark' : 'grass', 12);
      this.cam.shake = 0.5;
    } else {
      this.give(r);
      if (header) this.ball.head = true;
      this.ui.sound(header ? 'header' : 'trap');
    }
    this.reveal(ev);
    await this.wait(0.12);
    this.release();
    await this.wait(0.55);
    return defWins ? d : r;
  }

  // Duelo mano a mano: el defensor se tira a los pies del que gambetea.
  async duelDribble(ev, A, uv, { defWins }) {
    const D = 1 - A;
    const carrier = this.ball.owner;
    const to = this.W(A, uv[0], uv[1]);
    const d = this.nearest(D, carrier.x, carrier.y, true);
    const mid = [lerp(carrier.x, to[0], 0.55), lerp(carrier.y, to[1], 0.55)];
    this.moveTo(carrier, mid, 0.9, { zig: 2 });
    this.moveTo(d, this.short(d, mid, 2.5), 0.8);
    await this.wait(0.5);
    this.climax();
    await this.wait(0.4);
    const dir = (mid[0] - d.x) >= 0 ? 1 : -1;
    d.pose = { kind: 'slide', t: 0, dur: 0.6, dir };
    this.moveTo(d, [mid[0] + (mid[0] - d.x) * 0.4, mid[1] + (mid[1] - d.y) * 0.4], 0.35, { linear: true });
    this.burst(d.x, d.y, 'dust', 8);
    if (defWins) {
      await this.wait(0.3);
      carrier.lock = null;
      carrier.fallen = 1;
      this.give(d);
      this.ui.sound('tackle');
      this.burst(mid[0], mid[1], 'grass', 14);
      this.cam.shake = 0.6;
    } else {
      carrier.jump = { t: 0, dur: 0.45, h: 0.7 };
      this.moveTo(carrier, to, 0.75, { linear: true });
      this.ball.z = 0.8;
      await this.wait(0.3);
      this.ui.sound('trap');
    }
    this.reveal(ev);
    await this.wait(0.12);
    this.release();
    await this.wait(0.5);
  }

  keeperDive(side, lane, dur = 0.42, extra = 0) {
    const k = this.players[side][0];
    const att = 1 - side;
    const u = GOAL_U[lane];
    const to = this.W(att, lane === 'C' ? 34 : u + (lane === 'L' ? -1.5 - extra : 1.5 + extra), 104.2);
    k.ov = null; k.lock = null;
    k.dive = { from: [k.x, k.y], to, t: 0, dur, hold: 1.1, up: lane === 'C' ? 0.6 : 0.3, dir: lane === 'C' ? 0 : (to[0] < k.x ? -1 : 1) };
  }

  async fade(fn) {
    await this.ui.fadeOut();
    fn();
    this.trail = [];
    [this.cam.x, this.cam.y] = this.px(this.ball.x, this.ball.y);
    await this.ui.fadeIn();
  }

  // frame: en qué sentido se leen las coordenadas (por defecto, el del propio equipo).
  placeTeam(side, fn, frame = side) {
    for (const p of this.players[side]) {
      const [u, v] = fn(p);
      [p.x, p.y] = this.W(frame, u, v);
      p.tx = p.x; p.ty = p.y; p.vx = p.vy = 0; p.ov = null; p.lock = null; p.dive = null; p.fallen = 0; p.pose = null; p.jump = null; p.z = 0; p.cheer = 0; p.stance = null;
    }
  }

  // Jugador por número de camiseta: al rematar se intercambian identidades,
  // así que el índice en el arreglo no siempre coincide con p.i.
  byNum(side, i) { return this.players[side].find((p) => p.i === i) || this.players[side][i]; }

  kickoffNow(side) {
    this.hold = null;
    for (let s = 0; s < 2; s++) {
      this.placeTeam(s, (p) => {
        const [u, v] = FORMATION[p.i];
        if (s === side && p.i === 9) return [33, 52];
        if (s === side && p.i === 10) return [37.5, 51];
        return [u, Math.min(v * 0.92, s === side ? 49 : 42)];
      });
    }
    this.focus = [null, null]; this.defStyle = [null, null];
    this.give(this.byNum(side, 9));
    [this.ball.x, this.ball.y] = this.W(side, 34, 52.5);
    this.ball.z = 0;
    this.cam.tzoom = 1.2; this.cam.follow = null;
  }

  async kickoff(side) { this.freeKeepers = false; this.so = null; await this.fade(() => this.kickoffNow(side)); }

  async setCorner(A, laneSide) {
    await this.fade(() => {
      const cu = laneSide === 'L' ? 0.8 : 67.2;
      this.placeTeam(A, (p) => {
        if (p.i === 0) return [34, 4];
        const box = { 2: [29, 98], 3: [38, 99], 9: [32, 95], 10: [36, 93], 6: [34, 89] }[p.i];
        if (box) return box;
        if (p.i === (laneSide === 'L' ? 5 : 8)) return [cu + (laneSide === 'L' ? -0.6 : 0.6), 105.4];
        const [u, v] = FORMATION[p.i];
        return [u, v + 38];
      });
      this.placeTeam(1 - A, (p) => {
        if (p.i === 0) return [34, 0.8];
        const mark = { 1: [31, 3], 2: [30, 6], 3: [37, 6], 4: [37, 3], 6: [34, 10], 7: [35, 14], 5: [28, 13] }[p.i];
        if (mark) return mark;
        const [u, v] = FORMATION[p.i];
        return [u, v + 6];
      });
      this.give(this.byNum(A, laneSide === 'L' ? 5 : 8));
      [this.ball.x, this.ball.y] = this.W(A, cu, 104.4);
      this.ball.z = 0; this.ball.flight = null; this.ball.head = false; this.ball.rest = true;
      this.focus = [null, null]; this.defStyle = [null, null];
      this.cam.tzoom = 1.6;
      this.hold = 'corner';
    });
  }

  async setPenalty(A) {
    const shooter = this.ball.owner && this.ball.owner.side === A && this.ball.owner.i !== 0 ? this.ball.owner : this.byNum(A, 9);
    await this.fade(() => {
      // Todos fuera del área y de la medialuna. Los dos equipos se mezclan en el borde
      // del área para el rebote; el que patea deja a sus centrales atrás y el que
      // defiende deja al 9 en la mitad de la cancha para la contra.
      this.placeTeam(A, (p) => (p === shooter ? [34, 90.5] : PEN_ATT[p.i]));
      this.placeTeam(1 - A, (p) => PEN_DEF[p.i], A);
      this.give(shooter);
      [this.ball.x, this.ball.y] = this.W(A, 34, 94);
      this.ball.z = 0; this.ball.flight = null; this.ball.head = false; this.ball.rest = true;
      this.focus = [null, null]; this.defStyle = [null, null];
      this.cam.tzoom = 1.8;
      this.hold = 'penalty';
    });
  }

  async goalKick(D) {
    await this.fade(() => {
      this.hold = null;
      const k = this.players[D][0];
      [k.x, k.y] = this.W(D, 34, 5.5);
      k.dive = null; k.ov = null; k.z = 0;
      this.give(k);
      [this.ball.x, this.ball.y] = this.W(D, 34, 6.3);
      this.focus = [null, null]; this.defStyle = [null, null];
      this.cam.tzoom = 1.2;
    });
  }

  ensureOwner(side) {
    const o = this.ball.owner;
    if (o && o.side === side) return o;
    const p = this.nearest(side, this.ball.x, this.ball.y, false);
    this.give(p);
    return p;
  }

  ballUV(side) { return this.U(side, this.ball.x, this.ball.y); }

  // ---------- guiones ----------
  async play(ev) {
    this.clearOverrides();
    if (ev.situation !== 'penalty' && ev.situation !== 'corner') this.hold = null;
    const A = ev.poss, D = 1 - A;
    // Carta de defensa que la corta aunque el ataque ganó el duelo: se ve como
    // una jugada cortada (el duelo se sigue mostrando como lo ganó el ataque).
    if (ev.cut) ev = { ...ev, match: true, orig: ev };
    if (ev.situation === 'build') await this.playBuild(ev, A, D);
    else if (ev.situation === 'attack') await this.playAttack(ev, A, D);
    else if (ev.situation === 'shot' || ev.situation === 'penalty') await this.playShot(ev, A, D);
    else if (ev.situation === 'corner') await this.playCorner(ev, A, D);
    else if (ev.situation === 'shootout') await this.playShootout(ev, A, D);
    this.reveal(ev);
    this.release();
    this.clearOverrides();
  }

  async diceMoment(ev) {
    if (ev.dice == null || ev._diced) return;
    ev._diced = true;
    await this.ui.dice(ev.dice, ev.diceText, ev.diceFaces, ev.diceTitle, ev);
  }

  // Contragolpe armado: el que roba la suelta enseguida y la jugada sale con
  // pases (pelotazo al 9, diagonal del lateral, lateral-volante-pase o el
  // volante que conduce y filtra). Corren 3 o 4; el resto acompaña.
  async counterRun(ev, newA) {
    this.ui.banner('¡CONTRAGOLPE!', { small: true });
    this.cam.tzoom = 1.35;
    const A = newA, lane = LANE_U[ev.laneAfter || 'C'];
    const side = lane < 34 ? 'L' : lane > 34 ? 'R' : (Math.random() < 0.5 ? 'L' : 'R');
    const wing = this.byNum(A, side === 'L' ? 5 : 8);
    const fwd = this.mate(A, Math.abs(this.byNum(A, 9).x - this.W(A, lane, 60)[0]) < Math.abs(this.byNum(A, 10).x - this.W(A, lane, 60)[0]) ? [9, 10] : [10, 9]);
    const other = this.mate(A, [9, 10], [fwd]);
    // si la recuperó muy atrás (el arquero, un central), primero una salida corta
    let [u, v] = this.ballUV(A);
    if (v < 20) {
      const out = this.mate(A, u < 34 ? [6, 7] : [7, 6], [this.ball.owner]);
      await this.passTo(A, out, [clamp(u + (34 - u) * 0.5, 20, 48), 30], { dur: 0.8, h: 1.2 });
      [u, v] = this.ballUV(A);
    } else await this.dribble(A, [u + (34 - u) * 0.05, v + 1.2], 0.25);
    const far = clamp(v + 28, 52, 70);
    this.runs(A, [[fwd, lane, far - 2], [other, 68 - lane * 0.6 - 4, far - 6], [wing, side === 'L' ? 10 : 58, far - 4]], 1.4);
    const kind = pickR(['pelotazo', 'diagonal', 'lateral', 'volante']);
    if (kind === 'pelotazo') {
      // pelota larga al 9, que pica hacia adelante
      await this.passTo(A, fwd, [lane, far], { dur: 1.15, h: 3.4 });
    } else if (kind === 'diagonal') {
      // el lateral del otro lado cambia de frente buscando al puntero
      const fb = this.byNum(A, side === 'L' ? 4 : 1);
      await this.passTo(A, fb, [side === 'L' ? 58 : 10, v + 4], { dur: 0.6, h: 0.3 });
      await this.passTo(A, wing, [side === 'L' ? 10 : 58, far], { dur: 1.25, h: 3.6 });
    } else if (kind === 'lateral') {
      // lateral → volante → pase al que pica
      const fb = this.byNum(A, side === 'L' ? 1 : 4), cm = this.byNum(A, side === 'L' ? 6 : 7);
      await this.passTo(A, fb, [side === 'L' ? 9 : 59, v + 4], { dur: 0.55, h: 0.3 });
      await this.passTo(A, cm, [lerp(34, lane, 0.3), v + 11], { dur: 0.6, h: 0.3 });
      await this.passTo(A, fwd, [lane, far], { dur: 0.95, h: 0.4 });
    } else {
      // el volante la recibe, conduce unos metros y filtra
      const cm = this.mate(A, [6, 7], [this.ball.owner]);
      await this.passTo(A, cm, [34 + rnd(-4, 4), v + 6], { dur: 0.55, h: 0.3 });
      const [cu, cv] = this.ballUV(A);
      await this.dribble(A, [lerp(cu, lane, 0.25), cv + 7], 0.9);
      await this.passTo(A, pickR([fwd, wing]), [lane, far], { dur: 0.95, h: 0.4 });
    }
    // un par de pasos para acomodarse en el último tercio
    const [eu, ev2] = this.ballUV(A);
    if (ev2 < 70) await this.dribble(A, [lerp(eu, lane, 0.5), Math.min(72, ev2 + 5)], 0.6);
  }

  async afterSteal(D) {
    const [u, v] = this.ballUV(D);
    await this.dribble(D, [clamp(u + rnd(-4, 4), 4, 64), v + 6], 0.7);
  }

  // Una carta de situación cambió la jugada que viene: la pelota avanza sola
  // al último tercio (attack) o queda para rematar (shot).
  async cardMove(side, situation) {
    this.clearOverrides();
    this.hold = null;
    this.possSide = side;
    this.ensureOwner(side);
    const [u] = this.ballUV(side);
    this.cam.tzoom = 1.45; this.cam.follow = null;
    await this.dribble(side, [clamp(lerp(u, 34, 0.5), 22, 46), situation === 'shot' ? 84 : 73], 0.9);
    this.release();
  }

  // El defensor adivinó, pero una carta cambió la cara del dado a favor del
  // que ataca: la jugada sigue (o hay remate directo, o penal).
  async cardPlay(ev, A) {
    const D = 1 - A;
    const o = ev.outcome;
    if (o === 'foul' && ev.situation === 'attack') {
      // Falta en el último tercio: lo bajan y sigue el ataque desde ahí.
      const victim = this.nearest(A, this.ball.x, this.ball.y, true);
      victim.fallen = 1.2;
      this.ui.sound('whistle');
      this.ui.banner('FALTA', { small: true });
      await this.wait(1.1);
      this.give(victim);
      await this.wait(0.4);
      return true;
    }
    if (o === 'advance' || o === 'longball' || o === 'longpass' || o === 'chance') {
      this.give(this.nearest(A, this.ball.x, this.ball.y, true));
      this.ui.banner(o === 'longball' ? '¡PELOTAZO!' : o === 'longpass' ? '¡PASE LARGO!' : o === 'chance' ? '¡A REMATAR!' : '¡SIGUE LA JUGADA!', { small: true });
      const lane = LANE_U[ev.att] ?? 34;
      if (o === 'advance') await this.dribble(A, [lane, 73], 0.7);
      else if (o === 'longpass') await this.pass(A, [clamp(lane + rnd(-4, 4), 8, 60), 76], { dur: 1.2, h: 4.5 });
      else if (o === 'longball') await this.pass(A, [34 + rnd(-6, 6), 84], { dur: 1.1, h: 4 });
      else await this.dribble(A, [clamp(lerp(this.ballUV(A)[0], 34, 0.6), 24, 44), 89], 0.6);
      return true;
    }
    if (o === 'penalty') {
      // El penal siempre se ve dentro del área: si la jugada quedó afuera, el que
      // ataca la toma y entra al área, y ahí lo bajan.
      const victim = this.ball.owner && this.ball.owner.side === A ? this.ball.owner : this.nearest(A, this.ball.x, this.ball.y, true);
      const [vu, vv] = this.U(A, victim.x, victim.y);
      const inBox = vv >= 89 && Math.abs(vu - 34) < 19;
      if (inBox && victim.fallen > 0) {
        // ya lo bajaron dentro del área en el duelo
        this.ball.owner = null;
        await this.wait(0.3);
      } else {
        victim.fallen = 0;
        if (this.ball.owner !== victim) {
          this.ball.flight = null;
          this.give(victim);
          await this.wait(0.25);
        }
        const [bu, bv] = this.ballUV(A);
        if (bv < 91 || Math.abs(bu - 34) > 15) {
          const to = [clamp(bu, 22, 46), clamp(bv, 92, 97)];
          await this.dribble(A, to, clamp(Math.hypot(to[0] - bu, to[1] - bv) / 11, 0.6, 2.4), 1);
        }
        const fouler = this.nearest(D, this.ball.x, this.ball.y, true);
        this.moveTo(fouler, [this.ball.x, this.ball.y], 0.35, { linear: true });
        fouler.pose = { kind: 'slide', t: 0, dur: 0.5, dir: 1 };
        await this.wait(0.35);
        victim.fallen = 1.4;
        this.burst(victim.x, victim.y, 'dust', 10);
        this.ball.owner = null;
        await this.wait(0.5);
      }
      this.ui.sound('whistle');
      await this.ui.banner('¡PENAL!', {});
      await this.setPenalty(A);
      return true;
    }
    return false;
  }

  // La salida: la pelota pasa por varios jugadores hasta el tercio elegido.
  // Cada vez sale una forma distinta (toque corto, cambio de frente, pelotazo
  // o pared); el último pase es el duelo que decide si llega.
  async playBuild(ev, A, D) {
    this.cam.tzoom = 1.3; this.cam.follow = null;
    this.possSide = A;
    this.ensureOwner(A);
    const lane = LANE_U[ev.att];
    this.focus[D] = 68 - LANE_U[ev.def];
    const kind = pickR(['corto', 'cambio', 'pelotazo', 'pared']);
    // quién recibe el pase decisivo: el puntero de esa banda o un delantero por el medio
    const target = [clamp(lane + rnd(-2, 2), 5, 63), 66];
    const recvFor = (passer) => ev.att === 'L' ? this.mate(A, [5, 9, 1], [passer]) : ev.att === 'R' ? this.mate(A, [8, 10, 4], [passer]) : this.mate(A, pickR([[9, 10, 6], [10, 9, 7]]), [passer]);
    let [u, v] = this.ballUV(A);
    this.prevPasser = null;
    const back = [1, 2, 3, 4].map((n) => this.byNum(A, n));
    const mids = [5, 6, 7, 8].map((n) => this.byNum(A, n));
    // los que no participan se ofrecen: se abren a un espacio libre cerca de su lugar
    this.offerSupport(A);
    if (kind === 'corto') {
      // dos o tres toques cortos al compañero mejor ubicado, avanzando hacia el carril
      const n = v > 25 ? 2 : 3;
      for (let k = 0; k < n; k++) {
        await this.smartPass(A, k === n - 1 ? mids : [...back, ...mids], { adv: 10, toward: lane, len: 13 });
        await this.wait(0.12);
        this.offerSupport(A);
      }
    } else if (kind === 'cambio') {
      // carga de un lado para atraer al rival y después cambia de frente
      const away = lane < 34 ? 1 : lane > 34 ? -1 : (Math.random() < 0.5 ? 1 : -1);
      const far = [...back, ...mids].filter((p) => (this.U(A, p.x, p.y)[0] - 34) * away > 4);
      await this.smartPass(A, far.length ? far : mids, { adv: 6, toward: 34 + away * 20, len: 14 });
    } else if (kind === 'pared') {
      // toca con un volante, pica al espacio y se la devuelven adelante
      const first = this.ball.owner;
      const wallCands = mids.filter((p) => p !== first);
      const run = this.openSpot(A, first, [clamp(lerp(u, lane, 0.35), 8, 60), Math.min(v + 13, 58)], 16);
      const p1 = this.smartPass(A, wallCands, { adv: 5, toward: u, len: 10 });
      this.moveTo(first, this.W(A, ...run), 1.15);
      await p1;
      await this.passTo(A, first, run, { dur: 0.5, h: 0.2 });
    } else {
      // pelotazo: antes un toque para perfilarse si está muy atrás
      if (v < 25) await this.smartPass(A, back, { adv: 6, len: 12 });
    }
    // el pase decisivo: largo y por arriba a la banda (o el pelotazo), raso por el medio
    const passer = this.ball.owner;
    const recv = recvFor(passer);
    const long = ev.att !== 'C' || kind === 'pelotazo';
    if (recv) { recv.ov = this.short(recv, this.W(A, ...target), 3); recv.boost = 1.2; }
    this.cam.tzoom = 1.4;
    const winner = await this.duelPass(ev, A, target, {
      h: long ? (kind === 'pelotazo' ? 4 : 3.4) : 0.3, dur: long ? 1.3 : 1.0, defWins: ev.match, style: long ? 'header' : 'slide', recv,
    });
    if (!ev.match) { await this.dribble(A, [lerp(this.ballUV(A)[0], lane, 0.5), 70], 0.5); return; }
    await this.diceMoment(ev);
    if (await this.cardPlay(ev, A)) return;
    if (ev.outcome === 'foul') {
      const victim = this.nearest(A, winner.x, winner.y, true);
      victim.fallen = 1.2;
      this.ui.sound('whistle');
      this.ui.banner('FALTA', { small: true });
      await this.wait(1.1);
      this.give(victim);
      await this.wait(0.4);
      return;
    }
    if (ev.outcome === 'counter') { await this.counterRun(ev, D); return; }
    await this.afterSteal(D);
  }

  async playAttack(ev, A, D) {
    this.cam.tzoom = 1.5; this.cam.follow = null;
    this.possSide = A;
    this.ensureOwner(A);
    this.defStyle[D] = ev.def;
    const lane = LANE_U[ev.lane] ?? 34;
    if (ev.att === 'cross') {
      // Centro: la abre a un compañero de la banda (el puntero o el lateral que pasa
      // al ataque) y ese tira el centro; al área entran los delanteros, nunca el que centra.
      const wingU = ev.lane === 'R' ? 62 : ev.lane === 'L' ? 6 : (Math.random() < 0.5 ? 6 : 62);
      const L = wingU < 34;
      const owner = this.ball.owner;
      const [ou] = this.ballUV(A);
      const wide = [this.byNum(A, L ? 5 : 8), this.byNum(A, L ? 1 : 4)];
      let crosser = wide.includes(owner) && Math.abs(ou - wingU) < 14 ? owner : (Math.random() < 0.6 ? wide[0] : wide[1]);
      if (crosser === owner && !wide.includes(owner)) crosser = wide[0];
      const target = [L ? 38 : 30, 95.5];
      const heads = [this.byNum(A, 9), this.byNum(A, 10)].filter((p) => p !== crosser);
      const runner = heads[L ? heads.length - 1 : 0] || this.mate(A, [6, 7], [crosser]);
      const second = heads.find((p) => p !== runner) || this.mate(A, [7, 6], [crosser, runner]);
      this.runs(A, [[runner, L ? 31 : 37, 90], [second, L ? 37 : 31, 88], [this.mate(A, [6, 7], [crosser]), 34, 82]], 1.2);
      if (crosser !== owner) {
        const at = [wingU + (L ? 3 : -3), 79];
        crosser.ov = this.W(A, ...at); crosser.boost = 1.4;
        await this.wait(0.15);
        await this.passTo(A, crosser, at, { dur: 0.8, h: 0.35 });
      }
      await this.dribble(A, [wingU + (L ? 1 : -1), 84], 0.55);
      this.cam.tzoom = 1.6;
      const marker = this.nearest(D, ...this.W(A, target[0], target[1]), true);
      await this.duelPass(ev, A, target, { h: 6, dur: 1.3, defWins: ev.match, style: 'header', recv: runner, def: marker });
      if (!ev.match) return;
      await this.diceMoment(ev);
      if (await this.cardPlay(ev, A)) return;
      if (ev.outcome === 'corner') {
        this.launch(this.W(A, target[0] < 34 ? 24 : 44, 107), { dur: 0.8, h: 2.5, z1: 0 });
        await this.wait(0.8);
        await this.setCorner(A, ev.cornerSide || (wingU < 34 ? 'L' : 'R'));
        return;
      }
      if (ev.outcome === 'counter') { await this.counterRun(ev, D); return; }
      await this.pass(D, [34 + rnd(-12, 12), 30], { dur: 1, h: 4 });
      return;
    }
    if (ev.att === 'through') {
      // Pase entre líneas: lo recibe otro que pica en diagonal a la espalda del defensor
      // (filtrado directo, un toque al lado y filtrado, o pared con el 9).
      const [cu, cv] = this.ballUV(A);
      await this.dribble(A, [lerp(cu, 34, 0.3), Math.max(cv, 70) + 1.5], 0.4);
      const runU = 34 + (lane < 34 ? -5 : lane > 34 ? 5 : rnd(-4, 4));
      const owner = this.ball.owner;
      const kind = pickR(['directo', 'toque', 'pared']);
      let runner;
      if (kind === 'pared') {
        // se la da al 9 de espaldas y pica: el 9 se la devuelve al espacio
        const nine = this.mate(A, [9, 10, 6], [owner]);
        const [ou, ov] = this.ballUV(A);
        await this.passTo(A, nine, [lerp(ou, 34, 0.5), ov + 7], { dur: 0.5, h: 0.2 });
        runner = owner;
        this.moveTo(owner, this.W(A, runU + (runU < 34 ? -3 : 3), 84), 0.7);
        await this.wait(0.15);
      } else {
        if (kind === 'toque') {
          const [ou, ov] = this.ballUV(A);
          const side = this.mate(A, ou < 34 ? [7, 6] : [6, 7], [owner]);
          await this.passTo(A, side, [clamp(ou + (ou < 34 ? 6 : -6), 14, 54), ov + 0.5], { dur: 0.45, h: 0.15 });
        }
        const holder = this.ball.owner;
        runner = this.mate(A, runU < 34 ? [9, 5, 10, 8] : [10, 8, 9, 5], [holder]);
        // arranca abierto y entra en diagonal
        const [ru] = this.U(A, runner.x, runner.y);
        runner.lock = null;
        runner.ov = this.W(A, runU + (ru < runU ? -2 : 2), 85); runner.boost = 1.45;
        await this.wait(0.2);
      }
      this.cam.tzoom = 1.6;
      await this.duelPass(ev, A, [runU, ev.match ? 87.5 : 89], { h: 0.25, dur: 1.0, defWins: ev.match, style: 'slide', recv: runner });
      if (!ev.match) {
        this.players[D][0].ov = this.W(A, 34, 99.5);
        await this.dribble(A, [runU * 0.7 + 34 * 0.3, 92], 0.5);
        return;
      }
      await this.diceMoment(ev);
      if (await this.cardPlay(ev, A)) return;
      if (ev.outcome === 'corner') {
        this.launch(this.W(A, runU < 34 ? 20 : 48, 106.5), { dur: 0.7, h: 1.2 });
        await this.wait(0.7);
        await this.setCorner(A, ev.cornerSide || 'L');
        return;
      }
      if (ev.outcome === 'counter') { await this.counterRun(ev, D); return; }
      await this.afterSteal(D);
      return;
    }
    // Gambeta: si sale, se saca a uno (a veces a dos) y remata; de vez en cuando
    // queda solo frente al arquero. Es solo la imagen: la regla sigue siendo un remate.
    const [cu, cv] = this.ballUV(A);
    const endU = clamp(lerp(cu, 34, 0.7) + rnd(-4, 4), 24, 44);
    await this.dribble(A, [lerp(cu, endU, 0.4), Math.max(cv + 3, 76)], 0.7, 1);
    this.cam.tzoom = 1.65;
    const look = ev.match ? null : ev.outcome === 'penalty' ? 'pen' : pickR(['afuera', 'afuera', 'adentro', 'adentro', 'mano']);
    await this.duelDribble(ev, A, [endU, ev.boxFoul ? 102 : look === 'pen' ? 93 : look === 'afuera' ? 83 : 86], { defWins: ev.match });
    if (!ev.match) {
      await this.diceMoment(ev);
      if (look === 'adentro') {
        // se saca a un segundo rival con un recorte y remata con él encima
        const d2 = this.nearest(D, this.ball.x, this.ball.y, true);
        const cut = [clamp(endU + (endU < 34 ? 5 : -5), 22, 46), 90];
        d2.ov = this.W(A, cut[0] + (endU < 34 ? -1.5 : 1.5), 91.5); d2.boost = 1.3;
        await this.dribble(A, cut, 0.55, 1);
      } else if (look === 'mano') {
        // se va solo: el arquero sale a achicar
        this.players[D][0].ov = this.W(A, 34, 98.5);
        await this.dribble(A, [lerp(endU, 34, 0.6), 93], 0.6);
        this.shotLook = 'mano';
      }
      if (ev.outcome === 'penalty') {
        const victim = this.ball.owner;
        const fouler = this.nearest(D, this.ball.x, this.ball.y, true);
        this.moveTo(fouler, [this.ball.x, this.ball.y], 0.35, { linear: true });
        fouler.pose = { kind: 'slide', t: 0, dur: 0.5, dir: 1 };
        await this.wait(0.35);
        victim.fallen = 1.3;
        this.burst(victim.x, victim.y, 'dust', 10);
        this.ui.sound('whistle');
        await this.ui.banner('¡PENAL!', {});
        await this.setPenalty(A);
      }
      return;
    }
    await this.diceMoment(ev);
    if (await this.cardPlay(ev, A)) return;
    if (ev.outcome === 'corner') {
      this.launch(this.W(A, endU < 34 ? 22 : 46, 106.5), { dur: 0.6, h: 1 });
      await this.wait(0.6);
      await this.setCorner(A, ev.cornerSide || 'L');
      return;
    }
    if (ev.outcome === 'counter') { await this.counterRun(ev, D); return; }
    await this.afterSteal(D);
  }

  // Cartel con el nombre de quien lleva la pelota.
  updateTag() {
    if (!this.tag) return;
    const o = this.ball.owner;
    const key = o ? `${o.side}:${o.i}:${this.teams[o.side].id}` : '';
    if (key === this.tagKey) return;
    this.tagKey = key;
    if (!o) { this.tag.classList.remove('on'); return; }
    const info = this.playerInfo(o);
    const k = this.kits[o.side];
    this.tag.innerHTML = `<i style="background:${k.shirt}"></i>${info.name} <small>${info.num}</small>`;
    this.tag.classList.add('on');
  }

  // Nombre y número del jugador en el plantel de su equipo.
  playerInfo(p) {
    const team = this.teams[p.side];
    return { name: playerName(team.id, p.i), num: NUMS[p.i], team: team.short, skin: p.skin, hair: p.hair, style: p.style };
  }

  async playShot(ev, A, D) {
    this.cam.tzoom = 1.75; this.cam.follow = null;
    this.possSide = A;
    let shooter = this.ensureOwner(A);
    if (ev.shooter != null && shooter.i !== ev.shooter && shooter.i !== 0) {
      // El que patea lo decide el anfitrión: intercambia identidad con quien tiene la pelota.
      const other = this.players[A].find((p) => p.i === ev.shooter);
      if (other) for (const k of ['i', 'skin', 'hair']) [shooter[k], other[k]] = [other[k], shooter[k]];
      this.tagKey = '';
    }
    const keeper = this.players[D][0];
    const kind = ev.shotKind;
    if (kind === 'penal') {
      const [su, sv] = this.U(A, shooter.x, shooter.y);
      // camina hasta la pelota, que sigue quieta en el punto penal
      this.ball.owner = shooter; this.ball.rest = true;
      this.moveTo(shooter, this.W(A, su, sv + 2.6), 0.8, { linear: true });
      await this.wait(0.8);
    } else if (kind !== 'cabezazo') {
      // un toque para acomodarse
      const [su, sv] = this.U(A, shooter.x, shooter.y);
      await this.dribble(A, [su + (34 - su) * 0.1, sv + 1.5], 0.35);
    }
    this.lastShooter = this.playerInfo(shooter);
    this.lastKeeper = this.playerInfo(keeper);
    const tu = GOAL_U[ev.att];
    // Dónde termina la pelota en la cancha.
    let to;
    if (ev.match) to = [tu, 104.5];
    else if (ev.outcome === 'goal') to = [tu + (ev.att === 'L' ? -0.6 : ev.att === 'R' ? 0.6 : 0), 106.6];
    else if (ev.outcome === 'post') to = [ev.att === 'R' ? 41 : 27, 101];
    else if (ev.outcome === 'clear') to = [tu + (tu < 34 ? 6 : -6), 96];
    else to = [tu < 34 ? 28.6 : tu > 34 ? 39.4 : 34, 109.5];

    // La escena del remate: se ve completa y ahí se revela el duelo y se tira el dado.
    await this.shotScene(ev, A, D, shooter, keeper);
    this.hold = null;

    const b = this.ball;
    b.owner = null; b.flight = null; b.head = false;
    this.trail = [];
    const goalWorld = this.W(A, 34, 105);
    const gi = goalWorld[1] < 50 ? 0 : 1;
    if (ev.match) {
      if (ev.outcome === 'save_corner') {
        // Igual que cualquier atajada: recién el dado dice que se le escapa al córner.
        this.give(keeper);
        this.ui.banner('¡ATAJADA!', { small: true });
        await this.wait(0.6);
        await this.diceMoment(ev);
        const side = ev.cornerSide || (tu < 34 ? 'L' : 'R');
        this.launch(this.W(A, side === 'L' ? 25 : 43, 107.6), { dur: 0.6, h: 1.6 });
        this.ui.banner('¡AL CÓRNER!', { small: true });
        await this.wait(0.8);
        await this.setCorner(A, side);
        return;
      }
      if (ev.outcome === 'goal') {
        // La tenía... y se le escapa (carta «Golazo de chilena»).
        this.give(keeper);
        this.ui.banner('¡ATAJADA!', { small: true });
        await this.wait(0.6);
        await this.diceMoment(ev);
        b.owner = null;
        [b.x, b.y] = this.W(A, tu, 106.6); b.z = 0.4;
        this.netShake[gi] = 1.0;
        this.reveal(ev);
        await this.celebrate(ev, A, shooter);
        return;
      }
      this.give(keeper);
      this.ui.banner('¡ATAJADA!', { small: true });
      await this.wait(0.6);
      await this.diceMoment(ev);
      if (ev.outcome === 'save_counter') { await this.counterRun(ev, D); return; }
      await this.wait(0.3);
      return;
    }
    const [x, y] = this.W(A, to[0], to[1]);
    b.x = x; b.y = y; b.z = ev.outcome === 'goal' ? 0.4 : 0;
    if (ev.outcome === 'goal') {
      this.netShake[gi] = 1.0;
      this.reveal(ev);
      await this.celebrate(ev, A, shooter);
      return;
    }
    this.reveal(ev);
    if (ev.outcome === 'save_corner') {
      // Arquero inspirado: la alcanza a sacar al córner.
      this.ui.banner('¡ATAJADÓN!', { small: true });
      await this.wait(0.7);
      await this.setCorner(A, ev.cornerSide || (tu < 34 ? 'L' : 'R'));
      return;
    }
    this.ui.banner(ev.outcome === 'post' ? '¡AL PALO!' : ev.outcome === 'clear' ? '¡DESPEJE EN LA LÍNEA!' : '¡AFUERA!', { small: true });
    await this.wait(0.7);
    await this.diceMoment(ev);
    await this.goalKick(D);
  }

  // Un penal de la tanda. Se patea siempre al mismo arco (el que ataca el local). Los
  // dos equipos miran abrazados desde el círculo central, cada uno de su lado, y el
  // arquero que no ataja espera al costado del área.
  async playShootout(ev, A, D) {
    const F = 0;
    // en la tanda los arqueros esperan al costado del área y al final corren a festejar
    this.freeKeepers = true;
    const shooter = this.players[A].find((p) => p.i === ev.shooter) || this.players[A][9];
    const keeper = this.players[D][0];
    const lineU = (side, k) => (side === 0 ? 32.6 - k * 1.5 : 35.4 + k * 1.5);
    const spot = this.W(F, 34, 94);
    const faceSpot = (p) => { const dl = Math.hypot(spot[0] - p.x, spot[1] - p.y) || 1; p.fx = (spot[0] - p.x) / dl; p.facing = (spot[1] - p.y) / dl; };
    const keeperSpot = (side) => (side === D ? [34, 104.4] : [side === 0 ? 12.5 : 55.5, 87]);
    if (!this.so) {
      // Primer penal: todos al círculo central, abrazados, cada equipo de su lado.
      // De ahí en adelante nadie vuelve a su puesto: solo caminan el que patea,
      // el que ya pateó y los arqueros que se turnan.
      const linePos = new Map();
      await this.fade(() => {
        for (const side of [0, 1]) {
          let k = 0;
          this.placeTeam(side, (p) => {
            if (p.i === 0) return keeperSpot(side);
            const at = [lineU(side, k++), 52.5];
            linePos.set(p, this.W(F, at[0], at[1]));
            return at;
          }, F);
        }
        for (const team of this.players) for (const p of team) {
          p.ov = [p.x, p.y]; p.boost = 0.5;
          if (linePos.has(p)) p.stance = 'linked';
          faceSpot(p);
        }
        this.ball.owner = null; this.ball.flight = null; this.ball.z = 0;
        [this.ball.x, this.ball.y] = spot;
        this.focus = [null, null]; this.defStyle = [null, null];
        const mid = this.W(F, 34, 54);
        this.cam.follow = { x: mid[0], y: mid[1] }; this.cam.tzoom = 1.8;
        [this.cam.x, this.cam.y] = this.px(mid[0], mid[1]);
      });
      this.so = { linePos, back: new Set() };
    }
    const so = this.so;
    // Los arqueros se cambian: el que ataja va al arco, el otro al costado del área.
    for (const side of [0, 1]) { const k = this.players[side][0]; k.stance = null; k.cheer = 0; k.ov = this.W(F, ...keeperSpot(side)); k.boost = 1.3; }
    // La pelota vuelve rodando al punto penal.
    const b0 = this.ball;
    b0.owner = null; b0.flight = null; b0.z = 0;
    const from = [b0.x, b0.y];
    // El que patea sale de la ronda y camina al punto penal.
    shooter.stance = null; shooter.cheer = 0;
    shooter.ov = this.W(F, 34, 92); shooter.boost = 1.5;
    this.cam.follow = shooter; this.cam.tzoom = 1.6;
    for (let t = 0; t < 6; t += 0.1) {
      const k = Math.min(1, t / 1.2);
      b0.x = lerp(from[0], spot[0], k * (2 - k)); b0.y = lerp(from[1], spot[1], k * (2 - k));
      const sw = this.W(F, 34, 92), ka = this.players[D][0], kg = this.W(F, 34, 104.4);
      // el que ya pateó, al llegar a la ronda, se vuelve a abrazar con los suyos
      for (const p of so.back) { const at = so.linePos.get(p); if (Math.hypot(p.x - at[0], p.y - at[1]) < 0.5) { p.stance = 'linked'; faceSpot(p); so.back.delete(p); } }
      if (t > 1.2 && Math.hypot(shooter.x - sw[0], shooter.y - sw[1]) < 0.6 && Math.hypot(ka.x - kg[0], ka.y - kg[1]) < 0.8) break;
      await this.wait(0.1);
    }
    [b0.x, b0.y] = spot;
    so.back.delete(shooter);
    this.give(shooter);
    this.ball.rest = true;
    [this.ball.x, this.ball.y] = spot;
    this.possSide = A;
    this.lastShooter = this.playerInfo(shooter);
    this.lastKeeper = this.playerInfo(keeper);
    await this.wait(0.6);
    this.cam.follow = null;
    await this.shotScene(ev, A, D, shooter, keeper);
    const b = this.ball;
    b.owner = null; b.flight = null;
    const tu = GOAL_U[ev.att];
    const to = ev.match ? [tu, 104.5] : ev.outcome === 'goal' ? [tu, 106.6] : ev.outcome === 'post' ? [ev.att === 'R' ? 41 : 27, 101] : [tu < 34 ? 28.6 : tu > 34 ? 39.4 : 34, 109.5];
    [b.x, b.y] = this.W(F, to[0], to[1]); b.z = 0;
    this.reveal(ev);
    const scored = ev.outcome === 'goal';
    const line = (side) => this.players[side].filter((p) => so.linePos.has(p) && p !== shooter);
    if (scored) {
      const gi = this.W(F, 34, 105)[1] < 50 ? 0 : 1;
      this.netShake[gi] = 1;
      this.crowdJump = { side: A, t: 2 };
      shooter.cheer = 2;
      this.ui.banner('¡GOL!', { small: true });
    } else {
      if (ev.match) this.give(keeper);
      keeper.cheer = ev.match ? 2 : 0;
      this.ui.banner(ev.match ? '¡ATAJADO!' : ev.outcome === 'post' ? '¡AL PALO!' : '¡AFUERA!', { small: true });
    }
    if (!ev.shootoutEnd) {
      // festejan en el lugar, sin soltarse
      const happy = scored ? A : D;
      for (const p of line(happy)) p.cheer = 1.4 + Math.random() * 0.4;
      await this.wait(1.2);
      // el que pateó se retira a la ronda; el resto se queda donde está
      shooter.stance = null; shooter.cheer = 0;
      shooter.ov = this.so.linePos.get(shooter); shooter.boost = 1.2;
      this.so.back.add(shooter);
      return;
    }
    // Último penal: los que ganan corren al que lo metió (o al arquero, si lo decidió
    // él) y los que pierden se quedan en el pasto.
    const win = scored ? A : D, lose = 1 - win;
    const hero = scored ? shooter : keeper;
    this.so = null;
    await this.wait(0.5);
    for (const p of this.players[win]) {
      if (p === hero) continue;
      p.stance = null;
      p.ov = [hero.x + rnd(-2.2, 2.2), hero.y + rnd(-1.6, 1.6)]; p.boost = 1.9; p.cheer = 7;
    }
    hero.ov = [hero.x, hero.y]; hero.cheer = 6;
    const ground = ['kneelHead', 'kneelDown', 'sitBack', 'lieBack', 'kneelHead', 'sitBack'];
    let g = 0;
    for (const p of this.players[lose]) {
      p.cheer = 0;
      if (p.i === 0 && p !== keeper) { p.stance = null; continue; }
      if (p !== shooter && p !== keeper && Math.random() < 0.3) { p.stance = null; continue; } // alguno queda de pie, mirando
      p.stance = ground[g++ % ground.length]; p.stanceDir = Math.random() < 0.5 ? 1 : -1;
    }
    if (!scored) shooter.stance = 'kneelHead';
    this.cam.follow = hero; this.cam.tzoom = 1.6;
    await this.wait(4.5);
    this.cam.follow = null;
  }

  async shotScene(ev, A, D, shooter, keeper) {
    if (!this.cut) return;
    ev._scene = true;
    const sh = this.lastShooter, kp = this.lastKeeper;
    await this.ui.fadeOut();
    const scene = this.cut.play({
      // Si el arquero adivinó, la escena siempre la muestra en sus manos: el dado
      // decide después (se le escapa, la saca al córner o sale de contra).
      kind: ev.shotKind === 'remate' && this.shotLook ? this.shotLook : ev.shotKind, att: ev.att, def: ev.def, match: ev.match, outcome: ev.match ? 'save' : ev.outcome,
      shooter: sh, keeper: kp,
      kitA: this.kits[A], kitD: this.kits[D], gkColor: this.kits[D].gk,
      crowd: [this.kits[A].shirt, this.kits[D].shirt],
      stadium: this.stadium,
      sound: (n) => this.ui.sound(n),
      onContact: () => this.reveal(ev),
      onFreeze: async () => {
        // Le ganó al arquero: se revela el duelo y el dado decide.
        this.ui.reveal({ ...ev, outcome: 'beaten' });
        if (ev.outcome !== 'goal') ev._revealed = true;
        await this.diceMoment(ev);
        if (ev.outcome === 'goal') this.reveal(ev);
      },
    });
    this.shotLook = null;
    await this.ui.fadeIn();
    await scene;
    await this.ui.fadeOut();
    this.cut.hide();
    await this.ui.fadeIn();
  }

  async playCorner(ev, A, D) {
    this.hold = null;
    this.cam.tzoom = 1.6; this.cam.follow = null;
    this.possSide = A;
    const taker = this.ensureOwner(A);
    taker.ov = [taker.x, taker.y]; // espera junto a la pelota hasta patear
    const [tu] = this.U(A, taker.x, taker.y);
    const left = tu < 34;
    const T = { near: [left ? 31 : 37, 100.5], spot: [34, 94], far: [left ? 38.5 : 29.5, 99.5] }[ev.att];
    const runner = this.nearest(A, ...this.W(A, T[0], T[1]), true, [taker]);
    const marker = this.nearest(D, ...this.W(A, T[0], T[1]), true);
    await this.wait(0.4);
    await this.duelPass(ev, A, T, { h: 5.5, dur: 1.3, defWins: ev.match, style: 'header', recv: runner, def: marker });
    if (!ev.match) return;
    // el rechazo cae donde llega el compañero que la recibe (la pelota no se
    // desvía sola hacia él)
    const aim = this.W(A, T[0] + rnd(-10, 10), 76);
    const rec = this.nearest(D, aim[0], aim[1], true, [this.ball.owner]);
    const run = Math.min(Math.hypot(aim[0] - rec.x, aim[1] - rec.y), 4.5);
    const land = this.short(rec, aim, Math.max(0, Math.hypot(aim[0] - rec.x, aim[1] - rec.y) - run));
    rec.ov = land; rec.boost = 1.3;
    this.ball.owner = null;
    this.launch(land, { dur: 1.0, h: 4 });
    await this.wait(1.0);
    rec.ov = null; rec.boost = 1;
    this.give(rec);
    await this.afterSteal(D);
  }

  async celebrate(ev, A, scorer) {
    if (!ev._scene) this.ui.sound('goal');
    this.crowdJump = { side: A, t: 4.5 };
    this.flash = 0.6;
    this.confetti(A);
    this.ui.banner('¡GOOOL!', { goal: true, color: this.kits[A].shirt, alt: this.kits[A].alt2 });
    await this.wait(0.4);
    const [su] = this.U(A, scorer.x, scorer.y);
    const corner = this.W(A, su < 34 ? 3 : 65, 101);
    scorer.ov = corner; scorer.boost = 1.25; scorer.cheer = 3.5;
    this.cam.follow = scorer; this.cam.tzoom = 2.1;
    this.players[A].forEach((p, k) => {
      if (p !== scorer && p.i !== 0 && k % 2 === 0) { p.ov = [corner[0] + rnd(-3, 3), corner[1] + rnd(-3, 3)]; p.boost = 1.1; p.cheer = 3.5; }
    });
    this.players[1 - A].forEach((p) => { if (p.i !== 0) { p.ov = this.W(1 - A, FORMATION[p.i][0], Math.min(FORMATION[p.i][1], 40)); p.boost = 0.45; } });
    await this.wait(3.3);
    this.cam.follow = null;
  }

  // ---------- estadio ----------
  buildBackground() {
    const c = document.createElement('canvas');
    c.width = WW; c.height = WH;
    const g = c.getContext('2d');
    // estructura de tribunas
    const st = this.stadium;
    const seat = st.seats[0];
    g.fillStyle = tone(seat, -0.6); g.fillRect(0, 0, WW, WH);
    for (let y = 0; y < WH; y += 3) {
      g.fillStyle = (y / 3) % 7 === 3 ? tone(st.seats[1], -0.35) : (y / 3) % 2 ? tone(seat, -0.45) : tone(seat, -0.3);
      g.fillRect(0, y, WW, 1);
    }
    // césped con franjas y cuadriculado de corte
    const gx0 = MX - 10, gy0 = MY - 10, gw = PW * S + 20, gh = PL * S + 20;
    g.fillStyle = '#3d9a3a'; g.fillRect(gx0, gy0, gw, gh);
    const bands = 14;
    for (let i = 0; i < bands; i++) {
      const y0 = Math.round(MY + (PL * S * i) / bands), y1 = Math.round(MY + (PL * S * (i + 1)) / bands);
      g.fillStyle = i % 2 ? '#3f9c3b' : '#48ab43';
      g.fillRect(gx0, y0, gw, y1 - y0);
    }
    for (let i = 0; i < 8; i++) {
      if (i % 2) { g.fillStyle = st.mow === 'checks' ? 'rgba(0,0,0,0.07)' : 'rgba(0,0,0,0.035)'; g.fillRect(MX + (PW * S * i) / 8, gy0, (PW * S) / 8, gh); }
    }
    // pista de atletismo alrededor de la cancha
    if (st.track) {
      const tx0 = MX - 10, ty0 = MY - 10, tw = PW * S + 20, th = PL * S + 20, inner = 5;
      g.fillStyle = st.track;
      g.fillRect(tx0, ty0, tw, inner); g.fillRect(tx0, ty0 + th - inner, tw, inner);
      g.fillRect(tx0, ty0, inner, th); g.fillRect(tx0 + tw - inner, ty0, inner, th);
      g.fillStyle = 'rgba(255,255,255,0.35)';
      for (let k = 1; k < inner; k += 2) {
        g.fillRect(tx0 + k, ty0 + k, tw - 2 * k, 1); g.fillRect(tx0 + k, ty0 + th - 1 - k, tw - 2 * k, 1);
        g.fillRect(tx0 + k, ty0 + k, 1, th - 2 * k); g.fillRect(tx0 + tw - 1 - k, ty0 + k, 1, th - 2 * k);
      }
    }
    // textura
    for (let i = 0; i < 5000; i++) {
      const x = gx0 + Math.random() * gw, y = gy0 + Math.random() * gh;
      g.fillStyle = Math.random() < 0.5 ? 'rgba(0,30,0,0.08)' : 'rgba(255,255,200,0.06)';
      g.fillRect(Math.floor(x), Math.floor(y), 1, 1);
    }
    // desgaste en las áreas chicas y el círculo central
    const wear = (cx, cy, r, n) => {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, d = Math.random() ** 1.6 * r;
        g.fillStyle = Math.random() < 0.6 ? 'rgba(150,130,80,0.18)' : 'rgba(120,100,60,0.14)';
        g.fillRect(Math.round(MX + (cx + Math.cos(a) * d) * S), Math.round(MY + (cy + Math.sin(a) * d * 0.7) * S), 1, 1);
      }
    };
    wear(PW / 2, 3, 6, 260); wear(PW / 2, PL - 3, 6, 260); wear(PW / 2, PL / 2, 5, 120);
    // sombra de la tribuna sobre el césped
    const sh = g.createLinearGradient(0, gy0, 0, gy0 + 40);
    sh.addColorStop(0, 'rgba(0,0,0,0.28)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = sh; g.fillRect(gx0, gy0, gw, 40);
    // líneas
    g.fillStyle = 'rgba(246,246,236,0.92)';
    const line = (x0, y0, x1, y1) => {
      const ax = Math.round(MX + x0 * S), ay = Math.round(MY + y0 * S), bx = Math.round(MX + x1 * S), by = Math.round(MY + y1 * S);
      g.fillRect(Math.min(ax, bx), Math.min(ay, by), Math.max(1, Math.abs(bx - ax)), Math.max(1, Math.abs(by - ay)));
    };
    const rect = (x, y, w, h) => { line(x, y, x + w, y); line(x, y + h, x + w + 1 / S, y + h); line(x, y, x, y + h); line(x + w, y, x + w, y + h); };
    rect(0, 0, PW, PL);
    line(0, PL / 2, PW, PL / 2);
    const circle = (cx, cy, r, a0 = 0, a1 = Math.PI * 2) => {
      const steps = Math.ceil(r * S * 8);
      for (let i = 0; i <= steps; i++) {
        const a = a0 + ((a1 - a0) * i) / steps;
        g.fillRect(Math.round(MX + (cx + Math.cos(a) * r) * S), Math.round(MY + (cy + Math.sin(a) * r) * S), 1, 1);
      }
    };
    circle(PW / 2, PL / 2, 9.15);
    g.fillRect(Math.round(MX + (PW / 2) * S) - 1, Math.round(MY + (PL / 2) * S) - 1, 3, 3);
    for (const top of [true, false]) {
      const y = top ? 0 : PL;
      const dir = top ? 1 : -1;
      rect((PW - 40.3) / 2, top ? 0 : PL - 16.5, 40.3, 16.5);
      rect((PW - 18.3) / 2, top ? 0 : PL - 5.5, 18.3, 5.5);
      const spotY = y + dir * 11;
      g.fillRect(Math.round(MX + (PW / 2) * S) - 1, Math.round(MY + spotY * S) - 1, 2, 2);
      const a = Math.acos(5.5 / 9.15);
      if (top) circle(PW / 2, spotY, 9.15, Math.PI / 2 - a, Math.PI / 2 + a);
      else circle(PW / 2, spotY, 9.15, -Math.PI / 2 - a, -Math.PI / 2 + a);
      circle(0, y, 1, top ? 0 : -Math.PI / 2, top ? Math.PI / 2 : 0);
      circle(PW, y, 1, top ? Math.PI / 2 : Math.PI, top ? Math.PI : Math.PI * 1.5);
    }
    this.drawStadiumFeatures(g);
    // bancos de suplentes
    for (const yy of [PL / 2 - 9, PL / 2 + 3]) {
      const X = MX + PW * S + 11, Y = Math.round(MY + yy * S);
      g.fillStyle = '#11141a'; g.fillRect(X, Y, 6, 22);
      g.fillStyle = '#5a6a80'; g.fillRect(X, Y, 6, 2);
      g.fillStyle = 'rgba(255,255,255,0.1)'; g.fillRect(X + 1, Y + 3, 1, 18);
    }
    return c;
  }

  // Rasgos fijos del estadio sobre las tribunas (letras, torre, palcos).
  drawStadiumFeatures(g) {
    const st = this.stadium;
    const standH = MY - 15;
    const block = (x, y, w, h) => this.noCrowd.push([x, y, w, h]);
    if (st.letters) {
      const k = 2, w = pxTextW(st.letters, k) + 8;
      for (const y of [Math.round((standH - 10) / 2) - 1, WH - standH + Math.round((standH - 10) / 2) - 2]) {
        const x = Math.round(WW / 2 - w / 2);
        g.fillStyle = tone(st.seats[0], -0.15); g.fillRect(x, y - 2, w, 14);
        pxText(g, st.letters, x + 4, y, st.seats[1] === st.seats[0] ? '#ffffff' : st.seats[1], k);
        block(x - 1, y - 3, w + 2, 16);
      }
    }
    if (st.features.includes('tower')) {
      // Torre de los Homenajes detrás de un arco, con su sombra larga.
      const x = Math.round(WW / 2 + 70), y = WH - standH + 1;
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x + 4, y + 4, 26, 8);
      g.fillStyle = '#f2f2ee'; g.fillRect(x, y, 12, 12);
      g.fillStyle = '#c9ccd2'; g.fillRect(x + 2, y + 2, 8, 8);
      g.fillStyle = '#75aadb'; g.fillRect(x + 4, y + 4, 4, 4);
      block(x - 1, y - 1, 32, 16);
    }
    if (st.features.includes('bombonera')) {
      // Un lateral recto y vertical lleno de palcos.
      const x0 = WW - (MX - 11) - 1;
      for (let y = MY - 12; y < WH - MY + 10; y += 4) {
        g.fillStyle = '#0b2c7a'; g.fillRect(x0, y, MX - 11, 4);
        g.fillStyle = '#f7c600'; g.fillRect(x0 + 1, y + 1, MX - 13, 2);
        g.fillStyle = '#26303c'; g.fillRect(x0 + 3, y + 1, 2, 2); g.fillRect(x0 + 7, y + 1, 2, 2);
      }
      block(x0, MY - 12, MX - 10, WH - 2 * MY + 22);
    }
  }

  // Techo y forma del estadio: se dibuja encima de la hinchada.
  buildOverlay() {
    const st = this.stadium;
    const c = document.createElement('canvas');
    c.width = WW; c.height = WH;
    const g = c.getContext('2d');
    if (st.shape === 'round') {
      const R = 46;
      g.fillStyle = '#12151c';
      for (const [cx, cy, sx, sy] of [[R, R, -1, -1], [WW - R, R, 1, -1], [R, WH - R, -1, 1], [WW - R, WH - R, 1, 1]]) {
        for (let y = 0; y < R; y++) for (let x = 0; x < R; x++) {
          if (Math.hypot(x, y) > R) g.fillRect(cx + sx * x - (sx < 0 ? 1 : 0), cy + sy * y - (sy < 0 ? 1 : 0), 1, 1);
        }
      }
    }
    if (st.roof) {
      const b = 4;
      const dome = st.features.includes('dome');
      for (let i = 0; i < WW; i++) for (let j = 0; j < b; j++) {
        const col = dome ? (((i + j) >> 1) % 3 === 0 ? '#ffffff' : st.roof) : (i % 6 === 0 ? tone(st.roof, -0.25) : st.roof);
        g.fillStyle = col; g.fillRect(i, j, 1, 1); g.fillRect(i, WH - 1 - j, 1, 1);
      }
      for (let j = 0; j < WH; j++) for (let i = 0; i < b; i++) {
        const col = dome ? (((i + j) >> 1) % 3 === 0 ? '#ffffff' : st.roof) : (j % 6 === 0 ? tone(st.roof, -0.25) : st.roof);
        g.fillStyle = col; g.fillRect(i, j, 1, 1); g.fillRect(WW - 1 - i, j, 1, 1);
      }
      g.fillStyle = 'rgba(0,0,0,0.25)';
      g.fillRect(b, b, WW - 2 * b, 1); g.fillRect(b, WH - b - 1, WW - 2 * b, 1);
    }
    if (st.features.includes('trusses')) {
      // torres cilíndricas en las esquinas y vigas rojas sobre el techo
      g.fillStyle = '#b3261e';
      for (const [x, y] of [[9, 9], [WW - 9, 9], [9, WH - 9], [WW - 9, WH - 9]]) {
        for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) if (dx * dx + dy * dy <= 36) g.fillRect(x + dx, y + dy, 1, 1);
      }
      g.fillRect(0, 2, WW, 2); g.fillRect(0, WH - 4, WW, 2);
      g.fillStyle = '#e8e8e8';
      for (const [x, y] of [[9, 9], [WW - 9, 9], [9, WH - 9], [WW - 9, WH - 9]]) g.fillRect(x - 2, y - 2, 4, 4);
    }
    if (st.features.includes('arch')) {
      // el arco de Wembley sobre la tribuna norte
      g.fillStyle = '#ffffff';
      for (let x = 12; x < WW - 12; x++) {
        const t = (x - WW / 2) / (WW / 2 - 12);
        const y = Math.round(3 + (1 - t * t) * 0 + t * t * 14);
        g.fillRect(x, y, 1, 2);
      }
      g.fillStyle = 'rgba(0,0,0,0.3)';
      for (let x = 12; x < WW - 12; x++) { const t = (x - WW / 2) / (WW / 2 - 12); g.fillRect(x + 2, Math.round(5 + t * t * 14), 1, 1); }
    }
    return c;
  }

  buildBoards() {
    // Carteles LED: bloques de color con "letras" de píxeles.
    const len = 640;
    const c = document.createElement('canvas');
    c.width = len; c.height = 4;
    const g = c.getContext('2d');
    const t = this.teams;
    const pal = [['#0b2a6b', '#ffd23f'], ['#c8102e', '#ffffff'], ['#111111', '#3fbf5a'], [t[0].kit.shirt, t[0].kit.alt2 === t[0].kit.shirt ? '#111' : t[0].kit.alt2], [t[1].kit.shirt, t[1].kit.alt2 === t[1].kit.shirt ? '#111' : t[1].kit.alt2], ['#ff7a00', '#111111']];
    let x = 0, k = 0;
    while (x < len) {
      const [bg, fg] = pal[k % pal.length]; k++;
      const w = 40 + Math.floor(Math.random() * 30);
      g.fillStyle = bg; g.fillRect(x, 0, w, 4);
      g.fillStyle = fg;
      for (let i = x + 4; i < x + w - 4; i++) {
        if (Math.random() < 0.55) g.fillRect(i, 1, 1, Math.random() < 0.5 ? 2 : 1);
        if (Math.random() < 0.15) i++;
      }
      g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(x + w - 1, 0, 1, 4);
      x += w;
    }
    return c;
  }

  buildCrowd() {
    const st = this.stadium || { seats: ['#7a7a7a', '#c9c9c9'], features: [] };
    const cols = [this.teams[0].kit.shirt, this.teams[0].kit.alt2, this.teams[1].kit.shirt, this.teams[1].kit.alt2, '#c9c9c9', st.seats[0], '#3a3a3a', st.seats[1]];
    const kop = st.features.includes('kop');
    const blocked = (x, y) => (this.noCrowd || []).some(([bx, by, bw, bh]) => x >= bx && x < bx + bw && y >= by && y < by + bh);
    this.crowd = [];
    const add = (x, y) => {
      if (Math.random() < 0.08 || blocked(x, y)) return; // asientos vacíos
      const homeEnd = y > WH / 2;
      const r = Math.random();
      let c;
      if (kop && y > WH - MY + 15) c = r < 0.85 ? cols[0] : cols[1];
      else if (r < 0.45) c = homeEnd ? cols[0] : cols[2];
      else if (r < 0.6) c = homeEnd ? cols[1] : cols[3];
      else c = cols[4 + Math.floor(Math.random() * 4)];
      this.crowd.push({ x, y, c, ph: Math.random() * 10, team: homeEnd ? 0 : 1, skin: SKINS[Math.floor(Math.random() * SKINS.length)], flag: Math.random() < 0.02 });
    };
    for (let y = 2; y < MY - 15; y += 3) for (let x = 1; x < WW - 2; x += 3) { add(x, y); add(x, WH - y - 3); }
    for (let x = 1; x < MX - 11; x += 3) for (let y = MY - 12; y < WH - MY + 10; y += 3) { add(x, y); if (!(y > MY + (PL / 2 - 10) * S && y < MY + (PL / 2 + 10) * S)) add(WW - x - 3, y); }
  }

  drawCrowd(g, now) {
    const flip = this.mySide === 1;
    for (const p of this.crowd) {
      const team = flip ? 1 - p.team : p.team;
      const jumping = this.crowdJump.t > 0 && this.crowdJump.side === team;
      const bob = jumping ? (Math.sin(now / 80 + p.ph) > 0 ? -1 : 0) : (Math.sin(now / 700 + p.ph) > 0.96 ? -1 : 0);
      g.fillStyle = p.c; g.fillRect(p.x, p.y + bob + 1, 2, 2);
      g.fillStyle = p.skin; g.fillRect(p.x, p.y + bob, 2, 1);
      if (p.flag || (jumping && p.ph > 9.3)) { g.fillStyle = p.c; g.fillRect(p.x + 2, p.y + bob - 3 + (Math.sin(now / 120 + p.ph) > 0 ? 0 : 1), 3, 2); g.fillStyle = '#ddd'; g.fillRect(p.x + 2, p.y + bob - 3, 1, 4); }
    }
  }

  drawBoards(g) {
    const off = Math.floor(this.boardT * 14) % 320;
    const yT = MY - 15, yB = MY + PL * S + 11;
    g.drawImage(this.boards, off, 0, PW * S + 20, 4, MX - 10, yT, PW * S + 20, 4);
    g.drawImage(this.boards, 320 - off, 0, PW * S + 20, 4, MX - 10, yB, PW * S + 20, 4);
    g.save();
    g.translate(MX - 14, MY - 10); g.rotate(Math.PI / 2);
    g.drawImage(this.boards, off + 100, 0, PL * S + 20, 4, 0, 0, PL * S + 20, 4);
    g.restore();
    g.save();
    g.translate(MX + PW * S + 10, MY - 10); g.rotate(Math.PI / 2);
    g.drawImage(this.boards, 300 - off, 0, PL * S + 20, 4, 0, 0, PL * S + 20, 4);
    g.restore();
    g.fillStyle = 'rgba(0,0,0,0.35)';
    g.fillRect(MX - 10, yT + 4, PW * S + 20, 1);
    g.fillRect(MX - 10, yB + 4, PW * S + 20, 1);
  }

  drawGoal(g, top, shake, front) {
    const gw = Math.round(7.32 * S), x0 = Math.round(MX + (PW / 2) * S - gw / 2);
    const yLine = top ? MY : MY + PL * S;
    const depth = 9;
    const wob = shake > 0 ? Math.sin(performance.now() / 35) * 2 * shake : 0;
    if (!front) {
      // red (detrás de los jugadores)
      const y0 = top ? yLine - depth : yLine;
      g.fillStyle = 'rgba(20,30,20,0.35)'; g.fillRect(x0, y0, gw, depth);
      for (let x = 0; x <= gw; x++) {
        for (let y = 0; y < depth; y++) {
          const dyy = top ? depth - y : y;
          const bulge = Math.round(wob * Math.sin((x / gw) * Math.PI) * (dyy / depth));
          if ((x + y) % 3 === 0 || (x - y + 30) % 3 === 0) {
            g.fillStyle = `rgba(235,235,235,${0.25 + 0.35 * (dyy / depth)})`;
            g.fillRect(x0 + x, y0 + y + (top ? -bulge : bulge), 1, 1);
          }
        }
      }
      // red lateral y fondo
      g.fillStyle = 'rgba(235,235,235,0.55)';
      g.fillRect(x0, top ? y0 : y0 + depth - 1, gw, 1);
      g.fillRect(x0, y0, 1, depth); g.fillRect(x0 + gw - 1, y0, 1, depth);
      return;
    }
    // palos y travesaño (delante)
    g.fillStyle = 'rgba(0,0,0,0.3)';
    g.fillRect(x0 + 1, yLine + 1, gw, 1);
    g.fillStyle = '#ffffff';
    g.fillRect(x0 - 1, yLine - 1, 2, 3); g.fillRect(x0 + gw - 1, yLine - 1, 2, 3);
    g.fillRect(x0 - 1, yLine - (top ? 1 : 0), gw + 2, 1);
  }

  drawFlags(g, now) {
    for (const [x, y] of [[0, 0], [PW, 0], [0, PL], [PW, PL]]) {
      const [X, Y] = [Math.round(MX + x * S), Math.round(MY + y * S)];
      g.fillStyle = '#e8e8e8'; g.fillRect(X, Y - 7, 1, 7);
      const w = Math.sin(now / 200 + x + y) > 0 ? 0 : 1;
      g.fillStyle = '#f0c419'; g.fillRect(X + (x ? -4 : 1), Y - 7 + w, 4, 2); g.fillRect(X + (x ? -3 : 1), Y - 5 + w, 2, 1);
    }
  }

  // ---------- sprites ----------
  sprite(kit, gk, skin, hair, view, frame) {
    const key = `${kit.shirt}${kit.alt2}${kit.pattern}${kit.shorts}${gk ? kit.gk : ''}|${skin}${hair}|${view}${frame}`;
    let c = this.spriteCache.get(key);
    if (c) return c;
    const isPose = !!POSES[view];
    const rows = isPose ? POSES[view] : [...BODY[view], ...(view === 'jump' ? LEGS.jump[0] : LEGS[view === 'side' ? 'side' : 'front'][frame])];
    c = document.createElement('canvas');
    c.width = rows[0].length; c.height = rows.length;
    const g = c.getContext('2d');
    const shirt = gk ? kit.gk : kit.shirt;
    const alt = gk ? shade(kit.gk, 0.75) : kit.alt2;
    const pattern = gk ? 'plain' : kit.pattern;
    const shorts = gk ? '#222833' : kit.shorts;
    const num = lum(shirt) > 150 ? '#1a1a1a' : '#f4f4f4';
    const socks = gk ? '#222833' : (lum(kit.shorts) > 128 ? kit.shorts : shade(shirt, 0.95));
    for (let r = 0; r < rows.length; r++) {
      for (let col = 0; col < rows[r].length; col++) {
        const ch = rows[r][col];
        if (ch === '.') continue;
        let color;
        switch (ch) {
          case 'h': color = hair; break;
          case 's': color = skin; break;
          case 'S': color = shade(skin, 0.82); break;
          case 'e': color = '#1b1410'; break;
          case 't': case 'T': {
            const altCell = !isPose && view !== 'side' ? isAlt(pattern, r, col) : (pattern === 'stripes' && col % 2 === 0);
            const base = altCell ? alt : shirt;
            color = ch === 'T' ? shade(base, 0.78) : base;
            break;
          }
          case 'n': color = gk ? shade(shirt, 0.7) : num; break;
          case 'p': color = shorts; break;
          case 'P': color = shade(shorts, 0.75); break;
          case 'k': color = socks; break;
          case 'b': color = '#151515'; break;
          case 'g': color = gk ? '#f2f2f2' : skin; break;
          default: color = '#f0f';
        }
        g.fillStyle = color;
        g.fillRect(col, r, 1, 1);
      }
    }
    this.spriteCache.set(key, c);
    return c;
  }

  drawPlayer(g, p, kit, isGK) {
    const [X, Y] = this.px(p.x, p.y);
    const x = Math.round(X), y = Math.round(Y);
    const lift = Math.round((p.z || 0) * S * 0.9);
    this.drawShadow(g, x, y, p.pose || p.dive || p.fallen > 0 ? 11 : 7, lift);

    let facing = p.facing, fx = p.fx;
    if (this.mySide === 1) { facing = -facing; fx = -fx; }
    const flipDir = (d) => (this.mySide === 1 ? -d : d);

    const now = performance.now();
    const cheerHop = p.cheer > 0 && !p.jump ? Math.round(Math.abs(Math.sin(now / 120)) * 3) : 0;
    const kk = this.hdKit(p, kit, isGK);
    const pick = this.hdPick(p, isGK, fx, facing, flipDir, now);
    const hs = this.hdGet(kk, pick.view, pick.key, pick.pose, true);
    if (hs) {
      let dx, dy;
      if (pick.dive != null) {
        // la estirada se ubica por el centro del cuerpo, que baja hasta el pasto
        const q = pick.dive;
        dx = x - hs.c[0];
        dy = y - lerp(9, 3, q) - lift - hs.c[1];
      } else {
        dx = x - (pick.dir < 0 ? hs.cv.width - hs.ox : hs.ox);
        dy = y - hs.oy - lift - cheerHop;
      }
      dx = Math.round(dx); dy = Math.round(dy);
      if (pick.dir < 0) { g.save(); g.translate(dx + hs.cv.width, dy); g.scale(-1, 1); g.drawImage(hs.cv, 0, 0); g.restore(); }
      else g.drawImage(hs.cv, dx, dy);
      return;
    }

    let view, frame = 0, dir = 1, img;
    if (p.dive && p.dive.dir !== 0) { view = 'dive'; dir = flipDir(p.dive.dir); }
    else if (p.pose && p.pose.kind === 'slide') { view = 'slide'; dir = flipDir(p.pose.dir); }
    else if (p.fallen > 0) { view = 'fallen'; dir = fx >= 0 ? 1 : -1; }
    else if (p.jump || p.cheer > 0 || (p.dive && p.dive.dir === 0)) { view = 'jump'; }
    else {
      const moving = Math.hypot(p.vx, p.vy) > 0.5;
      frame = moving ? Math.floor(p.anim * 1.7) % 4 : 0;
      if (Math.abs(fx) > 0.75) { view = 'side'; dir = fx > 0 ? 1 : -1; }
      else view = facing < -0.2 ? 'back' : 'front';
    }
    img = this.sprite(kit, isGK, p.skin, p.hair, view, frame);
    const bob = (view === 'front' || view === 'back' || view === 'side') && (frame === 1 || frame === 3) ? 1 : 0;
    const dx = x - Math.floor(img.width / 2), dy = y - img.height - lift - bob - cheerHop + (POSES[view] ? 1 : 0);
    if (dir < 0) {
      g.save(); g.translate(dx + img.width, dy); g.scale(-1, 1); g.drawImage(img, 0, 0); g.restore();
    } else g.drawImage(img, dx, dy);
  }

  drawRef(g) {
    this.drawPlayer(g, { ...this.ref, skin: '#e0a77c', hair: '#222', fallen: 0, dive: null, pose: null, jump: null, cheer: 0, z: 0, i: 99 },
      { shirt: '#111111', alt2: '#111111', pattern: 'plain', shorts: '#111111' }, false);
  }

  drawBall(g, x, y, z) {
    const X = Math.round(x), Y = Math.round(y);
    const bz = Math.round(z * S * 0.9);
    // sombra: más chica y clara cuanto más alta va
    const sw = Math.max(2, 4 - Math.floor(bz / 10));
    g.fillStyle = `rgba(0,0,0,${Math.max(0.12, 0.38 - bz * 0.01)})`;
    g.fillRect(X - (sw >> 1), Y, sw, 1);
    // la pelota oficial en chico, girando: imágenes guardadas por tamaño y giro
    const r = z > 3 ? 2 : 1.6, spin = (Math.floor(this.ball.spin * 2) % 12) / 2;
    const key = `${r}|${spin}`;
    if (!FAR_BALLS.has(key)) FAR_BALLS.set(key, P4.ball(r, spin));
    const im = FAR_BALLS.get(key);
    g.drawImage(im, X - (im.width >> 1) + 1, Y - im.height + 1 - bz);
  }

  // ---------- luz del día y clima ----------
  // Dos capas del tamaño del estadio, armadas una vez por partido: una que
  // oscurece y tiñe (multiplicar: sombra de la tribuna, atardecer, noche) y otra
  // que ilumina (pantalla: los focos y su reflejo en los charcos).
  buildLight() {
    const { time, weather } = this.day;
    const mk = () => { const c = document.createElement('canvas'); c.width = WW; c.height = WH; return c; };
    const shade = mk(), glow = mk();
    const m = shade.getContext('2d'), l = glow.getContext('2d');
    const gx0 = MX - 10, gy0 = MY - 10, gw = PW * S + 20, gh = PL * S + 20;
    const sun = weather === 'clear' && time !== 'night';
    const night = time === 'night';
    // tono general: tribunas y cancha
    const BASE = LIGHT[time][weather];
    m.fillStyle = BASE[0]; m.fillRect(0, 0, WW, WH);
    m.fillStyle = BASE[1]; m.fillRect(gx0, gy0, gw, gh);
    if (sun) {
      // Sombra dura de la tribuna sobre el pasto: de mañana el sol viene del
      // este (cae a la izquierda), de tarde del oeste, más bajo y más larga.
      const left = time === 'morning';
      const reach = left ? 0.17 : 0.3;
      const col = left ? '#a4b2d2' : '#9f8fbb';
      m.fillStyle = col;
      for (let y = 0; y < WH; y++) {
        // el borde no es recto: las cabeceras y el techo lo quiebran un poco
        const bend = Math.round(Math.sin(y * 0.021) * 3 + (y / WH) * (left ? 6 : -10));
        const edge = Math.round(PW * S * reach) + bend;
        if (left) {
          const x1 = MX + edge;
          m.fillRect(0, y, x1, 1);
          // penumbra de un píxel tramada
          if (y % 2) m.fillRect(x1, y, 1, 1);
        } else {
          const x0 = MX + PW * S - edge;
          m.fillRect(x0, y, WW - x0, 1);
          if (y % 2) m.fillRect(x0 - 1, y, 1, 1);
        }
      }
      if (!left) {
        // el sol de la tarde dora lo que sigue iluminado
        l.fillStyle = 'rgba(70,38,6,0.32)';
        l.fillRect(0, 0, MX + PW * S * (1 - reach), WH);
      }
    }
    if (night) {
      // focos en las cuatro esquinas: manchas de luz cálida sobre el pasto
      const k = weather === 'clear' ? 1 : weather === 'cloudy' ? 0.85 : 0.9;
      const pool = (x, y, r, a) => {
        const gr = l.createRadialGradient(x, y, 0, x, y, r);
        gr.addColorStop(0, `rgba(255,248,214,${a * k})`); gr.addColorStop(0.55, `rgba(255,244,200,${a * 0.45 * k})`); gr.addColorStop(1, 'rgba(255,244,200,0)');
        l.fillStyle = gr; l.fillRect(x - r, y - r, r * 2, r * 2);
      };
      for (const [x, y] of [[MX - 6, MY - 6], [MX + PW * S + 6, MY - 6], [MX - 6, MY + PL * S + 6], [MX + PW * S + 6, MY + PL * S + 6]]) pool(x, y, 150, 0.14);
    }
    if (weather === 'rain') {
      // charcos donde el pasto está gastado: brillan con la luz que haya
      const shine = night ? 'rgba(170,190,235,0.32)' : 'rgba(150,165,190,0.22)';
      const hi = night ? 'rgba(255,248,220,0.55)' : 'rgba(220,230,245,0.4)';
      const spots = [[PW / 2 - 4, 4, 9], [PW / 2 + 5, 6.5, 6], [PW / 2 + 3, PL - 4, 10], [PW / 2 - 6, PL - 6.5, 5], [PW / 2 + 2, PL / 2 + 1, 7], [12, 30, 5], [55, 72, 6]];
      for (const [u, v, w] of spots) {
        const cx = Math.round(MX + u * S), cy = Math.round(MY + v * S), hw = Math.round(w * S / 2);
        for (let dy = -2; dy <= 2; dy++) {
          const span = Math.round(hw * Math.sqrt(1 - (dy / 2.6) ** 2));
          l.fillStyle = shine; l.fillRect(cx - span, cy + dy, span * 2, 1);
        }
        l.fillStyle = hi; l.fillRect(cx - Math.round(hw / 3), cy - 1, Math.round(hw / 2), 1);
      }
    }
    this.shade = shade; this.glow = glow;
    this.gray = weather !== 'clear';
    this.splash = weather === 'rain' ? Array.from({ length: 70 }, () => ({ x: gx0 + Math.random() * gw, y: gy0 + Math.random() * gh, t: Math.random() })) : null;
  }

  applyLight(g, now) {
    if (!this.shade) return;
    g.save();
    if (this.gray) {
      // cielo cubierto: la luz pareja le quita color a todo
      g.globalCompositeOperation = 'saturation';
      g.fillStyle = 'rgba(128,128,128,0.3)'; g.fillRect(0, 0, WW, WH);
    }
    g.globalCompositeOperation = 'multiply';
    g.drawImage(this.shade, 0, 0);
    g.globalCompositeOperation = 'screen';
    g.drawImage(this.glow, 0, 0);
    g.restore();
    if (this.day.time === 'night') {
      // las torres de iluminación en las esquinas del estadio
      for (const [x, y] of [[3, 3], [WW - 11, 3], [3, WH - 7], [WW - 11, WH - 7]]) {
        g.fillStyle = '#1a1d26'; g.fillRect(x - 1, y - 1, 10, 6);
        for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { g.fillStyle = (i + j) % 2 ? '#fff6c8' : '#ffffff'; g.fillRect(x + i * 2, y + j * 2, 1, 1); }
      }
    }
    if (this.splash) {
      // gotas que rebotan en el pasto: una coronita de un instante
      const t = (now || 0) / 1000;
      for (const d of this.splash) {
        const f = (t * 1.7 + d.t) % 1;
        if (f > 0.16) continue;
        if (f < 0.02) { d.x = MX - 10 + Math.random() * (PW * S + 20); d.y = MY - 10 + Math.random() * (PL * S + 20); }
        const x = Math.round(d.x), y = Math.round(d.y);
        g.fillStyle = 'rgba(225,235,250,0.75)';
        if (f < 0.06) g.fillRect(x, y - 1, 1, 1);
        else { g.fillRect(x - 1, y, 1, 1); g.fillRect(x + 1, y, 1, 1); g.fillStyle = 'rgba(225,235,250,0.35)'; g.fillRect(x, y - 1, 1, 1); }
      }
    }
  }

  // La sombra de cada jugador según la luz: de noche, una principal y dos suaves
  // por los focos; con sol, una sola y larga hacia el lado contrario; nublado,
  // apenas una mancha bajo los pies.
  drawShadow(g, x, y, sw, lift) {
    const day = this.day || { time: 'night', weather: 'clear' };
    const sa = Math.max(0.12, 0.3 - lift * 0.02);
    if (day.time === 'night') {
      g.fillStyle = `rgba(0,0,0,${sa})`;
      g.fillRect(x - (sw >> 1), y - 1, sw, 2);
      g.fillStyle = 'rgba(0,0,0,0.08)';
      g.fillRect(x - 6, y, 5, 1); g.fillRect(x + 2, y, 5, 1);
      return;
    }
    if (day.weather !== 'clear') {
      g.fillStyle = `rgba(0,0,0,${sa * 0.75})`;
      g.fillRect(x - (sw >> 1) + 1, y - 1, sw - 2, 2);
      return;
    }
    // sol bajo: de mañana la sombra va hacia el oeste (derecha), de tarde al este
    const dir = day.time === 'morning' ? 1 : -1;
    const len = (day.time === 'morning' ? 7 : 10) + Math.round(lift * 0.6);
    g.fillStyle = `rgba(0,0,0,${sa})`;
    g.fillRect(x - (sw >> 1), y - 1, sw, 2);
    g.fillStyle = `rgba(0,0,0,${sa * 0.8})`;
    if (dir > 0) g.fillRect(x + (sw >> 1), y - 2 + (lift ? 1 : 0), len, 2);
    else g.fillRect(x - (sw >> 1) - len, y - 2 + (lift ? 1 : 0), len, 2);
  }

  // Lluvia sobre la transmisión: tono gris azulado y gotas en diagonal.
  drawRain(c, Wd, Hd, now) {
    c.fillStyle = 'rgba(35,50,80,0.12)'; c.fillRect(0, 0, Wd, Hd);
    if (!this.drops || this.drops.w !== Wd) {
      this.drops = Array.from({ length: Math.round(Wd * Hd / 2600) }, () => ({ x: Math.random(), y: Math.random(), v: 0.8 + Math.random() * 0.6, l: 8 + Math.random() * 10 }));
      this.drops.w = Wd;
    }
    const t = (now || 0) / 1000, u = Math.max(1, Wd / 600);
    c.strokeStyle = 'rgba(215,228,245,0.45)'; c.lineWidth = Math.max(1, u);
    c.beginPath();
    for (const d of this.drops) {
      const y = ((d.y + t * d.v * 1.6) % 1) * (Hd + 40) - 20;
      const x = ((d.x - t * d.v * 0.25) % 1 + 1) % 1 * (Wd + 40) - 20;
      c.moveTo(x, y); c.lineTo(x - d.l * u * 0.3, y + d.l * u);
    }
    c.stroke();
  }

  draw(now) {
    const g = this.wctx;
    if (!this.kits) {
      g.fillStyle = '#1d212b'; g.fillRect(0, 0, WW, WH);
    } else {
      g.drawImage(this.bg, 0, 0);
      this.drawCrowd(g, now);
      if (this.overlay) g.drawImage(this.overlay, 0, 0);
      this.drawBoards(g);
      this.drawFlags(g, now);
      const topShake = this.mySide === 0 ? this.netShake[0] : this.netShake[1];
      const botShake = this.mySide === 0 ? this.netShake[1] : this.netShake[0];
      this.drawGoal(g, true, topShake, false);
      this.drawGoal(g, false, botShake, false);
      // partículas en el piso
      const ents = [];
      for (const t of this.players) for (const p of t) ents.push({ y: this.px(p.x, p.y)[1], d: () => this.drawPlayer(g, p, this.kits[p.side], p.i === 0) });
      ents.push({ y: this.px(this.ref.x, this.ref.y)[1], d: () => this.drawRef(g) });
      const b = this.ball;
      const [bx, by] = this.px(b.x, b.y);
      // la pelota que se conduce se dibuja delante de su dueño, a la altura de los pies
      const oy = b.owner && !b.flight && !b.head ? this.px(b.owner.x, b.owner.y)[1] + 0.2 : -Infinity;
      ents.push({ y: Math.max(by + 0.1, oy), d: () => this.drawBall(g, bx, by, b.z) });
      ents.sort((a, b2) => a.y - b2.y).forEach((e) => e.d());
      // estela de la pelota
      for (const t of this.trail) {
        g.fillStyle = `rgba(255,255,255,${t.a * 0.45})`;
        g.fillRect(Math.round(t.x), Math.round(t.y - t.z - 2), 2, 2);
      }
      for (const p of this.particles) {
        const [qx, qy] = this.px(p.x, p.y);
        g.fillStyle = p.c;
        g.fillRect(Math.round(qx), Math.round(qy - p.z * S * 0.9), p.conf ? 2 : 1, p.conf ? (Math.sin(p.life * 12) > 0 ? 2 : 1) : 1);
      }
      this.drawGoal(g, true, topShake, true);
      this.drawGoal(g, false, botShake, true);
      // indicador del portador
      if (b.owner && !b.flight) {
        const [ox, oy] = this.px(b.owner.x, b.owner.y);
        const bob = Math.sin(now / 150) > 0 ? 0 : 1;
        const X = Math.round(ox), Y = Math.round(oy) - 20 + bob - Math.round(b.owner.z * S * 0.9);
        g.fillStyle = '#000'; g.fillRect(X - 3, Y - 1, 7, 4);
        g.fillStyle = b.owner.side === this.mySide ? '#ffe14a' : '#ffffff';
        g.fillRect(X - 2, Y, 5, 1); g.fillRect(X - 1, Y + 1, 3, 1); g.fillRect(X, Y + 2, 1, 1);
      }
      this.applyLight(g, now);
      if (this.flash > 0) { g.fillStyle = `rgba(255,255,255,${this.flash * 0.5})`; g.fillRect(0, 0, WW, WH); }
    }
    // cámara
    const c = this.ctx, Wd = this.cv.width, Hd = this.cv.height;
    c.imageSmoothingEnabled = false;
    c.fillStyle = '#1d212b'; c.fillRect(0, 0, Wd, Hd);
    const base = Math.min(Wd / WW, Hd / WH);
    const sc = base * this.cam.zoom;
    const vw = Wd / sc, vh = Hd / sc;
    let cx = vw >= WW ? WW / 2 : clamp(this.cam.x, vw / 2, WW - vw / 2);
    let cy = vh >= WH ? WH / 2 : clamp(this.cam.y, vh / 2, WH - vh / 2);
    if (this.cam.shake > 0) { cx += (Math.random() - 0.5) * this.cam.shake * 3; cy += (Math.random() - 0.5) * this.cam.shake * 3; }
    c.drawImage(this.world, cx - vw / 2, cy - vh / 2, vw, vh, 0, 0, Wd, Hd);
    // viñeta suave de transmisión
    if (!this.vignette) {
      const v = document.createElement('canvas'); v.width = Wd; v.height = Hd;
      const vg = v.getContext('2d');
      const grd = vg.createRadialGradient(Wd / 2, Hd / 2, Math.min(Wd, Hd) * 0.35, Wd / 2, Hd / 2, Math.max(Wd, Hd) * 0.75);
      grd.addColorStop(0, 'rgba(0,0,0,0)'); grd.addColorStop(1, 'rgba(0,0,0,0.38)');
      vg.fillStyle = grd; vg.fillRect(0, 0, Wd, Hd);
      this.vignette = v;
    }
    c.drawImage(this.vignette, 0, 0);
    if (this.cut) this.cut.rain = !!this.rain;
    if (this.rain) this.drawRain(c, Wd, Hd, now);
    if (this.ts < 0.8) {
      // tono de repetición en cámara lenta
      c.fillStyle = `rgba(20,30,60,${(0.8 - this.ts) * 0.22})`;
      c.fillRect(0, 0, Wd, Hd);
    }
  }
}
