// Cámara de costado de la escena del tiro: tribuna con hinchas (paralaje),
// carteles y pasto en perspectiva. La usan la carrera con el remate y la
// celebración del gol. x del mundo en píxeles, 0 = la pelota.
import { hexRgb } from './teams.js';
import { text } from './cutscene.js';

function rng(seed) { let s = seed % 2147483647; if (s <= 0) s += 2147483646; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
const lit = (c, f) => { const [r, g, b] = hexRgb(c); return `rgb(${Math.round(r * f)},${Math.round(g * f)},${Math.round(b * f)})`; };
const SKINS = ['#f1c7a0', '#e0a77c', '#c68657', '#9c6440', '#6e4428'];

// o: { crowd: [colA, colD], stadium }, LW ancho, H alto, GY línea de los pies.
export function buildSide(o, LW, H, GY) {
  const R = rng(23);
  const st = o.stadium || { seats: ['#2a2f3a', '#3a404d'], name: 'CALCIOPOLI' };
  // el pasto y los carteles se extienden bien más allá de donde arranca la carrera,
  // así la cámara nunca muestra el borde del dibujo
  const GX = 1000, grassTop = GY - 114, gw = 2600, gh = H - grassTop;
  // pasto: franjas que se angostan hacia el fondo, con algo de ruido
  const grass = document.createElement('canvas'); grass.width = gw; grass.height = gh;
  {
    const g = grass.getContext('2d');
    const im = g.createImageData(gw, gh), d = im.data;
    const A = hexRgb('#4a9c40'), B = hexRgb('#3f8c38');
    for (let y = 0; y < gh; y++) {
      const depth = Math.min(1, y / 128), s = 0.42 + 0.58 * depth;
      for (let x = 0; x < gw; x++) {
        const u = (x - GX) / s;
        const c = Math.floor((u + 4000) / 46) % 2 ? A : B;
        const r = R();
        let k = r < 0.12 ? 0.92 : r < 0.22 ? 1.06 : 1;
        if (depth < 0.1) k *= 0.88 + depth;
        const i = (y * gw + x) * 4;
        d[i] = c[0] * k; d[i + 1] = c[1] * k; d[i + 2] = c[2] * k; d[i + 3] = 255;
      }
    }
    for (let x = 0; x < gw; x++) for (const [yy, a] of [[24, 0.85], [25, 0.4]]) { const i = (yy * gw + x) * 4; d[i] += (240 - d[i]) * a; d[i + 1] += (245 - d[i + 1]) * a; d[i + 2] += (232 - d[i + 2]) * a; }
    g.putImageData(im, 0, 0);
    // punto penal gastado, justo donde está la pelota
    for (let i = 0; i < 220; i++) { const a = R() * 6.28, rr = Math.sqrt(R()) * 16; g.fillStyle = R() < 0.5 ? '#6f7a3c' : '#5d7a36'; g.fillRect(Math.round(GX + Math.cos(a) * rr), Math.round(114 + 1 + Math.sin(a) * rr * 0.3), 1, 1); }
    g.fillStyle = '#eef2e4'; g.fillRect(GX - 4, 114, 9, 2); g.fillRect(GX - 3, 115, 7, 2);
  }
  // carteles de publicidad
  const BX = 700, bw = 2100;
  const boards = document.createElement('canvas'); boards.width = bw; boards.height = 16;
  {
    const b = boards.getContext('2d');
    b.fillStyle = '#0c0e16'; b.fillRect(0, 0, bw, 16);
    const ads = [['CALCIOPOLI', '#ffd23f', '#1a1c3a'], ['EL CALCIOPOLITANO', '#f4f2ec', '#a8202a'], [(st.name || 'CALCIOPOLI').toUpperCase(), '#1c2340', '#d8dce6'], ['DADOS Y CO', '#f4f2ec', '#2a7a3a']];
    let x = 0, i = 0;
    while (x < bw) {
      const [t, fg, bg] = ads[i++ % ads.length];
      const tw = t.length * 4 + 14;
      b.fillStyle = bg; b.fillRect(x, 2, tw, 12);
      b.fillStyle = 'rgba(255,255,255,0.12)'; b.fillRect(x, 2, tw, 1);
      b.fillStyle = 'rgba(0,0,0,0.25)'; b.fillRect(x, 13, tw, 1);
      text(b, t, x + 7, 6, fg);
      x += tw + 2;
    }
    b.fillStyle = '#05060a'; b.fillRect(0, 14, bw, 2);
  }
  // tribuna en tres bandejas; los hinchas se dibujan aparte para que salten
  const sw = 1000;
  const stands = document.createElement('canvas'); stands.width = sw; stands.height = 100;
  const fans = [];
  const tiers = [[8, 34, 0.55], [38, 66, 0.75], [70, 98, 1]];
  const [ca, cd] = o.crowd || ['#7cc4ec', '#d0202a'];
  {
    const s = stands.getContext('2d');
    s.fillStyle = '#0a0b12'; s.fillRect(0, 0, sw, 100);
    const seat = st.seats ? st.seats[0] : '#262a3c';
    for (const [y0, y1, l] of tiers) {
      for (let y = y0; y < y1; y++) { s.fillStyle = lit((y - y0) % 5 === 4 ? '#1a1c28' : seat, l * 0.8); s.fillRect(0, y, sw, 1); }
      s.fillStyle = lit('#6a7084', l); s.fillRect(0, y1, sw, 1);
      s.fillStyle = '#07080d'; s.fillRect(0, y1 + 1, sw, 3);
      for (let x = 30; x < sw; x += 120) { s.fillStyle = lit('#3a3e52', l); s.fillRect(x, y0, 5, y1 - y0); s.fillStyle = lit('#2a2e40', l); for (let y = y0; y < y1; y += 2) s.fillRect(x, y, 5, 1); }
      for (let y = y0 + 1; y <= y1 - 5; y += 5) for (let x = 0; x < sw; x += 4) {
        if (R() < 0.06 || (x % 120 >= 28 && x % 120 < 37)) continue;
        const home = R() < 0.72;
        fans.push({ x: x + ((R() * 2) | 0), y, l, ph: R() * 6.28, sp: 6 + R() * 5,
          shirt: home ? (R() < 0.75 ? ca : '#f4f2ec') : (R() < 0.75 ? cd : '#f4f2ec'), home,
          skin: SKINS[(R() * 5) | 0], hair: ['#2a1a10', '#111111', '#7a5530', '#c8a060'][(R() * 4) | 0],
          arms: R() < 0.12, scarf: R() < 0.15 });
      }
    }
    s.fillStyle = '#05060a'; s.fillRect(0, 0, sw, 6);
  }
  // colores ya sombreados de cada hincha (se dibujan muchas veces por cuadro)
  for (const f of fans) { f.cs = lit(f.shirt, f.l); f.ck = lit(f.skin, f.l); f.ch = lit(f.hair, f.l); f.cf = lit(ca, f.l); f.cw = lit('#f4f2ec', f.l); }
  const standsTop = grassTop - 114;

  const toScreen = (wx, cam) => Math.round(wx - cam + LW / 2);
  // excite: 0 tranquilos · 1 festejando
  function draw(g, cam, sec, excite) {
    g.fillStyle = '#05060a'; g.fillRect(0, 0, LW, H);
    if (standsTop > 0) {
      // techo de la tribuna con focos
      g.fillStyle = '#0d0f18'; g.fillRect(0, 0, LW, standsTop);
      for (let x = 10; x < LW; x += 40) { g.fillStyle = 'rgba(255,250,220,0.85)'; g.fillRect(x, standsTop - 6, 8, 2); }
    }
    const sx0 = Math.round(-(cam * 0.5) - 350 + LW / 2);
    g.drawImage(stands, sx0, standsTop);
    for (const f of fans) {
      const x = f.x + sx0;
      if (x < -3 || x > LW + 2) continue;
      const ex = f.home ? excite : excite * 0.15;
      const jump = ex ? Math.max(0, Math.sin(sec * f.sp + f.ph)) * 2 * ex : 0;
      const y = Math.round(standsTop + f.y - jump);
      g.fillStyle = f.cs; g.fillRect(x, y + 2, 3, 3);
      g.fillStyle = f.ck; g.fillRect(x + 1, y, 2, 2);
      g.fillStyle = f.ch; g.fillRect(x + 1, y, 2, 1);
      if (f.scarf) { g.fillStyle = Math.sin(sec * 4 + f.ph) > 0 ? f.cf : f.cw; g.fillRect(x - 1, y - 2 - (ex ? 1 : 0), 5, 1); }
      if ((f.arms && Math.sin(sec * 3 + f.ph) > 0) || ex > 0.5) { g.fillStyle = f.ck; g.fillRect(x, y - 1, 1, 1); g.fillRect(x + 3, y - 1, 1, 1); }
    }
    // flashes de cámaras de fotos
    for (let i = 0; i < (excite ? 7 : 2); i++) if (Math.random() < 0.12) {
      const x = (Math.random() * LW) | 0, y = standsTop + 8 + ((Math.random() * 90) | 0);
      g.fillStyle = 'rgba(255,255,255,0.95)'; g.fillRect(x, y, 1, 1);
      g.fillStyle = 'rgba(255,255,255,0.4)'; g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3);
    }
    g.drawImage(boards, Math.round(-(cam * 0.85) - BX + LW / 2), grassTop - 14);
    g.drawImage(grass, Math.round(-cam - GX + LW / 2), grassTop);
    g.fillStyle = 'rgba(6,20,8,0.35)'; g.fillRect(0, grassTop, LW, 3);
  }
  return { draw, toScreen, grassTop, standsTop };
}
