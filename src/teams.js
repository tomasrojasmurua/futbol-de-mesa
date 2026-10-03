// Equipos disponibles. Los colores son aproximaciones de las camisetas clásicas.
// pattern: plain | stripes | hoops | band | sash | sleeves | center | checks
export const TEAMS = [
  // Clubes
  { id: 'rac', name: 'Racing Club', short: 'RAC', group: 'Clubes', kit: { shirt: '#74b9e7', alt2: '#ffffff', pattern: 'stripes', shorts: '#1a1a1a' }, away: { shirt: '#1a1a1a', alt2: '#74b9e7', pattern: 'plain', shorts: '#1a1a1a' } },
  { id: 'uc', name: 'Universidad Católica', short: 'UC', group: 'Clubes', kit: { shirt: '#ffffff', alt2: '#1d3e8a', pattern: 'band', shorts: '#1d3e8a' }, away: { shirt: '#1d3e8a', alt2: '#ffffff', pattern: 'band', shorts: '#ffffff' } },
  { id: 'colo', name: 'Colo-Colo', short: 'CC', group: 'Clubes', kit: { shirt: '#ffffff', alt2: '#111111', pattern: 'plain', shorts: '#111111' }, away: { shirt: '#111111', alt2: '#ffffff', pattern: 'plain', shorts: '#111111' } },
  { id: 'udch', name: 'U. de Chile', short: 'UCH', group: 'Clubes', kit: { shirt: '#0b3fa8', alt2: '#d6182b', pattern: 'plain', shorts: '#0b3fa8' }, away: { shirt: '#ffffff', alt2: '#0b3fa8', pattern: 'plain', shorts: '#ffffff' } },
  { id: 'boca', name: 'Boca Juniors', short: 'BOC', group: 'Clubes', kit: { shirt: '#0b2c7a', alt2: '#f7c600', pattern: 'band', shorts: '#0b2c7a' }, away: { shirt: '#f7c600', alt2: '#0b2c7a', pattern: 'plain', shorts: '#0b2c7a' } },
  { id: 'river', name: 'River Plate', short: 'RIV', group: 'Clubes', kit: { shirt: '#ffffff', alt2: '#d8132b', pattern: 'sash', shorts: '#111111' }, away: { shirt: '#d8132b', alt2: '#ffffff', pattern: 'sash', shorts: '#111111' } },
  { id: 'fla', name: 'Flamengo', short: 'FLA', group: 'Clubes', kit: { shirt: '#c8102e', alt2: '#111111', pattern: 'hoops', shorts: '#ffffff' }, away: { shirt: '#ffffff', alt2: '#c8102e', pattern: 'plain', shorts: '#ffffff' } },
  { id: 'pal', name: 'Palmeiras', short: 'PAL', group: 'Clubes', kit: { shirt: '#006437', alt2: '#ffffff', pattern: 'plain', shorts: '#ffffff' }, away: { shirt: '#ffffff', alt2: '#006437', pattern: 'plain', shorts: '#006437' } },
  { id: 'rma', name: 'Real Madrid', short: 'RMA', group: 'Clubes', kit: { shirt: '#ffffff', alt2: '#e8c34a', pattern: 'plain', shorts: '#ffffff' }, away: { shirt: '#24245a', alt2: '#e8c34a', pattern: 'plain', shorts: '#24245a' } },
  { id: 'bar', name: 'Barcelona', short: 'BAR', group: 'Clubes', kit: { shirt: '#a50044', alt2: '#004d98', pattern: 'stripes', shorts: '#004d98' }, away: { shirt: '#f2d84a', alt2: '#a50044', pattern: 'plain', shorts: '#f2d84a' } },
  { id: 'atm', name: 'Atlético de Madrid', short: 'ATM', group: 'Clubes', kit: { shirt: '#d8202c', alt2: '#ffffff', pattern: 'stripes', shorts: '#23308a' }, away: { shirt: '#23308a', alt2: '#d8202c', pattern: 'plain', shorts: '#23308a' } },
  { id: 'mci', name: 'Manchester City', short: 'MCI', group: 'Clubes', kit: { shirt: '#6cabdd', alt2: '#ffffff', pattern: 'plain', shorts: '#ffffff' }, away: { shirt: '#1c2c5b', alt2: '#6cabdd', pattern: 'plain', shorts: '#1c2c5b' } },
  { id: 'mun', name: 'Manchester United', short: 'MUN', group: 'Clubes', kit: { shirt: '#da291c', alt2: '#ffffff', pattern: 'plain', shorts: '#ffffff' }, away: { shirt: '#ffffff', alt2: '#da291c', pattern: 'plain', shorts: '#111111' } },
  { id: 'liv', name: 'Liverpool', short: 'LIV', group: 'Clubes', kit: { shirt: '#c8102e', alt2: '#ffffff', pattern: 'plain', shorts: '#c8102e' }, away: { shirt: '#f4f1e6', alt2: '#111111', pattern: 'plain', shorts: '#f4f1e6' } },
  { id: 'ars', name: 'Arsenal', short: 'ARS', group: 'Clubes', kit: { shirt: '#ef0107', alt2: '#ffffff', pattern: 'sleeves', shorts: '#ffffff' }, away: { shirt: '#f0d54a', alt2: '#023474', pattern: 'plain', shorts: '#023474' } },
  { id: 'che', name: 'Chelsea', short: 'CHE', group: 'Clubes', kit: { shirt: '#034694', alt2: '#ffffff', pattern: 'plain', shorts: '#034694' }, away: { shirt: '#ffffff', alt2: '#034694', pattern: 'plain', shorts: '#ffffff' } },
  { id: 'bay', name: 'Bayern Múnich', short: 'BAY', group: 'Clubes', kit: { shirt: '#dc052d', alt2: '#ffffff', pattern: 'plain', shorts: '#dc052d' }, away: { shirt: '#ffffff', alt2: '#dc052d', pattern: 'plain', shorts: '#ffffff' } },
  { id: 'psg', name: 'Paris Saint-Germain', short: 'PSG', group: 'Clubes', kit: { shirt: '#004170', alt2: '#da291c', pattern: 'center', shorts: '#004170' }, away: { shirt: '#ffffff', alt2: '#da291c', pattern: 'center', shorts: '#ffffff' } },
  { id: 'juv', name: 'Juventus', short: 'JUV', group: 'Clubes', kit: { shirt: '#ffffff', alt2: '#111111', pattern: 'stripes', shorts: '#ffffff' }, away: { shirt: '#f2c94c', alt2: '#111111', pattern: 'plain', shorts: '#111111' } },
  { id: 'int', name: 'Inter', short: 'INT', group: 'Clubes', kit: { shirt: '#0068a8', alt2: '#111111', pattern: 'stripes', shorts: '#111111' }, away: { shirt: '#ffffff', alt2: '#0068a8', pattern: 'plain', shorts: '#ffffff' } },
  { id: 'mil', name: 'Milan', short: 'MIL', group: 'Clubes', kit: { shirt: '#d8202c', alt2: '#111111', pattern: 'stripes', shorts: '#ffffff' }, away: { shirt: '#ffffff', alt2: '#d8202c', pattern: 'plain', shorts: '#ffffff' } },
  { id: 'aja', name: 'Ajax', short: 'AJA', group: 'Clubes', kit: { shirt: '#ffffff', alt2: '#d2122e', pattern: 'center', shorts: '#ffffff' }, away: { shirt: '#111111', alt2: '#d2122e', pattern: 'center', shorts: '#111111' } },
  // Selecciones
  { id: 'arg', name: 'Argentina', short: 'ARG', group: 'Selecciones', kit: { shirt: '#75b2dd', alt2: '#ffffff', pattern: 'stripes', shorts: '#111111' }, away: { shirt: '#23308a', alt2: '#75b2dd', pattern: 'plain', shorts: '#23308a' } },
  { id: 'chi', name: 'Chile', short: 'CHI', group: 'Selecciones', kit: { shirt: '#d52b1e', alt2: '#ffffff', pattern: 'plain', shorts: '#0039a6' }, away: { shirt: '#ffffff', alt2: '#d52b1e', pattern: 'plain', shorts: '#ffffff' } },
  { id: 'bra', name: 'Brasil', short: 'BRA', group: 'Selecciones', kit: { shirt: '#ffdf00', alt2: '#009b3a', pattern: 'plain', shorts: '#002776' }, away: { shirt: '#002776', alt2: '#ffdf00', pattern: 'plain', shorts: '#ffffff' } },
  { id: 'uru', name: 'Uruguay', short: 'URU', group: 'Selecciones', kit: { shirt: '#5cbfeb', alt2: '#ffffff', pattern: 'plain', shorts: '#111111' }, away: { shirt: '#ffffff', alt2: '#5cbfeb', pattern: 'plain', shorts: '#5cbfeb' } },
  { id: 'col', name: 'Colombia', short: 'COL', group: 'Selecciones', kit: { shirt: '#fcd116', alt2: '#003893', pattern: 'plain', shorts: '#003893' }, away: { shirt: '#ce1126', alt2: '#fcd116', pattern: 'plain', shorts: '#ce1126' } },
  { id: 'per', name: 'Perú', short: 'PER', group: 'Selecciones', kit: { shirt: '#ffffff', alt2: '#d91023', pattern: 'sash', shorts: '#ffffff' }, away: { shirt: '#d91023', alt2: '#ffffff', pattern: 'sash', shorts: '#d91023' } },
  { id: 'mex', name: 'México', short: 'MEX', group: 'Selecciones', kit: { shirt: '#006847', alt2: '#ffffff', pattern: 'plain', shorts: '#ffffff' }, away: { shirt: '#ffffff', alt2: '#006847', pattern: 'plain', shorts: '#ce1126' } },
  { id: 'esp', name: 'España', short: 'ESP', group: 'Selecciones', kit: { shirt: '#c60b1e', alt2: '#ffc400', pattern: 'plain', shorts: '#1a2a6c' }, away: { shirt: '#ffffff', alt2: '#c60b1e', pattern: 'plain', shorts: '#ffffff' } },
  { id: 'fra', name: 'Francia', short: 'FRA', group: 'Selecciones', kit: { shirt: '#1f2a6b', alt2: '#ffffff', pattern: 'plain', shorts: '#ffffff' }, away: { shirt: '#ffffff', alt2: '#1f2a6b', pattern: 'plain', shorts: '#1f2a6b' } },
  { id: 'ger', name: 'Alemania', short: 'GER', group: 'Selecciones', kit: { shirt: '#ffffff', alt2: '#111111', pattern: 'plain', shorts: '#111111' }, away: { shirt: '#111111', alt2: '#d00', pattern: 'plain', shorts: '#111111' } },
  { id: 'eng', name: 'Inglaterra', short: 'ENG', group: 'Selecciones', kit: { shirt: '#ffffff', alt2: '#1d2b6b', pattern: 'plain', shorts: '#1d2b6b' }, away: { shirt: '#c8102e', alt2: '#ffffff', pattern: 'plain', shorts: '#c8102e' } },
  { id: 'ita', name: 'Italia', short: 'ITA', group: 'Selecciones', kit: { shirt: '#1f5bb5', alt2: '#ffffff', pattern: 'plain', shorts: '#ffffff' }, away: { shirt: '#ffffff', alt2: '#1f5bb5', pattern: 'plain', shorts: '#1f5bb5' } },
  { id: 'por', name: 'Portugal', short: 'POR', group: 'Selecciones', kit: { shirt: '#a6192e', alt2: '#046a38', pattern: 'plain', shorts: '#046a38' }, away: { shirt: '#ffffff', alt2: '#a6192e', pattern: 'plain', shorts: '#ffffff' } },
  { id: 'ned', name: 'Países Bajos', short: 'NED', group: 'Selecciones', kit: { shirt: '#f36c21', alt2: '#ffffff', pattern: 'plain', shorts: '#f36c21' }, away: { shirt: '#1d2b6b', alt2: '#f36c21', pattern: 'plain', shorts: '#1d2b6b' } },
  { id: 'cro', name: 'Croacia', short: 'CRO', group: 'Selecciones', kit: { shirt: '#ffffff', alt2: '#e3162b', pattern: 'checks', shorts: '#ffffff' }, away: { shirt: '#1d2b6b', alt2: '#e3162b', pattern: 'plain', shorts: '#1d2b6b' } },
  { id: 'jpn', name: 'Japón', short: 'JPN', group: 'Selecciones', kit: { shirt: '#1a3a8f', alt2: '#ffffff', pattern: 'plain', shorts: '#ffffff' }, away: { shirt: '#ffffff', alt2: '#1a3a8f', pattern: 'plain', shorts: '#1a3a8f' } },
];

export const teamById = (id) => TEAMS.find((t) => t.id === id) || TEAMS[0];

function hexRgb(h) {
  const n = h.replace('#', '');
  const f = n.length === 3 ? n.split('').map((c) => c + c).join('') : n;
  return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16));
}

function colorDist(a, b) {
  const [r1, g1, b1] = hexRgb(a), [r2, g2, b2] = hexRgb(b);
  return Math.hypot(r1 - r2, g1 - g2, b1 - b2);
}

// Elige las camisetas del partido: si chocan los colores, la visita usa su alternativa.
export function matchKits(home, away) {
  const h = home.kit;
  let a = away.kit;
  const clash = Math.min(colorDist(h.shirt, a.shirt), colorDist(h.shirt, a.alt2) + 60, colorDist(h.alt2, a.shirt) + 60);
  if (clash < 120) a = away.away;
  if (colorDist(h.shirt, a.shirt) < 90) a = { shirt: '#222222', alt2: '#888888', pattern: 'plain', shorts: '#222222' };
  return [
    { ...h, gk: '#2fbf4a' },
    { ...a, gk: h.shirt === '#ffdf00' || colorDist(a.shirt, '#f2b705') < 120 ? '#9b30d9' : '#f2b705' },
  ];
}

export { hexRgb };
