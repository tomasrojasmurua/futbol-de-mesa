// La salida del túnel: los dos equipos caminan en dos filas hacia la luz de la
// cancha, con el árbitro adelante y los chicos de la mano. Se conversan; uno
// le explica algo al de atrás con la mano. Al final la luz lo tapa todo.
import { P4 } from '../players.js';
import { text as pxText, textW as pxTextW } from '../cutscene.js';
import { stadiumFor } from '../stadiums.js';
import { lookOf, kitFor, paint } from './cast.js';
import { rgb, mix, dark, ramp, clamp, lerp, ease, seeded, fillPoly, line, drawSprite, canvas, ellipse, tinted, crest } from './common.js';
import { vignette } from './locker.js';

const NEAR = 9, FAR = 10, KID = 15; // escalas
const FR = 6;                         // cuadros por paso
const SPEED = 64;                     // px por segundo
const EXIT = 520;                     // dónde termina el túnel
const TW = 640;                       // largo pintado del túnel

const WALK_L = [[0, { a: 0.32, k: 0.05, p: -0.15 }], [0.15, { a: 0.18, k: 0.18, p: 0 }], [0.35, { a: -0.05, k: 0.08, p: 0 }], [0.55, { a: -0.3, k: 0.2, p: 0.35 }], [0.7, { a: -0.18, k: 0.7, p: 0.5 }], [0.85, { a: 0.18, k: 0.55, p: 0.1 }]];
// Caminar (sin fase de vuelo). talk: el brazo cercano gesticula; turn: mira hacia atrás.
export function walk(u, o = {}) {
  const l0 = P4.keyed(WALK_L, u, true), l1 = P4.keyed(WALK_L, u + 0.5, true);
  const bob = Math.cos(u * 6.28 * 2) * 3;
  const arms = [{ a: -l1.a * 0.7, e: 0.35 + Math.max(0, -l1.a) * 0.4 }, { a: -l0.a * 0.7, e: 0.35 + Math.max(0, -l0.a) * 0.4 }];
  if (o.talk) arms[1] = { a: 0.5 + Math.sin(u * 6.28 * 2) * 0.15, e: 1.5 + Math.sin(u * 6.28 * 2 + 1) * 0.3 };
  if (o.hand) arms[1] = { a: 0.25, e: 0.15 };  // le da la mano al chico
  return { lean: 0.05, twist: 0.4, headTilt: o.turn ? -0.25 : 0, lift: -bob, legs: [l1, l0], arms };
}

export class Tunnel {
  // o: { teams, kits, cast, at, setup }
  constructor(o) {
    this.o = o;
    const { teams, kits, cast, at } = o;
    this.st = stadiumFor(o.setup.stadium);
    const ref = { shirt: '#1b1d24', alt2: '#e8c84a', pattern: 'plain', shorts: '#1b1d24', gk: '#1b1d24' };
    const types = {
      h0: [kitFor(kits[0], lookOf(teams[0], 0, 9)), NEAR, {}],
      h1: [kitFor(kits[0], lookOf(teams[0], 0, 10)), NEAR, { hand: true }],
      ht: [kitFor(kits[0], lookOf(teams[0], 0, 6)), NEAR, { talk: true }],
      a0: [kitFor(kits[1], lookOf(teams[1], 1, 9)), FAR, {}],
      a1: [kitFor(kits[1], lookOf(teams[1], 1, 10)), FAR, { turn: true }],
      rf: [kitFor(ref, { skin: '#e0a77c', hair: '#1c1c1c', style: 'buzz' }), NEAR, {}],
      kid: [kitFor(kits[0], { skin: '#f1c7a0', hair: '#5b3a1e', style: 'fringe' }), KID, { hand: true }],
    };
    this.types = types;
    for (const [id, [kit, sc, opt]] of Object.entries(types)) for (let f = 0; f < FR; f++) cast.want(`tun-${id}`, f, at, () => paint(walk(f / FR, opt), kit, 'side', sc));
    // las dos filas (x de partida; adelante el árbitro)
    this.near = [['rf', 340], ['h0', 292, true], ['h1', 244, true], ['ht', 198], ['h0', 154], ['h1', 110], ['ht', 66], ['h0', 22]];
    this.far = [['a0', 314], ['a1', 270], ['a0', 226], ['a1', 182], ['a0', 138], ['a1', 94], ['a0', 50]];
    this.bg = null;
  }

  buildBg(H) {
    const W = TW, cv = canvas(W, H), g = cv.getContext('2d');
    const k = this.o.kits, st = this.st;
    const floorY = this.floorY = Math.round(H * 0.82);
    const ceilB = Math.round(H * 0.34), wallB = floorY - 30;
    this.farY = floorY - 18;
    // techo de hormigón con vigas y lámparas con rejilla
    g.fillStyle = '#2b2e36'; g.fillRect(0, 0, W, ceilB);
    for (let y = 0; y < ceilB; y += 6) { g.fillStyle = '#30333c'; g.fillRect(0, y, W, 1); }
    for (let x = 30; x < W; x += 90) {
      g.fillStyle = '#23252c'; g.fillRect(x - 3, 0, 14, ceilB);
      g.fillStyle = '#383b45'; g.fillRect(x - 3, 0, 2, ceilB);
    }
    for (let x = 70; x < EXIT; x += 90) {
      g.fillStyle = '#1b1d22'; g.fillRect(x - 10, ceilB - 6, 22, 5);
      g.fillStyle = '#f2f6ff'; g.fillRect(x - 8, ceilB - 4, 18, 3);
      g.fillStyle = '#9aa3b4'; for (let i = 0; i < 18; i += 3) g.fillRect(x - 8 + i, ceilB - 4, 1, 3);
    }
    g.fillStyle = '#1d1f25'; g.fillRect(0, ceilB - 1, W, 2);
    // caños y canaletas de cables
    for (const [y, c, h] of [[Math.round(ceilB * 0.35), '#5a5f6b', 5], [Math.round(ceilB * 0.55), '#7a5a3a', 3], [Math.round(ceilB * 0.7), '#4a5060', 7]]) {
      g.fillStyle = c; g.fillRect(0, y, EXIT, h);
      g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(0, y, EXIT, 1);
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, y + h - 1, EXIT, 1);
      for (let x = 20; x < EXIT; x += 64) { g.fillStyle = '#2a2d35'; g.fillRect(x, y - 1, 2, h + 2); }
    }
    // pared: azulejos blancos, una franja con los colores del local y el letrero
    for (let y = ceilB; y < wallB; y++) { g.fillStyle = y % 7 ? '#bfc3c8' : '#a2a7ae'; g.fillRect(0, y, W, 1); }
    for (let x = 0; x < W; x += 9) { g.fillStyle = '#a2a7ae'; for (let y = ceilB; y < wallB; y += 7) g.fillRect(x + ((y / 7) % 2 ? 4 : 0), y, 1, 7); }
    const band = Math.round(lerp(ceilB, wallB, 0.62));
    g.fillStyle = k[0].shirt; g.fillRect(0, band, W, 10);
    g.fillStyle = k[0].alt2 || dark(k[0].shirt, 0.3); g.fillRect(0, band + 10, W, 3);
    g.fillStyle = k[1].shirt; g.fillRect(0, band + 13, W, 3);
    // letrero sobre la salida y escudos en la pared
    const sign = (st.letters || st.name).toUpperCase();
    const sw = pxTextW(sign, 2) + 16, sx = Math.round(EXIT - 60 - sw), sy = ceilB + 10;
    g.fillStyle = dark(k[0].shirt, 0.55); g.fillRect(sx, sy, sw, 20);
    g.fillStyle = k[0].alt2 || '#ffffff'; g.fillRect(sx, sy, sw, 1); g.fillRect(sx, sy + 19, sw, 1);
    pxText(g, sign, sx + 8, sy + 5, '#ffffff', 2);
    const teams = this.o.teams;
    for (const [cx, side] of [[110, 0], [150, 1], [300, 0], [340, 1]]) crest(g, cx, sy + 14, k[side], teams[side].short, 1);
    // pasamanos
    g.fillStyle = '#8a9099'; g.fillRect(0, wallB - 22, EXIT, 2);
    for (let x = 10; x < EXIT; x += 60) g.fillRect(x, wallB - 22, 2, 22);
    g.fillStyle = '#5d636e'; g.fillRect(0, wallB - 20, EXIT, 1);
    // zócalo y piso de goma verde
    g.fillStyle = '#4a4e57'; g.fillRect(0, wallB, W, 4);
    for (let y = wallB + 4; y < H; y++) { const u = (y - wallB) / (H - wallB); g.fillStyle = u < 0.1 ? '#1f3a2a' : u < 0.5 ? '#25452f' : '#2a4d35'; g.fillRect(0, y, W, 1); }
    for (let x = -200; x < W + 200; x += 24) line(g, x, wallB + 4, x + (x - EXIT) * 0.9, H, '#1f3a2a');
    // la boca del túnel: luz del estadio
    g.fillStyle = '#fffaf0'; g.fillRect(EXIT, 0, W - EXIT, H);
    g.fillStyle = '#e8f2dc'; g.fillRect(EXIT, floorY - 40, W - EXIT, H);
    g.fillStyle = '#d6ecc2'; g.fillRect(EXIT, floorY - 12, W - EXIT, H);
    // la hinchada que se adivina afuera, quemada por la luz
    for (let i = 0; i < 220; i++) {
      const x = EXIT + 4 + Math.floor(seeded(i) * (W - EXIT)), y = Math.floor(H * 0.3 + seeded(i + 99) * (floorY - 48 - H * 0.3));
      g.fillStyle = seeded(i + 7) < 0.5 ? mix(k[0].shirt, '#fffaf0', 0.7) : '#efe6d6'; g.fillRect(x, y, 2, 2);
    }
    // marco de la salida
    g.fillStyle = '#1b1d22'; g.fillRect(EXIT - 6, 0, 8, floorY - 6);
    return cv;
  }

  draw(g, W, H, t) {
    if (!this.bg || this.bg.height !== H) this.bg = this.buildBg(H);
    const cam = Math.round(lerp(150, EXIT - 110, ease(t / 4.4) * 0.6 + (t / 4.4) * 0.4));
    g.drawImage(this.bg, -cam, 0);
    const cast = this.o.cast;
    const step = (t * SPEED) / 46;   // un paso cada 46 px
    // la luz de la salida baña a los que se acercan
    const draws = [];
    const row = (list, y, far) => list.forEach(([id, x0, kid], n) => {
      const x = x0 + t * SPEED;
      if (x > EXIT + 30) return;
      const f = Math.floor((step + n * 0.37) * FR) % FR;
      draws.push({ id, x, y, f, kid, far });
    });
    row(this.far, this.farY, true);
    row(this.near, this.floorY, false);
    for (const d of draws) {
      const s = cast.get(`tun-${d.id}`, d.f, FR);
      if (!s) continue;
      const x = d.x - cam;
      if (x < -60 || x > W + 60) continue;
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(Math.round(x - 12), d.y - 1, 26, 2);
      const img = d.far ? this.shade(s, d.id, d.f) : s.cv;
      drawSprite(g, s, x, d.y, false, img);
      if (d.kid) {
        const ks = cast.get('tun-kid', d.f, FR);
        if (ks) drawSprite(g, ks, x + 9, d.y + 3, false);
      }
    }
    // resplandor de la salida: crece al final hasta tapar todo
    const ex = EXIT - cam;
    g.save(); g.globalCompositeOperation = 'screen';
    const gr = g.createLinearGradient(ex - 160, 0, ex, 0);
    gr.addColorStop(0, 'rgba(255,248,230,0)'); gr.addColorStop(1, 'rgba(255,248,230,0.45)');
    g.fillStyle = gr; g.fillRect(ex - 160, 0, 160, H);
    g.restore();
    vignette(g, W, H);
    const white = clamp((t - 3.7) / 0.7, 0, 1);
    if (white > 0) { g.fillStyle = `rgba(255,252,244,${white})`; g.fillRect(0, 0, W, H); }
  }

  // la fila de atrás, un poco más en sombra
  shade(s, id, f) {
    this.dim = this.dim || new Map();
    const key = `${id}#${f}`;
    if (!this.dim.has(key)) this.dim.set(key, tinted(s.cv, '#b4b8c4'));
    return this.dim.get(key);
  }
}
