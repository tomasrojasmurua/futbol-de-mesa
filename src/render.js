// Motor visual: estadio pixelado, 22 jugadores con IA de posicionamiento,
// pelota con altura y estela, cámara de TV con cámara lenta, partículas y
// guiones animados para cada jugada (con un momento de suspenso antes de
// revelar quién ganó el duelo).
import { hexRgb } from './teams.js';
import { playerName } from './squads.js';
import { Cutscene, text as pxText, textW as pxTextW } from './cutscene.js';
import { stadiumFor } from './stadiums.js';

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

  setup(teams, kits, mySide) {
    this.teams = teams;
    this.kits = kits;
    this.mySide = mySide;
    this.spriteCache.clear();
    this.stadium = stadiumFor(teams[0].id);
    this.noCrowd = [];
    this.bg = this.buildBackground();
    this.overlay = this.buildOverlay();
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
          ov: null, lock: null, boost: 1, fallen: 0, dive: null, pose: null, jump: null, cheer: 0,
        };
      });
    }
    this.ball.owner = null;
    this.ball.x = 34; this.ball.y = 52.5; this.ball.z = 0;
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
    this.ts = lerp(this.ts, this.tsTarget, Math.min(1, real * 7));
    this.update(real * this.ts, real);
    if (this.cv.clientWidth) this.resize();
    this.draw(now);
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
    for (const team of this.players) for (const p of team) this.movePlayer(p, dt);
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
    } else if (b.owner) {
      const p = b.owner;
      if (b.head) { b.x = p.x; b.y = p.y; b.z = 2.1 + p.z; }
      else {
        const sp = Math.hypot(p.vx, p.vy);
        const dx = sp > 0.3 ? p.vx / sp : p.fx, dy = sp > 0.3 ? p.vy / sp : p.facing;
        b.x = lerp(b.x, p.x + dx * 0.75, Math.min(1, dt * 18));
        b.y = lerp(b.y, p.y + dy * 0.75, Math.min(1, dt * 18));
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
          v = bv < 25 ? 4.5 : 2.5;
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
    else {
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
    this.ball.owner = p; this.ball.flight = null; this.ball.head = false;
    this.possSide = p.side;
  }

  clearOverrides() {
    for (const t of this.players) for (const p of t) { p.ov = null; p.boost = 1; }
  }

  // Mueve a un jugador por un camino fijo (sirve para coreografías exactas).
  moveTo(p, to, dur, opts = {}) {
    p.ov = null;
    p.lock = { from: [p.x, p.y], to, t: 0, dur, ...opts };
  }

  launch(to, { dur = 0.8, h = 0.4, z1 = 0, ground } = {}) {
    const b = this.ball;
    b.owner = null; b.head = false;
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
    this.ui.reveal(ev);
  }

  async pass(side, uv, { dur = 0.8, h = 0.4, recv = null, z1 = 0 } = {}) {
    const to = this.W(side, uv[0], uv[1]);
    const passer = this.ball.owner;
    const r = recv || this.nearest(side, to[0], to[1], true, passer ? [passer] : []);
    r.ov = to; r.boost = 1.5;
    this.launch(to, { dur, h, z1 });
    this.ui.sound('kick');
    await this.wait(dur);
    const d = Math.hypot(r.x - to[0], r.y - to[1]);
    if (d > 1.2) await this.wait(Math.min(0.6, d / 9));
    r.ov = null; r.boost = 1;
    r.x = lerp(r.x, to[0], 0.7); r.y = lerp(r.y, to[1], 0.7);
    this.give(r);
    return r;
  }

  async dribble(side, uv, dur = 1, zig = 0) {
    const p = this.ball.owner;
    if (!p) return;
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
    const r = recv || this.nearest(A, to[0], to[1], true, passer ? [passer] : []);
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

  placeTeam(side, fn) {
    for (const p of this.players[side]) {
      const [u, v] = fn(p);
      [p.x, p.y] = this.W(side, u, v);
      p.tx = p.x; p.ty = p.y; p.vx = p.vy = 0; p.ov = null; p.lock = null; p.dive = null; p.fallen = 0; p.pose = null; p.jump = null; p.z = 0; p.cheer = 0;
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

  async kickoff(side) { await this.fade(() => this.kickoffNow(side)); }

  async setCorner(A, laneSide) {
    await this.fade(() => {
      const cu = laneSide === 'L' ? 0.8 : 67.2;
      this.placeTeam(A, (p) => {
        if (p.i === 0) return [34, 30];
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
      this.ball.z = 0; this.ball.flight = null; this.ball.head = false;
      this.focus = [null, null]; this.defStyle = [null, null];
      this.cam.tzoom = 1.6;
      this.hold = 'corner';
    });
  }

  async setPenalty(A) {
    const shooter = this.ball.owner && this.ball.owner.side === A && this.ball.owner.i !== 0 ? this.ball.owner : this.byNum(A, 9);
    await this.fade(() => {
      // Todos fuera del área y de la medialuna (a más de 9,15 m del punto penal).
      let k = 0;
      this.placeTeam(A, (p) => (p === shooter ? [34, 90.5] : p.i === 0 ? [34, 30] : [10 + ((k++) * 5.2), 82 + (p.i % 2) * 1.5]));
      let j = 0;
      this.placeTeam(1 - A, (p) => (p.i === 0 ? [34, 0.6] : [13 + ((j++) * 4.6), 21.5 + (p.i % 2) * 1.5]));
      this.give(shooter);
      [this.ball.x, this.ball.y] = this.W(A, 34, 94);
      this.ball.z = 0; this.ball.flight = null; this.ball.head = false;
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
    await this.ui.dice(ev.dice, ev.diceText, ev.diceFaces, ev.diceTitle);
  }

  async counterRun(ev, newA) {
    this.ui.banner('¡CONTRAGOLPE!', { small: true });
    this.cam.tzoom = 1.35;
    const lane = LANE_U[ev.laneAfter || 'C'];
    const [, v] = this.ballUV(newA);
    await this.dribble(newA, [lerp(this.ballUV(newA)[0], lane, 0.5), Math.min(v + 8, 60)], 0.7);
    await this.pass(newA, [lane, Math.min(v + 26, 70)], { dur: 1.0, h: 3 });
    await this.dribble(newA, [lane, 73], 0.6);
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
      this.ui.sound('whistle');
      await this.ui.banner('¡PENAL!', {});
      await this.setPenalty(A);
      return true;
    }
    return false;
  }

  async playBuild(ev, A, D) {
    this.cam.tzoom = 1.3; this.cam.follow = null;
    this.possSide = A;
    this.ensureOwner(A);
    const lane = LANE_U[ev.att];
    this.focus[D] = 68 - LANE_U[ev.def];
    const [cu0, cv] = this.ballUV(A);
    void cu0;
    const v1 = clamp(cv + 6, 26, 46);
    await this.pass(A, [lerp(34, lane, 0.35) + rnd(-3, 3), v1], { dur: cv < 15 ? 1.0 : 0.75, h: cv < 15 ? 1.8 : 0.3 });
    await this.dribble(A, [lerp(this.ballUV(A)[0], lane, 0.55), v1 + 6], 0.8);
    // El pase decisivo: largo por la banda o raso por el medio.
    const long = ev.att !== 'C';
    this.cam.tzoom = 1.4;
    const winner = await this.duelPass(ev, A, [clamp(lane + rnd(-2, 2), 5, 63), 66], {
      h: long ? 3.4 : 0.3, dur: long ? 1.3 : 1.0, defWins: ev.match, style: long ? 'header' : 'slide',
    });
    if (!ev.match) { await this.dribble(A, [lane, 73], 0.7); return; }
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
    const fw = this.players[A].slice(9);
    if (ev.att === 'cross') {
      const wingU = ev.lane === 'R' ? 62 : ev.lane === 'L' ? 6 : (Math.random() < 0.5 ? 6 : 62);
      const target = [wingU < 34 ? 38 : 30, 95.5];
      const runner = wingU < 34 ? fw[1] : fw[0];
      fw[0].ov = this.W(A, wingU < 34 ? 30 : 38, 92); fw[1].ov = this.W(A, wingU < 34 ? 37 : 31, 90);
      await this.dribble(A, [wingU, 86], 1.1);
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
      const [cu] = this.ballUV(A);
      await this.dribble(A, [lerp(cu, 34, 0.5), 74], 0.7);
      const runU = 34 + (lane < 34 ? -5 : lane > 34 ? 5 : rnd(-4, 4));
      fw[0].ov = this.W(A, runU, 84); fw[0].boost = 1.4;
      await this.wait(0.2);
      this.cam.tzoom = 1.6;
      await this.duelPass(ev, A, [runU, 89], { h: 0.25, dur: 1.0, defWins: ev.match, style: 'slide', recv: fw[0] });
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
    // Gambeta
    const [cu] = this.ballUV(A);
    const endU = clamp(lerp(cu, 34, 0.7) + rnd(-4, 4), 24, 44);
    await this.dribble(A, [lerp(cu, endU, 0.4), 80], 0.8, 1);
    this.cam.tzoom = 1.65;
    await this.duelDribble(ev, A, [endU, 89], { defWins: ev.match });
    if (!ev.match) {
      await this.diceMoment(ev);
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
    return { name: playerName(team.id, p.i), num: NUMS[p.i], team: team.short, skin: p.skin, hair: p.hair };
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
      this.moveTo(shooter, this.W(A, su, sv + 2.6), 0.8, { linear: true });
      this.ball.owner = null;
      await this.wait(0.8);
      this.ball.owner = shooter;
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
    this.ui.banner(ev.outcome === 'post' ? '¡AL PALO!' : '¡AFUERA!', { small: true });
    await this.wait(0.7);
    await this.diceMoment(ev);
    await this.goalKick(D);
  }

  // Un penal de la tanda: el resto de los jugadores mira desde el círculo central.
  async playShootout(ev, A, D) {
    const shooter = this.players[A].find((p) => p.i === ev.shooter) || this.players[A][9];
    const keeper = this.players[D][0];
    await this.fade(() => {
      let k = 0;
      this.placeTeam(A, (p) => (p === shooter ? [34, 92] : p.i === 0 ? [30, 50] : [26 + ((k++) % 5) * 2.2, 51.5 + Math.floor(k / 6) * 1.6]));
      let j = 0;
      this.placeTeam(D, (p) => (p.i === 0 ? [34, 0.6] : [36 + ((j++) % 5) * 2.2, 52 + Math.floor(j / 6) * 1.6]));
      for (const team of this.players) for (const p of team) if (p !== shooter) { p.ov = [p.x, p.y]; p.boost = 0.5; }
      this.give(shooter);
      [this.ball.x, this.ball.y] = this.W(A, 34, 94);
      this.focus = [null, null]; this.defStyle = [null, null];
      this.cam.tzoom = 1.8; this.cam.follow = null;
    });
    this.possSide = A;
    this.lastShooter = this.playerInfo(shooter);
    this.lastKeeper = this.playerInfo(keeper);
    await this.wait(0.4);
    await this.shotScene(ev, A, D, shooter, keeper);
    const b = this.ball;
    b.owner = null; b.flight = null;
    const tu = GOAL_U[ev.att];
    const to = ev.match ? [tu, 104.5] : ev.outcome === 'goal' ? [tu, 106.6] : ev.outcome === 'post' ? [ev.att === 'R' ? 41 : 27, 101] : [tu < 34 ? 28.6 : tu > 34 ? 39.4 : 34, 109.5];
    [b.x, b.y] = this.W(A, to[0], to[1]); b.z = 0;
    this.reveal(ev);
    if (ev.outcome === 'goal') {
      const gi = this.W(A, 34, 105)[1] < 50 ? 0 : 1;
      this.netShake[gi] = 1;
      this.crowdJump = { side: A, t: 2 };
      shooter.cheer = 2;
      this.ui.banner('¡GOL!', { small: true });
    } else {
      if (ev.match) this.give(keeper);
      keeper.cheer = ev.match ? 2 : 0;
      this.ui.banner(ev.match ? '¡ATAJADO!' : ev.outcome === 'post' ? '¡AL PALO!' : '¡AFUERA!', { small: true });
    }
    await this.wait(1.2);
  }

  async shotScene(ev, A, D, shooter, keeper) {
    if (!this.cut) return;
    ev._scene = true;
    const sh = this.lastShooter, kp = this.lastKeeper;
    await this.ui.fadeOut();
    const scene = this.cut.play({
      // Si el arquero adivinó, la escena siempre la muestra en sus manos: el dado
      // decide después (se le escapa, la saca al córner o sale de contra).
      kind: ev.shotKind, att: ev.att, def: ev.def, match: ev.match, outcome: ev.match ? 'save' : ev.outcome,
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
    const [tu] = this.U(A, taker.x, taker.y);
    const left = tu < 34;
    const T = { near: [left ? 31 : 37, 100.5], spot: [34, 94], far: [left ? 38.5 : 29.5, 99.5] }[ev.att];
    const runner = this.nearest(A, ...this.W(A, T[0], T[1]), true, [taker]);
    const marker = this.nearest(D, ...this.W(A, T[0], T[1]), true);
    await this.wait(0.4);
    await this.duelPass(ev, A, T, { h: 5.5, dur: 1.3, defWins: ev.match, style: 'header', recv: runner, def: marker });
    if (!ev.match) return;
    const clearTo = [T[0] + rnd(-10, 10), 76];
    const rec = this.nearest(D, ...this.W(A, clearTo[0], clearTo[1]), true);
    rec.ov = this.W(A, clearTo[0], clearTo[1]);
    this.ball.owner = null;
    this.launch(this.W(A, clearTo[0], clearTo[1]), { dur: 1.0, h: 4 });
    await this.wait(1.0);
    rec.ov = null;
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
    if (st.features.includes('ring')) {
      g.strokeStyle = '#f4f6f8'; g.lineWidth = 2;
      g.beginPath(); g.ellipse(WW / 2, WH / 2, WW / 2 - 6, WH / 2 - 6, 0, 0, Math.PI * 2); g.stroke();
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
    // sombras (una principal y dos suaves por los focos)
    const sw = p.pose || p.dive || p.fallen > 0 ? 11 : 7;
    const sa = Math.max(0.12, 0.3 - lift * 0.02);
    g.fillStyle = `rgba(0,0,0,${sa})`;
    g.fillRect(x - (sw >> 1), y - 1, sw, 2);
    g.fillStyle = 'rgba(0,0,0,0.08)';
    g.fillRect(x - 6, y, 5, 1); g.fillRect(x + 2, y, 5, 1);

    let facing = p.facing, fx = p.fx;
    if (this.mySide === 1) { facing = -facing; fx = -fx; }
    const flipDir = (d) => (this.mySide === 1 ? -d : d);

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
    const cheerHop = p.cheer > 0 && !p.jump ? Math.round(Math.abs(Math.sin(performance.now() / 120)) * 3) : 0;
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
    const big = z > 3;
    const sz = big ? 4 : 3;
    const bx = X - 1, by = Y - sz - bz;
    g.fillStyle = '#d8d8d8'; g.fillRect(bx, by, sz, sz);
    g.fillStyle = '#ffffff'; g.fillRect(bx, by, sz - 1, sz - 1);
    const f = Math.floor(this.ball.spin) % 3;
    g.fillStyle = '#2a2a2a';
    g.fillRect(bx + (f === 0 ? 1 : f === 1 ? 0 : sz - 2), by + (f === 2 ? 0 : 1), 1, 1);
  }

  // Lluvia sobre la transmisión: tono gris azulado y gotas en diagonal.
  drawRain(c, Wd, Hd, now) {
    c.fillStyle = 'rgba(35,50,80,0.3)'; c.fillRect(0, 0, Wd, Hd);
    if (!this.drops || this.drops.w !== Wd) {
      this.drops = Array.from({ length: Math.round(Wd * Hd / 1600) }, () => ({ x: Math.random(), y: Math.random(), v: 0.8 + Math.random() * 0.6, l: 8 + Math.random() * 10 }));
      this.drops.w = Wd;
    }
    const t = (now || 0) / 1000, u = Math.max(1, Wd / 600);
    c.strokeStyle = 'rgba(215,228,245,0.7)'; c.lineWidth = Math.max(1.2, u * 1.3);
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
      ents.push({ y: by + 0.1, d: () => this.drawBall(g, bx, by, b.z) });
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
