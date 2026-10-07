// El camarín: el equipo se prepara. Un plano general que recorre el banco
// (uno se ata los botines, otro se pone la camiseta, otro se acomoda la
// canillera, el arquero se calza los guantes) y un primer plano de las manos
// apretando los cordones.
import { P4 } from '../players.js';
import { text as pxText, textW as pxTextW } from '../cutscene.js';
import { lookOf, nameOf, NUMS, kitFor, paint } from './cast.js';
import { rgb, css, mixv, mix, dark, ramp, clamp, lerp, ease, seeded, fillPoly, line, drawSprite, canvas, ellipse } from './common.js';

const SC = 10;          // escala de los jugadores (≈86 px de pie)
const WIDE = 3.0;       // segundos del plano general
const SW = 380;         // ancho del camarín (más que la pantalla: la cámara lo recorre)

// Poses propias del camarín (de costado, mirando a la derecha).
const POSE = {
  tie: (u) => ({ lean: 0.92, twist: 0.5, headTilt: 0.4, legs: [{ a: 1.2, k: 2.0, p: 0.4 }, { a: 1.45, k: 1.45, p: 0 }], arms: [{ a: 0.02 + Math.sin(u * 6.28) * 0.08, e: 0.15 + Math.cos(u * 6.28) * 0.12 }, { a: 0.1 - Math.sin(u * 6.28) * 0.08, e: 0.12 }] }),
  guard: (u) => ({ lean: 0.65, twist: 0.5, headTilt: 0.3, legs: [{ a: 1.45, k: 1.45, p: 0 }, { a: 1.3, k: 0.55, p: 0.1 }], arms: [{ a: 0.45 + Math.sin(u * 6.28) * 0.05, e: 0.2 }, { a: 0.6 + Math.sin(u * 6.28) * 0.06, e: 0.0 }] }),
  gloves: (u) => ({ lean: 0.18, twist: 0.5, headTilt: 0.25, legs: [{ a: 1.45, k: 1.5, p: 0 }, { a: 1.55, k: 1.55, p: 0 }], arms: [{ a: 0.95 + Math.sin(u * 6.28) * 0.05, e: 0.75 }, { a: 1.0, e: 0.55 + Math.sin(u * 6.28) * 0.08 }] }),
  talk: (u) => ({ lean: 0.04, twist: 0.5, headTilt: 0.05, legs: [{ a: -0.05, k: 0.05, p: 0 }, { a: 0.1, k: 0.08, p: 0 }], arms: [{ a: 0.12, e: 0.3 }, { a: 0.35 + Math.sin(u * 6.28) * 0.2, e: 1.6 + Math.sin(u * 6.28 + 1) * 0.35 }] }),
  shirt: (u) => ({ legs: [{ a: 0.08, f: 0, k: 0.06 }, { a: 0.08, f: 0, k: 0.06 }], arms: [{ a: 2.85 - u * 0.25, e: 0.55 }, { a: 2.85 - u * 0.25, e: 0.55 }] }),
};

export class Locker {
  // o: { team, kit (del partido), side, cast, at (segundo en que empieza) }
  constructor(o) {
    this.o = o;
    const { team, kit, side, cast, at } = o;
    this.team = team; this.kit = kit;
    const mk = (i, isGK = false) => kitFor(kit, lookOf(team, side, i), NUMS[i], isGK);
    // quién hace qué: dorsal, pose, cuadros, posición en el camarín
    this.people = [
      { i: 9, pose: 'tie', n: 4, x: 50, seat: true },
      { i: 10, pose: 'shirt', n: 3, x: 128, view: 'front', bare: true },
      { i: 4, pose: 'guard', n: 3, x: 214, seat: true, flip: true },
      { i: 7, pose: 'talk', n: 4, x: 268, flip: true },
      { i: 0, pose: 'gloves', n: 3, x: 336, seat: true, gk: true },
    ];
    for (const p of this.people) {
      p.kit = mk(p.i, p.gk);
      if (p.bare) p.kit = { ...p.kit, id: `${p.kit.id}|bare`, shirt: p.kit.skin, alt: p.kit.skin, trim: p.kit.skin, sleeve: undefined, pattern: 'plain', num: undefined };
      p.anim = `locker-${p.pose}`;
      for (let f = 0; f < p.n; f++) cast.want(p.anim, f, at, () => paint(POSE[p.pose](f / p.n), p.kit, p.view || 'side', SC));
    }
    this.shirtKit = mk(10);
    this.ball = P4.ball(4.5, 0.6);
    this.bg = null;
  }

  // ---------- fondo (se pinta una vez) ----------
  buildBg(H) {
    const W = SW, cv = canvas(W, H), g = cv.getContext('2d');
    const k = this.kit, team = this.team;
    const floorY = this.floorY = Math.round(H * 0.8);
    const wallB = floorY - 8;
    let ceilY = this.ceilY = Math.round(floorY - 222);
    const benchY = this.benchY = floorY - 21;
    const wood = ramp('#9a6a3c'), dk = ramp(mix(k.shirt, '#20242e', 0.72));
    // techo con paneles y tubos de luz
    // techo en perspectiva (se ve desde abajo): paneles que se abren hacia la cámara
    for (let y = 0; y < ceilY; y++) { g.fillStyle = y < ceilY * 0.5 ? '#232733' : '#1d2029'; g.fillRect(0, y, W, 1); }
    for (let i = -14; i < 30; i++) line(g, i * 30, ceilY, (i - 6) * 30 * 1.9 + W * 0.45, 0, '#2a2f3c');
    for (let y = ceilY - 3, st = 3; y > 0; st *= 1.5, y -= Math.round(st)) { g.fillStyle = '#2a2f3c'; g.fillRect(0, y, W, 1); }
    for (const lx of [60, 190, 320]) {
      // tubo de luz en perspectiva
      fillPoly(g, [[lx - 22, ceilY - 14], [lx + 22, ceilY - 14], [lx + 34, ceilY - 34], [lx - 34, ceilY - 34]], '#3a3f4c');
      fillPoly(g, [[lx - 19, ceilY - 16], [lx + 19, ceilY - 16], [lx + 29, ceilY - 31], [lx - 29, ceilY - 31]], '#fff3d6');
      fillPoly(g, [[lx - 14, ceilY - 19], [lx + 14, ceilY - 19], [lx + 20, ceilY - 28], [lx - 20, ceilY - 28]], '#ffffff');
    }
    // pared: franja con el nombre del club
    g.fillStyle = dk[1]; g.fillRect(0, ceilY, W, wallB - ceilY);
    // armarios de arriba, con puertas y una pelota o un bolso asomando
    const cab = ceilY + 2, cabH = 46;
    for (let x = 4, c = 0; x < W - 10; x += 40, c++) {
      g.fillStyle = wood[0]; g.fillRect(x, cab, 38, cabH);
      g.fillStyle = wood[2]; g.fillRect(x + 1, cab + 1, 17, cabH - 2); g.fillRect(x + 20, cab + 1, 17, cabH - 2);
      g.fillStyle = wood[3]; g.fillRect(x + 1, cab + 1, 17, 1); g.fillRect(x + 20, cab + 1, 17, 1); g.fillRect(x + 1, cab + 1, 1, cabH - 2); g.fillRect(x + 20, cab + 1, 1, cabH - 2);
      g.fillStyle = wood[1]; g.fillRect(x + 4, cab + 5, 11, cabH - 10); g.fillRect(x + 23, cab + 5, 11, cabH - 10);
      g.fillStyle = wood[2]; g.fillRect(x + 5, cab + 6, 9, cabH - 12); g.fillRect(x + 24, cab + 6, 9, cabH - 12);
      g.fillStyle = '#d8d2c0'; g.fillRect(x + 16, cab + 20, 1, 5); g.fillRect(x + 21, cab + 20, 1, 5);
      if (c % 3 === 1) { // una puerta entreabierta con toallas
        g.fillStyle = dk[0]; g.fillRect(x + 20, cab + 1, 17, cabH - 2);
        for (let j = 0; j < 4; j++) { g.fillStyle = j % 2 ? '#e9e6dc' : k.shirt; g.fillRect(x + 22, cab + 8 + j * 8, 13, 6); g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(x + 22, cab + 13 + j * 8, 13, 1); }
        fillPoly(g, [[x + 37, cab + 1], [x + 44, cab - 2], [x + 44, cab + cabH + 3], [x + 37, cab + cabH - 1]], wood[1]);
      }
    }
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, cab + cabH, W, 3);
    // la pared de arriba: el nombre del club grande, entre dos franjas
    ceilY += 52;
    g.fillStyle = k.shirt; g.fillRect(0, ceilY, W, 3);
    g.fillStyle = k.alt2 || dark(k.shirt, 0.3); g.fillRect(0, ceilY + 3, W, 1);
    const label = team.name.toUpperCase();
    const lw = pxTextW(label, 2) + 40;
    const ink = rgb(k.shirt).reduce((a, b) => a + b, 0) > 520 ? '#1d2230' : '#ffffff';
    const wallInk = mix(k.shirt, dk[1], 0.35);
    for (let x = 14; x < W; x += lw) { pxText(g, label, x + 1, ceilY + 16, dk[0], 2); pxText(g, label, x, ceilY + 15, wallInk, 2); }
    g.fillStyle = k.shirt; g.fillRect(0, ceilY + 34, W, 3);
    g.fillStyle = k.alt2 || dark(k.shirt, 0.3); g.fillRect(0, ceilY + 37, W, 1);
    // casilleros de madera, uno por jugador
    const top = ceilY + 46, cw = 40;
    this.cubbies = [];
    for (let c = 0, x = 4; x < W - 10; c++, x += cw) {
      this.cubbies.push(x);
      // marco
      g.fillStyle = wood[1]; g.fillRect(x, top, cw - 2, benchY - top);
      g.fillStyle = wood[2]; g.fillRect(x + 1, top, cw - 4, benchY - top);
      g.fillStyle = wood[3]; g.fillRect(x + 1, top, 1, benchY - top);
      // fondo del casillero
      g.fillStyle = dk[0]; g.fillRect(x + 3, top + 12, cw - 8, benchY - top - 14);
      g.fillStyle = dk[1]; g.fillRect(x + 3, top + 12, cw - 8, 2);
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x + 3, top + 14, 3, benchY - top - 16);
      // repisa y placa con el nombre
      g.fillStyle = wood[1]; g.fillRect(x + 1, top + 9, cw - 4, 2);
      const i = [9, 10, 4, 7, 0, 1, 2, 3, 5, 6, 8][c % 11];
      const nm = nameOf(team, i).split(' ').pop().toUpperCase().slice(0, 7);
      g.fillStyle = '#e9e4d6'; g.fillRect(x + 3, top + 2, cw - 8, 7);
      g.fillStyle = '#c2bba8'; g.fillRect(x + 3, top + 8, cw - 8, 1);
      pxText(g, nm, x + 3 + Math.round((cw - 8 - pxTextW(nm)) / 2), top + 3, '#2a2a33');
      // camiseta colgada (de espaldas, con el número), salvo la del que se la está poniendo
      if (i !== 10) this.hangShirt(g, x + cw / 2 - 1, top + 20, NUMS[i], i === 0);
      // zapatillas abajo
      // shorts doblados en la repisa de abajo
      g.fillStyle = k.shorts; g.fillRect(x + 8, benchY - 9, 18, 5);
      g.fillStyle = dark(k.shorts, 0.3); g.fillRect(x + 8, benchY - 5, 18, 1);
    }
    // banco
    g.fillStyle = wood[3]; g.fillRect(0, benchY - 3, W, 2);
    g.fillStyle = wood[2]; g.fillRect(0, benchY - 1, W, 3);
    g.fillStyle = wood[0]; g.fillRect(0, benchY + 2, W, 1);
    for (let x = 14; x < W; x += 50) { g.fillStyle = wood[0]; g.fillRect(x, benchY + 3, 3, floorY - benchY - 3); }
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, benchY + 3, W, 4);
    // botines en el piso, bajo el banco
    for (let x = 30; x < W; x += 74) {
      g.fillStyle = '#16181f'; g.fillRect(x, floorY - 4, 9, 3); g.fillRect(x + 11, floorY - 3, 9, 3);
      g.fillStyle = k.alt2 && k.alt2 !== k.shirt ? k.alt2 : '#e8e8e8'; g.fillRect(x + 2, floorY - 3, 4, 1); g.fillRect(x + 13, floorY - 2, 4, 1);
    }
    // zócalo
    g.fillStyle = dk[0]; g.fillRect(0, wallB - 3, W, 3);
    // piso de goma con el escudo en el medio, en perspectiva
    const fl = ramp(mix(k.shirt, '#1a1d26', 0.78));
    for (let y = wallB; y < H; y++) {
      const u = (y - wallB) / (H - wallB);
      g.fillStyle = u < 0.08 ? fl[0] : fl[1]; g.fillRect(0, y, W, 1);
    }
    for (let i = -20; i < 40; i++) {
      const x0 = i * 26, x1 = (i - 13) * 26 * 1.9 + W * 0.4;
      line(g, x0, wallB, x1, H, fl[0]);
    }
    for (let y = wallB + 4, s = 4; y < H; s *= 1.45, y += Math.round(s)) { g.fillStyle = fl[0]; g.fillRect(0, y, W, 1); }
    // escudo en el piso (elipse aplastada)
    const cx = 190, cy = floorY + 30;
    ellipse(g, cx, cy, 52, 15, mix(k.shirt, '#000', 0.25));
    ellipse(g, cx, cy, 48, 13, k.shirt);
    ellipse(g, cx, cy, 40, 10, k.alt2 && k.alt2 !== k.shirt ? k.alt2 : dark(k.shirt, 0.25));
    const sh = team.short;
    pxText(g, sh, cx - Math.round(pxTextW(sh, 2) / 2), cy - 5, ink === '#ffffff' && (k.alt2 || '').toLowerCase() === '#ffffff' ? '#1d2230' : ink, 2);
    // luz cálida de los tubos sobre la pared
    g.save(); g.globalCompositeOperation = 'screen';
    for (const lx of [60, 190, 320]) {
      const gr = g.createRadialGradient(lx, this.ceilY, 4, lx, this.ceilY, 110);
      gr.addColorStop(0, 'rgba(255,238,200,0.28)'); gr.addColorStop(1, 'rgba(255,238,200,0)');
      g.fillStyle = gr; g.fillRect(lx - 110, ceilY, 220, 200);
    }
    g.restore();
    // bolso, botellas y cinta sobre el banco / piso
    this.props(g, benchY, floorY);
    return cv;
  }

  // Camiseta de espaldas colgada en una percha.
  hangShirt(g, cx, y, num, gk) {
    const k = this.kit, base = gk ? k.gk : k.shirt;
    const r = ramp(base), alt = k.alt2 || base;
    cx = Math.round(cx);
    // percha
    g.fillStyle = '#c9ccd2'; g.fillRect(cx, y - 4, 1, 3); g.fillRect(cx - 7, y - 1, 15, 1);
    const pts = [[cx - 7, y], [cx + 8, y], [cx + 12, y + 6], [cx + 9, y + 8], [cx + 8, y + 5], [cx + 8, y + 24], [cx - 7, y + 24], [cx - 7, y + 5], [cx - 8, y + 8], [cx - 11, y + 6]];
    fillPoly(g, pts, r[2]);
    // patrón simple de la camiseta
    if (!gk) {
      const pat = k.pattern;
      g.fillStyle = alt;
      if (pat === 'stripes') for (let x = cx - 5; x < cx + 8; x += 4) g.fillRect(x, y + 1, 2, 23);
      if (pat === 'hoops') for (let yy = y + 3; yy < y + 24; yy += 5) g.fillRect(cx - 7, yy, 15, 2);
      if (pat === 'band') g.fillRect(cx - 7, y + 9, 15, 4);
      if (pat === 'sash') for (let d = 0; d < 20; d++) g.fillRect(cx + 6 - d * 0.7, y + 2 + d, 3, 1);
      if (pat === 'center') g.fillRect(cx - 2, y + 1, 5, 23);
      if (pat === 'sleeves') { g.fillRect(cx - 11, y + 4, 4, 4); g.fillRect(cx + 9, y + 4, 4, 4); }
      if (pat === 'checks') for (let yy = 0; yy < 4; yy++) for (let xx = 0; xx < 4; xx++) if ((xx + yy) % 2) g.fillRect(cx - 7 + xx * 4, y + 4 + yy * 5, 4, 5);
    }
    // pliegues y sombra
    g.fillStyle = r[1]; g.fillRect(cx + 5, y + 6, 3, 18); g.fillRect(cx - 7, y + 22, 15, 2);
    g.fillStyle = r[3]; g.fillRect(cx - 6, y + 1, 1, 20);
    g.fillStyle = r[0]; g.fillRect(cx - 1, y, 3, 1);
    // número
    const s = String(num), ink = rgb(base).reduce((a, b) => a + b, 0) > 480 ? '#1d2230' : '#f4f1ea';
    pxText(g, s, cx + 1 - Math.round(pxTextW(s) / 2), y + 10, ink);
  }

  props(g, benchY, floorY) {
    const k = this.kit;
    // botellas en el banco
    for (const [x, c] of [[168, '#3aa0e0'], [173, '#3aa0e0'], [298, '#e05a3a']]) {
      g.fillStyle = c; g.fillRect(x, benchY - 10, 3, 7);
      g.fillStyle = '#ffffff'; g.fillRect(x, benchY - 12, 3, 2);
      g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(x, benchY - 9, 1, 5);
    }
    // bolso del club en el piso
    const bx = 84, by = floorY + 10;
    fillPoly(g, [[bx, by - 12], [bx + 26, by - 12], [bx + 29, by], [bx - 3, by]], dark(k.shirt, 0.45));
    fillPoly(g, [[bx + 1, by - 11], [bx + 25, by - 11], [bx + 26, by - 7], [bx, by - 7]], dark(k.shirt, 0.25));
    g.fillStyle = k.alt2 || '#ffffff'; g.fillRect(bx + 2, by - 7, 24, 1);
    g.fillStyle = '#16181f'; g.fillRect(bx + 8, by - 15, 1, 3); g.fillRect(bx + 18, by - 15, 1, 3); g.fillRect(bx + 8, by - 16, 11, 1);
    g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(bx - 4, by, 35, 2);
    // cinta adhesiva
    ellipse(g, 246, floorY + 12, 4, 2, '#e8e6e0'); g.fillStyle = '#9a968e'; g.fillRect(245, floorY + 12, 2, 1);
  }

  // ---------- cuadro ----------
  draw(g, W, H, t) {
    if (t >= WIDE) return this.drawClose(g, W, H, t - WIDE);
    if (!this.bg || this.bg.height !== H) this.bg = this.buildBg(H);
    // la cámara recorre el banco
    const cam = Math.round(lerp(0, SW - W, ease(t / WIDE)));
    g.drawImage(this.bg, -cam, 0);
    const cast = this.o.cast, floorY = this.floorY;
    // la pelota en el piso
    g.drawImage(this.ball, 158 - cam, floorY + 8 - this.ball.height);
    for (const p of this.people) {
      const f = Math.floor((t * (p.pose === 'talk' ? 2.2 : 1.6) * p.n + p.i) % p.n);
      const s = cast.get(p.anim, f, p.n);
      if (!s) continue;
      const x = p.x - cam, y = floorY;
      // sombra en el piso
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(Math.round(x - 12), y - 1, 26, 2);
      drawSprite(g, s, x, y, p.flip);
      if (p.pose === 'shirt') this.liftedShirt(g, s, x, y, t);
    }
    // viñeta suave
    vignette(g, W, H);
  }

  // La camiseta a medio poner: los brazos ya entraron en las mangas y la tela,
  // arrugada, pasa por encima de la cabeza (el jugador de frente con los brazos arriba).
  liftedShirt(g, s, x, y, t) {
    const hx = s.hand.map((h) => [x - s.ox + h[0], y - s.oy + h[1]]);
    const c = [x - s.ox + s.c[0], y - s.oy + s.c[1]];   // centro del torso
    const kit = this.kit, r = ramp(kit.shirt);
    const alt = kit.alt2 && kit.alt2 !== kit.shirt ? kit.alt2 : null;
    const headY = c[1] - 27;                             // más o menos la cabeza
    const u = 0.5 + Math.sin(t * 2.4) * 0.5;             // la tela baja y sube un poco
    // mangas que envuelven los antebrazos
    hx.forEach((h, i) => {
      const sx = i ? 1 : -1;
      const el = [h[0] + sx * 3, h[1] + 15];
      fillPoly(g, [[h[0] - 3, h[1] + 3], [h[0] + 3, h[1] + 3], [el[0] + 4, el[1]], [el[0] - 4, el[1]]], r[2]);
      g.fillStyle = r[1]; g.fillRect(Math.round(el[0] + (i ? 1 : -3)), Math.round(h[1] + 6), 2, 9);
      if (alt) { g.fillStyle = alt; g.fillRect(Math.round(h[0] - 3), Math.round(h[1] + 3), 6, 1); }
    });
    // el cuerpo de la camiseta, arrugado sobre la cabeza
    const L = Math.min(hx[0][0], hx[1][0]) + 1, R = Math.max(hx[0][0], hx[1][0]) - 1;
    const top = Math.min(hx[0][1], hx[1][1]) + 12, bot = headY + 6 + Math.round(u * 3);
    const mid = (L + R) / 2;
    fillPoly(g, [[L - 2, top], [mid, top - 3], [R + 2, top], [R + 1, bot - 2], [mid + 5, bot + 2], [mid - 5, bot + 1], [L - 1, bot - 3]], r[2]);
    if (alt && kit.pattern === 'stripes') { g.fillStyle = alt; for (let xx = Math.round(L); xx < R; xx += 4) g.fillRect(xx, top, 2, bot - top); }
    if (alt && kit.pattern === 'hoops') { g.fillStyle = alt; for (let yy = top + 2; yy < bot; yy += 5) g.fillRect(Math.round(L), yy, Math.round(R - L), 2); }
    if (alt && (kit.pattern === 'band' || kit.pattern === 'sash')) { g.fillStyle = alt; g.fillRect(Math.round(L), Math.round((top + bot) / 2), Math.round(R - L), 3); }
    // pliegues: luz arriba, sombras en V hacia el cuello
    g.fillStyle = r[3]; g.fillRect(Math.round(L), top, Math.round(R - L), 1); g.fillRect(Math.round(L + 2), top + 1, 3, 1);
    g.fillStyle = r[1];
    line(g, L + 2, top + 3, mid - 2, bot - 2, r[1]); line(g, R - 2, top + 3, mid + 2, bot - 2, r[1]);
    g.fillRect(Math.round(L - 1), bot - 4, Math.round(R - L + 2), 1);
    g.fillStyle = r[0]; g.fillRect(Math.round(mid - 3), bot - 1, 7, 2);    // el cuello, por donde va a salir la cabeza
    g.fillStyle = r[4]; g.fillRect(Math.round(mid - 6), top + 2, 2, 1);
  }

  // ---------- primer plano: las manos atan los cordones ----------
  drawClose(g, W, H, t) {
    const k = this.kit, pk = this.people[0].kit;
    const gy = Math.round(H * 0.8);                     // el piso
    const fl = ramp(mix(k.shirt, '#1a1d26', 0.78)), wood = ramp('#9a6a3c');
    // fondo fuera de foco: la pared, el banco y el piso
    g.fillStyle = mix(k.shirt, '#20242e', 0.78); g.fillRect(0, 0, W, gy);
    for (let x = -10; x < W; x += 46) { g.fillStyle = mix(wood[1], '#20242e', 0.5); g.fillRect(x, 0, 30, Math.round(H * 0.42)); }
    g.fillStyle = mix(wood[2], '#20242e', 0.35); g.fillRect(0, Math.round(H * 0.42), W, 16);
    g.fillStyle = mix(wood[3], '#20242e', 0.35); g.fillRect(0, Math.round(H * 0.42), W, 3);
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, Math.round(H * 0.42) + 16, W, 8);
    for (const x of [8, 150]) { g.fillStyle = mix(wood[0], '#20242e', 0.4); g.fillRect(x, Math.round(H * 0.42) + 16, 10, gy - Math.round(H * 0.42) - 16); }
    // la pelota, fuera de foco a la derecha
    ellipse(g, 160, gy - 22, 22, 22, '#c9c6bd'); ellipse(g, 156, gy - 26, 15, 15, '#e4e1d8'); ellipse(g, 166, gy - 16, 6, 5, '#7a8db8');
    for (let y = gy; y < H; y++) { g.fillStyle = y < gy + 3 ? fl[0] : fl[1]; g.fillRect(0, y, W, 1); }
    for (let x = -60; x < W + 60; x += 22) line(g, x, gy, x + (x - W / 2) * 1.6, H, fl[0]);
    // desenfoque: velo oscuro sobre el fondo
    g.fillStyle = 'rgba(14,16,24,0.35)'; g.fillRect(0, 0, W, H);
    // la luz cae desde arriba a la izquierda
    const lift = Math.round(Math.sin(clamp(t / 1.6, 0, 1) * Math.PI) * 2);
    const bx = 22, by = gy - lift * 0;
    this.leg(g, bx, by, pk, k);
    this.boot(g, bx, by, k);
    // cordones y manos
    const eyes = [];
    for (let i = 0; i < 6; i++) { const u = i / 5; eyes.push([bx + lerp(42, 92, u), by + lerp(-51, -35, u)]); }
    this.laces(g, eyes, t);
    const top = eyes[0];
    // tirón: suben las manos, se cruzan para el nudo y vuelven a tirar
    const pull = ease(clamp(t / 0.7, 0, 1));
    const knot = clamp((t - 0.75) / 0.45, 0, 1);
    const tug = ease(clamp((t - 1.25) / 0.3, 0, 1));
    const spread = 18 - Math.sin(knot * Math.PI) * 12 + tug * 4;
    const up = 26 + pull * 20 - Math.sin(knot * Math.PI) * 10 + tug * 6;
    const hands = [[top[0] - spread, top[1] - up], [top[0] + spread + 4, top[1] - up + 3]];
    // las puntas del cordón hasta los dedos
    if (knot > 0.5) this.bow(g, top[0] + 1, top[1] - 5, clamp((knot - 0.5) * 2, 0, 1), hands);
    else hands.forEach((h, i) => { const p = handTip(h, i); line(g, top[0] + (i ? 2 : -2), top[1] - 2, p[0], p[1], i ? '#dcd8ce' : '#f4f1ea'); });
    hands.forEach((h, i) => this.hand(g, h, i, ramp(pk.skin)));
    vignette(g, W, H);
  }

  // La canilla con la media del club y la canillera abajo.
  leg(g, bx, by, pk, k) {
    const sock = ramp(pk.socks);
    const x0 = bx + 2, x1 = bx + 36;          // tobillo (atrás / adelante)
    const pts = [[x0 - 6, 0], [x1 + 14, 0], [x1 + 2, by - 54], [x0, by - 50]];
    fillPoly(g, pts, sock[2]);
    // tejido acanalado: columnas alternadas
    for (let y = 0; y < by - 52; y++) {
      const u = y / (by - 52), xa = lerp(x0 - 6, x0, u), xb = lerp(x1 + 14, x1 + 2, u);
      for (let x = Math.ceil(xa); x < xb; x++) {
        const rel = (x - xa) / (xb - xa);
        let c = null;
        if (rel < 0.16) c = sock[3];                       // borde iluminado
        else if (rel > 0.84) c = sock[1];                  // borde en sombra
        if (rel > 0.5 && rel < 0.82) c = rel < 0.56 ? sock[1] : rel < 0.6 ? sock[4] : sock[3]; // la canillera: un relieve
        if (!c && (x % 3 === 0)) c = sock[1];
        if (c) { g.fillStyle = c; g.fillRect(x, y, 1, 1); }
      }
    }
    // el borde de la canillera marcado en la media
    for (let y = 0; y < by - 60; y++) { const u = y / (by - 52); g.fillStyle = sock[0]; g.fillRect(Math.round(lerp(x0 - 6, x0, u) + (lerp(x1 + 14, x1 + 2, u) - lerp(x0 - 6, x0, u)) * 0.5), y, 1, 1); }
    // la franja de la media sobre el botín
    if (k.alt2 && k.alt2 !== pk.socks) { g.fillStyle = k.alt2; g.fillRect(x0, by - 58, x1 - x0 + 3, 2); }
  }

  boot(g, bx, by, k) {
    const b = ['#0b0b10', '#15151c', '#22222c', '#3a3a48', '#5c5c70'];
    const P = (pts) => pts.map(([x, y]) => [bx + x, by + y]);
    // la silueta
    const out = P([[0, -8], [-4, -22], [-3, -40], [0, -50], [16, -56], [36, -58], [46, -52], [72, -42], [102, -33], [124, -26], [136, -18], [138, -9]]);
    fillPoly(g, out, b[2]);
    // luz arriba (empeine y puntera), sombra abajo y en el talón
    fillPoly(g, P([[44, -50], [72, -40], [102, -31], [124, -24], [134, -17], [128, -16], [100, -27], [70, -36], [44, -45]]), b[3]);
    fillPoly(g, P([[104, -30], [122, -24], [130, -19], [118, -21]]), b[4]);
    fillPoly(g, P([[0, -8], [-4, -22], [-3, -40], [0, -50], [8, -50], [6, -12]]), b[1]);
    g.fillStyle = b[1]; g.fillRect(bx, by - 15, 138, 6);
    g.fillStyle = b[0]; g.fillRect(bx - 2, by - 10, 140, 2);
    // costura punteada
    for (let x = 10; x < 120; x += 3) { const y = x < 46 ? -44 : lerp(-40, -20, (x - 46) / 74); g.fillStyle = b[4]; g.fillRect(bx + x, Math.round(by + y + 8), 1, 1); }
    // la franja con el color del club
    const al = k.alt2 && k.alt2.toLowerCase() !== '#ffffff' ? k.alt2 : k.shirt;
    const ar = ramp(al);
    fillPoly(g, P([[14, -20], [48, -38], [80, -30], [84, -26], [50, -32], [18, -15]]), ar[2]);
    fillPoly(g, P([[48, -38], [80, -30], [80, -29], [50, -35]]), ar[3]);
    // cuello acolchado
    g.fillStyle = b[3]; g.fillRect(bx + 2, by - 51, 32, 2);
    // suela y tapones
    g.fillStyle = '#e6e1d4'; g.fillRect(bx - 2, by - 9, 141, 3);
    g.fillStyle = '#b4ad9c'; g.fillRect(bx - 2, by - 6, 141, 1);
    for (const x of [4, 20, 84, 102, 118, 130]) {
      fillPoly(g, P([[x, -6], [x + 7, -6], [x + 6, 0], [x + 1, 0]]), '#d6d0c0');
      g.fillStyle = '#9a9484'; g.fillRect(bx + x + 4, by - 5, 2, 5);
    }
    // sombra en el piso
    g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(bx - 4, by, 148, 2);
  }

  laces(g, eyes, t) {
    const tight = ease(clamp(t / 0.7, 0, 1));
    for (let i = 0; i < 5; i++) {
      const [ax, ay] = eyes[i], [cx, cy] = eyes[i + 1];
      const sag = (1 - tight) * (5 - i) * 0.5;
      line(g, ax - 3, ay - 3 + sag, cx + 3, cy + 2 + sag, '#f4f1ea');
      line(g, ax + 3, ay + 2 + sag, cx - 3, cy - 3 + sag, '#cfcabf');
    }
    for (const [ex, ey] of eyes) { g.fillStyle = '#8a909c'; g.fillRect(Math.round(ex) - 4, Math.round(ey) - 4, 2, 2); g.fillRect(Math.round(ex) + 3, Math.round(ey) + 2, 2, 2); }
  }

  // El moño: dos rulos que crecen y las puntas que cuelgan.
  bow(g, x, y, u, hands) {
    const r = Math.round(2 + u * 4);
    for (const s of [-1, 1]) {
      // rulo: un óvalo de cordón (solo el borde), inclinado hacia arriba
      const cx = x + s * (r + 1), cy = y - 2 - r * 0.3, ry = Math.max(2, r * 0.7);
      for (let a = 0; a < 6.28; a += 0.12) {
        const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * ry - Math.cos(a) * s * r * 0.25;
        g.fillStyle = Math.sin(a) > 0.2 ? '#cfcabf' : '#f4f1ea'; g.fillRect(Math.round(px), Math.round(py), 1, 1);
      }
    }
    g.fillStyle = '#dcd8ce'; g.fillRect(Math.round(x) - 1, Math.round(y) - 2, 3, 3);
    hands.forEach((h, i) => { const p = handTip(h, i); line(g, x + (i ? 2 * r : -2 * r), y - 1, p[0], p[1], '#e8e4da'); });
  }

  // Una mano que baja desde arriba con el antebrazo, pinzando el cordón con el
  // pulgar y el índice. i = 0 izquierda, 1 derecha (espejada).
  hand(g, at, i, sk) {
    const s = i ? -1 : 1, th = i ? 0.42 : -0.42;
    const c = Math.cos(th), sn = Math.sin(th);
    const T = (pts) => pts.map(([x, y]) => [at[0] + (x * s) * c - y * sn, at[1] + (x * s) * sn + y * c]);
    // antebrazo
    // antebrazo: ancho arriba (el músculo), angosto en la muñeca
    fillPoly(g, T([[-11, -110], [12, -110], [12, -70], [10, -40], [8, -8], [7, 0], [-7, 0], [-8, -10], [-11, -45], [-12, -75]]), sk[2]);
    fillPoly(g, T([[-11, -110], [-5, -110], [-5, -75], [-6, -45], [-4, -12], [-5, 0], [-7, 0], [-8, -10], [-11, -45], [-12, -75]]), sk[3]);
    fillPoly(g, T([[-10, -100], [-8, -100], [-8, -60], [-9, -60]]), sk[4]);
    fillPoly(g, T([[7, -110], [12, -110], [12, -70], [10, -40], [8, -8], [7, 0], [4, 0], [6, -40], [8, -70]]), sk[1]);
    fillPoly(g, T([[10, -105], [12, -105], [12, -70], [10, -60]]), sk[0]);
    fillPoly(g, T([[1, -55], [2, -55], [2, -14], [1, -14]]), sk[1]);       // tendón
    fillPoly(g, T([[-6, -3], [6, -3], [6, -1], [-6, -1]]), sk[1]);         // pliegue de la muñeca
    // el dorso de la mano
    fillPoly(g, T([[-8, -1], [8, -1], [10, 6], [10, 13], [-9, 13], [-9, 5]]), sk[2]);
    fillPoly(g, T([[-7, 0], [3, 0], [2, 6], [-7, 7]]), sk[3]);
    fillPoly(g, T([[-5, 1], [0, 1], [-1, 3], [-5, 4]]), sk[4]);
    fillPoly(g, T([[6, 2], [10, 6], [10, 13], [6, 13]]), sk[1]);
    // nudillos y dedos doblados
    fillPoly(g, T([[-9, 13], [10, 13], [9, 19], [-6, 19]]), sk[2]);
    for (const kx of [-6, -1, 4]) fillPoly(g, T([[kx, 12], [kx + 3, 12], [kx + 3, 13], [kx, 13]]), sk[3]);
    for (const kx of [-3, 2, 7]) fillPoly(g, T([[kx, 14], [kx + 1, 14], [kx + 1, 19], [kx, 19]]), sk[1]);
    fillPoly(g, T([[-6, 18], [9, 18], [8, 20], [-5, 20]]), sk[0]);
    // índice estirado hacia el pulgar y el pulgar
    fillPoly(g, T([[-9, 12], [-5, 13], [-6, 23], [-9, 23]]), sk[2]);
    fillPoly(g, T([[-9, 4], [-12, 9], [-13, 17], [-10, 23], [-8, 21], [-9, 12]]), sk[2]);
    fillPoly(g, T([[-11, 7], [-12, 9], [-13, 17], [-12, 17]]), sk[3]);
    fillPoly(g, T([[-10, 21], [-6, 21], [-6, 24], [-10, 24]]), sk[1]);
    // uña del pulgar
    fillPoly(g, T([[-12, 17], [-11, 17], [-11, 20], [-12, 20]]), sk[4]);
  }
}

// Dónde quedan las puntas de los dedos (por donde pasa el cordón).
function handTip(h, i) {
  const s = i ? -1 : 1, th = i ? 0.42 : -0.42;
  const x = -9 * s, y = 23;
  return [h[0] + x * Math.cos(th) - y * Math.sin(th), h[1] + x * Math.sin(th) + y * Math.cos(th)];
}

export function vignette(g, W, H) {
  g.save();
  const gr = g.createRadialGradient(W / 2, H * 0.48, H * 0.3, W / 2, H * 0.48, H * 0.75);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.5)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.restore();
}
