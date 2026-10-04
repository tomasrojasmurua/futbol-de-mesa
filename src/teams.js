// Equipos disponibles. Los colores son aproximaciones de las camisetas clásicas.
// pattern: plain | stripes | hoops | band | sash | sleeves | center | checks
export const TEAMS = [
  // Clubes de América
  { id: 'rac', name: 'Racing Club', short: 'RAC', group: 'Clubes de América', kit: { shirt: '#74b9e7', alt2: '#ffffff', pattern: 'stripes', shorts: '#1a1a1a' }, away: { shirt: '#1a1a1a', alt2: '#74b9e7', pattern: 'plain', shorts: '#1a1a1a' } },
  { id: 'uc', name: 'Universidad Católica', short: 'UC', group: 'Clubes de América', kit: { shirt: '#ffffff', alt2: '#1d3e8a', pattern: 'band', shorts: '#1d3e8a' }, away: { shirt: '#1d3e8a', alt2: '#ffffff', pattern: 'band', shorts: '#ffffff' } },
  { id: 'colo', name: 'Colo-Colo', short: 'CC', group: 'Clubes de América', kit: { shirt: '#ffffff', alt2: '#111111', pattern: 'plain', shorts: '#111111' }, away: { shirt: '#111111', alt2: '#ffffff', pattern: 'plain', shorts: '#111111' } },
  { id: 'udch', name: 'U. de Chile', short: 'UCH', group: 'Clubes de América', kit: { shirt: '#0b3fa8', alt2: '#d6182b', pattern: 'plain', shorts: '#0b3fa8' }, away: { shirt: '#ffffff', alt2: '#0b3fa8', pattern: 'plain', shorts: '#ffffff' } },
  { id: 'boca', name: 'Boca Juniors', short: 'BOC', group: 'Clubes de América', kit: { shirt: '#0b2c7a', alt2: '#f7c600', pattern: 'band', shorts: '#0b2c7a' }, away: { shirt: '#f7c600', alt2: '#0b2c7a', pattern: 'plain', shorts: '#0b2c7a' } },
  { id: 'river', name: 'River Plate', short: 'RIV', group: 'Clubes de América', kit: { shirt: '#ffffff', alt2: '#d8132b', pattern: 'sash', shorts: '#111111' }, away: { shirt: '#d8132b', alt2: '#ffffff', pattern: 'sash', shorts: '#111111' } },
  { id: 'fla', name: 'Flamengo', short: 'FLA', group: 'Clubes de América', kit: { shirt: '#c8102e', alt2: '#111111', pattern: 'hoops', shorts: '#ffffff' }, away: { shirt: '#ffffff', alt2: '#c8102e', pattern: 'plain', shorts: '#ffffff' } },
  { id: 'pal', name: 'Palmeiras', short: 'PAL', group: 'Clubes de América', kit: { shirt: '#006437', alt2: '#ffffff', pattern: 'plain', shorts: '#ffffff' }, away: { shirt: '#ffffff', alt2: '#006437', pattern: 'plain', shorts: '#006437' } },
  { id: 'ind', name: 'Independiente', short: 'IND', group: 'Clubes de América', kit: { shirt: '#d8202c', alt2: '#ffffff', pattern: 'plain', shorts: '#1d3e8a' }, away: { shirt: '#ffffff', alt2: '#d8202c', pattern: 'plain', shorts: '#ffffff' } },
  { id: 'slo', name: 'San Lorenzo', short: 'SLO', group: 'Clubes de América', kit: { shirt: '#1b2f80', alt2: '#d1162b', pattern: 'stripes', shorts: '#1b2f80' }, away: { shirt: '#ffffff', alt2: '#d1162b', pattern: 'plain', shorts: '#ffffff' } },
  { id: 'est', name: 'Estudiantes', short: 'EST', group: 'Clubes de América', kit: { shirt: '#d8202c', alt2: '#ffffff', pattern: 'stripes', shorts: '#111111' }, away: { shirt: '#ffffff', alt2: '#d8202c', pattern: 'plain', shorts: '#ffffff' } },
  { id: 'vel', name: 'Vélez Sarsfield', short: 'VEL', group: 'Clubes de América', kit: { shirt: '#ffffff', alt2: '#1d3e8a', pattern: 'band', shorts: '#ffffff' }, away: { shirt: '#1d3e8a', alt2: '#ffffff', pattern: 'band', shorts: '#1d3e8a' } },
  { id: 'pen', name: 'Peñarol', short: 'PEN', group: 'Clubes de América', kit: { shirt: '#f7c600', alt2: '#111111', pattern: 'stripes', shorts: '#111111' }, away: { shirt: '#111111', alt2: '#f7c600', pattern: 'plain', shorts: '#111111' } },
  { id: 'nac', name: 'Nacional', short: 'NAC', group: 'Clubes de América', kit: { shirt: '#ffffff', alt2: '#d1162b', pattern: 'plain', shorts: '#0b2c7a' }, away: { shirt: '#0b2c7a', alt2: '#d1162b', pattern: 'plain', shorts: '#0b2c7a' } },
  { id: 'cor', name: 'Corinthians', short: 'COR', group: 'Clubes de América', kit: { shirt: '#ffffff', alt2: '#111111', pattern: 'plain', shorts: '#111111' }, away: { shirt: '#111111', alt2: '#ffffff', pattern: 'plain', shorts: '#111111' } },
  { id: 'sao', name: 'São Paulo', short: 'SAO', group: 'Clubes de América', kit: { shirt: '#ffffff', alt2: '#d1162b', pattern: 'band', shorts: '#ffffff' }, away: { shirt: '#d1162b', alt2: '#111111', pattern: 'stripes', shorts: '#111111' } },
  { id: 'atn', name: 'Atlético Nacional', short: 'ATN', group: 'Clubes de América', kit: { shirt: '#00843d', alt2: '#ffffff', pattern: 'stripes', shorts: '#ffffff' }, away: { shirt: '#ffffff', alt2: '#00843d', pattern: 'plain', shorts: '#00843d' } },
  { id: 'ame', name: 'América', short: 'AME', group: 'Clubes de América', kit: { shirt: '#fde100', alt2: '#0b2c7a', pattern: 'plain', shorts: '#0b2c7a' }, away: { shirt: '#0b2c7a', alt2: '#fde100', pattern: 'plain', shorts: '#0b2c7a' } },
  { id: 'uni', name: 'Universitario', short: 'UNI', group: 'Clubes de América', kit: { shirt: '#f4ecd0', alt2: '#7a1f2b', pattern: 'plain', shorts: '#f4ecd0' }, away: { shirt: '#7a1f2b', alt2: '#f4ecd0', pattern: 'plain', shorts: '#7a1f2b' } },
  { id: 'ali', name: 'Alianza Lima', short: 'ALI', group: 'Clubes de América', kit: { shirt: '#0b2c7a', alt2: '#ffffff', pattern: 'stripes', shorts: '#0b2c7a' }, away: { shirt: '#ffffff', alt2: '#0b2c7a', pattern: 'plain', shorts: '#ffffff' } },
  // Clubes de Europa
  { id: 'rma', name: 'Real Madrid', short: 'RMA', group: 'Clubes de Europa', kit: { shirt: '#ffffff', alt2: '#e8c34a', pattern: 'plain', shorts: '#ffffff' }, away: { shirt: '#24245a', alt2: '#e8c34a', pattern: 'plain', shorts: '#24245a' } },
  { id: 'bar', name: 'Barcelona', short: 'BAR', group: 'Clubes de Europa', kit: { shirt: '#a50044', alt2: '#004d98', pattern: 'stripes', shorts: '#004d98' }, away: { shirt: '#f2d84a', alt2: '#a50044', pattern: 'plain', shorts: '#f2d84a' } },
  { id: 'atm', name: 'Atlético de Madrid', short: 'ATM', group: 'Clubes de Europa', kit: { shirt: '#d8202c', alt2: '#ffffff', pattern: 'stripes', shorts: '#23308a' }, away: { shirt: '#23308a', alt2: '#d8202c', pattern: 'plain', shorts: '#23308a' } },
  { id: 'mci', name: 'Manchester City', short: 'MCI', group: 'Clubes de Europa', kit: { shirt: '#6cabdd', alt2: '#ffffff', pattern: 'plain', shorts: '#ffffff' }, away: { shirt: '#1c2c5b', alt2: '#6cabdd', pattern: 'plain', shorts: '#1c2c5b' } },
  { id: 'mun', name: 'Manchester United', short: 'MUN', group: 'Clubes de Europa', kit: { shirt: '#da291c', alt2: '#ffffff', pattern: 'plain', shorts: '#ffffff' }, away: { shirt: '#ffffff', alt2: '#da291c', pattern: 'plain', shorts: '#111111' } },
  { id: 'liv', name: 'Liverpool', short: 'LIV', group: 'Clubes de Europa', kit: { shirt: '#c8102e', alt2: '#ffffff', pattern: 'plain', shorts: '#c8102e' }, away: { shirt: '#f4f1e6', alt2: '#111111', pattern: 'plain', shorts: '#f4f1e6' } },
  { id: 'ars', name: 'Arsenal', short: 'ARS', group: 'Clubes de Europa', kit: { shirt: '#ef0107', alt2: '#ffffff', pattern: 'sleeves', shorts: '#ffffff' }, away: { shirt: '#f0d54a', alt2: '#023474', pattern: 'plain', shorts: '#023474' } },
  { id: 'che', name: 'Chelsea', short: 'CHE', group: 'Clubes de Europa', kit: { shirt: '#034694', alt2: '#ffffff', pattern: 'plain', shorts: '#034694' }, away: { shirt: '#ffffff', alt2: '#034694', pattern: 'plain', shorts: '#ffffff' } },
  { id: 'bay', name: 'Bayern Múnich', short: 'BAY', group: 'Clubes de Europa', kit: { shirt: '#dc052d', alt2: '#ffffff', pattern: 'plain', shorts: '#dc052d' }, away: { shirt: '#ffffff', alt2: '#dc052d', pattern: 'plain', shorts: '#ffffff' } },
  { id: 'psg', name: 'Paris Saint-Germain', short: 'PSG', group: 'Clubes de Europa', kit: { shirt: '#004170', alt2: '#da291c', pattern: 'center', shorts: '#004170' }, away: { shirt: '#ffffff', alt2: '#da291c', pattern: 'center', shorts: '#ffffff' } },
  { id: 'juv', name: 'Juventus', short: 'JUV', group: 'Clubes de Europa', kit: { shirt: '#ffffff', alt2: '#111111', pattern: 'stripes', shorts: '#ffffff' }, away: { shirt: '#f2c94c', alt2: '#111111', pattern: 'plain', shorts: '#111111' } },
  { id: 'int', name: 'Inter', short: 'INT', group: 'Clubes de Europa', kit: { shirt: '#0068a8', alt2: '#111111', pattern: 'stripes', shorts: '#111111' }, away: { shirt: '#ffffff', alt2: '#0068a8', pattern: 'plain', shorts: '#ffffff' } },
  { id: 'mil', name: 'Milan', short: 'MIL', group: 'Clubes de Europa', kit: { shirt: '#d8202c', alt2: '#111111', pattern: 'stripes', shorts: '#ffffff' }, away: { shirt: '#ffffff', alt2: '#d8202c', pattern: 'plain', shorts: '#ffffff' } },
  { id: 'aja', name: 'Ajax', short: 'AJA', group: 'Clubes de Europa', kit: { shirt: '#ffffff', alt2: '#d2122e', pattern: 'center', shorts: '#ffffff' }, away: { shirt: '#111111', alt2: '#d2122e', pattern: 'center', shorts: '#111111' } },
  { id: 'tot', name: 'Tottenham', short: 'TOT', group: 'Clubes de Europa', kit: { shirt: '#ffffff', alt2: '#132257', pattern: 'plain', shorts: '#132257' }, away: { shirt: '#132257', alt2: '#ffffff', pattern: 'plain', shorts: '#132257' } },
  { id: 'new', name: 'Newcastle', short: 'NEW', group: 'Clubes de Europa', kit: { shirt: '#111111', alt2: '#ffffff', pattern: 'stripes', shorts: '#111111' }, away: { shirt: '#3fb6e8', alt2: '#111111', pattern: 'plain', shorts: '#3fb6e8' } },
  { id: 'bvb', name: 'Borussia Dortmund', short: 'BVB', group: 'Clubes de Europa', kit: { shirt: '#fde100', alt2: '#111111', pattern: 'plain', shorts: '#111111' }, away: { shirt: '#111111', alt2: '#fde100', pattern: 'plain', shorts: '#111111' } },
  { id: 'lev', name: 'Bayer Leverkusen', short: 'LEV', group: 'Clubes de Europa', kit: { shirt: '#e32221', alt2: '#111111', pattern: 'plain', shorts: '#111111' }, away: { shirt: '#111111', alt2: '#e32221', pattern: 'plain', shorts: '#111111' } },
  { id: 'nap', name: 'Napoli', short: 'NAP', group: 'Clubes de Europa', kit: { shirt: '#12a0d7', alt2: '#ffffff', pattern: 'plain', shorts: '#ffffff' }, away: { shirt: '#ffffff', alt2: '#12a0d7', pattern: 'plain', shorts: '#ffffff' } },
  { id: 'rom', name: 'Roma', short: 'ROM', group: 'Clubes de Europa', kit: { shirt: '#8e1f2f', alt2: '#f0bc42', pattern: 'plain', shorts: '#ffffff' }, away: { shirt: '#ffffff', alt2: '#8e1f2f', pattern: 'plain', shorts: '#ffffff' } },
  { id: 'sev', name: 'Sevilla', short: 'SEV', group: 'Clubes de Europa', kit: { shirt: '#ffffff', alt2: '#d8202c', pattern: 'plain', shorts: '#ffffff' }, away: { shirt: '#d8202c', alt2: '#ffffff', pattern: 'plain', shorts: '#d8202c' } },
  { id: 'ath', name: 'Athletic Club', short: 'ATH', group: 'Clubes de Europa', kit: { shirt: '#ee2523', alt2: '#ffffff', pattern: 'stripes', shorts: '#111111' }, away: { shirt: '#111111', alt2: '#ee2523', pattern: 'plain', shorts: '#111111' } },
  { id: 'ben', name: 'Benfica', short: 'BEN', group: 'Clubes de Europa', kit: { shirt: '#e20e0e', alt2: '#ffffff', pattern: 'plain', shorts: '#ffffff' }, away: { shirt: '#111111', alt2: '#e20e0e', pattern: 'plain', shorts: '#111111' } },
  { id: 'fcp', name: 'Porto', short: 'FCP', group: 'Clubes de Europa', kit: { shirt: '#0047ab', alt2: '#ffffff', pattern: 'stripes', shorts: '#0047ab' }, away: { shirt: '#f28c28', alt2: '#111111', pattern: 'plain', shorts: '#111111' } },
  { id: 'scp', name: 'Sporting CP', short: 'SCP', group: 'Clubes de Europa', kit: { shirt: '#008057', alt2: '#ffffff', pattern: 'hoops', shorts: '#111111' }, away: { shirt: '#111111', alt2: '#008057', pattern: 'plain', shorts: '#111111' } },
  { id: 'psv', name: 'PSV', short: 'PSV', group: 'Clubes de Europa', kit: { shirt: '#ed1c24', alt2: '#ffffff', pattern: 'stripes', shorts: '#111111' }, away: { shirt: '#111111', alt2: '#ed1c24', pattern: 'plain', shorts: '#111111' } },
  { id: 'om', name: 'Marsella', short: 'OM', group: 'Clubes de Europa', kit: { shirt: '#ffffff', alt2: '#2faee0', pattern: 'plain', shorts: '#ffffff' }, away: { shirt: '#2faee0', alt2: '#ffffff', pattern: 'plain', shorts: '#2faee0' } },
  { id: 'cel', name: 'Celtic', short: 'CEL', group: 'Clubes de Europa', kit: { shirt: '#018749', alt2: '#ffffff', pattern: 'hoops', shorts: '#ffffff' }, away: { shirt: '#111111', alt2: '#f2c94c', pattern: 'plain', shorts: '#111111' } },
  { id: 'gal', name: 'Galatasaray', short: 'GAL', group: 'Clubes de Europa', kit: { shirt: '#fdb912', alt2: '#a90432', pattern: 'stripes', shorts: '#a90432' }, away: { shirt: '#a90432', alt2: '#fdb912', pattern: 'plain', shorts: '#a90432' } },
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
  { id: 'ecu', name: 'Ecuador', short: 'ECU', group: 'Selecciones', kit: { shirt: '#ffdd00', alt2: '#034ea2', pattern: 'plain', shorts: '#034ea2' }, away: { shirt: '#034ea2', alt2: '#ffdd00', pattern: 'plain', shorts: '#034ea2' } },
  { id: 'par', name: 'Paraguay', short: 'PAR', group: 'Selecciones', kit: { shirt: '#d52b1e', alt2: '#ffffff', pattern: 'stripes', shorts: '#0038a8' }, away: { shirt: '#0038a8', alt2: '#ffffff', pattern: 'plain', shorts: '#0038a8' } },
  { id: 'ven', name: 'Venezuela', short: 'VEN', group: 'Selecciones', kit: { shirt: '#7a1b2b', alt2: '#f2c230', pattern: 'plain', shorts: '#ffffff' }, away: { shirt: '#ffffff', alt2: '#7a1b2b', pattern: 'plain', shorts: '#ffffff' } },
  { id: 'bol', name: 'Bolivia', short: 'BOL', group: 'Selecciones', kit: { shirt: '#007934', alt2: '#ffffff', pattern: 'plain', shorts: '#ffffff' }, away: { shirt: '#ffffff', alt2: '#007934', pattern: 'plain', shorts: '#ffffff' } },
  { id: 'usa', name: 'Estados Unidos', short: 'USA', group: 'Selecciones', kit: { shirt: '#ffffff', alt2: '#002868', pattern: 'plain', shorts: '#002868' }, away: { shirt: '#002868', alt2: '#bf0a30', pattern: 'plain', shorts: '#002868' } },
  { id: 'bel', name: 'Bélgica', short: 'BEL', group: 'Selecciones', kit: { shirt: '#e30613', alt2: '#fdda24', pattern: 'plain', shorts: '#e30613' }, away: { shirt: '#ffffff', alt2: '#e30613', pattern: 'plain', shorts: '#ffffff' } },
  { id: 'mar', name: 'Marruecos', short: 'MAR', group: 'Selecciones', kit: { shirt: '#c1272d', alt2: '#006233', pattern: 'plain', shorts: '#006233' }, away: { shirt: '#ffffff', alt2: '#c1272d', pattern: 'plain', shorts: '#ffffff' } },
  { id: 'sen', name: 'Senegal', short: 'SEN', group: 'Selecciones', kit: { shirt: '#ffffff', alt2: '#00853f', pattern: 'plain', shorts: '#ffffff' }, away: { shirt: '#00853f', alt2: '#fdef42', pattern: 'plain', shorts: '#00853f' } },
  { id: 'kor', name: 'Corea del Sur', short: 'KOR', group: 'Selecciones', kit: { shirt: '#e4002b', alt2: '#0047a0', pattern: 'plain', shorts: '#111111' }, away: { shirt: '#ffffff', alt2: '#e4002b', pattern: 'plain', shorts: '#ffffff' } },
  { id: 'sui', name: 'Suiza', short: 'SUI', group: 'Selecciones', kit: { shirt: '#d52b1e', alt2: '#ffffff', pattern: 'plain', shorts: '#ffffff' }, away: { shirt: '#ffffff', alt2: '#d52b1e', pattern: 'plain', shorts: '#ffffff' } },
  { id: 'den', name: 'Dinamarca', short: 'DEN', group: 'Selecciones', kit: { shirt: '#c8102e', alt2: '#ffffff', pattern: 'plain', shorts: '#ffffff' }, away: { shirt: '#ffffff', alt2: '#c8102e', pattern: 'plain', shorts: '#ffffff' } },
  { id: 'can', name: 'Canadá', short: 'CAN', group: 'Selecciones', kit: { shirt: '#d80621', alt2: '#ffffff', pattern: 'plain', shorts: '#d80621' }, away: { shirt: '#ffffff', alt2: '#d80621', pattern: 'plain', shorts: '#ffffff' } },
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
