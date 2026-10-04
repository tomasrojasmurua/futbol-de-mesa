// LaLiga 2025-26
const st = (name, city, seats, letters, o = {}) => ({ name, city, seats, track: null, roof: null, shape: 'rect', mow: 'stripes', letters, sky: 'night', features: [], ...o });

export default {
  id: 'es',
  name: 'LaLiga',
  country: 'España',
  // Todos los equipos de la máxima categoría, en orden alfabético por nombre.
  teams: ['es_ala', 'ath', 'atm', 'bar', 'es_cel', 'es_elc', 'es_esp', 'es_get', 'es_gir', 'es_lev', 'es_mll', 'es_osa', 'es_ray', 'es_bet', 'rma', 'es_ovi', 'es_rso', 'sev', 'es_val', 'es_vil'],
  // Equipos que no existían en el juego.
  newTeams: [
    {
      id: 'es_ala', name: 'Alavés', short: 'ALA',
      kit: { shirt: '#1c4fa0', alt2: '#ffffff', pattern: 'stripes', shorts: '#1c4fa0' },
      away: { shirt: '#1a1a1a', alt2: '#1c4fa0', pattern: 'plain', shorts: '#1a1a1a' },
      squad: ['Sivera', 'Yusi', 'Tenaglia', 'Pacheco', 'Jonny', 'Rebbach', 'Blanco', 'Guridi', 'Calebe', 'Boyé', 'Mariano'],
      stadium: st('Estadio de Mendizorroza', 'Vitoria-Gasteiz', ['#1c4fa0', '#ffffff'], 'ALAVES'),
    },
    {
      id: 'es_cel', name: 'Celta de Vigo', short: 'CLT',
      kit: { shirt: '#8ac3ee', alt2: '#ffffff', pattern: 'plain', shorts: '#ffffff' },
      away: { shirt: '#1d2a4d', alt2: '#8ac3ee', pattern: 'plain', shorts: '#1d2a4d' },
      squad: ['Radu', 'Carreira', 'Starfelt', 'Alonso', 'Mingueza', 'Swedberg', 'Moriba', 'Beltrán', 'Aspas', 'Borja', 'Jutglà'],
      stadium: st('Abanca-Balaídos', 'Vigo', ['#8ac3ee', '#ffffff'], 'CELTA', { roof: '#d4d8dd' }),
    },
    {
      id: 'es_elc', name: 'Elche', short: 'ELC',
      kit: { shirt: '#ffffff', alt2: '#0b7a3d', pattern: 'band', shorts: '#ffffff' },
      away: { shirt: '#0b7a3d', alt2: '#ffffff', pattern: 'plain', shorts: '#0b7a3d' },
      squad: ['Dituro', 'Pedrosa', 'Bigas', 'Affengruber', 'Fort', 'Valera', 'Febas', 'Aguado', 'Josan', 'Mir', 'Silva'],
      stadium: st('Estadio Martínez Valero', 'Elche', ['#0b7a3d', '#ffffff'], 'ELCHE', { shape: 'round', sky: 'dusk' }),
    },
    {
      id: 'es_esp', name: 'Espanyol', short: 'RCD',
      kit: { shirt: '#0d5ea8', alt2: '#ffffff', pattern: 'stripes', shorts: '#0d5ea8' },
      away: { shirt: '#111111', alt2: '#0d5ea8', pattern: 'plain', shorts: '#111111' },
      squad: ['Dmitrovic', 'Romero', 'Cabrera', 'Calero', 'El Hilali', 'Pere Milla', 'Expósito', 'Lozano', 'Dolan', 'Kike García', 'Roberto'],
      stadium: st('RCDE Stadium', 'Cornellà de Llobregat', ['#0d5ea8', '#ffffff'], 'ESPANYOL', { roof: '#d4d8dd' }),
    },
    {
      id: 'es_get', name: 'Getafe', short: 'GET',
      kit: { shirt: '#005999', alt2: '#ffffff', pattern: 'plain', shorts: '#005999' },
      away: { shirt: '#c8102e', alt2: '#ffffff', pattern: 'plain', shorts: '#c8102e' },
      squad: ['Soria', 'Rico', 'Djené', 'Duarte', 'Iglesias', 'Liso', 'Arambarri', 'Milla', 'Martín', 'Mayoral', 'Uche'],
      stadium: st('Coliseum', 'Getafe', ['#005999', '#ffffff'], 'GETAFE'),
    },
    {
      id: 'es_gir', name: 'Girona', short: 'GIR',
      kit: { shirt: '#d1102b', alt2: '#ffffff', pattern: 'stripes', shorts: '#d1102b' },
      away: { shirt: '#1c2b4d', alt2: '#d1102b', pattern: 'plain', shorts: '#1c2b4d' },
      squad: ['Gazzaniga', 'Moreno', 'Reis', 'Francés', 'Arnau', 'Ounahi', 'Witsel', 'Martín', 'Tsygankov', 'Vanat', 'Stuani'],
      stadium: st('Estadi Montilivi', 'Girona', ['#d1102b', '#ffffff'], 'GIRONA'),
    },
    {
      id: 'es_lev', name: 'Levante', short: 'LVT',
      kit: { shirt: '#0c3b88', alt2: '#b5122b', pattern: 'stripes', shorts: '#0c3b88' },
      away: { shirt: '#ffffff', alt2: '#b5122b', pattern: 'plain', shorts: '#ffffff' },
      squad: ['Ryan', 'Sánchez', 'Elgezabal', 'Dela', 'Toljan', 'Álvarez', 'Rey', 'Arriaga', 'Brugué', 'Romero', 'Eyong'],
      stadium: st('Estadi Ciutat de València', 'Valencia', ['#b5122b', '#0c3b88'], 'LEVANTE'),
    },
    {
      id: 'es_mll', name: 'Mallorca', short: 'MLL',
      kit: { shirt: '#c8102e', alt2: '#111111', pattern: 'plain', shorts: '#111111' },
      away: { shirt: '#ffffff', alt2: '#c8102e', pattern: 'plain', shorts: '#ffffff' },
      squad: ['Román', 'Mojica', 'Valjent', 'Raíllo', 'Maffeo', 'Virgili', 'Costa', 'Darder', 'Asano', 'Muriqi', 'Joseph'],
      stadium: st('Estadi Mallorca Son Moix', 'Palma', ['#c8102e', '#111111'], 'MALLORCA', { sky: 'dusk' }),
    },
    {
      id: 'es_osa', name: 'Osasuna', short: 'OSA',
      kit: { shirt: '#c8102e', alt2: '#0b1f45', pattern: 'plain', shorts: '#0b1f45' },
      away: { shirt: '#ffffff', alt2: '#c8102e', pattern: 'plain', shorts: '#ffffff' },
      squad: ['Herrera', 'Bretones', 'Catena', 'Boyomo', 'Rosier', 'Muñoz', 'Torró', 'Moncayola', 'Oroz', 'Budimir', 'García'],
      stadium: st('El Sadar', 'Pamplona', ['#c8102e', '#0b1f45'], 'OSASUNA', { roof: '#cfd3d8' }),
    },
    {
      id: 'es_ray', name: 'Rayo Vallecano', short: 'RAY',
      kit: { shirt: '#ffffff', alt2: '#d81920', pattern: 'sash', shorts: '#ffffff' },
      away: { shirt: '#1a1a1a', alt2: '#d81920', pattern: 'sash', shorts: '#1a1a1a' },
      squad: ['Batalla', 'Chavarría', 'Lejeune', 'Luiz Felipe', 'Ratiu', 'García', 'Valentín', 'López', 'Isi', 'De Frutos', 'Alemão'],
      stadium: st('Estadio de Vallecas', 'Madrid', ['#d81920', '#ffffff'], 'RAYO', { sky: 'day' }),
    },
    {
      id: 'es_bet', name: 'Real Betis', short: 'BET',
      kit: { shirt: '#00954c', alt2: '#ffffff', pattern: 'stripes', shorts: '#ffffff' },
      away: { shirt: '#1b2a45', alt2: '#00954c', pattern: 'plain', shorts: '#1b2a45' },
      squad: ['Vallés', 'Rodríguez', 'Natan', 'Bartra', 'Bellerín', 'Abde', 'Amrabat', 'Fornals', 'Antony', 'Isco', 'Cucho'],
      stadium: st('Estadio Benito Villamarín', 'Sevilla', ['#00954c', '#ffffff'], 'BETIS', { shape: 'round' }),
    },
    {
      id: 'es_ovi', name: 'Real Oviedo', short: 'OVI',
      kit: { shirt: '#0a4ea2', alt2: '#ffffff', pattern: 'plain', shorts: '#ffffff' },
      away: { shirt: '#ffffff', alt2: '#0a4ea2', pattern: 'plain', shorts: '#0a4ea2' },
      squad: ['Escandell', 'Alhassane', 'Carmo', 'Costas', 'Ahijado', 'Hassan', 'Colombatto', 'Cazorla', 'Chaira', 'Rondón', 'Viñas'],
      stadium: st('Estadio Carlos Tartiere', 'Oviedo', ['#0a4ea2', '#ffffff'], 'OVIEDO', { roof: '#d0d4d9' }),
    },
    {
      id: 'es_rso', name: 'Real Sociedad', short: 'RSO',
      kit: { shirt: '#0067b1', alt2: '#ffffff', pattern: 'stripes', shorts: '#ffffff' },
      away: { shirt: '#1a1a1a', alt2: '#0067b1', pattern: 'plain', shorts: '#1a1a1a' },
      squad: ['Remiro', 'Gómez', 'Caleta-Car', 'Zubeldia', 'Aramburu', 'Barrenetxea', 'Turrientes', 'Sucic', 'Kubo', 'Oyarzabal', 'Guedes'],
      stadium: st('Reale Arena', 'San Sebastián', ['#0067b1', '#ffffff'], 'REAL SOCIEDAD', { roof: '#d9dde2' }),
    },
    {
      id: 'es_val', name: 'Valencia', short: 'VCF',
      kit: { shirt: '#ffffff', alt2: '#1a1a1a', pattern: 'plain', shorts: '#1a1a1a' },
      away: { shirt: '#f37021', alt2: '#1a1a1a', pattern: 'plain', shorts: '#1a1a1a' },
      squad: ['Dimitrievski', 'Gayà', 'Copete', 'Tárrega', 'Foulquier', 'López', 'Pepelu', 'Guerra', 'Rioja', 'Duro', 'Danjuma'],
      stadium: st('Mestalla', 'Valencia', ['#ffffff', '#f37021'], 'VALENCIA'),
    },
    {
      id: 'es_vil', name: 'Villarreal', short: 'VLR',
      kit: { shirt: '#ffe500', alt2: '#10365c', pattern: 'plain', shorts: '#ffe500' },
      away: { shirt: '#10365c', alt2: '#ffe500', pattern: 'plain', shorts: '#10365c' },
      squad: ['Júnior', 'Cardona', 'Veiga', 'Mouriño', 'Foyth', 'Pépé', 'Parejo', 'Comesaña', 'Moleiro', 'Moreno', 'Mikautadze'],
      stadium: st('Estadio de la Cerámica', 'Villarreal', ['#ffe500', '#10365c'], 'VILLARREAL'),
    },
  ],
};
