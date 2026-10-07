// Los jugadores de la película: su aspecto (el mismo que en el partido), su
// camiseta y los cuadros ya pintados. Pintar un jugador ilustrado cuesta, así
// que los cuadros se piden de antemano y se pintan de a poco entre cuadro y
// cuadro de la película, en el orden en que van a aparecer.
import { P4 } from '../players.js';
import { p4Kit, HAIR_STYLES } from '../playerkit.js';
import { playerName } from '../squads.js';
import { seeded } from './common.js';

const SKINS = ['#f1c7a0', '#e0a77c', '#c68657', '#9c6440', '#6e4428', '#f5d3b5'];
const HAIRS = ['#2a1a10', '#4a2e18', '#111111', '#7a5530', '#d9b25a', '#1c1c1c', '#5b3a1e', '#a0522d'];
export const NUMS = [1, 3, 4, 2, 6, 11, 8, 5, 7, 9, 10];

// Igual que render.js: cada jugador tiene siempre la misma cara y el mismo pelo.
export function lookOf(team, side, i) {
  const seed = side * 31 + i * 7 + team.id.length * 13 + team.id.charCodeAt(0);
  return {
    skin: SKINS[Math.floor(seeded(seed) * SKINS.length)],
    hair: HAIRS[Math.floor(seeded(seed + 3) * HAIRS.length)],
    style: HAIR_STYLES[Math.floor(seeded(seed + 5) * HAIR_STYLES.length)],
  };
}
export const nameOf = (team, i) => playerName(team.id, i);

export class Cast {
  constructor() {
    this.jobs = [];       // { key, fn, at }
    this.done = new Map();
    this.byAnim = new Map();
  }

  // Un cuadro de una animación (anim, i). at: segundo de la película en que se necesita.
  want(anim, i, at, fn) {
    const key = `${anim}#${i}`;
    if (this.done.has(key) || this.jobs.some((j) => j.key === key)) return;
    this.jobs.push({ key, fn, at: at + (i ? 0.01 * i + 0.4 : 0) });
    if (!this.byAnim.has(anim)) this.byAnim.set(anim, []);
  }

  sort() { this.jobs.sort((a, b) => a.at - b.at); }

  // Pinta cuadros pendientes hasta gastar ms milisegundos.
  warm(ms) {
    const end = performance.now() + ms;
    let n = 0;
    while (this.jobs.length && (performance.now() < end || n === 0)) {
      const j = this.jobs.shift();
      try { this.done.set(j.key, j.fn()); } catch (e) { console.error(e); }
      n++;
    }
    return !this.jobs.length;
  }

  // El cuadro i de la animación, o el más cercano ya pintado.
  get(anim, i, n = 1) {
    const exact = this.done.get(`${anim}#${i}`);
    if (exact) return exact;
    for (let d = 1; d < n; d++) {
      const a = this.done.get(`${anim}#${(i - d + n) % n}`);
      if (a) return a;
      const b = this.done.get(`${anim}#${(i + d) % n}`);
      if (b) return b;
    }
    return null;
  }
}

// Atajo: pintar un jugador ilustrado.
export function paint(pose, kit, view, scale, small = false) { return P4.sprite(pose, kit, view, scale, null, small); }
export function kitFor(teamKit, look, num, isGK = false) { return p4Kit(teamKit, isGK, look, num); }
