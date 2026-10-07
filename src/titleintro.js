// Entrada de la portada: se prenden los focos sobre el pasto, caen las letras
// de Calcciopoli una por una y la pelota entra rodando desde un costado,
// pica, se pasa un poco, vuelve y queda en su lugar sobre el nombre. Después
// un brillo cruza las letras y aparece JUGAR. Tocar la pantalla la salta.
// Todo se pinta en la grilla de píxeles del logo, así el último cuadro es
// idéntico al logo quieto y el cambio no se nota.
import { P4 } from './players.js';
import { paintLogo, LOGO_TEXT } from './titleart.js';
import * as audio from './audio.js';

const LIGHTS = 900;          // focos
const L0 = 420, LSTEP = 70;  // primera letra y separación entre letras
const LFALL = 300, LHOP = 150;
const B0 = 1250;             // entra la pelota
const BROLL = 1500, BBACK = 380;
const SETTLE = B0 + BROLL + BBACK;
const GLINT = 420;
const END = SETTLE + GLINT + 120;

const clamp = (v) => Math.max(0, Math.min(1, v));
const easeOut = (u) => 1 - (1 - u) ** 3;
const easeInOut = (u) => (u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2);
const hop = (u, peak) => 4 * peak * u * (1 - u);

let running = null;
export const introRunning = () => !!running;
export function skipTitleIntro() { if (running) running(); }

export function playTitleIntro(screen, logoEl) {
  if (running) running();
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { screen.classList.remove('intro'); return; }
  // Se mide con las letras ya cargadas, para que el logo no se mueva al final.
  screen.classList.add('intro');
  const fonts = document.fonts ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]) : Promise.resolve();
  const go = () => { try { start(screen, logoEl); } catch (e) { screen.classList.remove('intro'); audio.holdBand(false); throw e; } };
  audio.holdBand(true);
  // El navegador no deja sonar nada antes de un toque: si el sonido está
  // prendido, la entrada espera ese primer toque («Toca para empezar»).
  fonts.then(() => (audio.isMuted() ? go() : tapToStart(screen, go)));
}

function tapToStart(screen, go) {
  const tap = document.createElement('button');
  tap.id = 'intro-tap'; tap.type = 'button'; tap.textContent = 'TOCA PARA EMPEZAR';
  screen.appendChild(tap);
  const begin = (e) => {
    if (e.type === 'keydown' && !['Enter', ' ', 'Escape'].includes(e.key)) return;
    e.preventDefault(); e.stopPropagation();
    screen.removeEventListener('click', begin, true);
    removeEventListener('keydown', begin, true);
    tap.remove();
    audio.unlock();
    audio.whenRunning(600).then(() => requestAnimationFrame(go));
  };
  screen.addEventListener('click', begin, true);
  addEventListener('keydown', begin, true);
}

function start(screen, logoEl) {
  const sr = screen.getBoundingClientRect(), lr = logoEl.getBoundingClientRect();
  const k = lr.width / logoEl.width;
  if (!(k > 0) || !screen.classList.contains('active')) { screen.classList.remove('intro'); audio.holdBand(false); audio.startBand(1); return; }

  // Lienzo que cubre la pantalla con la grilla del logo: el píxel (x, y) del
  // logo cae en (NX + x, NY + y).
  const NX = Math.ceil((lr.left - sr.left) / k), NY = Math.ceil((lr.top - sr.top) / k);
  const cv = document.createElement('canvas');
  cv.id = 'intro-art';
  cv.width = NX + Math.ceil((sr.right - lr.left) / k);
  cv.height = NY + Math.ceil((sr.bottom - lr.top) / k);
  Object.assign(cv.style, {
    left: `${lr.left - sr.left - NX * k}px`, top: `${lr.top - sr.top - NY * k}px`,
    width: `${cv.width * k}px`, height: `${cv.height * k}px`,
  });
  const g = cv.getContext('2d');

  // Piezas: cada letra en su lugar, y el nombre entero para el brillo.
  const letters = [...LOGO_TEXT].map((_, i) => { const c = document.createElement('canvas'); paintLogo(c, { ball: false, only: i }); return c; });
  const name = document.createElement('canvas');
  const { W, H, BR, ballS, ballX } = paintLogo(name, { ball: false });
  // máscara del dorado (sin bordes ni relieve) para que el brillo sólo pase por ahí
  const gold = document.createElement('canvas'); gold.width = W; gold.height = H;
  {
    const src = name.getContext('2d').getImageData(0, 0, W, H), d = src.data;
    for (let i = 0; i < d.length; i += 4) { const ok = d[i + 3] && d[i] > 180 && d[i + 1] > 120; d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = ok ? 255 : 0; }
    gold.getContext('2d').putImageData(src, 0, 0);
  }
  const shine = document.createElement('canvas'); shine.width = W; shine.height = H;
  const sg = shine.getContext('2d');
  // la pelota girando: un cuadro por cada 1/96 de vuelta
  const frames = new Map();
  const ballAt = (a) => {
    const q = ((Math.round(a / (Math.PI * 2 / 96)) % 96) + 96) % 96;
    if (!frames.has(q)) frames.set(q, P4.ball(BR, q * Math.PI * 2 / 96));
    return frames.get(q);
  };

  screen.appendChild(cv);
  screen.classList.add('intro-go');
  const fall = NY + 16;  // las letras caen desde arriba de la pantalla
  const xEnd = ballX, x0 = -NX - ballS - 2, xOver = xEnd + 6;
  const t0 = performance.now();
  const hush = audio.introSounds();
  let raf = 0, ended = false;

  function frame() {
    const t = performance.now() - t0;
    g.clearRect(0, 0, cv.width, cv.height);
    // letras
    letters.forEach((c, i) => {
      const u = (t - L0 - i * LSTEP) / LFALL;
      if (u <= 0) return;
      let dy = 0;
      if (u < 1) dy = -fall * (1 - u * u);
      else { const v = (t - L0 - i * LSTEP - LFALL) / LHOP; if (v < 1) dy = -hop(v, 2); }
      g.drawImage(c, NX, NY + Math.round(dy));
    });
    // brillo que cruza el nombre cuando la pelota ya está quieta
    const gu = (t - SETTLE) / GLINT;
    if (gu > 0 && gu < 1) {
      sg.globalCompositeOperation = 'source-over';
      sg.clearRect(0, 0, W, H); sg.drawImage(gold, 0, 0);
      sg.globalCompositeOperation = 'source-in';
      const bx = -14 + gu * (W + 28);
      sg.fillStyle = 'rgba(255,255,255,.85)';
      sg.beginPath(); sg.moveTo(bx, H); sg.lineTo(bx + 4, H); sg.lineTo(bx + 4 + H * 0.6, 0); sg.lineTo(bx + H * 0.6, 0); sg.fill();
      sg.fillStyle = 'rgba(255,250,220,.45)';
      sg.beginPath(); sg.moveTo(bx + 6, H); sg.lineTo(bx + 8, H); sg.lineTo(bx + 8 + H * 0.6, 0); sg.lineTo(bx + 6 + H * 0.6, 0); sg.fill();
      g.drawImage(shine, NX, NY);
    }
    // pelota: entra picando, rueda frenando, se pasa y vuelve a su lugar
    const bt = t - B0;
    if (bt > 0) {
      let x, h = 0;
      if (bt < BROLL) {
        const u = bt / BROLL;
        x = x0 + (xOver - x0) * easeOut(u);
        if (u < 0.22) h = 26 * (1 - (u / 0.22) ** 2);
        else if (u < 0.47) h = hop((u - 0.22) / 0.25, 9);
        else if (u < 0.62) h = hop((u - 0.47) / 0.15, 3);
      } else x = xOver + (xEnd - xOver) * easeInOut(clamp((bt - BROLL) / BBACK));
      const px = Math.round(x), py = -Math.round(h);
      // sombra en el piso, más chica y clara cuanto más alto va
      const lift = clamp(h / 34);
      const sw = Math.max(4, Math.round(BR * 1.5 * (1 - lift * 0.5)));
      g.fillStyle = `rgba(0,0,0,${(0.45 * (1 - lift * 0.6)).toFixed(3)})`;
      g.fillRect(NX + px + Math.round(ballS / 2 - sw / 2), NY + ballS - 1, sw, 2);
      // rodar: el ángulo sigue a la distancia, y es 0 justo en su lugar
      g.drawImage(ballAt((px - xEnd) / BR), NX + px, NY + py);
    }
    if (t >= SETTLE && !screen.classList.contains('intro-in')) screen.classList.add('intro-in');
    if (t >= END) { ended = true; finish(); return; }
    raf = requestAnimationFrame(frame);
  }

  // Tocar durante la entrada la salta, sin que ese toque llegue a un botón.
  const swallow = (e) => { e.preventDefault(); e.stopPropagation(); finish(); };
  const onKey = (e) => { if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') swallow(e); };
  screen.addEventListener('click', swallow, true);
  addEventListener('keydown', onKey, true);
  addEventListener('resize', finish);

  function finish() {
    if (running !== finish) return;
    running = null;
    cancelAnimationFrame(raf);
    screen.removeEventListener('click', swallow, true);
    removeEventListener('keydown', onKey, true);
    removeEventListener('resize', finish);
    cv.remove();
    if (!ended) hush();   // si la saltan, los efectos se cortan; si termina, se apagan solos
    audio.holdBand(false);
    audio.startBand(0.15);
    screen.classList.remove('intro', 'intro-go');
    // los botones terminan de aparecer y se limpia la clase
    if (!screen.classList.contains('intro-in')) screen.classList.add('intro-in', 'intro-fast');
    setTimeout(() => screen.classList.remove('intro-in', 'intro-fast'), 900);
  }
  running = finish;
  raf = requestAnimationFrame(frame);
}
