// Portada del menú: el 10 de tu equipo, con la pierna atrás, a punto de rematar al arco;
// estadio de noche con focos y tribuna, y una cancha de pasto en perspectiva.
// Se pinta en píxeles grandes (≈200 de ancho) y se escala sin suavizar.
import { P4 } from './players.js';
import { p4Kit } from './playerkit.js';

const rng = (seed) => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
const { rgb, mix } = P4;
const css = (r, g, b) => `rgb(${r | 0},${g | 0},${b | 0})`;
const dim = (c, f) => { const [r, g, b] = rgb(c); return css(r * f, g * f, b * f); };

const LOOK_10 = { skin: '#e0a77c', hair: '#3a2414', style: 'curly' };
const LOOK_GK = { skin: '#9c6440', hair: '#141010', style: 'buzz' };

// kit: camiseta de tu equipo; rival: la del arquero; W, H: tamaño en píxeles de la escena.
export function paintTitle(cv, W, H, kit, rival) {
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  g.imageSmoothingEnabled = false;
  const R = rng(7);

  // Cámara detrás del delantero (metros): altura, distancia al jugador, foco.
  const HY = Math.round(H * 0.3);          // horizonte
  const CAM = 2.6, ZP = 5;
  const F = (H * 0.38 * ZP) / CAM;         // pies del jugador al 68 % de la altura
  const sy = (z) => HY + (F * CAM) / z;
  const sx = (x, z) => W / 2 + (F * x) / z;
  const ZG = 24;                           // línea de gol
  const goalY = sy(ZG), boardY = Math.round(sy(ZG + 4.5));

  // ---------- cielo de noche ----------
  for (let y = 0; y < boardY; y++) {
    const t = y / boardY;
    const c = mix('#05060c', '#141a2c', t);
    g.fillStyle = c; g.fillRect(0, y, W, 1);
  }

  // ---------- tribuna detrás del arco ----------
  const top = Math.round(H * 0.105);
  const crowd = [kit.shirt, kit.shirt, kit.alt2 || '#f4f2ec', kit.shorts, '#d8d4c8', '#2a2e3a', rival.shirt];
  // techo
  g.fillStyle = '#0b0d14'; g.fillRect(0, top - 4, W, 4);
  g.fillStyle = '#2a2f40'; g.fillRect(0, top - 1, W, 1);
  for (let x = 3; x < W; x += 9) { g.fillStyle = '#161a26'; g.fillRect(x, top - 4, 1, 3); }
  for (let y = top; y < boardY - 5; y++) {
    const t = (y - top) / (boardY - top);
    g.fillStyle = (y - top) % 5 === 4 ? '#10121a' : mix('#151826', '#232838', t); g.fillRect(0, y, W, 1);
  }
  // bandeja del medio
  const mid = Math.round(top + (boardY - top) * 0.42);
  g.fillStyle = '#2e3446'; g.fillRect(0, mid, W, 2); g.fillStyle = '#0a0b10'; g.fillRect(0, mid + 2, W, 1);
  for (let x = 0; x < W; x += 34) { g.fillStyle = '#c8202a'; g.fillRect(x + 4, mid, 12, 2); g.fillStyle = '#f4f2ec'; g.fillRect(x + 18, mid, 10, 2); }
  for (let y = top + 2; y < boardY - 6; y += 3) {
    if (y >= mid - 1 && y <= mid + 3) continue;
    const lit = 0.42 + ((y - top) / (boardY - top)) * 0.55;
    for (let x = (y % 2) * 1 - 1; x < W; x += 3) {
      if (R() < 0.07) continue;
      const c = crowd[(R() * crowd.length) | 0];
      const up = R() < 0.18 ? 1 : 0; // algunos de pie
      g.fillStyle = dim(c, lit); g.fillRect(x, y + 1 - up, 2, 2);
      g.fillStyle = dim(R() < 0.72 ? '#e0a77c' : '#8a5634', lit * 1.05); g.fillRect(x, y - up, 2, 1);
      if (R() < 0.08) { g.fillStyle = dim(c, lit * 1.2); g.fillRect(x - 1, y - 1 - up, 1, 2); g.fillRect(x + 2, y - 1 - up, 1, 2); }
    }
  }
  // banderas y bengalas
  for (let i = 0; i < Math.round(W / 40); i++) {
    const x = Math.round(12 + R() * (W - 24)), y = Math.round(top + 6 + R() * (boardY - top - 18));
    g.fillStyle = '#9a9aa0'; g.fillRect(x, y, 1, 9);
    g.fillStyle = kit.shirt; g.fillRect(x + 1, y, 7, 4); g.fillStyle = dim(kit.alt2 || '#ffffff', 1); g.fillRect(x + 1, y + 2, 7, 1);
  }
  for (let i = 0; i < 2; i++) {
    const x = Math.round(W * (0.18 + i * 0.62)), y = Math.round(boardY - 12 - R() * 10);
    const rg = g.createRadialGradient(x, y, 0, x, y, 9); rg.addColorStop(0, 'rgba(255,90,50,.85)'); rg.addColorStop(0.35, 'rgba(255,60,40,.35)'); rg.addColorStop(1, 'rgba(255,60,40,0)');
    g.globalCompositeOperation = 'screen'; g.fillStyle = rg; g.fillRect(x - 10, y - 10, 20, 20); g.globalCompositeOperation = 'source-over';
    g.fillStyle = '#fff2c8'; g.fillRect(x, y, 1, 1);
    g.fillStyle = 'rgba(200,200,210,.18)'; for (let k = 0; k < 9; k++) g.fillRect(x - 2 + Math.round(Math.sin(k) * 2), y - 3 - k * 2, 4 + (k >> 2), 2);
  }
  // flashes de cámaras
  for (let i = 0; i < W / 12; i++) {
    const x = (R() * W) | 0, y = top + 2 + ((R() * (boardY - top - 10)) | 0);
    g.fillStyle = '#ffffff'; g.fillRect(x, y, 1, 1); g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3);
  }

  // ---------- carteles LED ----------
  const ads = [['#1a1c3a', '#ffd23f'], ['#b0202a', '#f4f2ec'], ['#e8ecef', '#1a1c3a'], ['#1d6a3a', '#f4f2ec'], ['#141414', '#ff8a2a']];
  for (let x = -5, i = 0; x < W; i++) {
    const w = 30 + ((i * 11) % 13), [bg, fg] = ads[i % ads.length];
    g.fillStyle = bg; g.fillRect(x, boardY - 5, w, 5);
    g.fillStyle = fg; for (let k = 3; k < w - 3; k += 2) if ((k * 7 + i * 3) % 5 !== 0) g.fillRect(x + k, boardY - 4 + ((k >> 1) % 2 ? 1 : 0), 1, 2);
    g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(x, boardY - 5, w, 1);
    x += w;
  }
  g.fillStyle = '#05060a'; g.fillRect(0, boardY, W, 1);

  // ---------- pasto en perspectiva con franjas de corte ----------
  const grass = g.createImageData(W, H - boardY - 1), d = grass.data;
  const lights = [[-0.42, 0.55], [0.42, 0.55]]; // charcos de luz de los focos (x relativo, profundidad)
  for (let y = boardY + 1; y < H; y++) {
    const z = (F * CAM) / Math.max(0.5, y - HY);
    const band = Math.floor((z + 200) / 5.5) % 2;     // franjas de 5,5 m
    const near = Math.min(1, (y - boardY) / (H - boardY));
    for (let x = 0; x < W; x++) {
      const wx = ((x - W / 2) * z) / F;
      const diag = Math.floor((wx + 300) / 5.5) % 2; // corte cruzado, suave
      let r = band ? 62 : 52, gg = band ? 138 : 122, b = band ? 52 : 46;
      if (diag) { r += 3; gg += 5; b += 2; }
      // textura: más fina a lo lejos
      const n = R();
      const k = near > 0.25 ? (n < 0.1 ? 0.84 : n < 0.2 ? 1.1 : n < 0.24 ? 1.2 : 1) : n < 0.08 ? 0.92 : 1;
      // luz de los focos y sombra hacia los costados
      let li = 0.78 + near * 0.18;
      for (const [lx, lz] of lights) { const dx = (x / W - 0.5) - lx * 0.9, dz = near - lz; li += 0.1 * Math.exp(-(dx * dx * 6 + dz * dz * 5)); }
      li -= Math.abs(x / W - 0.5) * 0.18;
      const i = ((y - boardY - 1) * W + x) * 4;
      d[i] = r * k * li; d[i + 1] = gg * k * li; d[i + 2] = b * k * li; d[i + 3] = 255;
    }
  }
  g.putImageData(grass, 0, boardY + 1);

  // ---------- líneas: área grande, área chica, punto penal y medialuna ----------
  const seg = (x0, z0, x1, z1, a = 0.82) => {
    const n = Math.ceil(Math.max(Math.abs(sx(x1, z1) - sx(x0, z0)), Math.abs(sy(z1) - sy(z0)))) * 2 + 2;
    for (let i = 0; i <= n; i++) {
      const t = i / n, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t, Y = sy(z);
      if (Y <= boardY) continue;
      const w = Y > H * 0.55 ? 2 : 1;
      g.fillStyle = `rgba(236,242,228,${a})`; g.fillRect(Math.round(sx(x, z)), Math.round(Y), w, Y > H * 0.75 ? 2 : 1);
    }
  };
  seg(-W, ZG, W, ZG);
  seg(-20.16, ZG, -20.16, ZG - 16.5); seg(20.16, ZG, 20.16, ZG - 16.5); seg(-20.16, ZG - 16.5, 20.16, ZG - 16.5);
  seg(-9.16, ZG, -9.16, ZG - 5.5); seg(9.16, ZG, 9.16, ZG - 5.5); seg(-9.16, ZG - 5.5, 9.16, ZG - 5.5);
  { // medialuna
    let px = null;
    for (let a = -0.93; a <= 0.93; a += 0.02) { const x = Math.sin(a) * 9.15, z = ZG - 11 - Math.cos(a) * 9.15; if (px) seg(px[0], px[1], x, z); px = [x, z]; }
  }
  g.fillStyle = 'rgba(236,242,228,.9)'; g.fillRect(Math.round(sx(0, ZG - 11)) - 1, Math.round(sy(ZG - 11)), 2, 1);

  // ---------- arco con red y arquero ----------
  const gx0 = Math.round(sx(-3.66, ZG)), gx1 = Math.round(sx(3.66, ZG)), gb = Math.round(goalY), gt = Math.round(gb - (F * 2.44) / ZG);
  const back = Math.round(sy(ZG + 2)), bx0 = Math.round(sx(-3.66, ZG + 2)), bx1 = Math.round(sx(3.66, ZG + 2)), bt = Math.round(back - (F * 2.2) / (ZG + 2));
  g.fillStyle = 'rgba(8,10,16,.5)'; g.fillRect(bx0, bt, bx1 - bx0, back - bt);
  g.fillStyle = 'rgba(210,216,228,.32)';
  for (let x = bx0 + 1; x < bx1; x += 2) g.fillRect(x, bt, 1, back - bt);
  for (let y = bt + 1; y < back; y += 2) g.fillRect(bx0, y, bx1 - bx0, 1);
  // laterales de la red
  for (let y = gt; y < gb; y += 2) { g.fillRect(gx0 + 1, y, bx0 - gx0, 1); g.fillRect(bx1, y, gx1 - bx1, 1); }
  // arquero
  const gkKit = p4Kit({ ...rival, gk: rival.gk || '#e6c21e' }, true, LOOK_GK, 1);
  const kh = (F * 1.88) / ZG, ksc = Math.max(8, Math.round((860 / kh) / 2) * 2);
  const keeper = P4.sprite(P4.POSES.keeperReady(0.25), gkKit, 'front', ksc, null, true);
  g.fillStyle = 'rgba(6,20,8,.35)'; g.fillRect(Math.round(W / 2 - kh * 0.3), gb, Math.round(kh * 0.6), 1);
  g.drawImage(keeper.cv, Math.round(W / 2 - keeper.ox), Math.round(gb - 1 - keeper.oy));
  // palos y travesaño
  g.fillStyle = '#ffffff'; g.fillRect(gx0 - 1, gt, 2, gb - gt + 1); g.fillRect(gx1 - 1, gt, 2, gb - gt + 1); g.fillRect(gx0 - 1, gt - 1, gx1 - gx0 + 2, 2);
  g.fillStyle = '#aab0bc'; g.fillRect(gx0, gt + 1, 1, gb - gt); g.fillRect(gx1, gt + 1, 1, gb - gt);

  // ---------- focos en las esquinas ----------
  g.globalCompositeOperation = 'screen';
  for (const lx of [0.06, 0.94]) {
    const x = W * lx, y = H * 0.03;
    const rg = g.createRadialGradient(x, y, 1, x, y, H * 0.5); rg.addColorStop(0, 'rgba(255,246,220,.55)'); rg.addColorStop(0.08, 'rgba(255,240,206,.2)'); rg.addColorStop(0.4, 'rgba(180,200,255,.05)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = rg; g.fillRect(0, 0, W, H);
  }
  g.globalCompositeOperation = 'source-over';
  for (const lx of [0.06, 0.94]) {
    const x = Math.round(W * lx) - 7, y = Math.round(H * 0.03) - 3;
    g.fillStyle = '#1a1d26'; g.fillRect(x - 1, y - 1, 16, 9);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) { g.fillStyle = (r + c) % 2 ? '#fff6dc' : '#ffffff'; g.fillRect(x + c * 3, y + r * 3, 2, 2); }
    g.fillStyle = '#1a1d26'; g.fillRect(x + 6, y + 8, 2, top - y - 12);
  }

  // ---------- el 10, con la pierna atrás, a punto de rematar ----------
  const kit10 = p4Kit(kit, false, LOOK_10, 10);
  const ph = (F * 1.82) / ZP, psc = Math.max(4, Math.round((860 / ph) / 2) * 2);
  const xp = -0.75, feetY = Math.round(sy(ZP)), px = Math.round(sx(xp, ZP));
  const pl = P4.sprite(P4.POSES.kick(0.3), kit10, 'side', psc);
  // sombras de los cuatro focos: dos largas y suaves hacia adelante
  g.fillStyle = 'rgba(8,24,10,.28)';
  for (const s of [-1, 1]) { g.save(); g.translate(px, feetY); g.transform(1, 0, s * 0.55, 0.22, 0, 0); g.beginPath(); g.ellipse(0, -ph * 0.5, ph * 0.12, ph * 0.5, 0, 0, 7); g.fill(); g.restore(); }
  g.fillStyle = 'rgba(6,18,8,.5)'; g.beginPath(); g.ellipse(px, feetY, ph * 0.2, ph * 0.045, 0, 0, 7); g.fill();
  g.drawImage(pl.cv, px - pl.ox, feetY - pl.oy);
  // pelota adelante del pie derecho
  const br = Math.max(3, Math.round(ph * 0.06)), bxp = Math.round(sx(xp + 0.42, ZP + 0.1)), byp = Math.round(sy(ZP + 0.1));
  g.fillStyle = 'rgba(6,18,8,.5)'; g.beginPath(); g.ellipse(bxp + 1, byp, br * 1.1, br * 0.35, 0, 0, 7); g.fill();
  const ball = P4.ball(br, 0.3);
  g.drawImage(ball, bxp - (ball.width >> 1), byp - br * 2 + 1 - (ball.height >> 1) + br);

  // ---------- viñeta ----------
  const vg = g.createRadialGradient(W / 2, H * 0.45, H * 0.25, W / 2, H * 0.45, H * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(3,4,10,.55)');
  g.fillStyle = vg; g.fillRect(0, 0, W, H);
  return { feetY, goalY: gb };
}

// Íconos de los modos, en pixel art (cada letra es un color).
const PAL = { k: '#0c0f15', y: '#ffd23f', o: '#c77a12', w: '#f4f1e6', g: '#9aa3b5', b: '#7ec8f0', r: '#e05a4a', n: '#5b4630', d: '#3a4152' };
const ICONS = {
  ball: ['...kkkk...', '..kwwwwk..', '.kwwkkwwk.', 'kwwkkkkwwk', 'kwkwkkwkwk', 'kwwwwwwwwk', 'kwkwwwwkwk', '.kwkwwkwk.', '..kwwwwk..', '...kkkk...'],
  cup: ['kkkkkkkkkk', 'kyyyyyyyyk', 'kyykyyyoyk', '.kyyyyyok.', '..kyyyok..', '...kyok...', '....kk....', '...kyok...', '..kkkkkk..', '..knnnnk..'],
  bracket: ['ww........', 'kkkk......', '...k......', '...kkk....', '...k.k....', 'kkkk.kkkyy', 'ww...k..yy', '...kkk....', '...k......', 'kkkk......'],
  duo: ['..kk..kk..', '.kwwkkwwk.', '.kwwkkwwk.', '..kk..kk..', '.kbbkkrrk.', 'kbbbbkrrrk', 'kbbbbkrrrk', '.kbbk.krk.', '.k.k..k.k.', '..........'],
  table: ['kkkkkkkkkk', 'kyykwwwwwk', 'kkkkkkkkkk', 'kggkwwwwwk', 'kkkkkkkkkk', 'kggkwwwwwk', 'kkkkkkkkkk', 'kddkwwwwwk', 'kkkkkkkkkk', '..........'],
};
export function paintIcon(cv, name) {
  const m = ICONS[name];
  if (!m) return;
  cv.width = m[0].length; cv.height = m.length;
  const g = cv.getContext('2d');
  m.forEach((row, y) => [...row].forEach((ch, x) => { if (PAL[ch]) { g.fillStyle = PAL[ch]; g.fillRect(x, y, 1, 1); } }));
}
