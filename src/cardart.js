// Ilustraciones de las cartas de situación y de disciplina: escenas de 104x60
// píxeles con los mismos jugadores pintados del partido, en los colores de cada equipo.
import { P4 } from './players.js';

const CARDART = (() => {
  const W = 104, H = 60;
  const rng = (seed) => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
  const rgb = P4.rgb, mix = P4.mix;
  const shade = (c, f) => { const [r, g, b] = rgb(c); return `rgb(${Math.round(r * f)},${Math.round(g * f)},${Math.round(b * f)})`; };
  const cv = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };

  // Kits de muestra (en el juego se usan los colores del equipo)
  const D_HOME = { id: 'h', shirt: '#7cc4ec', alt: '#f4f2ec', pattern: 'stripes', trim: '#1c2340', shorts: '#1c2340', socks: '#f4f2ec', sockTrim: '#7cc4ec', boots: '#1d1d26', bootStripe: '#ffd23f', skin: '#e0a77c', hair: '#3a2414', hairStyle: 'curly', beard: 'stubble', crest: '#ffd23f', num: '10' };
  const D_AWAY = { id: 'a', shirt: '#d0202a', alt: '#f4f2ec', trim: '#f4f2ec', shorts: '#f4f2ec', socks: '#d0202a', sockTrim: '#f4f2ec', boots: '#f0ece0', skin: '#9c6440', hair: '#1e1612', hairStyle: 'short', crest: '#f4f1ea', num: '4' };
  const D_AWAY2 = { ...D_AWAY, id: 'a2', skin: '#f1c7a0', hair: '#7a5530', hairStyle: 'fringe', beard: 'full', num: '6' };
  const REF = { id: 'ref', shirt: '#1a1c22', alt: '#1a1c22', trim: '#e8c34a', shorts: '#1a1c22', socks: '#1a1c22', sockTrim: '#e8c34a', boots: '#111111', skin: '#c68657', hair: '#141010', hairStyle: 'buzz', beard: 'stubble' };
  const D_GK = { id: 'gk', shirt: '#f2c21b', trim: '#1a1a1a', shorts: '#1a1a1a', socks: '#f2c21b', sockTrim: '#1a1a1a', boots: '#1d1d26', skin: '#8a5634', hair: '#141010', hairStyle: 'buzz', beard: 'full', gk: 1, gloves: '#f2f2ee', gloveTrim: '#2a6ad8', long: 1, num: '1' };
  const COACH = { id: 'dt', shirt: '#262a36', alt: '#262a36', sleeve: '#262a36', long: 1, trim: '#d8dce6', vneck: 1, shorts: '#22252f', trousers: 1, socks: '#22252f', sockTrim: '#22252f', boots: '#141414', sole: '#141414', skin: '#e0a77c', hair: '#8a8a8a', hairStyle: 'short', beard: 'stubble' };
  const COACH2 = { ...COACH, id: 'dt2', shirt: '#3a2e2a', sleeve: '#3a2e2a', skin: '#c68657', hair: '#141010', hairStyle: 'buzz', beard: 'full' };
  const D_HOME2 = { ...D_HOME, id: 'h2', skin: '#9c6440', hair: '#141010', hairStyle: 'buzz', beard: 0, num: '9' };
  const D_HOME3 = { ...D_HOME, id: 'h3', skin: '#f1c7a0', hair: '#d9b25a', hairStyle: 'long', beard: 0, num: '7' };
  const D_AWAY3 = { ...D_AWAY, id: 'a3', skin: '#c68657', hair: '#2a1a10', hairStyle: 'curly', num: '3' };
  // Kits de la escena actual: A = el equipo de la carta, B = el rival (se cambian en render)
  let HOME, HOME2, HOME3, AWAY, AWAY2, AWAY3, GK, CROWD;
  const MEDIC = { id: 'med', shirt: '#e8ece6', alt: '#e8ece6', trim: '#2a8a4a', shorts: '#2a8a4a', socks: '#e8ece6', sockTrim: '#2a8a4a', boots: '#2a2a2a', skin: '#e0a77c', hair: '#2a1a10', hairStyle: 'short' };

  // ---------- fondo: tribuna de noche, carteles y pasto ----------
  function stadium(g, o = {}) {
    const R = rng(o.seed || 11);
    const horizon = o.horizon ?? 30;
    g.fillStyle = '#07080e'; g.fillRect(0, 0, W, H);
    // bandejas
    for (let y = 2; y < horizon - 5; y++) { g.fillStyle = (y % 4 === 3) ? '#14161f' : '#1f2232'; g.fillRect(0, y, W, 1); }
    g.fillStyle = '#3c4152'; g.fillRect(0, 12, W, 1);
    // hinchas: 2x2 con cabeza
    const cols = o.crowd || CROWD;
    for (let y = 3; y < horizon - 6; y += 3) for (let x = (y % 2) * 1; x < W; x += 3) {
      if (R() < 0.1) continue;
      const lit = 0.55 + (y / horizon) * 0.5;
      g.fillStyle = shade(cols[(R() * cols.length) | 0], lit); g.fillRect(x, y + 1, 2, 1);
      g.fillStyle = shade(R() < 0.7 ? '#e0a77c' : '#9c6440', lit); g.fillRect(x, y, 2, 1);
      if (o.excite && R() < 0.3) { g.fillRect(x - 1, y - 1, 1, 1); g.fillRect(x + 2, y - 1, 1, 1); }
    }
    // flashes
    for (let i = 0; i < (o.flashes ?? 4); i++) { const x = (R() * W) | 0, y = 3 + ((R() * (horizon - 10)) | 0); g.fillStyle = '#ffffff'; g.fillRect(x, y, 1, 1); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3); }
    // carteles
    const ads = ['#1a1c3a', '#a8202a', '#d8dce6', '#2a7a3a'];
    for (let x = 0, i = 0; x < W; i++) { const w = 18 + ((i * 7) % 9); g.fillStyle = ads[i % 4]; g.fillRect(x, horizon - 5, w, 4); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(x + 2, horizon - 4, w - 5, 1); g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(x + 3, horizon - 3, w - 7, 1); x += w + 1; }
    g.fillStyle = '#05060a'; g.fillRect(0, horizon - 1, W, 1);
    // pasto con franjas en perspectiva
    for (let y = horizon; y < H; y++) {
      const d = (y - horizon) / (H - horizon), s = 0.4 + d * 0.6;
      for (let x = 0; x < W; x++) {
        const band = Math.floor(((x - W / 2) / s + 400) / 14) % 2;
        const r = R();
        const base = band ? [74, 156, 64] : [63, 140, 56];
        const k = (r < 0.12 ? 0.9 : r < 0.22 ? 1.07 : 1) * (0.82 + d * 0.22);
        g.fillStyle = `rgb(${base[0] * k | 0},${base[1] * k | 0},${base[2] * k | 0})`; g.fillRect(x, y, 1, 1);
      }
    }
    g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(0, horizon, W, 2);
    // focos: halo de luz arriba
    g.globalCompositeOperation = 'screen';
    for (const lx of [6, W - 6]) { const rg = g.createRadialGradient(lx, 0, 1, lx, 0, 70); rg.addColorStop(0, 'rgba(255,244,214,.45)'); rg.addColorStop(0.1, 'rgba(255,244,214,.12)'); rg.addColorStop(1, 'rgba(255,244,214,0)'); g.fillStyle = rg; g.fillRect(0, 0, W, H); }
    g.globalCompositeOperation = 'source-over';
  }
  function line(g, y, a = 0.85) { g.fillStyle = `rgba(240,245,232,${a})`; g.fillRect(0, y, W, 1); }
  function shadow(g, x, y, w) { g.fillStyle = 'rgba(6,22,8,.42)'; g.beginPath(); g.ellipse(x, y, w, Math.max(1.5, w / 6), 0, 0, 7); g.fill(); }
  function put(g, s, x, y, flip) {
    const dx = Math.round(x - (flip ? s.cv.width - s.ox : s.ox)), dy = Math.round(y - s.oy);
    if (flip) { g.save(); g.translate(dx + s.cv.width, dy); g.scale(-1, 1); g.drawImage(s.cv, 0, 0); g.restore(); } else g.drawImage(s.cv, dx, dy);
    return { dx, dy, map: (p) => [flip ? dx + s.cv.width - p[0] : dx + p[0], dy + p[1]] };
  }
  function vignette(g, k = 0.45) { const vg = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.62); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(4,5,12,${k})`); g.fillStyle = vg; g.fillRect(0, 0, W, H); }
  const ball = (g, x, y, r = 2.5, spin = 0) => { const b = P4.ball(r, spin); g.drawImage(b, Math.round(x - b.width / 2), Math.round(y - b.height / 2)); };
  const SC = 18; // jugadores de ≈47 px
  const S = (pose, kit, view, sc = SC) => P4.sprite(pose, kit, view, sc);

  // Arco visto de frente, con red
  function goal(g, gx0, gx1, gt, gb) {
    g.fillStyle = 'rgba(10,14,22,.5)'; g.fillRect(gx0, gt, gx1 - gx0, gb - gt);
    g.fillStyle = 'rgba(220,226,236,.45)';
    for (let x = gx0 + 2; x < gx1; x += 3) g.fillRect(x, gt + 1, 1, gb - gt - 1);
    for (let y = gt + 2; y < gb; y += 3) g.fillRect(gx0 + 1, y, gx1 - gx0 - 2, 1);
    g.fillStyle = '#ffffff'; g.fillRect(gx0 - 2, gt - 2, 3, gb - gt + 2); g.fillRect(gx1 - 1, gt - 2, 3, gb - gt + 2); g.fillRect(gx0 - 2, gt - 2, gx1 - gx0 + 4, 2);
    g.fillStyle = '#b8bec8'; g.fillRect(gx0, gt, 1, gb - gt); g.fillRect(gx1 - 1, gt, 1, gb - gt); g.fillRect(gx0, gt, gx1 - gx0, 1);
    line(g, gb, 0.9);
  }

  // Tarjeta en la mano del árbitro, con brillo
  function card(g, x, y, col) {
    g.fillStyle = '#000'; g.fillRect(x - 3, y - 9, 7, 10);
    g.fillStyle = col; g.fillRect(x - 2, y - 8, 5, 8);
    g.fillStyle = mix(col, '#ffffff', 0.45); g.fillRect(x - 2, y - 8, 2, 1); g.fillRect(x - 2, y - 7, 1, 2);
    g.fillStyle = mix(col, '#000000', 0.25); g.fillRect(x + 2, y - 7, 1, 7);
    g.globalCompositeOperation = 'screen';
    const rg = g.createRadialGradient(x, y - 4, 1, x, y - 4, 16); rg.addColorStop(0, mix(col, '#ffffff', 0.3) + '88'); rg.addColorStop(1, '#00000000'); g.fillStyle = rg; g.fillRect(x - 16, y - 20, 32, 32);
    g.globalCompositeOperation = 'source-over';
  }

  const SCENES = {
    // Genialidad del crack: el 10 se va con la pelota y el rival queda en el piso
    crack(g) {
      stadium(g, { excite: true, flashes: 8 });
      line(g, 41, 0.6);
      const def = S(P4.POSES.slide(), AWAY, 'side');
      shadow(g, 30, 55, 16); put(g, def, 34, 56, true);
      const pl = S({ ...P4.POSES.run(0.62, 1.1), lean: 0.3 }, HOME, 'side');
      shadow(g, 64, 57, 12);
      const p = put(g, pl, 62, 57);
      const toe = p.map(pl.toe[1]);
      ball(g, Math.max(toe[0], p.map(pl.toe[0])[0]) + 4, 55, 2.5, 1);
      // líneas de velocidad
      g.fillStyle = 'rgba(255,255,255,.45)';
      for (const [y, w] of [[22, 10], [30, 14], [38, 8]]) g.fillRect(p.dx - w - 2, p.dy + y, w, 1);
      vignette(g);
    },
    // Lluvia: noche gris, gotas cruzadas y charcos que brillan
    lluvia(g) {
      stadium(g, { flashes: 0, seed: 5 });
      g.fillStyle = 'rgba(30,45,70,.42)'; g.fillRect(0, 0, W, H);
      line(g, 41, 0.45);
      const R = rng(9);
      // charcos con el reflejo de los focos
      for (const [x, y, w] of [[16, 50, 14], [70, 54, 18], [44, 46, 9]]) { g.fillStyle = 'rgba(150,175,205,.35)'; g.beginPath(); g.ellipse(x, y, w, 1.6, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(230,240,255,.55)'; g.fillRect(x - w / 3, y, w / 3, 1); }
      const pl = S(P4.POSES.runFront(0.3, 0.8), HOME, 'front');
      shadow(g, 52, 57, 9);
      put(g, pl, 52, 57);
      // pelo mojado y gotas que saltan de los pies
      g.fillStyle = 'rgba(200,220,240,.8)'; for (let i = 0; i < 8; i++) g.fillRect(44 + R() * 18, 52 + R() * 5, 1, 1);
      // lluvia en dos capas
      for (let i = 0; i < 140; i++) { const x = R() * (W + 20) - 10, y = R() * H, l = 3 + R() * 4; g.fillStyle = R() < 0.4 ? 'rgba(220,232,250,.6)' : 'rgba(170,190,220,.35)'; for (let k = 0; k < l; k++) g.fillRect(Math.round(x - k * 0.35), Math.round(y + k), 1, 1); }
      vignette(g, 0.55);
    },
    // Lesión: el jugador en el pasto agarrándose la pierna y el médico que llega con el maletín
    lesion(g) {
      stadium(g, { flashes: 2, seed: 21 });
      line(g, 41, 0.6);
      const down = S({ lean: 0.25, twist: 0.5, rot: -1.62, legs: [{ a: 1.35, k: 1.55, p: 0.3 }, { a: 0.12, k: 0.25, p: 0.6 }], arms: [{ a: 1.05, e: 0.25 }, { a: 0.95, e: 0.35 }], headTilt: -0.3 }, AWAY2, 'side');
      shadow(g, 40, 56, 20); put(g, down, 40, 57);
      const med = S({ lean: 0.35, twist: 0.45, lift: 0, legs: [{ a: 1.25, k: 2.0, p: 0.3 }, { a: 0.05, k: 1.65, p: 1.2 }], arms: [{ a: 1.0, e: 0.6 }, { a: 1.2, e: 0.5 }] }, MEDIC, 'side');
      shadow(g, 76, 57, 11); const m = put(g, med, 76, 57, true);
      // maletín y cruz
      g.fillStyle = '#000'; g.fillRect(86, 49, 11, 8); g.fillStyle = '#c8202a'; g.fillRect(87, 50, 9, 6); g.fillStyle = '#f4f2ec'; g.fillRect(91, 51, 1, 4); g.fillRect(89, 52, 5, 2);
      g.fillStyle = '#2a2a2a'; g.fillRect(89, 48, 5, 1);
      // aerosol frío: nubecita
      g.fillStyle = 'rgba(235,245,255,.55)'; for (const [x, y] of [[54, 47], [56, 46], [55, 45], [58, 47]]) g.fillRect(x, y, 2, 1);
      vignette(g);
    },
    // Fortuna de arquero: la estirada con la punta de los dedos
    arquero(g) {
      // de frente al arco: el arquero vuela delante de la red
      g.fillStyle = '#07080e'; g.fillRect(0, 0, W, H);
      stadium(g, { horizon: 18, flashes: 6, seed: 33 });
      // arco y red
      const gx0 = 8, gx1 = 96, gt = 16, gb = 52;
      g.fillStyle = 'rgba(10,14,22,.5)'; g.fillRect(gx0, gt, gx1 - gx0, gb - gt);
      g.fillStyle = 'rgba(220,226,236,.45)';
      for (let x = gx0 + 2; x < gx1; x += 3) g.fillRect(x, gt + 1, 1, gb - gt - 1);
      for (let y = gt + 2; y < gb; y += 3) g.fillRect(gx0 + 1, y, gx1 - gx0 - 2, 1);
      g.fillStyle = '#ffffff'; g.fillRect(gx0 - 2, gt - 2, 3, gb - gt + 2); g.fillRect(gx1 - 1, gt - 2, 3, gb - gt + 2); g.fillRect(gx0 - 2, gt - 2, gx1 - gx0 + 4, 2);
      g.fillStyle = '#b8bec8'; g.fillRect(gx0, gt, 1, gb - gt); g.fillRect(gx1 - 1, gt, 1, gb - gt); g.fillRect(gx0, gt, gx1 - gx0, 1);
      line(g, gb, 0.9);
      const k = S(P4.POSES.keeperDive(1, 0.55), GK, 'front', 18);
      const cx = 52, cy = 30;
      g.drawImage(k.cv, Math.round(cx - k.c[0]), Math.round(cy - k.c[1]));
      const hand = [cx - k.c[0] + Math.max(k.hand[0][0], k.hand[1][0]), cy - k.c[1] + Math.min(k.hand[0][1], k.hand[1][1])];
      ball(g, hand[0] + 4, hand[1] - 2, 3, 2);
      // chispazo del roce
      g.fillStyle = 'rgba(255,250,210,.9)'; for (const [dx, dy] of [[3, -6], [7, -4], [8, 0], [2, 3]]) g.fillRect(Math.round(hand[0] + 4 + dx), Math.round(hand[1] - 2 + dy), 1, 1);
      shadow(g, cx, gb + 3, 18);
      vignette(g);
    },
    // Ánimo de la hinchada: la tribuna de cerca, bengalas, bandera y tres hinchas a los gritos
    hinchada(g) {
      const R = rng(71);
      g.fillStyle = '#0a0b12'; g.fillRect(0, 0, W, H);
      // fondo: tribuna llena y saltando
      for (let y = 2; y < 40; y += 3) for (let x = (y % 2); x < W; x += 3) {
        const lit = 0.45 + y / 80;
        g.fillStyle = shade([HOME.shirt, HOME.alt || '#f4f2ec', HOME.shirt, HOME.shorts][(R() * 4) | 0], lit); g.fillRect(x, y + 1, 2, 2);
        g.fillStyle = shade(R() < 0.7 ? '#e0a77c' : '#9c6440', lit); g.fillRect(x, y, 2, 1);
        if (R() < 0.35) g.fillRect(x - 1, y - 1, 1, 1);
      }
      // bandera gigante a rayas que baja por la tribuna
      for (let y = 4; y < 26; y++) for (let x = 6; x < 46; x++) {
        const wave = Math.sin(x * 0.25 + y * 0.1) * 0.12;
        const c = Math.floor((x + Math.sin(y * 0.3) * 1.5) / 5) % 2 ? (HOME.alt !== HOME.shirt ? HOME.alt : '#f4f2ec') : HOME.shirt;
        g.fillStyle = shade(c, 0.78 + wave + y * 0.004); g.fillRect(x, y, 1, 1);
      }
      g.fillStyle = '#ffd23f'; for (const [x, y] of [[24, 13], [25, 12], [26, 13], [25, 14], [24, 15], [26, 15]]) g.fillRect(x, y, 1, 1); // sol
      // humo y bengalas
      for (const [bx, by] of [[62, 20], [92, 16]]) {
        for (let i = 0; i < 46; i++) { const a = R() * 6.28, r = R() * 12; g.fillStyle = `rgba(${R() < 0.5 ? '200,190,200' : '150,140,160'},${0.15 + R() * 0.2})`; g.fillRect(Math.round(bx + Math.cos(a) * r), Math.round(by - 6 - Math.abs(Math.sin(a)) * r * 1.4), 2, 2); }
        const rg = g.createRadialGradient(bx, by, 1, bx, by, 18); rg.addColorStop(0, 'rgba(255,120,60,.75)'); rg.addColorStop(1, 'rgba(255,60,30,0)'); g.fillStyle = rg; g.fillRect(bx - 18, by - 18, 36, 36);
        g.fillStyle = '#fff4c0'; g.fillRect(bx, by - 1, 2, 2); g.fillStyle = '#ff6a2a'; g.fillRect(bx - 1, by + 1, 4, 1);
      }
      // baranda
      g.fillStyle = '#5a6070'; g.fillRect(0, 41, W, 2); g.fillStyle = '#9aa3b4'; g.fillRect(0, 41, W, 1);
      // tres hinchas adelante, de frente, con los brazos arriba
      const fans = [
        [{ ...HOME, id: 'f1', num: '', crest: 0 }, 22, 0.25],
        [{ ...HOME3, id: 'f2', num: '', crest: 0, hairStyle: 'bun' }, 52, 0.0],
        [{ ...HOME2, id: 'f3', num: '', crest: 0 }, 82, 0.55],
      ];
      for (const [kit, x, u] of fans) {
        const s = S({ legs: [{ a: 0.1, f: 0, k: 0.1 }, { a: 0.1, f: 0, k: 0.1 }], arms: [{ a: 2.55 + u * 0.3, e: 0.35, f: 0.1, ef: 0 }, { a: 2.75 - u * 0.2, e: 0.25, f: 0.1, ef: 0 }] }, kit, 'front', 18);
        const p = put(g, s, x, 76);
        // bufanda estirada entre las manos del del medio
        if (x === 52) { const h = s.hand.map(p.map); g.fillStyle = '#000'; g.fillRect(Math.min(h[0][0], h[1][0]), Math.min(h[0][1], h[1][1]) - 1, Math.abs(h[1][0] - h[0][0]) + 1, 4); for (let i = 0; i <= Math.abs(h[1][0] - h[0][0]); i++) { g.fillStyle = Math.floor(i / 3) % 2 ? HOME.shirt : (HOME.alt !== HOME.shirt ? HOME.alt : '#f4f2ec'); g.fillRect(Math.min(h[0][0], h[1][0]) + i, Math.min(h[0][1], h[1][1]), 1, 2); } }
      }
      // papelitos
      for (let i = 0; i < 40; i++) { g.fillStyle = [HOME.shirt, HOME.alt || '#f4f2ec', '#ffd23f'][(R() * 3) | 0]; g.fillRect((R() * W) | 0, (R() * H) | 0, R() < 0.4 ? 2 : 1, 1); }
      vignette(g, 0.5);
    },
    // Entran suplentes: el cuarto árbitro levanta el cartel y el suplente espera para entrar
    suplentes(g) {
      stadium(g, { flashes: 3, seed: 53 });
      line(g, 41, 0.6);
      // banco de suplentes con techo
      g.fillStyle = '#2a3040'; g.fillRect(64, 18, 40, 3); g.fillStyle = 'rgba(160,200,230,.25)'; g.fillRect(64, 21, 40, 8);
      g.fillStyle = '#1a1e28'; g.fillRect(66, 27, 36, 3);
      for (let x = 68; x < 102; x += 5) { g.fillStyle = shade('#7cc4ec', 0.6); g.fillRect(x, 24, 3, 3); g.fillStyle = shade('#e0a77c', 0.6); g.fillRect(x + 1, 23, 2, 1); }
      // el que sale, caminando de espaldas
      const out = S({ ...P4.POSES.runFront(0.25, 0.3) }, { ...HOME, num: '8' }, 'back', 24);
      shadow(g, 86, 46, 6); put(g, out, 86, 46);
      // el suplente, de costado, listo para entrar
      const sub = S({ ...P4.POSES.idle(0.2), lean: 0.06 }, HOME2, 'side', 18);
      shadow(g, 30, 57, 9); put(g, sub, 30, 57);
      // cuarto árbitro con el cartel en alto
      const ref = S({ legs: [{ a: 0.1, f: 0, k: 0.08 }, { a: 0.12, f: 0, k: 0.08 }], arms: [{ a: 2.5, e: 0.5, f: 0.4, ef: 0.2 }, { a: 2.5, e: 0.5, f: 0.4, ef: 0.2 }] }, { ...REF, long: 1, sleeve: '#1a1c22' }, 'front', 24);
      shadow(g, 58, 59, 8);
      const r = put(g, ref, 58, 59);
      const h = ref.hand.map(r.map);
      const cx = Math.round((h[0][0] + h[1][0]) / 2), cy = Math.round(Math.min(h[0][1], h[1][1]));
      g.fillStyle = '#000'; g.fillRect(cx - 12, cy - 11, 25, 12);
      g.fillStyle = '#1a1c22'; g.fillRect(cx - 11, cy - 10, 23, 10);
      // números del cartel: 8 en rojo (sale) y 9 en verde (entra)
      const dig = { 8: '111101111101111', 9: '111101111001111' };
      const drawDig = (d, x, y, col) => { g.fillStyle = col; for (let i = 0; i < 15; i++) if (dig[d][i] === '1') g.fillRect(x + (i % 3), y + Math.floor(i / 3), 1, 1); };
      drawDig(8, cx - 8, cy - 8, '#ff4040'); drawDig(9, cx + 5, cy - 8, '#40ff70');
      g.fillStyle = '#ffd23f'; g.fillRect(cx - 1, cy - 7, 1, 1); g.fillRect(cx, cy - 6, 1, 1); g.fillRect(cx - 1, cy - 5, 1, 1);
      g.globalCompositeOperation = 'screen'; const rg = g.createRadialGradient(cx, cy - 5, 1, cx, cy - 5, 18); rg.addColorStop(0, 'rgba(120,255,150,.25)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.fillRect(cx - 18, cy - 23, 36, 36); g.globalCompositeOperation = 'source-over';
      vignette(g);
    },
    // Habilitación larga: el pase cruza el cielo hacia el delantero que pica al vacío
    habilitacion(g) {
      stadium(g, { flashes: 4, seed: 61, horizon: 26 });
      line(g, 38, 0.5);
      const k = S(P4.POSES.kick(0.72), HOME, 'side', 20);
      shadow(g, 20, 58, 10); put(g, k, 18, 58);
      // delantero chiquito a lo lejos, corriendo
      const fw = S(P4.POSES.run(0.4, 1), HOME2, 'side', 44);
      shadow(g, 88, 40, 4); put(g, fw, 88, 40);
      // estela punteada del pase en parábola
      for (let t = 0.08; t < 0.8; t += 0.035) {
        const x = 26 + t * 64, y = 48 - Math.sin(t * Math.PI) * 44;
        g.fillStyle = `rgba(255,255,255,${0.45 + t * 0.55})`; g.fillRect(Math.round(x), Math.round(y), 2, 1);
      }
      ball(g, 26 + 0.82 * 64, 48 - Math.sin(0.82 * Math.PI) * 44, 2, 1);
      vignette(g);
    },
    // Remate de primera: volea en el aire, la pelota se aplasta en el empeine
    primera(g) {
      stadium(g, { excite: true, flashes: 9, seed: 81 });
      line(g, 41, 0.55);
      const k = S({ ...P4.POSES.kick(0.5), lean: -0.35, lift: 90 }, HOME3, 'side', 18);
      shadow(g, 46, 58, 12); const p = put(g, k, 44, 58);
      const toe = p.map(k.toe[1]);
      // impacto: aro de luz y pelota achatada
      g.fillStyle = 'rgba(255,250,220,.85)';
      for (let a = 0; a < 6.28; a += 0.45) g.fillRect(Math.round(toe[0] + 4 + Math.cos(a) * 7), Math.round(toe[1] - 1 + Math.sin(a) * 5), 2, 1);
      const b = P4.ball(3, 2); g.drawImage(b, Math.round(toe[0] + 1), Math.round(toe[1] - 4), b.width + 1, b.height - 1);
      // líneas de velocidad hacia el arco
      g.fillStyle = 'rgba(255,255,255,.5)'; for (const [dy, w] of [[-5, 14], [-1, 20], [3, 12]]) g.fillRect(Math.round(toe[0] + 12), Math.round(toe[1] + dy), w, 1);
      vignette(g);
    },
    // Cambio táctico: el DT manda a todos al ataque, con flechas en la pizarra
    tactico(g) {
      stadium(g, { flashes: 3, seed: 91 });
      line(g, 41, 0.6);
      // flechas en el pasto, hacia el arco rival
      g.fillStyle = 'rgba(255,210,63,.75)';
      for (const [x, y] of [[60, 36], [76, 33], [92, 36]]) { g.fillRect(x, y, 1, 8); g.fillRect(x - 1, y + 1, 3, 1); g.fillRect(x - 2, y + 2, 5, 1); }
      // DT de costado, los dos brazos hacia adelante
      const dt = S({ lean: 0.08, twist: 0.4, legs: [{ a: -0.15, k: 0.1, p: 0 }, { a: 0.3, k: 0.25, p: 0 }], arms: [{ a: 1.9, e: 0.2 }, { a: 1.6, e: 0.1 }], headTilt: -0.2 }, COACH, 'side', 20);
      shadow(g, 30, 58, 10); const p = put(g, dt, 30, 58);
      // boca abierta: grito
      const hd = p.map(dt.hand[1]);
      g.fillStyle = 'rgba(255,255,255,.7)'; for (const [dx, dy] of [[3, -2], [5, 0], [3, 2]]) g.fillRect(hd[0] + dx, hd[1] + dy, 2, 1);
      // pizarra táctica en el piso
      g.fillStyle = '#000'; g.fillRect(64, 44, 34, 15); g.fillStyle = '#2f7a3a'; g.fillRect(65, 45, 32, 13);
      g.fillStyle = '#e8ecef'; g.fillRect(65, 51, 32, 1); g.fillRect(80, 45, 1, 13);
      g.fillStyle = '#7cc4ec'; for (const [x, y] of [[69, 55], [74, 49], [86, 53], [90, 47]]) g.fillRect(x, y, 2, 2);
      g.fillStyle = '#ffd23f'; for (const [x, y] of [[71, 54], [72, 53], [76, 48], [77, 47], [88, 52], [89, 51]]) g.fillRect(x, y, 1, 1);
      vignette(g);
    },
    // Capitán inspirado: el capitán con la cinta arenga al equipo con el puño cerrado
    capitan(g) {
      stadium(g, { excite: true, flashes: 6, seed: 101 });
      line(g, 41, 0.6);
      // compañeros atrás, chiquitos
      for (const [kit, x] of [[HOME2, 16], [HOME3, 88]]) { const s = S(P4.POSES.idleFront(), kit, 'front', 30); shadow(g, x, 46, 5); put(g, s, x, 46); }
      const cap = S({ legs: [{ a: 0.12, f: 0, k: 0.1 }, { a: 0.15, f: 0.15, k: 0.2 }], arms: [{ a: 0.5, e: 1.4, f: 0.6, ef: 0.4 }, { a: 2.85, e: 0.3, f: 0.1, ef: 0, fist: 1 }] }, { ...HOME, band: '#ffd23f' }, 'front', 18);
      shadow(g, 52, 59, 10);
      const p = put(g, cap, 52, 59);
      // cinta de capitán en el brazo izquierdo de la imagen
      const h = cap.hand.map(p.map);
      const up = h[0][1] < h[1][1] ? 0 : 1;
      // cinta de capitán en el brazo levantado
      g.fillStyle = '#000'; g.fillRect(Math.round(h[up][0]) - 2, Math.round(h[up][1]) + 9, 5, 4);
      g.fillStyle = '#ffd23f'; g.fillRect(Math.round(h[up][0]) - 1, Math.round(h[up][1]) + 10, 3, 2);
      g.fillStyle = '#1c2340'; g.fillRect(Math.round(h[up][0]), Math.round(h[up][1]) + 10, 1, 1);
      // rayos detrás del puño
      g.fillStyle = 'rgba(255,230,140,.6)';
      for (let a = 0; a < 6.28; a += 0.5) g.fillRect(Math.round(h[up][0] + Math.cos(a) * 6), Math.round(h[up][1] + Math.sin(a) * 6), 1, 1);
      vignette(g);
    },
    // Error del DT: se toma la cabeza mientras el rival se va de contra
    errordt(g) {
      stadium(g, { flashes: 2, seed: 121 });
      line(g, 41, 0.5);
      // área técnica
      g.fillStyle = 'rgba(240,245,232,.7)'; g.fillRect(8, 47, 46, 1); g.fillRect(8, 47, 1, 13); g.fillRect(53, 47, 1, 13);
      // el rival se va de contra, a lo lejos
      const r1 = S(P4.POSES.run(0.3, 1), AWAY, 'side', 36);
      shadow(g, 82, 42, 5); const p = put(g, r1, 82, 42);
      ball(g, p.map(r1.toe[1])[0] + 3, 41, 1.5, 0);
      const dt = S({ legs: [{ a: 0.12, f: 0, k: 0.1 }, { a: 0.14, f: 0.1, k: 0.12 }], arms: [{ a: 2.25, e: 2.3, f: 0.3, ef: 0.3 }, { a: 2.25, e: 2.3, f: 0.3, ef: 0.3 }] }, COACH2, 'front', 20);
      shadow(g, 30, 59, 10); put(g, dt, 30, 59);
      // gotas de sudor
      g.fillStyle = '#bfe4ff'; g.fillRect(40, 18, 1, 2); g.fillRect(19, 20, 1, 2);
      vignette(g);
    },
    // Tiro colocado: de frente al arco, la pelota entra por el ángulo con comba
    iluminacion(g) {
      g.fillStyle = '#07080e'; g.fillRect(0, 0, W, H);
      stadium(g, { horizon: 18, flashes: 6, seed: 131 });
      const gx0 = 8, gx1 = 96, gt = 16, gb = 52;
      goal(g, gx0, gx1, gt, gb);
      // el arquero no llega: estirada corta del otro lado
      const k = S(P4.POSES.keeperDive(-1, 0.35), GK, 'front', 20);
      g.drawImage(k.cv, Math.round(40 - k.c[0]), Math.round(36 - k.c[1]));
      // la comba: estela que dobla hacia el ángulo
      for (let t = 0; t < 1; t += 0.04) {
        const x = 30 + t * 56 + Math.sin(t * Math.PI) * 10, y = 62 - t * 41 - Math.sin(t * Math.PI) * 8;
        g.fillStyle = `rgba(255,255,255,${0.15 + t * 0.6})`; g.fillRect(Math.round(x), Math.round(y), t > 0.6 ? 2 : 1, 1);
      }
      ball(g, 86, 22, 2.5, 3);
      // la red se infla en el ángulo
      g.fillStyle = 'rgba(255,255,255,.55)'; for (const [dx, dy] of [[4, -3], [6, 0], [5, 3], [2, -5]]) g.fillRect(86 + dx, 22 + dy, 1, 1);
      vignette(g);
    },
    // Arquero nervioso: se le escurre la pelota de las manos
    chilena(g) {
      g.fillStyle = '#07080e'; g.fillRect(0, 0, W, H);
      stadium(g, { horizon: 18, flashes: 7, seed: 141 });
      goal(g, 8, 96, 16, 52);
      const k = S({ lift: 0, legs: [{ a: 0.32, f: 0, k: 0.75 }, { a: 0.34, f: 0.1, k: 0.8 }], arms: [{ a: 0.55, e: 0.25, f: 1.25, ef: 0.2 }, { a: 0.6, e: 0.3, f: 1.2, ef: 0.2 }], headTilt: 0.2 }, GK, 'front', 20);
      shadow(g, 52, 56, 12); const p = put(g, k, 52, 56);
      const h = k.hand.map(p.map);
      const hx = (h[0][0] + h[1][0]) / 2, hy = Math.min(h[0][1], h[1][1]);
      // la pelota se le va por arriba de los guantes
      ball(g, hx + 9, hy - 9, 2.5, 1);
      g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(Math.round(hx + 3), Math.round(hy - 4), 1, 1); g.fillRect(Math.round(hx + 5), Math.round(hy - 6), 1, 1);
      // gotas de sudor y líneas de temblor
      g.fillStyle = '#bfe4ff'; g.fillRect(p.dx + 5, p.dy + 3, 1, 2); g.fillRect(p.dx + k.cv.width - 6, p.dy + 4, 1, 2);
      g.fillStyle = 'rgba(255,255,255,.45)'; for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) g.fillRect(Math.round(52 + sx * (14 + i * 2)), 30 + i * 3, 1, 2);
      vignette(g);
    },
    // Desorden defensivo: dos defensores chocan y el delantero pasa entre ellos
    error(g) {
      stadium(g, { flashes: 5, seed: 151 });
      line(g, 41, 0.6);
      const d1 = S({ ...P4.POSES.run(0.55, 0.9), lean: -0.1 }, AWAY, 'side', 22);
      const d2 = S({ ...P4.POSES.run(0.05, 0.9), lean: -0.1 }, AWAY3, 'side', 22);
      shadow(g, 30, 52, 8); put(g, d1, 30, 52);
      shadow(g, 46, 52, 8); put(g, d2, 46, 52, true);
      // estrellitas del choque
      g.fillStyle = '#ffd23f'; for (const [x, y] of [[37, 14], [40, 11], [43, 15], [38, 18]]) { g.fillRect(x, y, 1, 1); g.fillRect(x - 1, y + 1, 3, 1); g.fillRect(x, y + 2, 1, 1); }
      // el delantero se escapa adelante
      const fw = S({ ...P4.POSES.run(0.3, 1.1), lean: 0.25 }, HOME, 'side', 18);
      shadow(g, 74, 59, 10); const p = put(g, fw, 74, 59);
      ball(g, p.map(fw.toe[1])[0] + 5, 57, 2.5, 2);
      g.fillStyle = 'rgba(255,255,255,.45)'; for (const [dy, w] of [[18, 10], [26, 14], [34, 8]]) g.fillRect(p.dx - w - 1, p.dy + dy, w, 1);
      vignette(g);
    },
    // Instrucción del DT: le grita al 10 y le marca el camino con el brazo
    instruccion(g) {
      stadium(g, { flashes: 3, seed: 161 });
      line(g, 41, 0.6);
      const pl = S(P4.POSES.idle(0.1), HOME, 'side', 22);
      shadow(g, 76, 54, 8); put(g, pl, 76, 54, true);
      const dt = S({ lean: 0.1, twist: 0.45, legs: [{ a: -0.1, k: 0.1, p: 0 }, { a: 0.25, k: 0.2, p: 0 }], arms: [{ a: 0.6, e: 1.9 }, { a: 1.65, e: 0.05 }], headTilt: -0.1 }, COACH, 'side', 20);
      shadow(g, 30, 58, 10); const p = put(g, dt, 30, 58);
      const hd = p.map(dt.hand[1]);
      // flecha de la instrucción hacia el arco
      g.fillStyle = 'rgba(255,210,63,.85)';
      for (let x = hd[0] + 4; x < hd[0] + 26; x += 3) g.fillRect(x, hd[1] - 1, 2, 1);
      g.fillRect(hd[0] + 26, hd[1] - 3, 1, 5); g.fillRect(hd[0] + 27, hd[1] - 2, 1, 3); g.fillRect(hd[0] + 28, hd[1] - 1, 1, 1);
      // ondas del grito
      g.fillStyle = 'rgba(255,255,255,.6)'; for (const [dx, dy] of [[0, -9], [2, -11], [4, -9]]) g.fillRect(p.dx + dt.cv.width - 4 + dx, p.dy + 8 + dy, 1, 2);
      vignette(g);
    },
    // Defensa sólida: tres defensores hombro con hombro, cerrando el paso
    defensa(g) {
      stadium(g, { flashes: 4, seed: 171, horizon: 24 });
      line(g, 34, 0.5);
      const wall = [[AWAY3, 26], [AWAY, 52], [AWAY2, 78]];
      for (const [kit, x] of wall) {
        const s = S({ legs: [{ a: 0.32, f: 0.05, k: 0.55 }, { a: 0.32, f: 0.05, k: 0.55 }], arms: [{ a: 0.75, e: 0.6, f: 0.3, ef: 0.3 }, { a: 0.75, e: 0.6, f: 0.3, ef: 0.3 }] }, { ...kit, num: '' }, 'front', 18);
        shadow(g, x, 59, 11); put(g, s, x, 59);
      }
      // el delantero rival, chiquito, sin espacio
      vignette(g, 0.55);
    },
    // Barrida quirúrgica: la barrida limpia se lleva la pelota y el rival salta
    barrida(g) {
      stadium(g, { flashes: 5, seed: 181 });
      line(g, 41, 0.6);
      const R = rng(7);
      const fw = S({ ...P4.POSES.run(0.5, 1.2), lift: 70, lean: 0.15 }, HOME, 'side', 20);
      shadow(g, 70, 58, 8); put(g, fw, 70, 58);
      const def = S(P4.POSES.slide(), AWAY, 'side', 18);
      shadow(g, 42, 58, 16); const p = put(g, def, 46, 58);
      const toe = p.map(def.toe[1]);
      ball(g, toe[0] + 5, 52, 2.5, 2);
      // pasto que salta
      for (let i = 0; i < 26; i++) { g.fillStyle = ['#3d8a37', '#5aa64c', '#77803f', '#2d6a2a'][i % 4]; g.fillRect(Math.round(toe[0] - 6 - R() * 16), Math.round(56 - R() * 10), R() < 0.3 ? 2 : 1, 1); }
      // surco en el pasto
      g.fillStyle = 'rgba(30,60,25,.55)'; g.fillRect(12, 58, toe[0] - 14, 1);
      vignette(g);
    },
    // Despeje en la línea: el defensor la saca sobre la línea, debajo del travesaño
    despeje(g) {
      g.fillStyle = '#07080e'; g.fillRect(0, 0, W, H);
      stadium(g, { flashes: 6, seed: 191, horizon: 16 });
      goal(g, -10, 70, 12, 46);
      const k = S({ ...P4.POSES.kick(0.66), lean: -0.2 }, AWAY, 'side', 18);
      shadow(g, 44, 52, 11); const p = put(g, k, 42, 52);
      const toe = p.map(k.toe[1]);
      // la pelota sale despedida hacia afuera
      for (let i = 1; i < 6; i++) { g.fillStyle = `rgba(255,255,255,${0.5 - i * 0.08})`; g.fillRect(Math.round(toe[0] + 6 + i * 4), Math.round(toe[1] - 6 - i * 3), 2, 1); }
      ball(g, toe[0] + 30, toe[1] - 22, 2.5, 3);
      g.fillStyle = 'rgba(255,250,220,.85)'; for (let a = 0; a < 6.28; a += 0.6) g.fillRect(Math.round(toe[0] + 2 + Math.cos(a) * 5), Math.round(toe[1] - 2 + Math.sin(a) * 4), 1, 1);
      vignette(g);
    },
    // Presión alta: dos rivales cierran al que sale jugando
    presion(g) {
      stadium(g, { flashes: 4, seed: 201 });
      line(g, 41, 0.6);
      const mid = S({ ...P4.POSES.idle(0.4), lean: 0.12 }, HOME, 'side', 20);
      shadow(g, 52, 56, 8); const pm = put(g, mid, 52, 56);
      ball(g, pm.map(mid.toe[1])[0] + 3, 55, 2.2, 0);
      const a1 = S({ ...P4.POSES.run(0.2, 1.1), lean: 0.3 }, AWAY, 'side', 18);
      const a2 = S({ ...P4.POSES.run(0.7, 1.1), lean: 0.3 }, AWAY3, 'side', 18);
      shadow(g, 22, 59, 9); put(g, a1, 22, 59);
      shadow(g, 84, 59, 9); put(g, a2, 84, 59, true);
      // flechas de la presión
      g.fillStyle = 'rgba(255,90,70,.85)';
      for (const [x, d] of [[34, 1], [70, -1]]) { for (let i = 0; i < 8; i++) g.fillRect(x + d * i, 30, 1, 1); g.fillRect(x + d * 8, 28, 1, 5); g.fillRect(x + d * 9, 29, 1, 3); g.fillRect(x + d * 10, 30, 1, 1); }
      vignette(g);
    },
    // Achique del arquero: sale rápido y se tira a los pies del delantero
    achique(g) {
      stadium(g, { flashes: 6, seed: 211 });
      line(g, 41, 0.6);
      const fw = S({ ...P4.POSES.run(0.15, 1), lean: 0.2 }, HOME, 'side', 18);
      shadow(g, 30, 58, 10); const pf = put(g, fw, 30, 58);
      const k = S(P4.POSES.keeperDive(-1, 0.9), GK, 'front', 18);
      g.drawImage(k.cv, Math.round(70 - k.c[0]), Math.round(50 - k.c[1]));
      shadow(g, 68, 58, 18);
      const toe = pf.map(fw.toe[1]);
      ball(g, toe[0] + 6, 55, 2.5, 1);
      g.fillStyle = 'rgba(255,250,220,.8)'; for (const [dx, dy] of [[9, -4], [11, -1], [10, 2]]) g.fillRect(toe[0] + dx, 55 + dy, 1, 1);
      vignette(g);
    },
    // Advertencia del árbitro: lo llama con el dedo y le habla
    warning(g) {
      stadium(g, { flashes: 3, seed: 221 });
      line(g, 41, 0.6);
      const pl = S({ ...P4.POSES.idle(0.2), headTilt: 0.35 }, AWAY2, 'side', 20);
      shadow(g, 68, 56, 8); put(g, pl, 68, 56, true);
      const ref = S({ lean: 0.04, twist: 0.45, legs: [{ a: -0.05, k: 0.1, p: 0 }, { a: 0.18, k: 0.15, p: 0 }], arms: [{ a: 0.1, e: 0.3 }, { a: 1.45, e: 0.55, fist: 1 }] }, REF, 'side', 20);
      shadow(g, 36, 58, 9); const r = put(g, ref, 36, 58);
      const hd = r.map(ref.hand[1]);
      // dedo índice levantado
      g.fillStyle = '#000'; g.fillRect(hd[0], hd[1] - 4, 2, 4); g.fillStyle = REF.skin; g.fillRect(hd[0], hd[1] - 3, 1, 3);
      // silbato colgando
      g.fillStyle = '#c8ccd4'; g.fillRect(r.dx + 9, r.dy + 15, 1, 1);
      vignette(g);
    },
    // Tiro libre: la barrera, el aerosol en el pasto y el pateador frente a la pelota
    freekick(g) {
      g.fillStyle = '#07080e'; g.fillRect(0, 0, W, H);
      stadium(g, { flashes: 8, seed: 231, horizon: 14 });
      goal(g, 28, 76, 12, 30);
      // arquero chiquito
      const gk = S(P4.POSES.keeperReady(0), GK, 'front', 48); put(g, gk, 60, 30);
      // barrera
      for (const [i, kit] of [[0, AWAY], [1, AWAY3], [2, AWAY2], [3, AWAY]]) {
        const s = S({ legs: [{ a: 0.08, f: 0, k: 0.06 }, { a: 0.08, f: 0, k: 0.06 }], arms: [{ a: 0.12, e: -0.9, f: 0.3, ef: 0.3 }, { a: 0.12, e: -0.9, f: 0.3, ef: 0.3 }] }, { ...kit, num: '' }, 'front', 26);
        put(g, s, 34 + i * 9, 42);
      }
      // aerosol: línea blanca de la barrera y marca de la pelota
      g.fillStyle = 'rgba(250,250,250,.85)'; for (let x = 28; x < 72; x += 2) g.fillRect(x, 43, 1, 1);
      g.fillStyle = 'rgba(250,250,250,.7)'; g.fillRect(49, 53, 7, 1);
      ball(g, 52, 51, 2.5, 0);
      // el pateador de espaldas
      const t = S({ legs: [{ a: 0.12, f: 0, k: 0.1 }, { a: 0.12, f: 0.1, k: 0.1 }], arms: [{ a: 0.3, e: 0.2, f: 0, ef: 0.1 }, { a: 0.3, e: 0.2, f: 0, ef: 0.1 }] }, HOME, 'back', 22);
      shadow(g, 76, 60, 8); put(g, t, 78, 61);
      vignette(g);
    },
    // Amarilla: el árbitro la levanta y el jugador se toma la cabeza
    yellow(g) { referee(g, '#f2c21b', false); },
    red(g) { referee(g, '#d8202a', true); },
  };

  function referee(g, col, red) {
    stadium(g, { flashes: 7, seed: red ? 41 : 17 });
    line(g, 41, 0.6);
    if (red) {
      // el expulsado se va de espaldas, cabizbajo
      const pl = S({ ...P4.POSES.runFront(0.05, 0.25), headTilt: 0.5 }, { ...AWAY, num: '4' }, 'back', 20);
      shadow(g, 28, 52, 8); put(g, pl, 28, 52);
    } else {
      // el amonestado protesta con las manos en la cabeza
      const pl = S({ legs: [{ a: 0.1, f: 0, k: 0.1 }, { a: 0.12, f: 0.2, k: 0.2 }], arms: [{ a: 2.3, e: 2.2, f: 0.2, ef: 0.2 }, { a: 2.3, e: 2.2, f: 0.2, ef: 0.2 }] }, AWAY, 'front', 20);
      shadow(g, 28, 54, 8); put(g, pl, 28, 54);
    }
    const ref = S({ legs: [{ a: 0.12, f: 0, k: 0.08 }, { a: 0.14, f: 0.1, k: 0.1 }], arms: [{ a: 0.2, e: 0.2, f: 0, ef: 0.2 }, { a: 2.75, e: 0.1, f: 0.1, ef: 0 }] }, REF, 'front', 22);
    shadow(g, 64, 58, 10);
    const r = put(g, ref, 64, 58);
    const hands = ref.hand.map(r.map);
    const up = hands[0][1] < hands[1][1] ? hands[0] : hands[1];
    card(g, Math.round(up[0]), Math.round(up[1]) - 1, col);
    vignette(g);
  }

  // Equipo de la carta en cada escena: en estas, el equipo de la carta es el que defiende
  // (o el que cometió la falta) y se dibuja con los kits del lado "AWAY".
  const SWAP = new Set(['lesion', 'defensa', 'barrida', 'despeje', 'presion', 'achique', 'yellow', 'red', 'warning']);
  const OWN_GK = new Set(['arquero', 'achique']);
  // kits: { A: [3 jugadores del equipo de la carta], B: [3 del rival], GA, GB, crowd }
  function render(id, scale = 3, kits) {
    const k = kits || { A: [D_HOME, D_HOME2, D_HOME3], B: [D_AWAY, D_AWAY2, D_AWAY3], GA: D_GK, GB: D_GK };
    const [mine, other] = SWAP.has(id) ? [k.B, k.A] : [k.A, k.B];
    [HOME, HOME2, HOME3] = mine; [AWAY, AWAY2, AWAY3] = other;
    GK = (OWN_GK.has(id) || (id === 'chilena' && k.chilenaOwn) ? k.GA : k.GB) || D_GK;
    CROWD = k.crowd || [k.A[0].shirt, k.A[0].alt || '#f4f2ec', k.B[0].shirt, '#f4f2ec', k.A[0].shirt];
    const c = cv(), g = c.getContext('2d');
    (SCENES[id] || ((gg) => stadium(gg)))(g);
    const out = document.createElement('canvas'); out.width = W * scale; out.height = H * scale;
    const o = out.getContext('2d'); o.imageSmoothingEnabled = false; o.drawImage(c, 0, 0, W * scale, H * scale);
    return out;
  }
  return { render, SCENES, W, H };
})();

export { CARDART };
