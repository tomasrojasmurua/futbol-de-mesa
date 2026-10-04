// Lógica pura del partido. El anfitrión (host) es la autoridad: resuelve cada
// jugada con las dos elecciones y una tirada de dado, y envía el evento a ambos.

import { newSituations, rollFaces, foul, afterPlay, halfTime, BASE_DICE } from './situations.js';

export const HALF_MINUTES = 45;
export const TURN_SECONDS = 12;

// Opciones por situación. Los carriles L/C/R están siempre en el marco del
// equipo que ataca (su izquierda / centro / derecha).
export const OPTIONS = {
  build: {
    att: [
      { id: 'L', label: 'Por la izquierda', icon: '◀' },
      { id: 'C', label: 'Por el centro', icon: '▲' },
      { id: 'R', label: 'Por la derecha', icon: '▶' },
    ],
    def: [
      { id: 'L', label: 'Cerrar', icon: '◀', lane: true },
      { id: 'C', label: 'Cerrar el centro', icon: '▲', lane: true },
      { id: 'R', label: 'Cerrar', icon: '▶', lane: true },
    ],
    attTitle: 'Tienes el balón: ¿por dónde sales?',
    defTitle: 'Te atacan: ¿dónde cierras?',
  },
  attack: {
    att: [
      { id: 'cross', label: 'Centro al área', icon: '⤴', hint: 'gana a doble marca y línea' },
      { id: 'through', label: 'Pase filtrado', icon: '⇡', hint: 'gana a bandas y doble marca' },
      { id: 'dribble', label: 'Gambeta', icon: '↯', hint: 'gana a bandas y línea' },
    ],
    def: [
      { id: 'cross', label: 'Cerrar bandas', icon: '⇹', hint: 'para el centro' },
      { id: 'through', label: 'Achicar línea', icon: '═', hint: 'para el pase filtrado' },
      { id: 'dribble', label: 'Doble marca', icon: '⛨', hint: 'para la gambeta' },
    ],
    attTitle: 'Último tercio: ¿cómo atacas?',
    defTitle: 'Llegan al área: ¿cómo defiendes?',
  },
  shot: {
    att: [
      { id: 'L', label: 'Palo izquierdo', icon: '◤' },
      { id: 'C', label: 'Al medio', icon: '▲' },
      { id: 'R', label: 'Palo derecho', icon: '◥' },
    ],
    def: [
      { id: 'L', label: 'Volar', icon: '◤', lane: true },
      { id: 'C', label: 'Quedarse', icon: '■', lane: true },
      { id: 'R', label: 'Volar', icon: '◥', lane: true },
    ],
    attTitle: '¡Remate! ¿A dónde?',
    defTitle: '¡Remate! ¿Hacia dónde se tira tu arquero?',
  },
  corner: {
    att: [
      { id: 'near', label: 'Primer palo', icon: '◣' },
      { id: 'spot', label: 'Punto penal', icon: '●' },
      { id: 'far', label: 'Segundo palo', icon: '◢' },
    ],
    def: [
      { id: 'near', label: 'Marcar primer palo', icon: '◣' },
      { id: 'spot', label: 'Marcar el punto penal', icon: '●' },
      { id: 'far', label: 'Marcar segundo palo', icon: '◢' },
    ],
    attTitle: 'Tiro de esquina: ¿a dónde lo mandas?',
    defTitle: 'Córner en contra: ¿qué zona marcas?',
  },
};

export const SHOT_TITLES = {
  remate: '¡Remate al arco! ¿A dónde?',
  cabezazo: '¡Cabezazo! ¿A dónde lo pones?',
  mano: '¡Mano a mano con el arquero! ¿A dónde?',
  penal: '¡PENAL! ¿A dónde patea?',
  libre: '¡Tiro libre directo! ¿A dónde?',
};

// Dado del remate cuando el arquero no adivina: igual para todo tipo de remate
// y para los dos equipos. 1 = palo, 2..MISS_ON = afuera, el resto es gol.
export const MISS_ON = 2;
const SHOOTERS = [9, 9, 10, 10, 5, 8, 6, 7];

// Duración: unidades de reloj por tiempo. El minuto que se ve siempre llega a 45'.
export const LENGTHS = {
  short: { label: 'Corto', half: 27 },
  normal: { label: 'Normal', half: 45 },
  long: { label: 'Largo', half: 72 },
};

export function optionsFor(situation) {
  return OPTIONS[situation === 'penalty' || situation === 'shootout' ? 'shot' : situation];
}

export function d6(rng = Math.random) {
  return 1 + Math.floor(rng() * 6);
}

export function newMatch({ home, away, callerSide = 1, length = 'normal', shootout = true, cards = true }) {
  return {
    // Situaciones de juego (mazos de partido y disciplina). null = sin cartas.
    sit: cards ? newSituations() : null,
    shootout,
    length: LENGTHS[length] ? length : 'normal',
    clock: 0,
    phase: 'toss',
    callerSide,
    teams: [home, away],
    half: 1,
    minute: 0,
    score: [0, 0],
    poss: 0,
    kickoff: 0,
    situation: 'build',
    lane: 'C',
    shotKind: 'remate',
    seq: 0,
    stats: { shots: [0, 0], onTarget: [0, 0], steals: [0, 0], corners: [0, 0], builds: [0, 0], yellows: [0, 0], reds: [0, 0] },
    // Por jugador (índice de la formación): goles, asistencias, remates, al arco,
    // recuperaciones, atajadas y penales atajados en la tanda.
    players: [0, 1].map(() => Array.from({ length: 11 }, () => ({ g: 0, a: 0, sh: 0, ot: 0, st: 0, sv: 0, ps: 0 }))),
    goals: [],
  };
}

export function resolveToss(state, call, rng = Math.random) {
  const result = rng() < 0.5 ? 'cara' : 'sello';
  const winner = call === result ? state.callerSide : 1 - state.callerSide;
  const s = { ...state, phase: 'play', poss: winner, kickoff: winner, situation: 'build', lane: 'C', seq: state.seq + 1 };
  return { state: s, ev: { type: 'toss', call, result, winner, caller: state.callerSide } };
}

const clone = (o) => JSON.parse(JSON.stringify(o));

export function validChoice(state, role, choice) {
  const opts = optionsFor(state.situation)[role];
  return opts.some((o) => o.id === choice);
}

export function randomChoice(state, role, rng = Math.random) {
  const opts = optionsFor(state.situation)[role];
  return opts[Math.floor(rng() * opts.length)].id;
}

// Resuelve una jugada. att = elección del que ataca, def = del que defiende.
export function resolvePlay(state, att, def, rng = Math.random) {
  const s = clone(state);
  const A = s.poss, D = 1 - A;
  const ev = {
    type: 'play', seq: s.seq, situation: s.situation, poss: A, att, def,
    lane: s.lane, shotKind: s.shotKind, match: att === def, dice: null, minute: s.minute,
  };
  const roll = () => (ev.dice = d6(rng));
  const pick = (list) => list[Math.floor(rng() * list.length)];
  const credit = (side, i, k) => { if (s.players) s.players[side][i][k]++; };
  const turnover = (next = 'build') => {
    s.poss = D; s.situation = next; s.lane = next === 'attack' ? ['L', 'C', 'R'][Math.floor(rng() * 3)] : 'C';
    s.stats.steals[D]++;
  };
  // Quién recupera: un defensa o volante del sector por donde venía el ataque.
  const stealer = () => {
    const i = pick(s.situation === 'attack' ? [2, 3, 2, 3, 6, 7, 1, 4] : [6, 7, 6, 7, 5, 8, 2, 3]);
    ev.stealer = i;
    credit(D, i, 'st');
  };

  if (s.situation === 'shootout') return kickShootout(s, ev, rng);
  // Tira uno de los cuatro dados (con las cartas activas) y devuelve la cara.
  const die = (name) => { ev.die = name; ev.faces = rollFaces(s, name, A, D); return ev.faces[roll() - 1]; };
  const goal = (kind) => {
    ev.outcome = 'goal';
    s.stats.onTarget[A]++;
    s.score[A]++;
    credit(A, ev.shooter, 'ot');
    credit(A, ev.shooter, 'g');
    // Asistencia: casi siempre hay un pase previo (no en los penales).
    if (kind !== 'penal' && rng() < 0.75) {
      ev.assist = pick([5, 6, 7, 8, 9, 10, 1, 4].filter((i) => i !== ev.shooter));
      credit(A, ev.assist, 'a');
    }
    if (s.goals) s.goals.push({ side: A, i: ev.shooter, assist: ev.assist ?? null, minute: s.minute, half: s.half, kind });
    s.poss = D; s.situation = 'build'; s.lane = 'C';
    ev.kickoffAfter = D;
  };
  const toShot = () => { s.situation = 'shot'; s.shotKind = att === 'cross' ? 'cabezazo' : att === 'through' ? 'mano' : 'remate'; };

  switch (s.situation) {
    case 'build': {
      s.stats.builds[A]++;
      s.clock += 3 + Math.floor(rng() * 3);
      if (ev.match) {
        const f = die('buildDef');
        if (f === 'foul') { ev.outcome = 'foul'; foul(s, ev, A, D, rng); }
        else if (f === 'counter') { ev.outcome = 'counter'; stealer(); turnover('attack'); }
        else if (f === 'advance') { ev.outcome = 'advance'; s.situation = 'attack'; s.lane = att; }
        else if (f === 'shoot') { ev.outcome = 'longball'; s.situation = 'shot'; s.shotKind = 'remate'; }
        else { ev.outcome = 'steal'; stealer(); turnover(); }
      } else {
        ev.outcome = 'advance'; s.situation = 'attack'; s.lane = att;
      }
      break;
    }
    case 'attack': {
      s.clock += 3;
      if (ev.match) {
        const f = die('attackDef');
        if (f === 'corner') { ev.outcome = 'corner'; s.situation = 'corner'; s.stats.corners[A]++; s.lane = rng() < 0.5 ? 'L' : 'R'; }
        else if (f === 'foul') { ev.outcome = 'foul'; foul(s, ev, A, D, rng); }
        else if (f === 'counter') { ev.outcome = 'counter'; stealer(); turnover('attack'); }
        else if (f === 'advance') { ev.outcome = 'chance'; toShot(); }
        else if (f === 'penalty') { ev.outcome = 'penalty'; s.situation = 'penalty'; s.shotKind = 'penal'; }
        else { ev.outcome = 'steal'; stealer(); turnover(); }
      } else {
        toShot();
        ev.outcome = 'chance';
        if (att === 'dribble') {
          const r = roll();
          if (r === 6) { ev.outcome = 'penalty'; s.situation = 'penalty'; s.shotKind = 'penal'; }
        }
      }
      break;
    }
    case 'shot':
    case 'penalty': {
      s.clock += 1;
      s.stats.shots[A]++;
      const kind = s.situation === 'penalty' ? 'penal' : s.shotKind;
      ev.shotKind = kind;
      // Quién patea (puesto en la formación), igual en los dos celulares.
      ev.shooter = kind === 'penal' ? 9 : SHOOTERS[Math.floor(rng() * SHOOTERS.length)];
      credit(A, ev.shooter, 'sh');
      if (ev.match) {
        const f = die('shotSave');
        if (f === 'goal') { goal(kind); break; }
        s.stats.onTarget[A]++;
        credit(A, ev.shooter, 'ot');
        credit(D, 0, 'sv');
        if (f === 'corner') { ev.outcome = 'save_corner'; s.situation = 'corner'; s.stats.corners[A]++; s.lane = att === 'R' ? 'R' : att === 'L' ? 'L' : (rng() < 0.5 ? 'L' : 'R'); }
        else if (f === 'counter') { ev.outcome = 'save_counter'; turnover('attack'); s.stats.steals[D]--; }
        else { ev.outcome = 'save'; turnover(); s.stats.steals[D]--; }
      } else {
        const f = die('shotBeat');
        if (f === 'goal') goal(kind);
        else if (f === 'corner') {
          // Arquero inspirado: la saca al córner.
          ev.outcome = 'save_corner'; s.stats.onTarget[A]++; credit(A, ev.shooter, 'ot'); credit(D, 0, 'sv');
          s.situation = 'corner'; s.stats.corners[A]++; s.lane = att === 'R' ? 'R' : att === 'L' ? 'L' : (rng() < 0.5 ? 'L' : 'R');
        } else {
          ev.outcome = f;
          turnover(); s.stats.steals[D]--;
        }
      }
      break;
    }
    case 'corner': {
      s.clock += 1;
      if (ev.match) { ev.outcome = 'cleared'; turnover(); }
      else { ev.outcome = 'header'; s.situation = 'shot'; s.shotKind = 'cabezazo'; }
      break;
    }
  }

  const halfLen = LENGTHS[s.length || 'normal'].half;
  afterPlay(s, ev, halfLen, rng);

  ev.cornerSide = s.situation === 'corner' ? s.lane : undefined;
  ev.laneAfter = s.lane;
  ev.possAfter = s.poss;
  ev.situationAfter = s.situation;

  // Fin de tiempo: sólo cuando la pelota vuelve a una salida (no se corta un ataque).
  s.minute = Math.round((s.clock * HALF_MINUTES) / halfLen);
  if (ev.outcome === 'goal' && s.goals && s.goals.length) s.goals[s.goals.length - 1].minute = Math.max(s.minute, s.half === 2 ? HALF_MINUTES + 1 : 1);
  if (s.clock >= halfLen * s.half && s.situation === 'build') {
    if (s.half === 1) {
      ev.halfEnd = 1;
      halfTime(s);
      s.half = 2; s.minute = HALF_MINUTES; s.clock = halfLen; s.poss = 1 - s.kickoff; s.situation = 'build'; s.lane = 'C';
      ev.kickoffAfter = s.poss;
    } else {
      ev.halfEnd = 2;
      if (s.score[0] === s.score[1] && s.shootout !== false) {
        // Empate: tanda de penales. Patea primero el que no sacó al inicio.
        ev.shootoutStart = true;
        s.situation = 'shootout'; s.shotKind = 'penal';
        s.poss = 1 - s.kickoff;
        s.pens = { first: s.poss, goals: [0, 0], kicks: [0, 0], log: [[], []] };
        ev.possAfter = s.poss; ev.situationAfter = 'shootout';
      } else s.phase = 'end';
    }
  }
  ev.minuteAfter = s.minute;
  ev.scoreAfter = [...s.score];
  s.seq++;
  return { state: s, ev };
}

// Un penal de la tanda: si el arquero adivina, ataja; si no, el mismo dado del
// remate decide (gol, palo o afuera). Cinco por lado y luego muerte súbita.
const TAKERS = [9, 10, 8, 5, 7, 6, 4, 1, 3, 2, 0];
function kickShootout(s, ev, rng) {
  const A = s.poss, D = 1 - A, p = s.pens;
  ev.shotKind = 'penal';
  ev.shooter = TAKERS[p.kicks[A] % TAKERS.length];
  ev.round = p.kicks[A] + 1;
  if (ev.match) { ev.outcome = 'save'; if (s.players) s.players[D][0].ps++; }
  else {
    const r = (ev.dice = d6(rng));
    ev.outcome = r === 1 ? 'post' : r <= MISS_ON ? 'wide' : 'goal';
  }
  const scored = ev.outcome === 'goal';
  p.kicks[A]++;
  p.log[A].push(scored);
  if (scored) p.goals[A]++;
  // ¿Ya está decidido?
  const [g0, g1] = p.goals, [k0, k1] = p.kicks;
  let done = false;
  if (k0 <= 5 && k1 <= 5) {
    const left0 = 5 - k0, left1 = 5 - k1;
    done = g0 + left0 < g1 || g1 + left1 < g0;
  }
  if (!done && k0 === k1 && k0 >= 5) done = g0 !== g1;
  ev.pensAfter = { goals: [...p.goals], kicks: [...p.kicks], log: [p.log[0].slice(), p.log[1].slice()] };
  ev.possAfter = done ? A : D; ev.situationAfter = 'shootout';
  if (done) {
    s.phase = 'end';
    s.winner = g0 > g1 ? 0 : 1;
    ev.shootoutEnd = true;
  } else s.poss = D;
  ev.minuteAfter = s.minute;
  ev.scoreAfter = [...s.score];
  s.seq++;
  return { state: s, ev };
}

// Formatea el minuto como en la tele: 45+2'
export function fmtMinute(minute, half) {
  const cap = HALF_MINUTES * half;
  if (minute > cap) return `${cap}+${minute - cap}'`;
  return `${minute}'`;
}

// Texto de relato para cada evento.
export function commentary(ev, names) {
  const A = names[ev.poss], D = names[1 - ev.poss];
  const laneTxt = { L: 'por la izquierda', C: 'por el centro', R: 'por la derecha' };
  switch (ev.situation) {
    case 'build':
      if (ev.outcome === 'advance' && ev.match) return `${D} leyó la jugada, pero no alcanza a cortar. Sigue ${A}.`;
      if (ev.outcome === 'advance') return `${A} sale ${laneTxt[ev.att]} y gana metros.`;
      if (ev.outcome === 'longball') return `¡Pelotazo largo de ${A} y queda para rematar!`;
      if (ev.outcome === 'foul') return `${D} leyó la jugada, pero cometió falta. Sigue ${A}.`;
      if (ev.outcome === 'counter') return `¡Robo de ${D} y sale el contragolpe!`;
      return `${D} cerró bien ${laneTxt[ev.att]} y recupera la pelota.`;
    case 'attack':
      if (ev.outcome === 'penalty' && ev.match) return `¡Cobran penal en una jugada dudosa! Protesta ${D}.`;
      if (ev.outcome === 'penalty') return `¡Gambeta en el área y lo derriban! ¡Penal para ${A}!`;
      if (ev.outcome === 'chance' && ev.match) return `${D} la tenía, pero ${A} se la gana igual y queda para rematar.`;
      if (ev.outcome === 'chance') {
        return ev.att === 'cross' ? `Centro de ${A}... ¡y hay cabezazo!`
          : ev.att === 'through' ? `¡Pase filtrado! ${A} queda mano a mano.`
            : `¡Qué gambeta! ${A} se perfila para rematar.`;
      }
      if (ev.outcome === 'corner') return `${D} despeja como puede: tiro de esquina.`;
      if (ev.outcome === 'foul') return `${D} lo para con falta. Sigue atacando ${A}.`;
      if (ev.outcome === 'counter') return `¡${D} corta y sale rápido de contra!`;
      return `${D} defiende bien y se queda con la pelota.`;
    case 'shot':
    case 'penalty':
      if (ev.outcome === 'goal' && ev.match) return `¡El arquero de ${D} la tenía y se le escapa! ¡Gol de ${A}!`;
      if (ev.outcome === 'goal') return `¡GOOOL de ${A}!`;
      if (ev.outcome === 'post') return `¡Al palo! Se salva ${D}.`;
      if (ev.outcome === 'wide') return `¡Uff! Se fue apenas afuera.`;
      if (ev.outcome === 'save_corner') return `¡Atajadón del arquero de ${D}! Al córner.`;
      if (ev.outcome === 'save_counter') return `¡El arquero de ${D} ataja y sale rápido de contra!`;
      return `El arquero de ${D} adivinó y se queda con la pelota.`;
    case 'shootout':
      if (ev.outcome === 'goal') return `¡Gol de ${A} en la tanda!`;
      if (ev.outcome === 'save') return `¡El arquero de ${D} ataja el penal!`;
      if (ev.outcome === 'post') return `¡${A} la estrella en el palo!`;
      return `¡${A} la tira afuera!`;
    case 'corner':
      if (ev.outcome === 'header') return `El córner cae justo... ¡cabezazo de ${A}!`;
      return `${D} rechaza el tiro de esquina.`;
  }
  return '';
}

// Caras del dado para esta tirada: cada cara muestra un símbolo de lo que pasa.
export const DIE_LABELS = {
  foul: 'Falta', steal: 'Recupera', advance: 'Sigue', counter: 'Contra', corner: 'Córner', shoot: 'Remate',
  penalty: 'Penal', save: 'Atajada', goal: 'Gol', post: 'Palo', wide: 'Afuera',
};

export function diceFaces(ev) {
  if (ev.faces) return ev.faces;
  switch (ev.situation) {
    case 'attack':
      if (ev.att === 'dribble' && !ev.match) return ['shoot', 'shoot', 'shoot', 'shoot', 'shoot', 'penalty'];
      return BASE_DICE.attackDef;
    case 'build': return BASE_DICE.buildDef;
    case 'shootout':
    case 'shot':
    case 'penalty':
      return ev.match ? BASE_DICE.shotSave : BASE_DICE.shotBeat;
  }
  return ['steal', 'steal', 'steal', 'steal', 'steal', 'steal'];
}

// Lo que pasó con el dado, en palabras. Si la cara la puso una carta, se dice.
const CARD_REASONS = {
  advance: '¡Una carta: sigue la jugada!',
  shoot: '¡Una carta: remate directo!',
  penalty: '¡Una carta: penal!',
  counter: '¡Una carta: contragolpe!',
  foul: 'Con uno menos no llegan: falta',
  corner: '¡Una carta: córner!',
  goal: '¡Una carta: es gol!',
  wide: 'La cancha pesada: se va afuera',
};
export function diceReason(ev) {
  if (ev.dice == null) return '';
  const d = ev.dice;
  if (ev.die) {
    const f = ev.faces[d - 1];
    if (f !== BASE_DICE[ev.die][d - 1]) {
      if (ev.die === 'shotBeat' && f === 'corner') return '¡Arquero inspirado: al córner!';
      if (ev.die === 'shotBeat' && f === 'goal') return '¡Una carta: entra igual!';
      if (ev.die === 'shotSave' && f === 'goal') return '¡Se le escapa: gol!';
      return CARD_REASONS[f] || '';
    }
  }
  switch (ev.situation) {
    case 'build':
      return d === 1 ? 'Falta: sigue el ataque' : d === 6 ? '¡Contragolpe!' : 'Pelota recuperada';
    case 'attack':
      if (ev.att === 'dribble' && !ev.match) return d === 6 ? '¡Penal!' : 'Queda para rematar';
      return d === 1 ? 'Despeje al córner' : d === 2 ? 'Falta: sigue el ataque' : d === 6 ? '¡Contragolpe!' : 'Pelota recuperada';
    case 'shootout':
    case 'shot':
    case 'penalty':
      if (ev.match) return d === 1 ? 'Da rebote: córner' : d === 6 ? 'Saque rápido: ¡contragolpe!' : 'La contiene';
      return ev.outcome === 'goal' ? '¡Adentro!' : ev.outcome === 'post' ? '¡Al palo!' : 'Se va afuera';
  }
  return '';
}
