// Motor visual: cancha pixelada, 22 jugadores con IA de posicionamiento,
// pelota con altura, cámara de TV y guiones animados para cada jugada.

const PW = 68, PL = 105;          // cancha en metros
const S = 3;                       // píxeles por metro (resolución interna)
const MX = 14, MY = 22;            // tribunas alrededor
export const WW = PW * S + MX * 2; // 232
export const WH = PL * S + MY * 2; // 359

const LANE_U = { L: 12, C: 34, R: 56 };
const GOAL_U = { L: 31.4, C: 34, R: 36.6 };

const FORMATION = [
  [34, 4],
  [8, 20], [25, 16], [43, 16], [60, 20],
  [9, 38], [27, 34], [41, 34], [59, 38],
  [29, 52], [39, 50],
];
const ROW = (i) => (i === 0 ? 'G' : i <= 4 ? 'D' : i <= 8 ? 'M' : 'F');

const SKINS = ['#f1c7a0', '#e0a77c', '#c68657', '#9c6440', '#6e4428', '#f5d3b5'];
const HAIRS = ['#2a1a10', '#4a2e18', '#111111', '#7a5530', '#d9b25a', '#1c1c1c', '#5b3a1e'];

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => t * t * (3 - 2 * t);
const rnd = (a, b) => a + Math.random() * (b - a);

function seeded(n) {
  let x = Math.sin(n * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

export class Renderer {
  constructor(canvas, ui) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d');
    this.ui = ui;
    this.world = document.createElement('canvas');
    this.world.width = WW; this.world.height = WH;
    this.wctx = this.world.getContext('2d');
    this.pitch = this.buildPitch();
    this.mySide = 0;
    this.kits = null;
    this.players = [[], []];
    this.ball = { x: 34, y: 52.5, z: 0, owner: null, flight: null, head: false, spin: 0 };
    this.ref = { x: 30, y: 60, vx: 0, vy: 0, anim: 0, facing: 1 };
    this.possSide = 0;
    this.focus = [null, null];
    this.defStyle = [null, null];
    this.cam = { x: WW / 2, y: WH / 2, zoom: 1, tzoom: 1, follow: null };
    this.timers = [];
    this.netShake = [0, 0];
    this.crowd = [];
    this.crowdJump = { side: -1, t: 0 };
    this.celebrate = null;
    this.flash = 0;
    this.last = performance.now();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    requestAnimationFrame((t) => this.loop(t));
  }

  // ---------- coordenadas ----------
  // Marco de equipo (u: izquierda→derecha, v: arco propio→arco rival) a mundo.
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
    this.buildCrowd();
    for (let s = 0; s < 2; s++) {
      this.players[s] = FORMATION.map(([u, v], i) => {
        const [x, y] = this.W(s, u, Math.min(v, 48));
        const seed = s * 31 + i * 7 + teams[s].id.length * 13;
        return {
          side: s, i, x, y, vx: 0, vy: 0, tx: x, ty: y, anim: 0, facing: s === 0 ? -1 : 1, fx: 0,
          skin: SKINS[Math.floor(seeded(seed) * SKINS.length)],
          hair: HAIRS[Math.floor(seeded(seed + 3) * HAIRS.length)],
          ov: null, lock: null, boost: 1, fallen: 0, dive: null,
        };
      });
    }
    this.ball.owner = null;
    this.ball.x = 34; this.ball.y = 52.5; this.ball.z = 0;
  }

  resize() {
    const r = this.cv.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    this.cv.width = Math.max(1, Math.round(r.width * dpr));
    this.cv.height = Math.max(1, Math.round(r.height * dpr));
    this.ctx.imageSmoothingEnabled = false;
  }

  // ---------- tiempo ----------
  wait(sec) { return new Promise((res) => this.timers.push({ t: sec, res })); }

  loop(now) {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.update(dt);
    this.draw(now);
    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    for (const tm of this.timers) tm.t -= dt;
    const done = this.timers.filter((t) => t.t <= 0);
    this.timers = this.timers.filter((t) => t.t > 0);
    done.forEach((t) => t.res());
    if (!this.kits) return;

    this.updateBall(dt);
    this.computeTargets();
    for (const team of this.players) for (const p of team) this.movePlayer(p, dt);
    this.moveRef(dt);
    this.netShake = this.netShake.map((n) => Math.max(0, n - dt));
    this.flash = Math.max(0, this.flash - dt);
    if (this.crowdJump.t > 0) this.crowdJump.t -= dt;

    // Cámara
    const target = this.cam.follow || this.ball;
    const [bx, by] = this.px(target.x, target.y - (this.cam.follow ? 0 : this.ball.z * 0.5));
    const k = Math.min(1, dt * 3);
    this.cam.x = lerp(this.cam.x, bx, k);
    this.cam.y = lerp(this.cam.y, by, k);
    this.cam.zoom = lerp(this.cam.zoom, this.cam.tzoom, Math.min(1, dt * 2));
  }

  updateBall(dt) {
    const b = this.ball;
    if (b.flight) {
      const f = b.flight;
      f.t += dt;
      const t = clamp(f.t / f.dur, 0, 1);
      const tt = f.ground ? 1 - (1 - t) * (1 - t) : t; // rodando, la pelota frena
      b.x = lerp(f.from[0], f.to[0], tt);
      b.y = lerp(f.from[1], f.to[1], tt);
      b.z = lerp(f.z0 || 0, f.z1 || 0, t) + 4 * f.h * t * (1 - t);
      b.spin += dt * 20;
      if (t >= 1) { b.flight = null; f.done && f.done(); }
    } else if (b.owner) {
      const p = b.owner;
      if (b.head) { b.x = p.x; b.y = p.y; b.z = 2.1; }
      else {
        const sp = Math.hypot(p.vx, p.vy);
        const dx = sp > 0.3 ? p.vx / sp : p.fx, dy = sp > 0.3 ? p.vy / sp : p.facing;
        b.x = lerp(b.x, p.x + dx * 0.8, Math.min(1, dt * 18));
        b.y = lerp(b.y, p.y + dy * 0.8, Math.min(1, dt * 18));
        b.z = 0;
        b.spin += sp * dt * 3;
      }
    }
  }

  computeTargets() {
    const b = this.ball;
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
          // Pequeño vaivén para que nunca estén quietos del todo.
          const wob = Math.sin(performance.now() / 900 + p.i * 1.7 + s * 3) * 0.9;
          u += wob; v += Math.cos(performance.now() / 1100 + p.i) * 0.6;
        }
        u = clamp(u, 1.5, 66.5); v = clamp(v, 1.5, 103.5);
        [p.tx, p.ty] = this.W(s, u, v);
      }
      // Marca en zona defensiva y presión al portador.
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
    // El portador espera con la pelota si nadie le dice qué hacer.
    const o = b.owner;
    if (o && !o.lock && !o.ov) { o.tx = o.x; o.ty = o.y; }
  }

  movePlayer(p, dt) {
    if (p.fallen > 0) { p.fallen -= dt; p.vx *= 0.9; p.vy *= 0.9; p.x += p.vx * dt; p.y += p.vy * dt; return; }
    if (p.dive) {
      const d = p.dive;
      d.t += dt;
      const t = clamp(d.t / d.dur, 0, 1);
      p.x = lerp(d.from[0], d.to[0], ease(t));
      p.y = lerp(d.from[1], d.to[1], ease(t));
      if (d.t > d.dur + d.hold) { p.dive = null; p.vx = p.vy = 0; }
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
      p.vx = (x - p.x) / Math.max(dt, 1e-3); p.vy = (y - p.y) / Math.max(dt, 1e-3);
      p.x = x; p.y = y;
      this.faceFromVel(p);
      p.anim += Math.hypot(p.vx, p.vy) * dt * 0.9;
      if (t >= 1) { p.lock = null; L.done && L.done(); }
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
      // mira hacia la pelota
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

  // ---------- acciones del guion ----------
  give(p) {
    this.ball.owner = p; this.ball.flight = null; this.ball.head = false;
    this.possSide = p.side;
  }

  clearOverrides() {
    for (const t of this.players) for (const p of t) { p.ov = null; p.boost = 1; }
  }

  // Pase a un punto (marco del equipo `side`). Devuelve el receptor.
  async pass(side, uv, { dur = 0.8, h = 0.4, recv = null, z1 = 0 } = {}) {
    const b = this.ball;
    const to = this.W(side, uv[0], uv[1]);
    const passer = b.owner;
    const r = recv || this.nearest(side, to[0], to[1], true, passer ? [passer] : []);
    r.ov = to; r.boost = 1.5;
    b.owner = null; b.head = false;
    b.flight = { from: [b.x, b.y], to, t: 0, dur, h, z0: b.z, z1, ground: h < 0.5 };
    this.ui.sound('kick');
    await this.wait(dur);
    // Si el receptor no llegó, lo "acerca" un poco para no ver saltos raros.
    const d = Math.hypot(r.x - to[0], r.y - to[1]);
    if (d > 1.2) await this.wait(Math.min(0.7, d / 9));
    r.ov = null; r.boost = 1;
    r.x = lerp(r.x, to[0], 0.7); r.y = lerp(r.y, to[1], 0.7);
    this.give(r);
    return r;
  }

  // Pase interceptado por un rival que corre hacia la línea de pase.
  async intercept(side, uv, { dur = 0.8, h = 0.3, at = 0.55 } = {}) {
    const b = this.ball;
    const to = this.W(side, uv[0], uv[1]);
    const mid = [lerp(b.x, to[0], at), lerp(b.y, to[1], at)];
    const cut = this.nearest(1 - side, mid[0], mid[1], true);
    cut.ov = mid; cut.boost = 1.7;
    b.owner = null;
    b.flight = { from: [b.x, b.y], to: mid, t: 0, dur: dur * at, h, z0: b.z, ground: h < 0.5 };
    this.ui.sound('kick');
    await this.wait(dur * at);
    cut.ov = null; cut.boost = 1;
    cut.x = lerp(cut.x, mid[0], 0.8); cut.y = lerp(cut.y, mid[1], 0.8);
    this.give(cut);
    return cut;
  }

  async dribble(side, uv, dur = 1, zig = 0) {
    const p = this.ball.owner;
    if (!p) return;
    const to = this.W(side, uv[0], uv[1]);
    p.lock = { from: [p.x, p.y], to, t: 0, dur, zig };
    await this.wait(dur);
  }

  // El rival más cercano entra al cruce y se queda con la pelota.
  async tackle(defSide, { dur = 0.45, fall = true } = {}) {
    const b = this.ball;
    const victim = b.owner;
    const t = this.nearest(defSide, b.x, b.y, true);
    t.ov = [b.x, b.y]; t.boost = 1.8;
    await this.wait(dur);
    t.ov = null; t.boost = 1;
    t.x = lerp(t.x, b.x, 0.8); t.y = lerp(t.y, b.y, 0.8);
    this.ui.sound('tackle');
    if (victim && fall) { victim.fallen = 0.9; victim.lock = null; }
    this.give(t);
    return t;
  }

  async ballOut(side, uv, { dur = 0.8, h = 2 } = {}) {
    const b = this.ball;
    b.owner = null; b.head = false;
    const to = this.W(side, uv[0], uv[1]);
    b.flight = { from: [b.x, b.y], to, t: 0, dur, h, z0: b.z };
    this.ui.sound('kick');
    await this.wait(dur);
  }

  keeperDive(side, lane, dur = 0.42) {
    const k = this.players[side][0];
    // `lane` viene en el marco del atacante; el arquero está en el arco rival.
    const att = 1 - side;
    const u = GOAL_U[lane];
    const to = this.W(att, lane === 'C' ? 34 : u + (lane === 'L' ? -1.2 : 1.2), 104.2);
    k.ov = null; k.lock = null;
    k.dive = { from: [k.x, k.y], to, t: 0, dur, hold: 0.9, dir: lane === 'C' ? 0 : (to[0] < k.x ? -1 : 1) };
  }

  async fade(fn) {
    await this.ui.fadeOut();
    fn();
    this.cam.x = this.px(this.ball.x, this.ball.y)[0];
    this.cam.y = this.px(this.ball.x, this.ball.y)[1];
    await this.ui.fadeIn();
  }

  placeTeam(side, fn) {
    for (const p of this.players[side]) {
      const [u, v] = fn(p);
      [p.x, p.y] = this.W(side, u, v);
      p.tx = p.x; p.ty = p.y; p.vx = p.vy = 0; p.ov = null; p.lock = null; p.dive = null; p.fallen = 0;
    }
  }

  kickoffNow(side) {
    for (let s = 0; s < 2; s++) {
      this.placeTeam(s, (p) => {
        const [u, v] = FORMATION[p.i];
        if (s === side && p.i === 9) return [33, 52];
        if (s === side && p.i === 10) return [37.5, 51];
        return [u, Math.min(v * 0.92, s === side ? 49 : 42)];
      });
    }
    this.focus = [null, null]; this.defStyle = [null, null];
    this.give(this.players[side][9]);
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
      const taker = this.players[A][laneSide === 'L' ? 5 : 8];
      this.give(taker);
      [this.ball.x, this.ball.y] = this.W(A, cu, 104.4);
      this.focus = [null, null]; this.defStyle = [null, null];
      this.cam.tzoom = 1.5;
    });
  }

  async setPenalty(A) {
    const shooter = this.ball.owner && this.ball.owner.side === A ? this.ball.owner : this.players[A][9];
    await this.fade(() => {
      let k = 0;
      this.placeTeam(A, (p) => (p === shooter ? [34, 90.5] : p.i === 0 ? [34, 30] : [10 + ((k++) * 5.2), 83 + (p.i % 2) * 2]));
      let j = 0;
      this.placeTeam(1 - A, (p) => (p.i === 0 ? [34, 0.6] : [13 + ((j++) * 4.6), 18.5 + (p.i % 2) * 1.5]));
      this.give(shooter);
      [this.ball.x, this.ball.y] = this.W(A, 34, 94);
      this.focus = [null, null]; this.defStyle = [null, null];
      this.cam.tzoom = 1.6;
    });
  }

  async goalKick(D) {
    await this.fade(() => {
      const k = this.players[D][0];
      [k.x, k.y] = this.W(D, 34, 5.5);
      k.dive = null; k.ov = null;
      this.give(k);
      [this.ball.x, this.ball.y] = this.W(D, 34, 6.3);
      this.focus = [null, null]; this.defStyle = [null, null];
      this.cam.tzoom = 1;
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
    const A = ev.poss, D = 1 - A;
    if (ev.situation === 'build') await this.playBuild(ev, A, D);
    else if (ev.situation === 'attack') await this.playAttack(ev, A, D);
    else if (ev.situation === 'shot' || ev.situation === 'penalty') await this.playShot(ev, A, D);
    else if (ev.situation === 'corner') await this.playCorner(ev, A, D);
    this.clearOverrides();
  }

  async diceMoment(ev) {
    if (ev.dice != null) await this.ui.dice(ev.dice, ev.diceText);
  }

  async counterRun(ev, newA) {
    this.ui.banner('¡CONTRAGOLPE!', { small: true });
    this.cam.tzoom = 1.25;
    const lane = LANE_U[ev.laneAfter || 'C'];
    const [, v] = this.ballUV(newA);
    await this.dribble(newA, [lerp(this.ballUV(newA)[0], lane, 0.5), Math.min(v + 8, 60)], 0.7);
    await this.pass(newA, [lane, Math.min(v + 26, 70)], { dur: 0.9, h: 2.2 });
    await this.dribble(newA, [lane, 73], 0.6);
  }

  async playBuild(ev, A, D) {
    this.cam.tzoom = 1.25; this.cam.follow = null;
    this.possSide = A;
    this.ensureOwner(A);
    const lane = LANE_U[ev.att];
    this.focus[D] = 68 - LANE_U[ev.def];
    const [, cv] = this.ballUV(A);
    const v1 = clamp(cv + 6, 26, 46);
    await this.pass(A, [lerp(34, lane, 0.35) + rnd(-3, 3), v1], { dur: cv < 15 ? 1.0 : 0.75, h: cv < 15 ? 1.6 : 0.3 });
    await this.dribble(A, [lerp(this.ballUV(A)[0], lane, 0.55), v1 + 7], 0.9);
    if (ev.outcome === 'advance') {
      this.cam.tzoom = 1.3;
      const r = await this.pass(A, [lane + rnd(-2, 2), 66], { dur: 1.0, h: ev.att === 'C' ? 0.35 : 2.4 });
      void r;
      await this.dribble(A, [lane, 73], 0.8);
      return;
    }
    // El rival leyó la jugada: duelo y dado.
    const [cu, cv2] = this.ballUV(A);
    const lock = this.dribble(A, [lerp(cu, lane, 0.5), cv2 + 5], 0.7);
    const presser = this.nearest(D, this.ball.x, this.ball.y, true);
    presser.ov = [this.ball.x, this.ball.y]; presser.boost = 1.6;
    await lock;
    await this.diceMoment(ev);
    if (ev.outcome === 'foul') {
      presser.ov = null; presser.boost = 1;
      const victim = this.ball.owner;
      victim.fallen = 1.1;
      this.ui.sound('whistle');
      this.ui.banner('FALTA', { small: true });
      await this.wait(1.4);
      return;
    }
    await this.tackle(D);
    if (ev.outcome === 'counter') { await this.counterRun(ev, D); return; }
    const [u, v] = this.ballUV(D);
    await this.dribble(D, [u + rnd(-4, 4), v + 5], 0.7);
  }

  async playAttack(ev, A, D) {
    this.cam.tzoom = 1.45; this.cam.follow = null;
    this.possSide = A;
    this.ensureOwner(A);
    this.defStyle[D] = ev.def;
    const lane = LANE_U[ev.lane] ?? 34;
    const fw = this.players[A].slice(9);
    if (ev.att === 'cross') {
      const wingU = ev.lane === 'R' ? 62 : ev.lane === 'L' ? 6 : (Math.random() < 0.5 ? 6 : 62);
      fw[0].ov = this.W(A, wingU < 34 ? 30 : 38, 93); fw[1].ov = this.W(A, wingU < 34 ? 39 : 29, 95);
      if (!ev.match) {
        await this.dribble(A, [wingU, 86], 1.1);
        this.cam.tzoom = 1.6;
        const target = [wingU < 34 ? 38 : 30, 95.5];
        const r = await this.pass(A, target, { dur: 1.0, h: 5.5, recv: wingU < 34 ? fw[1] : fw[0], z1: 2.1 });
        this.ball.head = true;
        void r;
        await this.wait(0.3);
        return;
      }
      const lock = this.dribble(A, [wingU, 84], 1.0);
      const blocker = this.nearest(D, ...this.W(A, wingU, 86), true);
      blocker.ov = this.W(A, wingU + (wingU < 34 ? 2 : -2), 88); blocker.boost = 1.5;
      await lock;
      await this.diceMoment(ev);
      if (ev.outcome === 'corner') { await this.ballOut(A, [wingU < 34 ? 6 : 62, 106.5], { dur: 0.7, h: 1.5 }); await this.setCorner(A, ev.cornerSide || (wingU < 34 ? 'L' : 'R')); return; }
      await this.tackle(D);
      if (ev.outcome === 'counter') { await this.counterRun(ev, D); return; }
      const [u, v] = this.ballUV(D);
      await this.dribble(D, [u + (u < 34 ? 6 : -6), v + 8], 0.8);
      return;
    }
    if (ev.att === 'through') {
      const [cu] = this.ballUV(A);
      await this.dribble(A, [lerp(cu, 34, 0.5), 74], 0.7);
      const runU = 34 + (lane < 34 ? -5 : lane > 34 ? 5 : rnd(-4, 4));
      fw[0].ov = this.W(A, runU, 90); fw[0].boost = 1.6;
      await this.wait(0.25);
      if (!ev.match) {
        this.cam.tzoom = 1.45;
        await this.pass(A, [runU, 89], { dur: 0.9, h: 0.3, recv: fw[0] });
        const k = this.players[D][0];
        k.ov = this.W(A, 34, 99.5);
        await this.dribble(A, [runU * 0.7 + 34 * 0.3, 92], 0.6);
        return;
      }
      await this.intercept(A, [runU, 89], { dur: 0.9, at: 0.6 });
      await this.diceMoment(ev);
      if (ev.outcome === 'corner') { await this.ballOut(D, [runU > 34 ? 6 : 62, -1.5], { dur: 0.8, h: 2 }); await this.setCorner(A, ev.cornerSide || 'L'); return; }
      if (ev.outcome === 'counter') { await this.counterRun(ev, D); return; }
      const [u, v] = this.ballUV(D);
      await this.dribble(D, [u, v + 6], 0.7);
      return;
    }
    // Gambeta
    const [cu] = this.ballUV(A);
    const endU = clamp(lerp(cu, 34, 0.7) + rnd(-4, 4), 24, 44);
    if (!ev.match) {
      await this.dribble(A, [endU, 88], 1.7, 3);
      await this.diceMoment(ev);
      if (ev.outcome === 'penalty') {
        const victim = this.ball.owner;
        const fouler = this.nearest(D, this.ball.x, this.ball.y, true);
        fouler.ov = [this.ball.x, this.ball.y]; fouler.boost = 2;
        await this.wait(0.35);
        fouler.ov = null; fouler.boost = 1;
        victim.fallen = 1.3;
        this.ui.sound('whistle');
        await this.ui.banner('¡PENAL!', {});
        await this.setPenalty(A);
      }
      return;
    }
    const lock = this.dribble(A, [endU, 82], 1.0, 2);
    await this.wait(0.55);
    await lock;
    await this.diceMoment(ev);
    if (ev.outcome === 'corner') { await this.ballOut(A, [endU < 34 ? 20 : 48, 106.5], { dur: 0.6, h: 1 }); await this.setCorner(A, ev.cornerSide || 'L'); return; }
    await this.tackle(D);
    if (ev.outcome === 'counter') { await this.counterRun(ev, D); return; }
    const [u, v] = this.ballUV(D);
    await this.dribble(D, [u + rnd(-5, 5), v + 7], 0.7);
  }

  async playShot(ev, A, D) {
    this.cam.tzoom = 1.7; this.cam.follow = null;
    this.possSide = A;
    const shooter = this.ensureOwner(A);
    const kind = ev.shotKind;
    if (kind === 'penal') {
      const [su, sv] = this.U(A, shooter.x, shooter.y);
      shooter.lock = { from: [shooter.x, shooter.y], to: this.W(A, su, sv + 2.6), t: 0, dur: 0.7, linear: true };
      this.ball.owner = null;
      await this.wait(0.7);
      this.ball.owner = shooter;
    }
    const tu = GOAL_U[ev.att];
    const header = kind === 'cabezazo';
    const dur = header ? 0.6 : 0.5;
    this.keeperDive(D, ev.def, dur * 0.9);
    const b = this.ball;
    const fly = (to, h, z1, d) => {
      b.owner = null; b.head = false;
      b.flight = { from: [b.x, b.y], to: this.W(A, to[0], to[1]), t: 0, dur: d, h, z0: b.z, z1 };
      return this.wait(d);
    };
    this.ui.sound(header ? 'header' : 'shot');
    if (ev.match) {
      await fly([tu, 104.4], header ? 0.8 : 0.7, ev.att === 'C' ? 1.4 : 0.8, dur);
      this.ui.sound('save');
      await this.diceMoment(ev);
      if (ev.outcome === 'save_corner') {
        this.ui.banner('¡ATAJADA!', { small: true });
        await fly([tu < 34 ? 27 : tu > 34 ? 41 : 38, 107.5], 2.5, 0, 0.7);
        await this.setCorner(A, ev.cornerSide || (tu < 34 ? 'L' : 'R'));
        return;
      }
      const k = this.players[D][0];
      this.give(k);
      this.ui.banner('¡ATAJADA!', { small: true });
      await this.wait(1.2);
      return;
    }
    if (ev.outcome === 'goal') {
      await fly([tu + (ev.att === 'L' ? -0.6 : ev.att === 'R' ? 0.6 : 0), 106.4], 0.5, 1.2, dur);
      const goalWorld = this.W(A, 34, 105);
      const gi = goalWorld[1] < 50 ? 0 : 1;
      this.netShake[gi] = 1.2;
      b.flight = null; b.z = 0.3;
      await this.celebrate_(ev, A, shooter);
      return;
    }
    await this.diceMoment(ev);
    if (ev.outcome === 'post') {
      const post = ev.att === 'R' ? 37.66 : 30.34;
      await fly([post, 105], 0.4, 1, dur * 0.9);
      this.ui.sound('post');
      this.ui.banner('¡AL PALO!', { small: true });
      await fly([post < 34 ? 22 : 46, 108], 1.5, 0, 0.6);
    } else {
      await fly([tu < 34 ? 27.5 : tu > 34 ? 40.5 : 34, 108.5], 3, 3, 0.7);
      this.ui.banner('¡AFUERA!', { small: true });
    }
    await this.wait(0.8);
    await this.goalKick(D);
  }

  async playCorner(ev, A, D) {
    this.cam.tzoom = 1.6; this.cam.follow = null;
    this.possSide = A;
    const taker = this.ensureOwner(A);
    const [tu] = this.U(A, taker.x, taker.y);
    const left = tu < 34;
    const T = { near: [left ? 31 : 37, 100.5], spot: [34, 94], far: [left ? 38.5 : 29.5, 99.5] }[ev.att];
    const runner = this.nearest(A, ...this.W(A, T[0], T[1]), true, [taker]);
    runner.ov = this.W(A, T[0], T[1]); runner.boost = 1.5;
    if (ev.match) {
      const def = this.nearest(D, ...this.W(A, T[0], T[1]), true);
      def.ov = this.W(A, T[0], T[1] + 0.8); def.boost = 1.7;
    }
    await this.wait(0.5);
    if (!ev.match) {
      await this.pass(A, T, { dur: 1.1, h: 5, recv: runner, z1: 2.1 });
      this.ball.head = true;
      await this.wait(0.3);
      return;
    }
    const b = this.ball;
    b.owner = null;
    b.flight = { from: [b.x, b.y], to: this.W(A, T[0], T[1]), t: 0, dur: 1.1, h: 5, z1: 2 };
    this.ui.sound('kick');
    await this.wait(1.1);
    this.ui.sound('header');
    const clearTo = [T[0] + rnd(-10, 10), 76];
    const rec = this.nearest(D, ...this.W(A, clearTo[0], clearTo[1]), true);
    rec.ov = this.W(A, clearTo[0], clearTo[1]);
    b.flight = { from: [b.x, b.y], to: this.W(A, clearTo[0], clearTo[1]), t: 0, dur: 1.0, h: 4, z0: 2 };
    await this.wait(1.0);
    rec.ov = null;
    this.give(rec);
    const [u, v] = this.ballUV(D);
    await this.dribble(D, [u, v + 6], 0.6);
  }

  async celebrate_(ev, A, scorer) {
    this.ui.sound('goal');
    this.crowdJump = { side: A, t: 4 };
    this.flash = 0.6;
    this.ui.banner('¡GOOOL!', { goal: true, color: this.kits[A].shirt, alt: this.kits[A].alt2 });
    await this.wait(0.4);
    const [su] = this.U(A, scorer.x, scorer.y);
    const corner = this.W(A, su < 34 ? 3 : 65, 101);
    scorer.ov = corner; scorer.boost = 1.2;
    this.cam.follow = scorer; this.cam.tzoom = 2;
    this.players[A].forEach((p, k) => {
      if (p !== scorer && p.i !== 0 && k % 2 === 0) { p.ov = [corner[0] + rnd(-3, 3), corner[1] + rnd(-3, 3)]; p.boost = 1.1; }
    });
    // Los que recibieron el gol caminan resignados al medio.
    this.players[1 - A].forEach((p) => { if (p.i !== 0) { p.ov = this.W(1 - A, FORMATION[p.i][0], Math.min(FORMATION[p.i][1], 40)); p.boost = 0.45; } });
    await this.wait(3.2);
    this.cam.follow = null;
  }

  // ---------- dibujo ----------
  buildPitch() {
    const c = document.createElement('canvas');
    c.width = WW; c.height = WH;
    const g = c.getContext('2d');
    g.fillStyle = '#2b2f3a'; g.fillRect(0, 0, WW, WH);
    // pasto con franjas
    const stripes = 14;
    for (let i = 0; i < stripes; i++) {
      g.fillStyle = i % 2 ? '#3f9b3a' : '#45a83f';
      const y0 = Math.round(MY + (PL * S * i) / stripes), y1 = Math.round(MY + (PL * S * (i + 1)) / stripes);
      g.fillRect(MX - 6, y0, PW * S + 12, y1 - y0);
    }
    g.fillStyle = '#3c9437';
    g.fillRect(MX - 6, MY - 6, PW * S + 12, 6); g.fillRect(MX - 6, MY + PL * S, PW * S + 12, 6);
    // ruido de pasto
    for (let i = 0; i < 1400; i++) {
      const x = MX - 6 + Math.random() * (PW * S + 12), y = MY - 6 + Math.random() * (PL * S + 12);
      g.fillStyle = Math.random() < 0.5 ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)';
      g.fillRect(Math.floor(x), Math.floor(y), 1, 1);
    }
    g.fillStyle = '#f2f2ea';
    const line = (x0, y0, x1, y1) => {
      const ax = Math.round(MX + x0 * S), ay = Math.round(MY + y0 * S), bx = Math.round(MX + x1 * S), by = Math.round(MY + y1 * S);
      g.fillRect(Math.min(ax, bx), Math.min(ay, by), Math.max(1, Math.abs(bx - ax)), Math.max(1, Math.abs(by - ay)));
    };
    const rect = (x, y, w, h) => { line(x, y, x + w, y); line(x, y + h, x + w, y + h); line(x, y, x, y + h); line(x + w, y, x + w, y + h + 1 / S); };
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
    g.fillRect(Math.round(MX + (PW / 2) * S) - 1, Math.round(MY + (PL / 2) * S) - 1, 2, 2);
    for (const top of [true, false]) {
      const y = top ? 0 : PL;
      const dir = top ? 1 : -1;
      const by = top ? 0 : PL - 16.5, gy = top ? 0 : PL - 5.5;
      rect((PW - 40.3) / 2, by, 40.3, 16.5);
      rect((PW - 18.3) / 2, gy, 18.3, 5.5);
      const spotY = y + dir * 11;
      g.fillRect(Math.round(MX + (PW / 2) * S) - 1, Math.round(MY + spotY * S), 2, 1);
      // medialuna
      const a = Math.acos(5.5 / 9.15);
      if (top) circle(PW / 2, spotY, 9.15, Math.PI / 2 - a, Math.PI / 2 + a);
      else circle(PW / 2, spotY, 9.15, -Math.PI / 2 - a, -Math.PI / 2 + a);
      // córners
      circle(0, y, 1, top ? 0 : -Math.PI / 2, top ? Math.PI / 2 : 0);
      circle(PW, y, 1, top ? Math.PI / 2 : Math.PI, top ? Math.PI : Math.PI * 1.5);
    }
    // banderines
    for (const [x, y] of [[0, 0], [PW, 0], [0, PL], [PW, PL]]) {
      const X = Math.round(MX + x * S), Y = Math.round(MY + y * S);
      g.fillStyle = '#ddd'; g.fillRect(X, Y - 5, 1, 5);
      g.fillStyle = '#f0c419'; g.fillRect(X + (x ? -3 : 1), Y - 5, 3, 2);
    }
    return c;
  }

  buildCrowd() {
    const cols = [this.teams[0].kit.shirt, this.teams[0].kit.alt2, this.teams[1].kit.shirt, this.teams[1].kit.alt2, '#c9c9c9', '#7a7a7a', '#3a3a3a'];
    this.crowd = [];
    const add = (x, y) => {
      // cada lado de la tribuna favorece a un equipo
      const nearHomeEnd = y > WH / 2;
      const r = Math.random();
      let c;
      if (r < 0.45) c = nearHomeEnd ? cols[0] : cols[2];
      else if (r < 0.6) c = nearHomeEnd ? cols[1] : cols[3];
      else c = cols[4 + Math.floor(Math.random() * 3)];
      this.crowd.push({ x, y, c, ph: Math.random() * 10, team: nearHomeEnd ? 0 : 1, skin: SKINS[Math.floor(Math.random() * SKINS.length)] });
    };
    for (let y = 2; y < MY - 9; y += 3) for (let x = 2; x < WW - 2; x += 3) { add(x, y); add(x, WH - y - 3); }
    for (let x = 1; x < MX - 8; x += 3) for (let y = MY - 6; y < WH - MY + 4; y += 3) { add(x, y); add(WW - x - 3, y); }
  }

  drawCrowd(g, now) {
    const flip = this.mySide === 1;
    for (const p of this.crowd) {
      let x = p.x, y = p.y;
      // la tribuna local siempre abajo para cada jugador
      const team = flip ? 1 - p.team : p.team;
      const jumping = this.crowdJump.t > 0 && this.crowdJump.side === team;
      const bob = jumping ? (Math.sin(now / 90 + p.ph) > 0 ? -1 : 0) : (Math.sin(now / 700 + p.ph) > 0.97 ? -1 : 0);
      g.fillStyle = p.c; g.fillRect(x, y + bob + 1, 2, 2);
      g.fillStyle = p.skin; g.fillRect(x, y + bob, 2, 1);
    }
  }

  drawGoal(g, top, shake) {
    const gw = 7.32 * S, x0 = Math.round(MX + (PW / 2) * S - gw / 2);
    const yLine = top ? MY : MY + PL * S;
    const depth = 7;
    const y0 = top ? yLine - depth : yLine;
    g.fillStyle = 'rgba(255,255,255,0.15)';
    g.fillRect(x0, y0, Math.round(gw), depth);
    g.fillStyle = 'rgba(230,230,230,0.55)';
    const wob = shake > 0 ? Math.round(Math.sin(performance.now() / 40) * 1.5 * shake) : 0;
    for (let x = x0; x <= x0 + gw; x += 2) g.fillRect(x + (wob && x % 4 ? wob : 0), y0, 1, depth);
    for (let y = y0; y < y0 + depth; y += 2) g.fillRect(x0, y + (top ? -wob * 0.5 : wob * 0.5), Math.round(gw), 1);
    g.fillStyle = '#ffffff';
    g.fillRect(x0 - 1, top ? y0 : yLine, 2, depth); g.fillRect(x0 + Math.round(gw) - 1, top ? y0 : yLine, 2, depth);
    g.fillRect(x0 - 1, top ? y0 : yLine + depth - 1, Math.round(gw) + 1, 1);
    g.fillRect(x0 - 1, yLine - (top ? 1 : 0), Math.round(gw) + 2, 1);
  }

  drawPlayer(g, p, kit, isGK) {
    const [X, Y] = this.px(p.x, p.y);
    const x = Math.round(X) - 2, y = Math.round(Y) - 9;
    const shirt = isGK ? kit.gk : kit.shirt;
    const alt = isGK ? kit.gk : kit.alt2;
    const pat = isGK ? 'plain' : kit.pattern;
    const shorts = isGK ? '#222' : kit.shorts;
    // sombra
    g.fillStyle = 'rgba(0,0,0,0.28)';
    g.fillRect(x, y + 8, 5, 2); g.fillRect(x + 1, y + 10, 3, 0.5);
    let facing = p.facing, fx = p.fx;
    if (this.mySide === 1) { facing = -facing; fx = -fx; }
    // tirado (falta o estirada)
    const lying = p.fallen > 0 || (p.dive && p.dive.dir !== 0);
    if (lying) {
      const dir = p.dive ? (this.mySide === 1 ? -p.dive.dir : p.dive.dir) : (fx >= 0 ? 1 : -1);
      const lx = Math.round(X) - 4, ly = Math.round(Y) - 4;
      const col = (i) => (dir > 0 ? lx + i : lx + 8 - i);
      g.fillStyle = p.skin; g.fillRect(col(0), ly + 1, 1, 1); g.fillRect(col(1), ly + 1, 1, 1);
      g.fillStyle = shorts; g.fillRect(Math.min(col(2), col(3)), ly, 2, 3);
      g.fillStyle = shirt; g.fillRect(Math.min(col(4), col(6)), ly, 3, 3);
      if (pat !== 'plain') { g.fillStyle = alt; g.fillRect(col(5), ly, 1, 3); }
      g.fillStyle = p.skin; g.fillRect(Math.min(col(7), col(8)), ly, 2, 2);
      g.fillStyle = p.hair; g.fillRect(col(8), ly, 1, 2);
      if (p.dive) { g.fillStyle = isGK ? '#fff' : p.skin; g.fillRect(col(9), ly - 1, 1, 1); g.fillRect(col(9), ly + 2, 1, 1); }
      return;
    }
    const back = facing < -0.3; // de espaldas a la cámara
    // cabeza
    g.fillStyle = p.hair; g.fillRect(x + 1, y, 3, 1);
    g.fillStyle = back ? p.hair : p.skin; g.fillRect(x + 1, y + 1, 3, 2);
    if (!back && Math.abs(fx) > 0.6) { g.fillStyle = p.hair; g.fillRect(fx > 0 ? x + 1 : x + 3, y + 1, 1, 1); }
    // camiseta
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 5; c++) {
        if (r === 2 && (c === 0 || c === 4)) { g.fillStyle = isGK ? '#eee' : p.skin; g.fillRect(x + c, y + 3 + r, 1, 1); continue; }
        let col = shirt;
        if (pat === 'stripes' && c % 2 === 1) col = alt;
        else if (pat === 'band' && r === 1) col = alt;
        else if (pat === 'hoops' && r !== 1) col = alt;
        else if (pat === 'sash' && c === 3 - r) col = alt;
        else if (pat === 'sleeves' && (c === 0 || c === 4)) col = alt;
        else if (pat === 'center' && c === 2) col = alt;
        else if (pat === 'checks' && (r + c) % 2) col = alt;
        g.fillStyle = col; g.fillRect(x + c, y + 3 + r, 1, 1);
      }
    }
    // short
    g.fillStyle = shorts; g.fillRect(x + 1, y + 6, 3, 1);
    // piernas animadas
    const moving = Math.hypot(p.vx, p.vy) > 0.5;
    const f = moving ? Math.floor(p.anim * 1.6) % 4 : 1;
    g.fillStyle = p.skin;
    const sock = '#eaeaea';
    if (f === 0) { g.fillRect(x + 1, y + 7, 1, 1); g.fillStyle = sock; g.fillRect(x + 1, y + 8, 1, 1); g.fillStyle = p.skin; g.fillRect(x + 3, y + 7, 1, 1); }
    else if (f === 2) { g.fillRect(x + 3, y + 7, 1, 1); g.fillStyle = sock; g.fillRect(x + 3, y + 8, 1, 1); g.fillStyle = p.skin; g.fillRect(x + 1, y + 7, 1, 1); }
    else { g.fillRect(x + 1, y + 7, 1, 1); g.fillRect(x + 3, y + 7, 1, 1); g.fillStyle = sock; g.fillRect(x + 1, y + 8, 1, 1); g.fillRect(x + 3, y + 8, 1, 1); }
  }

  drawRef(g) {
    const r = this.ref;
    this.drawPlayer(g, { ...r, skin: '#e0a77c', hair: '#222', fallen: 0, dive: null, i: 99 }, { shirt: '#111', alt2: '#111', pattern: 'plain', shorts: '#111' }, false);
  }

  draw(now) {
    const g = this.wctx;
    g.drawImage(this.pitch, 0, 0);
    if (this.kits) {
      this.drawCrowd(g, now);
      this.drawGoal(g, true, this.mySide === 0 ? this.netShake[0] : this.netShake[1]);
      // entidades ordenadas por profundidad
      const ents = [];
      for (const t of this.players) for (const p of t) ents.push({ y: this.px(p.x, p.y)[1], d: () => this.drawPlayer(g, p, this.kits[p.side], p.i === 0) });
      ents.push({ y: this.px(this.ref.x, this.ref.y)[1], d: () => this.drawRef(g) });
      const b = this.ball;
      const [bx, by] = this.px(b.x, b.y);
      ents.push({ y: by + 0.1, d: () => this.drawBall(g, bx, by, b.z) });
      ents.sort((a, b2) => a.y - b2.y).forEach((e) => e.d());
      this.drawGoal(g, false, this.mySide === 0 ? this.netShake[1] : this.netShake[0]);
      // indicador del portador
      if (b.owner && !b.flight) {
        const [ox, oy] = this.px(b.owner.x, b.owner.y);
        const k = this.kits[b.owner.side];
        const bob = Math.sin(now / 150) > 0 ? 0 : 1;
        g.fillStyle = '#000'; g.fillRect(Math.round(ox) - 2, Math.round(oy) - 15 + bob, 5, 3);
        g.fillStyle = b.owner.side === this.mySide ? '#ffe14a' : '#ffffff';
        g.fillRect(Math.round(ox) - 1, Math.round(oy) - 14 + bob, 3, 1); g.fillRect(Math.round(ox), Math.round(oy) - 13 + bob, 1, 1);
        void k;
      }
      if (this.flash > 0) { g.fillStyle = `rgba(255,255,255,${this.flash * 0.5})`; g.fillRect(0, 0, WW, WH); }
    }
    // cámara
    const c = this.ctx, W = this.cv.width, H = this.cv.height;
    c.imageSmoothingEnabled = false;
    c.fillStyle = '#1d212b'; c.fillRect(0, 0, W, H);
    const base = Math.min(W / WW, H / WH);
    const sc = base * this.cam.zoom;
    const vw = W / sc, vh = H / sc;
    const cx = vw >= WW ? WW / 2 : clamp(this.cam.x, vw / 2, WW - vw / 2);
    const cy = vh >= WH ? WH / 2 : clamp(this.cam.y, vh / 2, WH - vh / 2);
    c.drawImage(this.world, cx - vw / 2, cy - vh / 2, vw, vh, 0, 0, W, H);
  }

  drawBall(g, x, y, z) {
    const X = Math.round(x), Y = Math.round(y);
    g.fillStyle = 'rgba(0,0,0,0.35)';
    g.fillRect(X - 1, Y, 3, 1);
    const bz = Math.round(z * S * 0.9);
    const s = z > 3 ? 3 : 2;
    g.fillStyle = '#ffffff'; g.fillRect(X - 1, Y - 2 - bz, s, s);
    g.fillStyle = '#333'; g.fillRect(X - 1 + (Math.floor(this.ball.spin) % 2), Y - 2 - bz + (Math.floor(this.ball.spin / 2) % 2), 1, 1);
  }
}
