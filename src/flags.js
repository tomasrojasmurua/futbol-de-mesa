// Calcciopoli · banderas en pixel art para elegir liga.
// Cada bandera se define píxel a píxel (36×24) y se le da caída de tela:
// pliegues suaves en tres tonos, como si flameara.
const W = 36, H = 24;
const rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const hex = (c) => '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const tint = (h, f) => { const c = rgb(h); return f >= 1 ? hex(c.map((v) => v + (255 - v) * (f - 1))) : hex(c.map((v) => v * f)); };

// Punto dentro de una estrella de cinco puntas (polígono de 10 vértices).
const inStar = (x, y, cx, cy, r) => {
  const pts = Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.42 : r; return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]; });
  let inside = false;
  for (let i = 0, j = 9; i < 10; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
const disc = (x, y, cx, cy, r) => Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= r;

const FLAGS = {
  // Chile: cuadro azul con estrella blanca, franja blanca y roja.
  cl: (x, y) => {
    if (y < 12 && x < 12) return inStar(x + 0.5, y + 0.5, 6, 6.2, 4.2) ? '#ffffff' : '#0b3b9c';
    return y < 12 ? '#f4f4f4' : '#d52b1e';
  },
  // Argentina: celeste, blanco y celeste con el sol de mayo.
  ar: (x, y) => {
    const d = Math.hypot(x + 0.5 - 18, y + 0.5 - 12);
    if (d < 2.6) return d < 1.6 ? '#f6b40e' : '#e09a0a';
    if (d < 4.2 && y >= 8 && y < 16) { const a = Math.atan2(y + 0.5 - 12, x + 0.5 - 18); if (Math.cos(a * 8) > 0.2) return '#f6b40e'; }
    return y < 8 || y >= 16 ? '#74acdf' : '#f4f4f4';
  },
  // Brasil: verde, rombo amarillo, esfera azul con la banda blanca y estrellas.
  br: (x, y) => {
    const px = x + 0.5, py = y + 0.5;
    const d = Math.hypot(px - 18, py - 12);
    if (d < 5.6) {
      const band = Math.abs(Math.hypot(px - 16, py - 23) - 11.2) < 0.85;
      if (band) return '#f4f4f4';
      if ((x * 7 + y * 13) % 11 === 0 && py > 12) return '#ffffff';
      return '#1d3a8a';
    }
    if (Math.abs(px - 18) / 15.5 + Math.abs(py - 12) / 9.4 <= 1) return '#fedf00';
    return '#009b3a';
  },
  // México: verde, blanco y rojo, con el águila al centro.
  mx: (x, y) => {
    if (x >= 12 && x < 24) {
      const px = x + 0.5, py = y + 0.5;
      if (Math.abs(px - 18) / 4.4 + Math.abs(py - 15.6) / 1.4 <= 1 && py > 15) return '#2e7d32'; // nopal y ramas
      if (disc(x, y, 18.6, 11, 3)) return (x + y) % 3 ? '#7a4a1c' : '#5a3410'; // águila
      if (disc(x, y, 16.2, 9.4, 1.2)) return '#5a3410';
      if (y === 13 && x >= 16 && x <= 21) return '#4c8c2a'; // serpiente
      return '#f4f4f4';
    }
    return x < 12 ? '#006847' : '#ce1126';
  },
  // España: rojo y gualda, con el escudo hacia el asta.
  es: (x, y) => {
    if (y >= 6 && y < 18 && x >= 7 && x < 14) {
      if (x === 7 || x === 13) return y > 7 && y < 17 ? '#c4c4c4' : '#f1bf00'; // columnas
      if (y >= 7 && y < 9 && x > 8 && x < 12) return '#c8a000'; // corona
      if (y >= 9 && y < 16 && x > 8 && x < 12) return ((x + y) % 2) ? '#ad1519' : '#f1bf00'; // escudo
    }
    return y < 6 || y >= 18 ? '#ad1519' : '#f1bf00';
  },
  // Inglaterra: cruz de San Jorge.
  en: (x, y) => (Math.abs(x + 0.5 - 18) < 2.6 || Math.abs(y + 0.5 - 12) < 2.6 ? '#ce1124' : '#f6f6f6'),
  // Italia: verde, blanco y rojo.
  it: (x) => (x < 12 ? '#009246' : x < 24 ? '#f4f4f4' : '#ce2b37'),
  // Alemania: negro, rojo y oro.
  de: (x, y) => (y < 8 ? '#1a1a1a' : y < 16 ? '#dd0000' : '#ffce00'),
  // Francia: azul, blanco y rojo.
  fr: (x) => (x < 12 ? '#002395' : x < 24 ? '#f4f4f4' : '#ed2939'),
  // Portugal: verde y rojo, con la esfera armilar y el escudo.
  pt: (x, y) => {
    const d = Math.hypot(x + 0.5 - 14, y + 0.5 - 12);
    if (d < 5.2) {
      if (Math.abs(x + 0.5 - 14) < 2.2 && Math.abs(y + 0.5 - 12) < 2.6) return (y > 9 && y < 14 && x > 12 && x < 15) ? '#f4f4f4' : '#d52b1e';
      if (d > 4 || Math.abs(y + 0.5 - 12) < 0.6 || Math.abs(y + 0.5 - 12 - (x + 0.5 - 14) * 0.5) < 0.5) return '#ffe000';
    }
    return x < 14 ? '#046a38' : '#da291c';
  },
  // Sin país: azul con un planeta al centro (selecciones y otros clubes).
  world: (x, y) => {
    const px = x + 0.5, py = y + 0.5, d = Math.hypot(px - 18, py - 12);
    if (d < 7.2) {
      // un poco de continentes y luz desde arriba a la izquierda
      const u = (px - 18) / 7.2, v = (py - 12) / 7.2;
      const land = Math.sin(u * 5.1 + 1.2) + Math.sin(v * 4.3 - u * 2) * 0.9 + Math.sin((u + v) * 7) * 0.35;
      const lit = -(u * 0.6 + v * 0.7);
      const base = land > 0.75 ? '#3fa34d' : '#2f8fd8';
      return lit > 0.35 ? tint(base, 1.25) : lit < -0.45 ? tint(base, 0.7) : base;
    }
    if ((x * 5 + y * 11) % 37 === 0) return '#ffffff'; // estrellas
    return '#1c4fa8';
  },
};

// Bandera de cada grupo de equipos.
export const GROUP_FLAG = {
  'Primera de Chile': 'cl', 'Liga Profesional': 'ar', 'Brasileirão': 'br', 'Liga MX': 'mx', LaLiga: 'es',
  'Premier League': 'en', 'Serie A': 'it', Bundesliga: 'de', 'Ligue 1': 'fr', 'Primeira Liga': 'pt',
  'Otros clubes': 'world', Selecciones: 'world',
};

export function paintFlag(cv, key) {
  const f = FLAGS[key] || FLAGS.world;
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    // ondas de la tela: un poco más de luz en las crestas y sombra en los valles
    const wave = Math.sin(x * 0.3 - y * 0.08 + 0.6);
    const shade = wave > 0.6 ? 1.07 : wave < -0.6 ? 0.88 : 1;
    let c = tint(f(x, y), shade);
    if (x === W - 1 || y === H - 1) c = tint(c, 0.62);
    if (x === 0 || y === 0) c = tint(c, 1.1);
    g.fillStyle = c; g.fillRect(x, y, 1, 1);
  }
  return cv;
}
