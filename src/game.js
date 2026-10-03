// Lógica pura del partido. El anfitrión (host) es la autoridad: resuelve cada
// jugada con las dos elecciones y una tirada de dado, y envía el evento a ambos.

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
};

// Con qué número del dado (o menos) el remate se va afuera aunque el arquero falle.
const MISS_ON = { remate: 2, cabezazo: 3, mano: 1, penal: 0 };

export function optionsFor(situation) {
  return OPTIONS[situation === 'penalty' ? 'shot' : situation];
}

export function d6(rng = Math.random) {
  return 1 + Math.floor(rng() * 6);
}

export function newMatch({ home, away, callerSide = 1 }) {
  return {
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
    stats: { shots: [0, 0], onTarget: [0, 0], steals: [0, 0], corners: [0, 0], builds: [0, 0] },
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
  const turnover = (next = 'build') => {
    s.poss = D; s.situation = next; s.lane = next === 'attack' ? ['L', 'C', 'R'][Math.floor(rng() * 3)] : 'C';
    s.stats.steals[D]++;
  };

  switch (s.situation) {
    case 'build': {
      s.stats.builds[A]++;
      s.minute += 3 + Math.floor(rng() * 3);
      if (ev.match) {
        const r = roll();
        if (r === 1) { ev.outcome = 'foul'; }
        else if (r === 6) { ev.outcome = 'counter'; turnover('attack'); }
        else { ev.outcome = 'steal'; turnover(); }
      } else {
        ev.outcome = 'advance'; s.situation = 'attack'; s.lane = att;
      }
      break;
    }
    case 'attack': {
      s.minute += 3;
      if (ev.match) {
        const r = roll();
        if (r <= 2) { ev.outcome = 'corner'; s.situation = 'corner'; s.stats.corners[A]++; s.lane = rng() < 0.5 ? 'L' : 'R'; }
        else if (r === 6) { ev.outcome = 'counter'; turnover('attack'); }
        else { ev.outcome = 'steal'; turnover(); }
      } else {
        s.situation = 'shot';
        s.shotKind = att === 'cross' ? 'cabezazo' : att === 'through' ? 'mano' : 'remate';
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
      s.minute += 1;
      s.stats.shots[A]++;
      const kind = s.situation === 'penalty' ? 'penal' : s.shotKind;
      ev.shotKind = kind;
      if (ev.match) {
        s.stats.onTarget[A]++;
        const r = roll();
        if (r >= 5) { ev.outcome = 'save_corner'; s.situation = 'corner'; s.stats.corners[A]++; s.lane = att === 'R' ? 'R' : att === 'L' ? 'L' : (rng() < 0.5 ? 'L' : 'R'); }
        else { ev.outcome = 'save'; turnover(); s.stats.steals[D]--; }
      } else {
        const miss = MISS_ON[kind];
        const r = miss > 0 ? roll() : null;
        if (r !== null && r <= miss) {
          ev.outcome = r === 1 ? 'post' : 'wide';
          turnover(); s.stats.steals[D]--;
        } else {
          ev.outcome = 'goal';
          s.stats.onTarget[A]++;
          s.score[A]++;
          s.poss = D; s.situation = 'build'; s.lane = 'C';
          ev.kickoffAfter = D;
        }
      }
      break;
    }
    case 'corner': {
      s.minute += 1;
      if (ev.match) { ev.outcome = 'cleared'; turnover(); }
      else { ev.outcome = 'header'; s.situation = 'shot'; s.shotKind = 'cabezazo'; }
      break;
    }
  }

  ev.cornerSide = s.situation === 'corner' ? s.lane : undefined;
  ev.laneAfter = s.lane;
  ev.possAfter = s.poss;
  ev.situationAfter = s.situation;

  // Fin de tiempo: sólo cuando la pelota vuelve a una salida (no se corta un ataque).
  if (s.minute >= HALF_MINUTES * s.half && s.situation === 'build') {
    if (s.half === 1) {
      ev.halfEnd = 1;
      s.half = 2; s.minute = HALF_MINUTES; s.poss = 1 - s.kickoff; s.situation = 'build'; s.lane = 'C';
      ev.kickoffAfter = s.poss;
    } else {
      ev.halfEnd = 2;
      s.phase = 'end';
    }
  }
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
      if (ev.outcome === 'advance') return `${A} sale ${laneTxt[ev.att]} y gana metros.`;
      if (ev.outcome === 'foul') return `${D} leyó la jugada, pero cometió falta. Sigue ${A}.`;
      if (ev.outcome === 'counter') return `¡Robo de ${D} y sale el contragolpe!`;
      return `${D} cerró bien ${laneTxt[ev.att]} y recupera la pelota.`;
    case 'attack':
      if (ev.outcome === 'penalty') return `¡Gambeta en el área y lo derriban! ¡Penal para ${A}!`;
      if (ev.outcome === 'chance') {
        return ev.att === 'cross' ? `Centro de ${A}... ¡y hay cabezazo!`
          : ev.att === 'through' ? `¡Pase filtrado! ${A} queda mano a mano.`
            : `¡Qué gambeta! ${A} se perfila para rematar.`;
      }
      if (ev.outcome === 'corner') return `${D} despeja como puede: tiro de esquina.`;
      if (ev.outcome === 'counter') return `¡${D} corta y sale rápido de contra!`;
      return `${D} defiende bien y se queda con la pelota.`;
    case 'shot':
    case 'penalty':
      if (ev.outcome === 'goal') return `¡GOOOL de ${A}!`;
      if (ev.outcome === 'post') return `¡Al palo! Se salva ${D}.`;
      if (ev.outcome === 'wide') return `¡Uff! Se fue apenas afuera.`;
      if (ev.outcome === 'save_corner') return `¡Atajadón del arquero de ${D}! Al córner.`;
      return `El arquero de ${D} adivinó y se queda con la pelota.`;
    case 'corner':
      if (ev.outcome === 'header') return `El córner cae justo... ¡cabezazo de ${A}!`;
      return `${D} rechaza el tiro de esquina.`;
  }
  return '';
}

export function diceReason(ev) {
  if (ev.dice == null) return '';
  const d = ev.dice;
  switch (ev.situation) {
    case 'build':
      return d === 1 ? 'Falta: sigue el ataque' : d === 6 ? '¡Contragolpe!' : 'Pelota recuperada';
    case 'attack':
      if (ev.att === 'dribble' && !ev.match) return d === 6 ? '¡Penal!' : 'Queda para rematar';
      return d <= 2 ? 'Despeje al córner' : d === 6 ? '¡Contragolpe!' : 'Pelota recuperada';
    case 'shot':
    case 'penalty':
      if (ev.match) return d >= 5 ? 'Da rebote: córner' : 'La contiene';
      return ev.outcome === 'goal' ? '¡Va al arco!' : ev.outcome === 'post' ? '¡Al palo!' : 'Se va afuera';
  }
  return '';
}
