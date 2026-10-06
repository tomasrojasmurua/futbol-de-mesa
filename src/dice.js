// Mesa de dados: un dado de madera clara con un símbolo por cara que se agita
// en la mano, se lanza sobre el paño, rueda y cae. Todo automático: el
// resultado ya viene decidido, esto solo lo muestra.

const INK = '#2b3325', RED = '#7a2c1c', GREEN = '#2f6b2a', GOLD = '#8a6a12';
const PAPER = '#efe9d6';

// Pelota: círculo lleno con un pentágono claro al centro.
const ball = (cx, cy, r) => {
  const p = [0, 1, 2, 3, 4].map((i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    return `${(cx + Math.cos(a) * r * 0.42).toFixed(2)},${(cy + Math.sin(a) * r * 0.42).toFixed(2)}`;
  }).join(' ');
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="currentColor"/><polygon points="${p}" fill="${PAPER}"/>`;
};
const net = (x0, y0, x1, y1) => {
  let s = '';
  for (let x = x0 + 3; x < x1; x += 3) s += `M${x} ${y0}V${y1}`;
  for (let y = y0 + 3; y < y1; y += 3) s += `M${x0} ${y}H${x1}`;
  return `<path d="${s}" stroke="currentColor" stroke-width=".6" opacity=".45"/>`;
};

// Símbolos en una grilla de 24×24.
export const FACE_SYM = {
  goal: `${net(3, 5, 21, 20)}<path d="M3 20V5h18v15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>${ball(12, 14.5, 3.6)}`,
  post: `<path d="M5 21V4h15" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>${ball(11.4, 11, 4)}<path d="M7.2 6.8l-1.6-1.6M7 15.5l-1.6 1.6M7.8 11H6.2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
  clear: `<path d="M3 19h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M6 19l3-9 3 3 4-2" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 9l3-4" stroke="currentColor" stroke-width="1.5" stroke-dasharray="1.8 1.4" stroke-linecap="round"/>${ball(19.5, 4.6, 2.8)}`,
  wide: `${net(2, 13, 13, 21)}<path d="M2 21v-8h11v8" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9 11l7-5" stroke="currentColor" stroke-width="1.6" stroke-dasharray="2 1.6" stroke-linecap="round"/>${ball(18.5, 4.8, 2.8)}`,
  save: `<path d="M7 22v-3.2L3.6 14.2a1.3 1.3 0 0 1 2-1.6L8 15V6a1.4 1.4 0 0 1 2.8 0v5V4.2a1.4 1.4 0 0 1 2.8 0V11V5.2a1.4 1.4 0 0 1 2.8 0V11.5V7.6a1.4 1.4 0 0 1 2.8 0v8.6L17.5 19v3z" fill="currentColor"/><path d="M7 19h10.5" stroke="${PAPER}" stroke-width="1.2"/>`,
  corner: `<path d="M3.5 14.5a6.5 6.5 0 0 1 6.5 6.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="1.8 1.4"/><path d="M3 21h18M3 21V3" stroke="currentColor" stroke-width="1.2" opacity=".5"/><path d="M8 20V3" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M9 3.5h10l-3 3.5 3 3.5H9z" fill="currentColor"/>`,
  counter: `<path d="M13.5 1.5L4.5 13.5h6.2L9 22.5l10-13h-6.5z" fill="currentColor"/>`,
  foul: `<circle cx="9.5" cy="14" r="6" fill="currentColor"/><path d="M9.5 8.3h11.5v4.4h-6.3" fill="currentColor"/><circle cx="9.5" cy="14" r="2" fill="${PAPER}"/><path d="M4.5 9.5C2.5 7 3 4 5.5 3" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`,
  steal: `<path d="M4.5 10a7.8 7.8 0 0 1 13.4-3.6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M19.5 14a7.8 7.8 0 0 1-13.4 3.6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M19.6 2.6v5h-5z" fill="currentColor"/><path d="M4.4 21.4v-5h5z" fill="currentColor"/>${ball(12, 12, 3.4)}`,
  advance: `<path d="M5 12.5l7-7 7 7M5 19.5l7-7 7 7" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>`,
  longpass: `<path d="M3 21C5 9 12 4.5 17 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-dasharray="2.2 1.8" stroke-linecap="round"/><path d="M2 21h5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>${ball(18.5, 6.5, 3.6)}`,
  shoot: `<path d="M2 8.5h7M1 12h8M2 15.5h7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>${ball(16, 12, 5.2)}`,
  penalty: `${net(3, 3, 21, 11)}<path d="M3 11V3h18v8" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M6.5 21.5a5.5 5.5 0 0 1 11 0" fill="none" stroke="currentColor" stroke-width="1.4" opacity=".6"/>${ball(12, 17, 3)}`,
};
const FACE_COL = { goal: GREEN, penalty: RED, foul: RED, counter: GOLD, corner: GOLD };
const faceCol = (f) => FACE_COL[f] || INK;
export const faceSvg = (f) => `<svg viewBox="0 0 24 24" aria-hidden="true" style="color:${faceCol(f)}">${FACE_SYM[f] || ''}</svg>`;

// Paño de la mesa: un trozo de cancha en pixel art (franjas de corte, pasto
// con textura, el borde del área y la medialuna). Se dibuja una vez, chico, y
// se escala sin suavizar.
let grassUrl = null;
function grass() {
  if (grassUrl) return grassUrl;
  const W = 140, H = 60;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const BANDS = [['#3f9c3b', '#45a640', '#378f34', '#4fb04a'], ['#48ab43', '#4fb54a', '#3f9e3b', '#58bb52']];
  for (let x = 0; x < W; x++) {
    const band = BANDS[Math.floor(x / 14) % 2];
    for (let y = 0; y < H; y++) {
      const r = rnd();
      g.fillStyle = r < 0.62 ? band[0] : r < 0.82 ? band[1] : r < 0.95 ? band[2] : band[3];
      g.fillRect(x, y, 1, 1);
    }
  }
  // matas de pasto: rayitas verticales más claras y más oscuras
  for (let i = 0; i < 90; i++) {
    const x = Math.floor(rnd() * W), y = Math.floor(rnd() * (H - 2));
    g.fillStyle = rnd() < 0.5 ? 'rgba(20,70,20,.45)' : 'rgba(170,230,140,.35)';
    g.fillRect(x, y, 1, 2);
  }
  // línea del área grande y medialuna, gastadas
  const line = (x, y) => { if (rnd() < 0.93) { g.fillStyle = rnd() < 0.8 ? '#eef0e6' : '#cfd8c8'; g.fillRect(x, y, 1, 1); } };
  const ly = 14;
  for (let x = 0; x < W; x++) line(x, ly);
  const cx = W / 2, R = 30;
  for (let a = 0; a <= Math.PI; a += 0.008) {
    const x = Math.round(cx + Math.cos(a) * R), y = Math.round(ly - 22 + Math.sin(a) * R);
    if (y > ly) line(x, y);
  }
  // punto penal arriba, apenas asomado
  g.fillStyle = '#eef0e6'; g.fillRect(cx - 1, 2, 2, 2);
  // desgaste de tierra donde se paran a patear
  for (let i = 0; i < 40; i++) {
    const a = rnd() * Math.PI * 2, d = rnd() ** 1.5 * 7;
    g.fillStyle = 'rgba(140,110,60,.35)';
    g.fillRect(Math.round(cx + Math.cos(a) * d * 1.6), Math.round(H - 12 + Math.sin(a) * d * 0.6), 1, 1);
  }
  grassUrl = c.toDataURL();
  return grassUrl;
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// Muestra la tirada. value: 1..6, faces: lo que dice cada cara, labels: nombres,
// title: de qué es el dado, reason: qué significa el resultado. sound(nombre).
// band: franja con las cartas que cambiaron el dado; marked: las caras que pusieron.
export async function rollDice(wrap, { value, faces, labels, title, reason, sound, band, marked = [] }) {
  const kinds = [...new Set(faces)];
  const k = faces[value - 1];
  wrap.innerHTML = `<div class="tbox">
    <div class="thead"><small>Tirada de dado</small><h2>${title || 'El dado decide'}</h2>
      <div class="tband"></div><div class="tleg">${kinds.map((f) => `<span data-k="${f}"${marked.includes(f) ? ' class="byc"' : ''}><i>${faceSvg(f)}</i>${labels[f]}<em>${'●'.repeat(faces.filter((x) => x === f).length)}</em></span>`).join('')}</div></div>
    <div class="tray" style="background-image:url(${grass()})"><div class="tdie"></div></div>
    <div class="tres"></div></div>`;
  const tray = wrap.querySelector('.tray'), die = wrap.querySelector('.tdie'), res = wrap.querySelector('.tres');
  if (band) wrap.querySelector('.tband').appendChild(band);
  const setFace = (f) => { die.dataset.f = f; die.innerHTML = faceSvg(f); };
  const randFace = () => {
    let f;
    do f = faces[Math.floor(Math.random() * 6)]; while (kinds.length > 1 && f === die.dataset.f);
    return f;
  };
  setFace(randFace());
  wrap.classList.add('show');
  const W = tray.clientWidth, H = tray.clientHeight, D = die.offsetWidth;
  // Donde cae y desde donde se lanza (la mano, abajo).
  const lx = W / 2 + (Math.random() * 2 - 1) * Math.min(60, W * 0.18), ly = H / 2 + (Math.random() * 2 - 1) * 10;
  const hx = W / 2 + (Math.random() * 2 - 1) * 30, hy = H - D * 0.75;
  die.style.left = `${lx - D / 2}px`; die.style.top = `${ly - D / 2}px`;
  const rf = (Math.random() * 2 - 1) * 20;
  const dx = hx - lx, dy = hy - ly;

  // 1. Se agita en la mano.
  const red = reduced();
  const SHAKE = red ? 0 : 520;
  const t0 = performance.now();
  let nextFace = 0, nextClack = 0;
  await new Promise((done) => {
    const loop = (now) => {
      const t = now - t0;
      if (t >= SHAKE) { done(); return; }
      const p = t / SHAKE, amp = 3 + p * 9;
      die.style.transform = `translate(${dx + (Math.random() * 2 - 1) * amp}px,${dy + (Math.random() * 2 - 1) * amp}px) rotate(${(Math.random() * 2 - 1) * (8 + p * 26)}deg) scale(1.2)`;
      if (now >= nextFace) { setFace(randFace()); nextFace = now + 110 - p * 40; }
      if (now >= nextClack) { sound('clack'); nextClack = now + 150 - p * 60 + Math.random() * 30; }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });

  // 2. Se lanza: vuela girando, rebota y se asienta.
  const ROLL = red ? 250 : 900;
  const spin = (Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 540);
  die.style.transform = '';
  sound('throw');
  const anim = die.animate([
    { transform: `translate(${dx}px,${dy}px) rotate(${rf + spin}deg) scale(1.45)` },
    { transform: `translate(${dx * 0.3}px,${dy * 0.3 - 22}px) rotate(${rf + spin * 0.45}deg) scale(1.22)`, offset: 0.32 },
    { transform: `translate(${dx * 0.08}px,${dy * 0.08}px) rotate(${rf + spin * 0.15}deg) scale(1)`, offset: 0.55 },
    { transform: `translate(${dx * 0.03}px,${dy * 0.03 - 7}px) rotate(${rf + spin * 0.05}deg) scale(1.07)`, offset: 0.72 },
    { transform: `translate(0,0) rotate(${rf}deg) scale(1)` },
  ], { duration: ROLL, easing: 'cubic-bezier(.22,.75,.3,1)', fill: 'both' });
  const r0 = performance.now();
  let swap = 0;
  await new Promise((done) => {
    const loop = (now) => {
      const p = (now - r0) / ROLL;
      if (p >= 1) { done(); return; }
      if (!red && now >= swap) { setFace(randFace()); swap = now + 55 + 260 * p * p * p; }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });
  await anim.finished.catch(() => {});

  // 3. Cae y se ve el resultado.
  setFace(k);
  die.classList.add('land');
  sound('dice');
  wrap.querySelector(`.tleg span[data-k="${k}"]`)?.classList.add('hit');
  res.innerHTML = `<b class="rk">${labels[k]}</b>${reason ? `<span class="rd">${reason}</span>` : ''}`;
  await wait(1700);
  wrap.classList.remove('show');
  wrap.innerHTML = '';
}

// ---------- moneda del sorteo ----------
// Cada cara es un relieve: las figuras se dibujan en grises (blanco = más alto)
// y una luz desde arriba a la izquierda las ilumina como oro acuñado.
// Rama de laurel: un tallo en arco con hojas en punta a los dos lados.
const leaves = () => {
  let out = '<path d="M44 80C33 77 25.6 69 23.6 58 22.6 52 23 46 24.6 40" fill="none" stroke="#c4c4c4" stroke-width="1.3" stroke-linecap="round"/>';
  for (let i = 0; i < 6; i++) {
    const a = Math.PI * (0.64 + i * 0.075), x = 50 + Math.cos(a) * 27.6, y = 52 + Math.sin(a) * 27.6;
    const deg = (a * 180) / Math.PI;
    for (const side of [-1, 1]) {
      out += `<path d="M0 0C1.8-1.6 2.2-4 0-7.6-2.2-4-1.8-1.6 0 0Z" fill="${side < 0 ? '#d8d8d8' : '#cacaca'}" transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${(deg + 180 + side * 55).toFixed(1)})"/>`;
    }
  }
  return out;
};
const star = (x, y, r) => `<path d="M${x} ${y - r}L${x + r * 0.3} ${y - r * 0.3}L${x + r} ${y}L${x + r * 0.3} ${y + r * 0.3}L${x} ${y + r}L${x - r * 0.3} ${y + r * 0.3}L${x - r} ${y}L${x - r * 0.3} ${y - r * 0.3}Z" fill="#d8d8d8"/>`;
const groove = (d, w = 0.75, c = '#a6a6a6') => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
const COIN_ART = {
  // Cara: el busto de perfil de un jugador, peinado hacia atrás, con camiseta de cuello en V, y tres estrellas.
  cara: star(21, 48, 2.6) + star(24, 36, 2.2) + star(24, 60, 2.2) +
    '<g transform="translate(-2.5 -3.5) scale(1.04)">' +
    // camiseta y cuello
    '<path d="M12 99C14 88 24 81.6 41 79.6L50 85 60 79.6C76 81.6 86 88 88 99Z" fill="#b0b0b0"/>' +
    '<path d="M40.6 78.6L50 86 59.6 78.6 63.4 81.4 56 88.6 50 86.4 44 88.6 36.8 81.4Z" fill="#c4c4c4"/>' +
    groove('M50 86.4V99', 0.8, '#8c8c8c') + '<circle cx="50" cy="91" r=".9" fill="#d0d0d0"/>' +
    groove('M26 86C28 91 29 95 29 99M74 86C72 91 71 95 71 99', 0.7, '#8c8c8c') +
    // cara y cuello
    '<path d="M66 29C69 33 70 37 70 40 70 42 68.5 43 68.6 45 69.8 47.5 72.8 50.5 74.2 52.8 74.4 53.8 73.2 54.6 71.6 54.8L69.4 55.4C69 56.4 69.6 57.6 69.4 58.6 69.2 59.6 67.8 60.4 68.2 61.2 68.8 62 69 62.8 68.2 63.8 67.6 64.4 66.4 64.6 66.4 65.6 66.6 67 68 68.6 67.8 70.4 67.4 72.6 65 74 62 74.6 60 75 58.6 75.6 58.8 77.6L59.6 84H42L43 70C40 66 38 62 37 58Z" fill="#dcdcdc"/>' +
    '<path d="M63.4 45.6C64.6 44.8 66.4 44.9 67.2 45.8 66 46.8 64.6 46.9 63.4 45.6Z" fill="#8a8a8a"/>' + // ojo
    groove('M61.6 42.6C63.6 41.2 66.6 41.2 68.8 42.2', 1.3, '#c0c0c0') + // ceja
    groove('M69.6 55C68.6 54 67.6 53.6 66.8 54.4', 0.8, '#9a9a9a') + // nariz
    groove('M67.8 61.2L65.6 61.4', 0.8, '#909090') + // boca
    groove('M50.6 58C53 65 57 71.6 63 73.8', 0.8, '#c8c8c8') + // mandíbula
    groove('M61 59C59 61.6 59.6 65 61.4 67', 0.9, '#c4c4c4') + // pómulo
    // pelo
    '<path d="M37 61C31 56 28.6 49 29.2 41 29.8 30 36 20.6 47 17.6 55 15.6 63 17.4 67.4 22.4 69.4 24.8 69 27.6 66.6 29.6 64.6 31 62 31.2 60.6 33.6 59.4 35.8 60.4 39 59.6 42 59 44.6 57.2 45.4 56.6 47.6 55.6 52 53.6 57 49.6 60.6 46 63.6 41 64 37 61Z" fill="#d0d0d0"/>' +
    ['M31 47C30.6 37 35 27 44 22', 'M34 53C33 42 37 31 47 24.6', 'M38 57C36.6 46 40 35 50 27.4', 'M42.4 59.6C41 50 44 39 53 30.4', 'M47 59.6C46.4 51 48.6 42 56 34.4',
      'M51 57C50.6 51 52.4 45 57.4 40', 'M33 36C35 28 40 22.6 47.6 20', 'M46 19C53 17.6 60 18.6 65 22.4', 'M50 22.6C56 21.4 62 22.6 66.6 25.6', 'M55 27C59 25.6 63.4 26.4 67 28',
      'M40 38C42 32 46 28 51 25.6', 'M44 45C45.6 39 49 34.4 54.4 31.6', 'M36 45C36.4 39 38.6 34 42 30', 'M58 33C60.6 31 63.6 30.4 66 30.6'].map((d) => groove(d)).join('') +
    // oreja
    '<path d="M50.5 46C52.5 43.4 56.4 44 57 47.6 57.6 51.6 55.4 55.4 52.4 56.2 50.6 56.6 50 55 51 53.6" fill="#e4e4e4"/>' +
    groove('M52.6 48C54.4 47 55.6 48.4 55 50.8 54.6 52.6 53.4 53.2 52.6 52.6', 1, '#9c9c9c') +
    '</g>',
  // Sello: una pelota entre dos ramas de laurel.
  sello: leaves() + `<g transform="translate(100 0) scale(-1 1)">${leaves()}</g>` +
    '<path d="M44 80C47 78.6 53 78.6 56 80 53 81.6 47 81.6 44 80Z" fill="#cfcfcf"/><circle cx="50" cy="80" r="1.8" fill="#dedede"/>' + // lazo
    '<circle cx="50" cy="47" r="17" fill="#d6d6d6"/>' +
    '<path d="M50 39.4L57.2 44.6 54.4 53H45.6L42.8 44.6Z" fill="#8e8e8e"/>' +
    groove('M50 39.4V30.4M57.2 44.6L65.6 41.6M54.4 53L59.6 60.4M45.6 53L40.4 60.4M42.8 44.6L34.4 41.6', 1.4, '#9a9a9a'),
};

// El disco completo de una cara, como imagen (moneda que gira, leyenda y cartas de Cara o sello).
const faceCache = {};
export function coinFaceUrl(k) {
  if (faceCache[k]) return faceCache[k];
  const rim = Array.from({ length: 40 }, (_, i) => {
    const a = (i / 40) * Math.PI * 2;
    return `<rect x="${(50 + Math.cos(a) * 43 - 1.5).toFixed(2)}" y="${(50 + Math.sin(a) * 43 - 1.5).toFixed(2)}" width="3" height="3"/>`;
  }).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs>
    <radialGradient id="g" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#fff1a8"/><stop offset=".42" stop-color="#f2c230"/><stop offset=".72" stop-color="#d19a10"/><stop offset="1" stop-color="#9a6c00"/></radialGradient>
    <clipPath id="in"><circle cx="50" cy="50" r="41.2"/></clipPath>
    <filter id="r" x="0" y="0" width="100" height="100" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feColorMatrix in="SourceGraphic" type="luminanceToAlpha" result="h"/>
      <feGaussianBlur in="h" stdDeviation=".8" result="hb"/>
      <feDiffuseLighting in="hb" surfaceScale="4" diffuseConstant="1.12" lighting-color="#efbb2c" result="d"><feDistantLight azimuth="225" elevation="55"/></feDiffuseLighting>
      <feSpecularLighting in="hb" surfaceScale="4" specularConstant=".4" specularExponent="18" lighting-color="#fff6c8" result="s"><feDistantLight azimuth="225" elevation="55"/></feSpecularLighting>
      <feComposite in="s" in2="d" operator="arithmetic" k2="1" k3=".9" k4=".1" result="lit"/>
      <feMorphology in="h" operator="dilate" radius=".6" result="m"/>
      <feComposite in="lit" in2="m" operator="in"/>
    </filter></defs>
    <circle cx="50" cy="50" r="49" fill="#8a6200"/><circle cx="50" cy="50" r="46" fill="url(#g)"/>
    <circle cx="50" cy="50" r="44.6" fill="none" stroke="#f7d75a" stroke-width="1.8"/>
    <g fill="#fff3b0" opacity=".75" transform="translate(-1.4 -1.4)">${rim}</g><g fill="#7a5300">${rim}</g>
    <g clip-path="url(#in)"><g filter="url(#r)"><rect width="100" height="100" fill="#000"/>${COIN_ART[k]}</g></g></svg>`;
  return (faceCache[k] = `data:image/svg+xml,${encodeURIComponent(svg)}`);
}
const coinImg = (k) => `<img src="${coinFaceUrl(k)}" alt="">`;

export async function tossCoin(wrap, { result, text, sound }) {
  const k = result === 'sello' ? 'sello' : 'cara';
  const label = { cara: 'Cara', sello: 'Sello' };
  const edge = [-2, -1, 0, 1, 2].map((z) => `<i class="ce" style="transform:translateZ(${z}px)"></i>`).join('');
  wrap.innerHTML = `<div class="tbox">
    <div class="thead"><small>Sorteo inicial</small><h2>¿Cara o sello?</h2>
      <div class="tleg">${['cara', 'sello'].map((f) => `<span data-k="${f}"><i class="mc">${coinImg(f)}</i>${label[f]}</span>`).join('')}</div></div>
    <div class="tray" style="background-image:url(${grass()})"><div class="tshade"></div>
      <div class="tcoin"><div class="c3">${edge}<div class="cf f">${coinImg('cara')}</div><div class="cf b">${coinImg('sello')}</div></div></div></div>
    <div class="tres"><span class="rd">La moneda está en el aire…</span></div></div>`;
  const tray = wrap.querySelector('.tray'), coin = wrap.querySelector('.tcoin'), c3 = wrap.querySelector('.c3');
  const shade = wrap.querySelector('.tshade'), res = wrap.querySelector('.tres');
  wrap.classList.add('show');
  const W = tray.clientWidth, H = tray.clientHeight, D = coin.offsetWidth;
  const lx = W / 2 + (Math.random() * 2 - 1) * Math.min(50, W * 0.15), ly = H / 2 + 6;
  const dx = (Math.random() * 2 - 1) * 30, dy = H - D * 0.6 - ly;
  coin.style.left = `${lx - D / 2}px`; coin.style.top = `${ly - D / 2}px`;
  shade.style.left = `${lx - D / 2}px`; shade.style.top = `${ly - D / 2 + 6}px`;

  const red = reduced();
  const T = red ? 300 : 1350;
  const turns = 5 + Math.floor(Math.random() * 3);
  const F = turns * 360 + (k === 'sello' ? 180 : 0);
  const tilt = (Math.random() * 2 - 1) * 25;
  sound('coin');
  // Sube girando sobre sí misma, baja, pica una vez y se asienta tambaleando.
  const fly = coin.animate([
    { transform: `translate(${dx}px,${dy}px) scale(1.05) rotate(${tilt}deg)` },
    { transform: `translate(${dx * 0.5}px,${dy * 0.4 - 70}px) scale(1.75) rotate(${tilt * 0.6}deg)`, offset: 0.36, easing: 'ease-in' },
    { transform: `translate(0,0) scale(1) rotate(${tilt * 0.2}deg)`, offset: 0.66, easing: 'ease-out' },
    { transform: `translate(0,-10px) scale(1.1) rotate(${tilt * 0.1}deg)`, offset: 0.76, easing: 'ease-in' },
    { transform: 'translate(0,0) scale(1) rotate(0deg)', offset: 0.86 },
    { transform: 'translate(0,0) scale(1) rotate(0deg)' },
  ], { duration: T, fill: 'both' });
  const spin = c3.animate([
    { transform: 'rotateX(0deg)' },
    { transform: `rotateX(${F - 40}deg)`, offset: 0.66 },
    { transform: `rotateX(${F + 28}deg)`, offset: 0.76 },
    { transform: `rotateX(${F - 12}deg)`, offset: 0.86 },
    { transform: `rotateX(${F + 4}deg)`, offset: 0.94 },
    { transform: `rotateX(${F}deg)` },
  ], { duration: T, easing: 'linear', fill: 'both' });
  shade.animate([
    { transform: `translate(${dx}px,${dy}px) scale(.9)`, opacity: 0.5 },
    { transform: `translate(${dx * 0.5}px,${dy * 0.4}px) scale(.45)`, opacity: 0.18, offset: 0.36 },
    { transform: 'translate(0,0) scale(1)', opacity: 0.55, offset: 0.66 },
    { transform: 'translate(0,0) scale(.85)', opacity: 0.4, offset: 0.76 },
    { transform: 'translate(0,0) scale(1)', opacity: 0.55 },
  ], { duration: T, fill: 'both' });
  if (!red) setTimeout(() => sound('clink'), T * 0.66);
  await Promise.all([fly.finished, spin.finished].map((p) => p.catch(() => {})));

  coin.classList.add('land');
  sound('clink');
  wrap.querySelector(`.tleg span[data-k="${k}"]`)?.classList.add('hit');
  res.innerHTML = `<b class="rk">¡${label[k]}!</b>${text ? `<span class="rd">${text}</span>` : ''}`;
  await wait(1900);
  wrap.classList.remove('show');
  wrap.innerHTML = '';
}
