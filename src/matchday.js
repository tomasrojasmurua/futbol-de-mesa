// La previa del partido: estadio, hora del día, clima y camisetas.
// Nada de esto cambia el juego: solo cómo se ve (y se escucha) el partido.
import { stadiumFor } from './stadiums.js';
import { teamById, autoKits } from './teams.js';

export const TIMES = {
  morning: { label: 'Mañana', sky: 'day' },
  afternoon: { label: 'Tarde', sky: 'dusk' },
  night: { label: 'Noche', sky: 'night' },
};
export const WEATHERS = {
  clear: { label: 'Soleado', night: 'Despejado' },
  cloudy: { label: 'Nublado' },
  rain: { label: 'Lluvia' },
};
export const weatherLabel = (w, time) => (time === 'night' && WEATHERS[w].night) || WEATHERS[w].label;

// Tinte de la luz (se multiplica sobre la imagen): [tribunas, cancha].
export const LIGHT = {
  morning: { clear: ['#e9edf6', '#fffaf0'], cloudy: ['#a9adb6', '#d0d3d9'], rain: ['#99a1b2', '#c1c9d6'] },
  afternoon: { clear: ['#e2c6a8', '#ffe4c0'], cloudy: ['#aba19a', '#d2c8bf'], rain: ['#9a97a6', '#c3becb'] },
  night: { clear: ['#444b70', '#bcc8e4'], cloudy: ['#3b425b', '#aeb9d0'], rain: ['#383f5a', '#a5b2cb'] },
};

const SKY_TIME = { day: 'morning', dusk: 'afternoon', night: 'night' };

// Lo que sale si nadie toca nada: el estadio del local a su hora de siempre,
// sin lluvia, y las camisetas que no chocan.
export function defaultSetup(homeId, awayId) {
  const st = stadiumFor(homeId);
  return { stadium: homeId, time: SKY_TIME[st.sky] || 'night', weather: 'clear', kits: autoKits(teamById(homeId), teamById(awayId)) };
}

// Completa una previa que viene de afuera (de la red o vieja) con valores válidos.
export function cleanSetup(setup, homeId, awayId) {
  const d = defaultSetup(homeId, awayId);
  if (!setup) return d;
  const kit = (k, i) => (k === 0 || k === 1 ? k : d.kits[i]);
  return {
    stadium: typeof setup.stadium === 'string' && setup.stadium ? setup.stadium : d.stadium,
    time: TIMES[setup.time] ? setup.time : d.time,
    weather: WEATHERS[setup.weather] ? setup.weather : d.weather,
    kits: [0, 1].map((i) => kit(setup.kits && setup.kits[i], i)),
  };
}

// El estadio con el cielo de la hora y el clima elegidos (para las escenas).
export function stadiumWith(setup) {
  const st = stadiumFor(setup.stadium);
  return { ...st, sky: TIMES[setup.time].sky, weather: setup.weather };
}

// "una tarde de lluvia", "una noche despejada"...
export function dayLine(day) {
  if (!day) return '';
  const when = { morning: 'una mañana', afternoon: 'una tarde', night: 'una noche' }[day.time];
  const how = { clear: day.time === 'night' ? 'despejada' : 'de sol', cloudy: 'nublada', rain: 'de lluvia' }[day.weather];
  return `${when} ${how}`;
}
