import { LEAGUES } from './leagues/index.js';
// Estadios: cada equipo juega de local en una versión pixelada inspirada en su
// cancha real. Los rasgos son aproximaciones para reconocerla de un vistazo.
//
// seats: colores de las butacas · track: pista de atletismo · roof: techo
// shape: 'round' para estadios con esquinas curvas · mow: corte del pasto
// letters: texto en la tribuna · sky: cielo de la escena del remate
// features: andes (cordillera de fondo), arch (arco de Wembley), tower (Torre de
// los Homenajes), bombonera (un lateral vertical), kop (una cabecera entera del
// local), trusses (vigas rojas de San Siro), dome (techo de rombos), ring (techo
// circular blanco)
const S = (name, city, o) => ({ name, city, seats: ['#2c313d', '#3a404d'], track: null, roof: null, shape: 'rect', mow: 'stripes', letters: '', sky: 'night', features: [], ...o });

const MONUMENTAL = S('Más Monumental', 'Buenos Aires', { seats: ['#d8132b', '#f2f2f2'], shape: 'round', letters: 'RIVER' });
const NACIONAL_CL = S('Estadio Nacional', 'Santiago', { seats: ['#8f939b', '#b8bcc4'], track: '#c8552c', shape: 'round', sky: 'dusk', features: ['andes'], letters: 'CHILE' });
const MARACANA = S('Maracanã', 'Río de Janeiro', { seats: ['#f2c230', '#2f6fc1'], shape: 'round', roof: '#eef1f4', features: ['ring'], letters: 'MARACANA' });
const SAN_SIRO = S('San Siro', 'Milán', { seats: ['#d24a2a', '#2c56a8'], roof: '#5d636c', features: ['trusses'], mow: 'checks' });
const OLIMPICO = S('Stadio Olimpico', 'Roma', { seats: ['#2c56a8', '#f2f2f2'], track: '#c8552c', roof: '#eef1f4', shape: 'round', letters: 'ITALIA' });
const LUZ = S('Estádio da Luz', 'Lisboa', { seats: ['#c8102e', '#f2f2f2'], roof: '#c9ced6', letters: 'BENFICA' });
const AZTECA = S('Estadio Azteca', 'Ciudad de México', { seats: ['#006847', '#ce1126'], roof: '#a3a9b1', shape: 'round', letters: 'MEXICO' });
const ARENA_AMS = S('Johan Cruijff ArenA', 'Ámsterdam', { seats: ['#c8102e', '#d9d9d9'], roof: '#7d838c', shape: 'round', letters: 'AJAX' });

export const STADIUMS = {
  // Clubes de América
  rac: S('El Cilindro', 'Avellaneda', { seats: ['#74b9e7', '#f2f2f2'], shape: 'round', letters: 'RACING CLUB' }),
  uc: S('Claro Arena', 'Santiago', { seats: ['#1d3e8a', '#f2f2f2'], roof: '#d9dde3', sky: 'day', features: ['andes'], letters: 'CRUZADOS' }),
  colo: S('Monumental David Arellano', 'Santiago', { seats: ['#1a1a1a', '#f2f2f2'], shape: 'round', sky: 'dusk', features: ['andes'], letters: 'COLO COLO' }),
  udch: { ...NACIONAL_CL, seats: ['#0b3fa8', '#8f939b'], letters: 'LA U' },
  boca: S('La Bombonera', 'Buenos Aires', { seats: ['#0b2c7a', '#f7c600'], features: ['bombonera'], letters: 'BOCA' }),
  river: MONUMENTAL,
  fla: { ...MARACANA, letters: 'MENGAO' },
  pal: S('Allianz Parque', 'São Paulo', { seats: ['#006437', '#f2f2f2'], roof: '#e3e6ea', letters: 'PALMEIRAS' }),
  ind: S('Libertadores de América', 'Avellaneda', { seats: ['#d8202c', '#f2f2f2'], roof: '#c9ced6', letters: 'INDEPENDIENTE' }),
  slo: S('Pedro Bidegain', 'Buenos Aires', { seats: ['#1b2f80', '#d1162b'], letters: 'CICLON' }),
  est: S('Jorge Luis Hirschi', 'La Plata', { seats: ['#d8202c', '#f2f2f2'], roof: '#c9ced6', letters: 'PINCHA' }),
  vel: S('José Amalfitani', 'Buenos Aires', { seats: ['#1d3e8a', '#f2f2f2'], letters: 'VELEZ' }),
  pen: S('Campeón del Siglo', 'Montevideo', { seats: ['#f7c600', '#1a1a1a'], sky: 'dusk', letters: 'PENAROL' }),
  nac: S('Gran Parque Central', 'Montevideo', { seats: ['#0b2c7a', '#f2f2f2'], letters: 'NACIONAL' }),
  cor: S('Neo Química Arena', 'São Paulo', { seats: ['#1a1a1a', '#f2f2f2'], roof: '#d9dde3', letters: 'TIMAO' }),
  sao: S('Morumbis', 'São Paulo', { seats: ['#d1162b', '#f2f2f2'], shape: 'round', letters: 'SAO PAULO' }),
  atn: S('Atanasio Girardot', 'Medellín', { seats: ['#00843d', '#f2f2f2'], roof: '#c9ced6', sky: 'dusk', letters: 'VERDOLAGA' }),
  ame: { ...AZTECA, seats: ['#fde100', '#0b2c7a'], letters: 'AMERICA' },
  uni: S('Monumental de Lima', 'Lima', { seats: ['#f4ecd0', '#7a1f2b'], shape: 'round', sky: 'dusk', letters: 'LA U' }),
  ali: S('Alejandro Villanueva', 'Lima', { seats: ['#0b2c7a', '#f2f2f2'], letters: 'ALIANZA' }),
  // Clubes de Europa
  rma: S('Santiago Bernabéu', 'Madrid', { seats: ['#e9e9ee', '#2a2f6a'], roof: '#b7bec8', features: ['dome'], letters: 'REAL MADRID' }),
  bar: S('Spotify Camp Nou', 'Barcelona', { seats: ['#004d98', '#a50044'], shape: 'round', letters: 'MES QUE UN CLUB' }),
  atm: S('Metropolitano', 'Madrid', { seats: ['#d8202c', '#f2f2f2'], roof: '#e8eaee', letters: 'ATLETI' }),
  mci: S('Etihad Stadium', 'Mánchester', { seats: ['#6cabdd', '#1c2c5b'], roof: '#8a9099', letters: 'CITY' }),
  mun: S('Old Trafford', 'Mánchester', { seats: ['#da291c', '#1a1a1a'], roof: '#9aa1aa', features: ['trusses'], letters: 'MANCHESTER UNITED' }),
  liv: S('Anfield', 'Liverpool', { seats: ['#c8102e', '#f2f2f2'], roof: '#8a9099', features: ['kop'], letters: 'THIS IS ANFIELD' }),
  ars: S('Emirates Stadium', 'Londres', { seats: ['#ef0107', '#f2f2f2'], roof: '#eef1f4', shape: 'round', letters: 'ARSENAL' }),
  che: S('Stamford Bridge', 'Londres', { seats: ['#034694', '#f2f2f2'], roof: '#8a9099', letters: 'CHELSEA' }),
  bay: S('Allianz Arena', 'Múnich', { seats: ['#dc052d', '#7a7f88'], roof: '#dc052d', shape: 'round', features: ['dome'], letters: 'FC BAYERN' }),
  psg: S('Parc des Princes', 'París', { seats: ['#004170', '#da291c'], roof: '#a3a9b1', shape: 'round', features: ['ring'], letters: 'ICI C EST PARIS' }),
  juv: S('Allianz Stadium', 'Turín', { seats: ['#f2f2f2', '#1a1a1a'], roof: '#e3e6ea', letters: 'JUVENTUS' }),
  int: { ...SAN_SIRO, letters: 'INTER' },
  mil: { ...SAN_SIRO, letters: 'MILAN' },
  aja: ARENA_AMS,
  tot: S('Tottenham Hotspur Stadium', 'Londres', { seats: ['#132257', '#f2f2f2'], roof: '#c9ced6', letters: 'SPURS' }),
  new: S('St James\' Park', 'Newcastle', { seats: ['#1a1a1a', '#f2f2f2'], roof: '#9aa1aa', letters: 'NEWCASTLE' }),
  bvb: S('Signal Iduna Park', 'Dortmund', { seats: ['#fde100', '#1a1a1a'], roof: '#9aa1aa', features: ['kop'], letters: 'BVB' }),
  lev: S('BayArena', 'Leverkusen', { seats: ['#e32221', '#1a1a1a'], roof: '#d9dde3', shape: 'round', letters: 'WERKSELF' }),
  nap: S('Diego Armando Maradona', 'Nápoles', { seats: ['#12a0d7', '#f2f2f2'], track: '#2f5fb3', roof: '#a3a9b1', shape: 'round', letters: 'NAPOLI' }),
  rom: { ...OLIMPICO, seats: ['#8e1f2f', '#f0bc42'], letters: 'FORZA ROMA' },
  sev: S('Ramón Sánchez-Pizjuán', 'Sevilla', { seats: ['#d8202c', '#f2f2f2'], sky: 'dusk', letters: 'SEVILLA' }),
  ath: S('San Mamés', 'Bilbao', { seats: ['#ee2523', '#f2f2f2'], roof: '#e8eaee', letters: 'ATHLETIC' }),
  ben: LUZ,
  fcp: S('Estádio do Dragão', 'Oporto', { seats: ['#0047ab', '#f2f2f2'], roof: '#c9ced6', letters: 'FC PORTO' }),
  scp: S('José Alvalade', 'Lisboa', { seats: ['#008057', '#f2c230'], roof: '#c9ced6', letters: 'SPORTING' }),
  psv: S('Philips Stadion', 'Eindhoven', { seats: ['#ed1c24', '#f2f2f2'], roof: '#9aa1aa', letters: 'PSV' }),
  om: S('Vélodrome', 'Marsella', { seats: ['#2faee0', '#f2f2f2'], roof: '#eef1f4', shape: 'round', letters: 'DROIT AU BUT' }),
  cel: S('Celtic Park', 'Glasgow', { seats: ['#018749', '#f2f2f2'], roof: '#9aa1aa', letters: 'CELTIC' }),
  gal: S('RAMS Park', 'Estambul', { seats: ['#fdb912', '#a90432'], roof: '#c9ced6', letters: 'CIMBOM' }),
  // Selecciones
  arg: { ...MONUMENTAL, seats: ['#75b2dd', '#f2f2f2'], letters: 'ARGENTINA' },
  chi: NACIONAL_CL,
  bra: { ...MARACANA, letters: 'BRASIL' },
  uru: S('Estadio Centenario', 'Montevideo', { seats: ['#75aadb', '#f2f2f2'], shape: 'round', features: ['tower'], letters: 'URUGUAY' }),
  col: S('Metropolitano Roberto Meléndez', 'Barranquilla', { seats: ['#fcd116', '#ce1126'], sky: 'day', letters: 'COLOMBIA' }),
  per: S('Estadio Nacional', 'Lima', { seats: ['#d91023', '#f2f2f2'], track: '#b8452a', sky: 'dusk', letters: 'PERU' }),
  mex: AZTECA,
  esp: S('La Cartuja', 'Sevilla', { seats: ['#c60b1e', '#ffc400'], track: '#c8552c', roof: '#e3e6ea', shape: 'round', sky: 'dusk', letters: 'ESPANA' }),
  fra: S('Stade de France', 'Saint-Denis', { seats: ['#0055a4', '#ef4135'], roof: '#c9ced6', shape: 'round', features: ['ring'], letters: 'ALLEZ LES BLEUS' }),
  ger: S('Olympiastadion', 'Berlín', { seats: ['#5d636c', '#8a9099'], track: '#2f5fb3', roof: '#d9dde3', shape: 'round', letters: 'DEUTSCHLAND' }),
  eng: S('Wembley', 'Londres', { seats: ['#c8102e', '#f2f2f2'], roof: '#c9ced6', features: ['arch'], letters: 'ENGLAND' }),
  ita: OLIMPICO,
  por: { ...LUZ, letters: 'PORTUGAL' },
  ned: { ...ARENA_AMS, seats: ['#f36c21', '#d9d9d9'], letters: 'ORANJE' },
  cro: S('Maksimir', 'Zagreb', { seats: ['#171796', '#f2f2f2'], letters: 'HRVATSKA', mow: 'checks' }),
  jpn: S('Estadio Nacional de Japón', 'Tokio', { seats: ['#6b5a3e', '#3f6b4a'], track: '#a0522d', roof: '#8a6a44', shape: 'round', letters: 'NIPPON' }),
  ecu: S('Rodrigo Paz Delgado', 'Quito', { seats: ['#ffdd00', '#034ea2'], sky: 'day', features: ['andes'], letters: 'ECUADOR' }),
  par: S('Defensores del Chaco', 'Asunción', { seats: ['#d52b1e', '#f2f2f2'], letters: 'PARAGUAY' }),
  ven: S('Monumental de Maturín', 'Maturín', { seats: ['#7a1b2b', '#f2c230'], track: '#c8552c', shape: 'round', sky: 'dusk', letters: 'VINOTINTO' }),
  bol: S('Hernando Siles', 'La Paz', { seats: ['#007934', '#f2f2f2'], track: '#c8552c', shape: 'round', sky: 'day', features: ['andes'], letters: 'BOLIVIA' }),
  usa: S('SoFi Stadium', 'Los Ángeles', { seats: ['#002868', '#bf0a30'], roof: '#e3e6ea', shape: 'round', letters: 'USA' }),
  bel: S('Estadio Rey Balduino', 'Bruselas', { seats: ['#e30613', '#1a1a1a'], track: '#c8552c', roof: '#c9ced6', shape: 'round', letters: 'RED DEVILS' }),
  mar: S('Príncipe Moulay Abdellah', 'Rabat', { seats: ['#c1272d', '#006233'], roof: '#e8eaee', letters: 'MAROC' }),
  sen: S('Abdoulaye Wade', 'Diamniadio', { seats: ['#00853f', '#fdef42'], roof: '#e3e6ea', shape: 'round', sky: 'dusk', letters: 'SENEGAL' }),
  kor: S('Estadio Mundialista de Seúl', 'Seúl', { seats: ['#e4002b', '#f2f2f2'], roof: '#eef1f4', shape: 'round', letters: 'KOREA' }),
  sui: S('Wankdorf', 'Berna', { seats: ['#d52b1e', '#f2f2f2'], roof: '#9aa1aa', letters: 'HOPP SCHWIIZ' }),
  den: S('Parken', 'Copenhague', { seats: ['#c8102e', '#f2f2f2'], roof: '#9aa1aa', letters: 'DANMARK' }),
  can: S('BMO Field', 'Toronto', { seats: ['#d80621', '#f2f2f2'], roof: '#c9ced6', sky: 'day', letters: 'CANADA' }),
};

// Estadios de los equipos que llegaron con las ligas del modo carrera.
for (const l of LEAGUES) {
  for (const t of l.newTeams) {
    if (STADIUMS[t.id] || !t.stadium) continue;
    const { name, city, ...rest } = t.stadium;
    STADIUMS[t.id] = S(name, city, Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined)));
  }
}

export function stadiumFor(teamId) {
  return STADIUMS[teamId] || S('Estadio', '', {});
}

// País y continente de cada estadio, para buscarlo en la lista de la previa.
// flag: la bandera en pixel art de flags.js (si no hay, la del mundo).
export const COUNTRIES = {
  Argentina: ['ar', 'América'], Bolivia: ['bol', 'América'], Brasil: ['br', 'América'], Canadá: ['can', 'América'],
  Chile: ['cl', 'América'], Colombia: ['col', 'América'], Ecuador: ['ecu', 'América'], 'Estados Unidos': ['usa', 'América'],
  México: ['mx', 'América'], Paraguay: ['par', 'América'], Perú: ['per', 'América'], Uruguay: ['uru', 'América'], Venezuela: ['ven', 'América'],
  Alemania: ['de', 'Europa'], Bélgica: ['bel', 'Europa'], Croacia: ['cro', 'Europa'], Dinamarca: ['den', 'Europa'], Escocia: ['world', 'Europa'],
  España: ['es', 'Europa'], Francia: ['fr', 'Europa'], Inglaterra: ['en', 'Europa'], Italia: ['it', 'Europa'], 'Países Bajos': ['ned', 'Europa'],
  Portugal: ['pt', 'Europa'], Suiza: ['sui', 'Europa'], Turquía: ['world', 'Europa'],
  Marruecos: ['mar', 'África'], Senegal: ['sen', 'África'],
  'Corea del Sur': ['kor', 'Asia'], Japón: ['jpn', 'Asia'],
};
export const CONTINENTS = ['América', 'Europa', 'África', 'Asia'];
// Clubes que no están en ninguna liga del modo carrera.
const CLUB_COUNTRY = { pen: 'Uruguay', nac: 'Uruguay', atn: 'Colombia', uni: 'Perú', ali: 'Perú', aja: 'Países Bajos', psv: 'Países Bajos', cel: 'Escocia', gal: 'Turquía' };
const NATION_COUNTRY = {
  arg: 'Argentina', chi: 'Chile', bra: 'Brasil', uru: 'Uruguay', col: 'Colombia', per: 'Perú', mex: 'México', esp: 'España', fra: 'Francia',
  ger: 'Alemania', eng: 'Inglaterra', ita: 'Italia', por: 'Portugal', ned: 'Países Bajos', cro: 'Croacia', jpn: 'Japón', ecu: 'Ecuador',
  par: 'Paraguay', ven: 'Venezuela', bol: 'Bolivia', usa: 'Estados Unidos', bel: 'Bélgica', mar: 'Marruecos', sen: 'Senegal',
  kor: 'Corea del Sur', sui: 'Suiza', den: 'Dinamarca', can: 'Canadá',
};
const BY_COUNTRY = { ...CLUB_COUNTRY, ...NATION_COUNTRY };
for (const l of LEAGUES) for (const id of l.teams) if (!BY_COUNTRY[id]) BY_COUNTRY[id] = l.country;
export const stadiumCountry = (id) => BY_COUNTRY[id] || null;
