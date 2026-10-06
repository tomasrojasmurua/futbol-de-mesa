// Traduce la camiseta del juego ({ shirt, alt2, pattern, shorts, gk }) y el
// aspecto de un jugador al formato del pintor de jugadores (players.js).
import { hexRgb } from './teams.js';

// Cualquier color (#abc, #aabbcc o rgb()) a #aabbcc.
export function hex6(c) {
  const m = /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/.exec(c);
  const v = m ? [+m[1], +m[2], +m[3]] : hexRgb(c);
  return '#' + v.map((n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')).join('');
}
const scale = (c, f) => hex6(`rgb(${hexRgb(c).map((v) => Math.round(Math.min(255, v * f))).join(',')})`);
const lum = (c) => { const [r, g, b] = hexRgb(c); return 0.299 * r + 0.587 * g + 0.114 * b; };

export const HAIR_STYLES = ['short', 'short', 'curly', 'fringe', 'buzz', 'long', 'bun'];

// look: { skin, hair, style }; num: dorsal (solo se ve de cerca).
export function p4Kit(kit, isGK, look, num) {
  const shirt = hex6(isGK ? kit.gk : kit.shirt);
  const alt = isGK ? scale(shirt, 0.72) : hex6(kit.alt2 || kit.shirt);
  const pattern = isGK ? 'plain' : kit.pattern;
  const shorts = isGK ? '#222833' : hex6(kit.shorts);
  const socks = isGK ? '#222833' : lum(shorts) > 128 ? shorts : scale(shirt, 0.95);
  const id = `${shirt}${alt}${pattern}${shorts}|${look.skin}${look.hair}${look.style || ''}|${num || ''}`;
  return {
    id, shirt, alt, pattern, sleeve: pattern === 'sleeves' ? alt : undefined, trim: alt,
    shorts, socks, sockTrim: alt, boots: '#1d1d26', skin: hex6(look.skin), hair: hex6(look.hair), hairStyle: look.style || 'short',
    num: num != null ? String(num) : undefined, numColor: isGK ? '#f4f1ea' : undefined,
    gk: isGK ? 1 : 0, long: isGK ? 1 : 0, gloves: '#f2f2ee', gloveTrim: '#2a6ad8',
  };
}
