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
  wide: `${net(2, 13, 13, 21)}<path d="M2 21v-8h11v8" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9 11l7-5" stroke="currentColor" stroke-width="1.6" stroke-dasharray="2 1.6" stroke-linecap="round"/>${ball(18.5, 4.8, 2.8)}`,
  save: `<path d="M7 22v-3.2L3.6 14.2a1.3 1.3 0 0 1 2-1.6L8 15V6a1.4 1.4 0 0 1 2.8 0v5V4.2a1.4 1.4 0 0 1 2.8 0V11V5.2a1.4 1.4 0 0 1 2.8 0V11.5V7.6a1.4 1.4 0 0 1 2.8 0v8.6L17.5 19v3z" fill="currentColor"/><path d="M7 19h10.5" stroke="${PAPER}" stroke-width="1.2"/>`,
  corner: `<path d="M3.5 14.5a6.5 6.5 0 0 1 6.5 6.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="1.8 1.4"/><path d="M3 21h18M3 21V3" stroke="currentColor" stroke-width="1.2" opacity=".5"/><path d="M8 20V3" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M9 3.5h10l-3 3.5 3 3.5H9z" fill="currentColor"/>`,
  counter: `<path d="M13.5 1.5L4.5 13.5h6.2L9 22.5l10-13h-6.5z" fill="currentColor"/>`,
  foul: `<circle cx="9.5" cy="14" r="6" fill="currentColor"/><path d="M9.5 8.3h11.5v4.4h-6.3" fill="currentColor"/><circle cx="9.5" cy="14" r="2" fill="${PAPER}"/><path d="M4.5 9.5C2.5 7 3 4 5.5 3" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`,
  steal: `<path d="M4.5 10a7.8 7.8 0 0 1 13.4-3.6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M19.5 14a7.8 7.8 0 0 1-13.4 3.6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M19.6 2.6v5h-5z" fill="currentColor"/><path d="M4.4 21.4v-5h5z" fill="currentColor"/>${ball(12, 12, 3.4)}`,
  advance: `<path d="M5 12.5l7-7 7 7M5 19.5l7-7 7 7" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>`,
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
export async function rollDice(wrap, { value, faces, labels, title, reason, sound }) {
  const kinds = [...new Set(faces)];
  const k = faces[value - 1];
  wrap.innerHTML = `<div class="tbox">
    <div class="thead"><small>Tirada de dado</small><h2>${title || 'El dado decide'}</h2>
      <div class="tleg">${kinds.map((f) => `<span data-k="${f}"><i>${faceSvg(f)}</i>${labels[f]}<em>${'●'.repeat(faces.filter((x) => x === f).length)}</em></span>`).join('')}</div></div>
    <div class="tray" style="background-image:url(${grass()})"><div class="tdie"></div></div>
    <div class="tres"></div></div>`;
  const tray = wrap.querySelector('.tray'), die = wrap.querySelector('.tdie'), res = wrap.querySelector('.tres');
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
