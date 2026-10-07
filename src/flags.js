// Calciopoli · banderas en pixel art para elegir liga.
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
  // ---------- selecciones ----------
  // Uruguay: nueve franjas y el sol de mayo en el cuadro blanco.
  uru: (x, y) => {
    if (x < 14 && y < 13) { const d = Math.hypot(x + 0.5 - 7, y + 0.5 - 6.5); if (d < 2.4) return '#f6b40e'; if (d < 4.4 && Math.cos(Math.atan2(y + 0.5 - 6.5, x + 0.5 - 7) * 8) > 0.3) return '#e09a0a'; return '#f6f6f6'; }
    return Math.floor(y / (24 / 9)) % 2 ? '#0038a8' : '#f6f6f6';
  },
  // Colombia: amarillo la mitad, azul y rojo.
  col: (x, y) => (y < 12 ? '#fcd116' : y < 18 ? '#003893' : '#ce1126'),
  // Perú: rojo, blanco y rojo.
  per: (x) => (x < 12 || x >= 24 ? '#d91023' : '#f6f6f6'),
  // Japón: el sol rojo.
  jpn: (x, y) => (disc(x, y, 18, 12, 6.6) ? '#bc002d' : '#f6f6f6'),
  // Ecuador: como Colombia, con el escudo al centro.
  ecu: (x, y) => {
    if (disc(x, y, 18, 11.5, 3.6)) return y < 9 ? '#6b4a1c' : disc(x, y, 18, 12, 2.2) ? '#4f9fd8' : '#7a5a2a';
    return y < 12 ? '#ffdd00' : y < 18 ? '#034ea2' : '#ed1c24';
  },
  // Paraguay: rojo, blanco y azul con el escudo.
  par: (x, y) => {
    if (disc(x, y, 18, 12, 3.2) && !disc(x, y, 18, 12, 2.2)) return '#2f7d32';
    if (disc(x, y, 18, 12, 1)) return '#f6b40e';
    return y < 8 ? '#d52b1e' : y < 16 ? '#f6f6f6' : '#0038a8';
  },
  // Venezuela: amarillo, azul y rojo con el arco de ocho estrellas.
  ven: (x, y) => {
    if (y >= 8 && y < 16) {
      for (let i = 0; i < 8; i++) { const a = Math.PI * (1.1 + i * 0.114); const sx = 18 + Math.cos(a) * 6.2, sy = 15 + Math.sin(a) * 6.2; if (Math.abs(x + 0.5 - sx) < 0.75 && Math.abs(y + 0.5 - sy) < 0.75) return '#ffffff'; }
      return '#00247d';
    }
    return y < 8 ? '#ffcc00' : '#cf142b';
  },
  // Bolivia: rojo, amarillo y verde.
  bol: (x, y) => (y < 8 ? '#d52b1e' : y < 16 ? '#f9e300' : '#007934'),
  // Estados Unidos: franjas y el cuadro azul con estrellas.
  usa: (x, y) => {
    if (x < 15 && y < 13) return (x % 3 === 1 && y % 3 === 1) || (x % 3 === 2 && y % 3 === 2 && x < 14 && y < 12) ? '#ffffff' : '#3c3b6e';
    return Math.floor(y / (24 / 13)) % 2 ? '#f6f6f6' : '#b22234';
  },
  // Bélgica: negro, amarillo y rojo.
  bel: (x) => (x < 12 ? '#1a1a1a' : x < 24 ? '#fdda24' : '#ef3340'),
  // Marruecos: rojo con la estrella verde.
  mar: (x, y) => {
    const inS = inStar(x + 0.5, y + 0.5, 18, 12.4, 6.4), inI = inStar(x + 0.5, y + 0.5, 18, 12.4, 4.2);
    return inS && !inI ? '#006233' : '#c1272d';
  },
  // Senegal: verde, amarillo y rojo con la estrella verde.
  sen: (x, y) => (x >= 12 && x < 24 ? (inStar(x + 0.5, y + 0.5, 18, 12.4, 4.6) ? '#00853f' : '#fdef42') : x < 12 ? '#00853f' : '#e31b23'),
  // Corea del Sur: el taegeuk y los cuatro trigramas.
  kor: (x, y) => {
    const px = x + 0.5, py = y + 0.5, d = Math.hypot(px - 18, py - 12);
    if (d < 5.4) {
      // mitad roja arriba, azul abajo, con la curva en S
      const up = py - 12 < -(px - 18) * 0.55;
      const s1 = Math.hypot(px - (18 - 2.2), py - (12 + 1.2)) < 2.7, s2 = Math.hypot(px - (18 + 2.2), py - (12 - 1.2)) < 2.7;
      return (up && !s1) || s2 ? '#cd2e3a' : '#0047a0';
    }
    const tri = (cx, cy) => Math.abs(px - cx) < 3 && Math.abs(py - cy) < 2.6 && Math.floor((py - cy + 2.6) / 1.75) % 1 === 0 && ((py - cy + 2.6) % 1.75) < 1.1;
    if (tri(6, 5) || tri(30, 5) || tri(6, 19) || tri(30, 19)) return '#1a1a1a';
    return '#f6f6f6';
  },
  // Suiza: la cruz blanca sobre rojo.
  sui: (x, y) => ((Math.abs(x + 0.5 - 18) < 1.8 && Math.abs(y + 0.5 - 12) < 6.2) || (Math.abs(y + 0.5 - 12) < 1.8 && Math.abs(x + 0.5 - 18) < 6.2) ? '#ffffff' : '#d52b1e'),
  // Dinamarca: la cruz nórdica.
  den: (x, y) => (Math.abs(x + 0.5 - 13) < 1.8 || Math.abs(y + 0.5 - 12) < 1.8 ? '#ffffff' : '#c8102e'),
  // Canadá: la hoja de arce.
  can: (x, y) => {
    if (x < 9 || x >= 27) return '#d52b1e';
    const px = x + 0.5 - 18, py = y + 0.5 - 11;
    const a = Math.atan2(py, px), r = Math.hypot(px, py);
    const leaf = r < 5.6 * (0.62 + 0.38 * Math.abs(Math.cos(a * 2.5 + 1.2))) && py < 5;
    if (leaf || (Math.abs(px) < 0.6 && py >= 3 && py < 7.5)) return '#d52b1e';
    return '#f6f6f6';
  },
  // Países Bajos: rojo, blanco y azul.
  ned: (x, y) => (y < 8 ? '#ae1c28' : y < 16 ? '#f6f6f6' : '#21468b'),
  // Croacia: rojo, blanco y azul con el escudo ajedrezado.
  cro: (x, y) => {
    if (x >= 14 && x < 22 && y >= 6 && y < 17) {
      if (y < 8) return (x % 2) ? '#0093dd' : '#171796';
      const w = y > 13 ? 4 - (y - 13) : 4;
      if (Math.abs(x + 0.5 - 18) <= w) return ((x + y) % 2) ? '#ff0000' : '#ffffff';
    }
    return y < 8 ? '#ff0000' : y < 16 ? '#f6f6f6' : '#171796';
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
  'Premier League': 'en', 'Serie A': 'it', Bundesliga: 'de', 'Ligue 1': 'fr', 'Primeira Liga': 'pt', 'J1 League': 'jpn',
  'Otros clubes': 'world', Selecciones: 'world',
};

// Bandera de cada selección (id del equipo → bandera).
const NATION_FLAG = { arg: 'ar', chi: 'cl', bra: 'br', mex: 'mx', esp: 'es', fra: 'fr', ger: 'de', eng: 'en', ita: 'it', por: 'pt' };
export const teamFlag = (id) => (FLAGS[id] ? id : NATION_FLAG[id]) || null;
const urls = {};
export function flagUrl(key) {
  return urls[key] || (urls[key] = paintFlag(document.createElement('canvas'), key).toDataURL());
}

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
