// Lo que hace cada carta, explicado en corto: una frase, a quién ayuda o
// perjudica y el dado que cambia (caras nuevas en verde o rojo, con la cara de
// antes tachada en la esquina). Y la ilustración de la carta con los colores
// de los equipos del partido.
import { BASE_DICE, RED_FX } from './situations.js';
import { faceSvg } from './dice.js';
import { DIE_LABELS } from './game.js';
import { CARDART } from './cardart.js';
import { p4Kit } from './playerkit.js';

const DIE_NAMES = { buildDef: 'Dado de la salida', attackDef: 'Dado del último tercio', dribbleWin: 'Dado de la gambeta', shotSave: 'Dado de la atajada', shotBeat: 'Dado del remate' };

// Frase corta de cada carta, desde el lado del equipo al que le toca.
const SHORT = {
  hinchada: 'Más chances de anotar',
  suplentes: 'Más chances de contragolpear',
  lesion: 'Menos chances de recuperar la pelota',
  habilitacion: 'Más chances de avanzar aunque le adivinen la salida',
  primera: 'Más chances de rematar aunque le adivinen el ataque',
  tactico: 'Más chances de seguir con la pelota',
  arquero: 'Menos chances de recibir un gol',
  capitan: 'Más chances de seguir con la pelota',
  crack: 'Más chances de seguir con la pelota',
  polemica: 'Chances de penal en el último tercio',
  lluvia: 'Menos chances de anotar',
  errordt: 'Menos chances de contragolpear',
  iluminacion: 'Más chances de anotar',
  chilena: (e) => (e.role === 'def' ? 'Menos chances de atajar' : 'Más chances de gol aunque le atajen'),
  error: 'Más chances de seguir con la pelota',
  instruccion: 'Más chances de avanzar aunque le adivinen',
  defensa: 'Más chances de robar el balón y contragolpear',
  barrida: 'Más chances de robar el balón limpio',
  despeje: 'Menos chances de recibir un gol',
  presion: 'Más chances de robar el balón',
  achique: 'Más chances de atajar y salir rápido',
  red: 'Más chances de cometer falta o dar córner',
};

// Cuánto le sirve cada cara al que ataca: con esto se sabe si la carta ayuda
// o perjudica al equipo, sin depender de una lista a mano.
const FOR_ATTACK = { goal: 3, penalty: 3, shoot: 2, longpass: 2, advance: 2, corner: 1, foul: 1, post: 0, wide: 0, clear: 0, steal: -1, save: -1, counter: -2 };

// El dado base con las caras de la carta en su lugar (igual que al tirar).
function changedFaces(die, to) {
  const base = BASE_DICE[die], f = base.map((face) => ({ face, was: null }));
  const count = (l) => l.reduce((m, k) => ((m[k] = (m[k] || 0) + 1), m), {});
  const b = count(base), t = count(to), out = [], add = [];
  for (const k of new Set([...Object.keys(b), ...Object.keys(t)])) {
    const d = (t[k] || 0) - (b[k] || 0);
    for (let i = 0; i < -d; i++) out.push(k);
    for (let i = 0; i < d; i++) add.push(k);
  }
  for (let i = 0; i < Math.min(out.length, add.length); i++) {
    const j = f.findIndex((x) => x.face === out[i] && !x.was);
    if (j >= 0) f[j] = { face: add[i], was: out[i] };
  }
  return f;
}

function duration(e) {
  if (e.uses === null || e.uses === Infinity) return 'todo el partido';
  const shot = e.dice[0].startsWith('shot');
  if (e.role === 'att') return shot ? 'su próximo remate' : 'su próximo ataque';
  return shot ? 'el próximo remate rival' : 'su próxima defensa';
}

// Efectos activos de una carta para un equipo (los que todavía no se usaron).
function effectsOf(state, id, side) {
  const seen = new Set();
  const list = (state.sit ? state.sit.fx : []).filter((f) => f.card === id && f.side === side && !seen.has(f.dice[0]) && seen.add(f.dice[0]));
  if (list.length) return list;
  return id === 'red' ? RED_FX.map((e) => ({ ...e, uses: null })) : [];
}

// Recuadro de la ficha: título, a quién ayuda, frase corta y dados.
export function fxTipHtml(state, info, id, side, teamLabel) {
  const fx = effectsOf(state, id, side);
  let score = 0;
  const dice = fx.map((e) => {
    const faces = changedFaces(e.dice[0], e.to);
    const delta = faces.reduce((s, x) => s + (x.was ? FOR_ATTACK[x.face] - FOR_ATTACK[x.was] : 0), 0);
    const good = e.role === 'att' ? delta > 0 : delta < 0;
    score += good ? 1 : -1;
    const changed = faces.filter((x) => x.was);
    const legend = changed.length ? `${DIE_LABELS[changed[0].was]} → ${DIE_LABELS[changed[0].face]}${changed.length > 1 ? ` (${changed.length} caras)` : ''}` : '';
    const tiles = faces.map((x) => `<span class="ft${x.was ? (good ? ' up' : ' down') : ''}" title="${DIE_LABELS[x.face]}">${faceSvg(x.face)}${x.was ? `<i>${faceSvg(x.was)}</i>` : ''}</span>`).join('');
    return `<div class="fdie"><small>${DIE_NAMES[e.dice[0]]}</small><div class="frow">${tiles}</div><small class="flg">${legend}</small></div>`;
  }).join('');
  const good = score >= 0;
  const s = SHORT[id];
  const short = typeof s === 'function' ? s(fx[0] || {}) : s || '';
  const title = id === 'red' ? 'Con uno menos' : info.title;
  const dur = fx[0] ? `<small class="fdur">Dura: ${duration(fx[0])}</small>` : '';
  return `<b>${title}</b><em class="${good ? 'g' : 'r'}">${good ? '▲ A favor de' : '▼ En contra de'} ${teamLabel}</em><p class="fshort">${short}</p>${dice}${dur}`;
}

// ---------- ilustraciones ----------
const LOOK_A = [{ skin: '#e0a77c', hair: '#3a2414', style: 'curly' }, { skin: '#9c6440', hair: '#141010', style: 'buzz' }, { skin: '#f1c7a0', hair: '#d9b25a', style: 'long' }];
const LOOK_B = [{ skin: '#9c6440', hair: '#1e1612', style: 'short' }, { skin: '#f1c7a0', hair: '#7a5530', style: 'fringe' }, { skin: '#c68657', hair: '#2a1a10', style: 'curly' }];
const LOOK_GK = { skin: '#8a5634', hair: '#141010', style: 'buzz' };
const arts = new Map();

// kits: las dos camisetas del partido; side: el equipo de la carta (-1: los dos).
export function cardArt(id, kits, side, chilenaOwn) {
  const a = side < 0 ? 0 : side, b = 1 - a;
  const key = `${id}|${JSON.stringify(kits[a])}|${JSON.stringify(kits[b])}|${chilenaOwn ? 1 : 0}`;
  if (arts.has(key)) return arts.get(key);
  let cv = null;
  try {
    const team = (k, looks, nums) => looks.map((l, i) => p4Kit(k, false, l, nums[i]));
    cv = CARDART.render(id, 1, {
      A: team(kits[a], LOOK_A, ['10', '9', '7']), B: team(kits[b], LOOK_B, ['4', '6', '3']),
      GA: p4Kit(kits[a], true, LOOK_GK, 1), GB: p4Kit(kits[b], true, LOOK_GK, 1), chilenaOwn,
    });
  } catch (e) { console.warn('carta', id, e); }
  if (arts.size > 60) arts.clear();
  arts.set(key, cv);
  return cv;
}
