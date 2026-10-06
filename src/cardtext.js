// Cómo se cuenta cada carta de situación según quién la mira: el equipo al que
// le salió (mine), su rival (theirs) o alguien que solo mira el partido
// (neutral). Cada texto es [frase, cuándo]. rows: los dados que se muestran en
// la carta, con la cara que importa y cómo se llama desde cada lado.
const R = (die, key, t, l) => ({ die, key, t, l });

// Títulos y nombres de cara repetidos.
const SHOT_RIVAL = ['Remate del rival', 'Tu remate', 'Remate'];
const GOAL_RIVAL = ['Gol del rival', 'Tu gol', 'Gol'];
const SHOT_MINE = ['Tu remate', 'Remate del rival', 'Remate'];
const GOAL_MINE = ['Tu gol', 'Gol del rival', 'Gol'];
const SAVED_MINE = ['Si te atajan', 'Si tu arquero ataja', 'Si el arquero ataja'];
const KEEP = ['Sigues la jugada', 'El rival sigue', 'Sigue la jugada'];
const KEEP_IF_GUESSED = ['Si te adivinan el ataque', 'Si le adivinas el ataque', 'Si le adivinan el ataque'];
const KEEP_IF_GUESSED_B = ['Si te adivinan la salida', 'Si le adivinas la salida', 'Si le adivinan la salida'];
const DEF_OK = ['Si adivinas', 'Si el rival adivina', 'Si adivina'];
const DEF_NO = ['Si no adivinas', 'Si el rival no adivina', 'Si no adivina'];
const COUNTER_MINE = ['Sales de contra', 'El rival sale de contra', 'Sale de contra'];
const CUT_MINE = ['La cortas igual', 'Te la corta igual', 'La corta igual'];

export const CARD_TEXT = {
  hinchada: {
    mine: ['Tu hinchada empuja: si le ganas al arquero, es gol seguro.', 'Tu próximo remate que le gane al arquero'],
    theirs: ['Su hinchada lo empuja: si le gana a tu arquero, es gol seguro.', 'Su próximo remate que le gane a tu arquero'],
    neutral: ['La hinchada empuja: si le gana al arquero, es gol seguro.', 'Su próximo remate que supere al arquero'],
    rows: [R('shotBeat', 'goal', SHOT_MINE, GOAL_MINE)],
  },
  iluminacion: {
    mine: ['La pones donde quieres: si le ganas al arquero, es gol seguro.', 'Tu próximo remate que le gane al arquero'],
    theirs: ['La pone donde quiere: si le gana a tu arquero, es gol seguro.', 'Su próximo remate que le gane a tu arquero'],
    neutral: ['La pone donde quiere: si le gana al arquero, es gol seguro.', 'Su próximo remate que supere al arquero'],
    rows: [R('shotBeat', 'goal', SHOT_MINE, GOAL_MINE)],
  },
  chilena: {
    mine: ['Al arquero rival le tiemblan las manos: si ataja tu remate, se le puede escapar.', 'Tu próximo remate atajado'],
    theirs: ['A tu arquero le tiemblan las manos: si ataja, se le puede escapar.', 'Su próximo remate que ataje tu arquero'],
    neutral: ['Al arquero le tiemblan las manos: si ataja, se le puede escapar.', 'Su próximo remate atajado'],
    rows: [R('shotSave', 'goal', SAVED_MINE, GOAL_MINE)],
  },
  arquero: {
    mine: ['Tu arquero puede manotear el próximo remate al córner.', 'El próximo remate rival que le gane a tu arquero'],
    theirs: ['Ojo: aunque le ganes al arquero rival, te la puede mandar al córner.', 'Tu próximo remate que le gane al arquero'],
    neutral: ['Aunque le ganen, el arquero puede manotearla al córner.', 'El próximo remate rival que lo supere'],
    rows: [R('shotBeat', 'goal', SHOT_RIVAL, GOAL_RIVAL)],
  },
  despeje: {
    mine: ['Un defensor tuyo puede sacarla en la línea.', 'El próximo remate rival que le gane a tu arquero (no penales)'],
    theirs: ['Ojo: aunque le ganes al arquero, un defensor te la puede sacar en la línea.', 'Tu próximo remate que le gane al arquero (no penales)'],
    neutral: ['Un defensor puede sacarla en la línea.', 'El próximo remate rival que supere al arquero (no penales)'],
    rows: [R('shotBeat', 'goal', SHOT_RIVAL, GOAL_RIVAL)],
  },
  achique: {
    mine: ['Tu arquero sale rápido: si ataja, sales de contra; si no, puede taparla al córner.', 'El próximo remate rival'],
    theirs: ['Su arquero sale rápido: si te ataja, sale de contra; si no, puede taparla al córner.', 'Tu próximo remate'],
    neutral: ['El arquero sale rápido: si ataja, sale de contra; si no, puede tapar al córner.', 'El próximo remate rival'],
    rows: [
      R('shotSave', 'counter', ['Si tu arquero ataja', 'Si te atajan', 'Si el arquero ataja'], COUNTER_MINE),
      R('shotBeat', 'goal', ['Si le ganan a tu arquero', 'Si le ganas al arquero', 'Si le ganan al arquero'], GOAL_RIVAL),
    ],
  },
  lluvia: {
    mine: ['Llueve hasta el final: a los dos les cuesta más acertar al arco.', 'Todos los remates del partido, tuyos y del rival'],
    theirs: ['Llueve hasta el final: a los dos les cuesta más acertar al arco.', 'Todos los remates del partido, tuyos y del rival'],
    neutral: ['Llueve hasta el final: a los dos les cuesta más acertar al arco.', 'Todos los remates del partido'],
    rows: [R('shotBeat', 'goal', ['Cada remate que le gane al arquero', 'Cada remate que le gane al arquero', 'Cada remate que le gane al arquero'], ['Gol', 'Gol', 'Gol'])],
  },
  primera: {
    mine: ['Aunque te adivinen el ataque, puedes rematar igual.', 'Tu próximo ataque en el último tercio'],
    theirs: ['Aunque le adivines el ataque, puede rematar igual.', 'Su próximo ataque en el último tercio'],
    neutral: ['Aunque le adivinen el ataque, puede rematar igual.', 'Su próximo ataque en el último tercio'],
    rows: [R('attackDef', 'shoot', KEEP_IF_GUESSED, ['Rematas', 'Remata', 'Remata'])],
  },
  habilitacion: {
    mine: ['Aunque te adivinen la salida, tu pase largo puede llegar.', 'Tu próxima salida'],
    theirs: ['Aunque le adivines la salida, su pase largo puede llegar.', 'Su próxima salida'],
    neutral: ['Aunque le adivinen la salida, el pase largo puede llegar.', 'Su próxima salida'],
    rows: [R('buildDef', 'longpass', KEEP_IF_GUESSED_B, ['Pase largo', 'Pase largo', 'Pase largo'])],
  },
  instruccion: {
    mine: ['Tu DT tiene la jugada preparada: aunque te adivinen, sigues.', 'Tu próximo ataque'],
    theirs: ['Su DT tiene la jugada preparada: aunque le adivines, sigue.', 'Su próximo ataque'],
    neutral: ['El DT tiene la jugada preparada: aunque le adivinen, sigue.', 'Su próximo ataque'],
    rows: [R('buildDef', 'longpass', KEEP_IF_GUESSED_B, ['Pase largo', 'Pase largo', 'Pase largo']), R('attackDef', 'shoot', KEEP_IF_GUESSED, ['Rematas', 'Remata', 'Remata'])],
  },
  capitan: {
    mine: ['Tu capitán está encendido: aunque te adivinen, puedes seguir.', 'Tu próximo ataque'],
    theirs: ['Su capitán está encendido: aunque le adivines, puede seguir.', 'Su próximo ataque'],
    neutral: ['El capitán está encendido: aunque le adivinen, puede seguir.', 'Su próximo ataque'],
    rows: [R('buildDef', 'advance', KEEP_IF_GUESSED_B, KEEP), R('attackDef', 'shoot', KEEP_IF_GUESSED, ['Rematas', 'Remata', 'Remata'])],
  },
  crack: {
    mine: ['Tu crack puede inventar algo: aunque te adivinen, puedes seguir.', 'Tu próximo ataque'],
    theirs: ['Su crack puede inventar algo: aunque le adivines, puede seguir.', 'Su próximo ataque'],
    neutral: ['El crack puede inventar algo: aunque le adivinen, puede seguir.', 'Su próximo ataque'],
    rows: [R('buildDef', 'advance', KEEP_IF_GUESSED_B, KEEP), R('attackDef', 'shoot', KEEP_IF_GUESSED, ['Rematas', 'Remata', 'Remata'])],
  },
  tactico: {
    mine: ['Todo al ataque: aunque te adivinen, el rival no te sale de contra.', 'Tu próximo ataque'],
    theirs: ['El rival va con todo: aunque le adivines, no podrás salir de contra.', 'Su próximo ataque'],
    neutral: ['Todo al ataque: aunque le adivinen, el rival no sale de contra.', 'Su próximo ataque'],
    rows: [R('buildDef', 'advance', KEEP_IF_GUESSED_B, KEEP), R('attackDef', 'shoot', KEEP_IF_GUESSED, ['Rematas', 'Remata', 'Remata'])],
  },
  error: {
    mine: ['El rival está desordenado: aunque te adivinen, puedes seguir.', 'Tu próximo ataque'],
    theirs: ['Tu defensa está desordenada: aunque le adivines, puede seguir.', 'Su próximo ataque'],
    neutral: ['La defensa rival está desordenada: aunque le adivinen, puede seguir.', 'Su próximo ataque'],
    rows: [R('buildDef', 'advance', KEEP_IF_GUESSED_B, KEEP), R('attackDef', 'shoot', KEEP_IF_GUESSED, ['Rematas', 'Remata', 'Remata'])],
  },
  suplentes: {
    mine: ['Piernas frescas: si recuperas, sales de contra, y puedes quitarla aunque no adivines.', 'Tu próxima defensa'],
    theirs: ['El rival tiene piernas frescas: si te la quita, sale de contra, y te la puede quitar aunque no adivine.', 'Tu próximo ataque'],
    neutral: ['Piernas frescas: si recupera, sale de contra, y puede quitarla aunque no adivine.', 'Su próxima defensa'],
    rows: [R('buildDef', 'counter', DEF_OK, COUNTER_MINE), R('buildWin', 'counter', DEF_NO, CUT_MINE)],
  },
  presion: {
    mine: ['Aprietas arriba: si recuperas, sales de contra, y puedes quitarla aunque no adivines.', 'La próxima salida rival'],
    theirs: ['El rival aprieta arriba: te la puede quitar aunque no adivine.', 'Tu próxima salida'],
    neutral: ['Aprieta arriba: si recupera, sale de contra, y puede quitarla aunque no adivine.', 'La próxima salida rival'],
    rows: [R('buildDef', 'counter', DEF_OK, COUNTER_MINE), R('buildWin', 'steal', DEF_NO, CUT_MINE)],
  },
  defensa: {
    mine: ['Tu defensa está bien parada: sales de contra, y puedes cortar aunque no adivines.', 'El próximo ataque rival en el último tercio'],
    theirs: ['Su defensa está bien parada: te puede cortar aunque no adivine.', 'Tu próximo ataque en el último tercio'],
    neutral: ['Defensa bien parada: sale de contra, y puede cortar aunque no adivine.', 'El próximo ataque rival en el último tercio'],
    rows: [R('attackDef', 'counter', DEF_OK, COUNTER_MINE), R('attackWin', 'steal', DEF_NO, CUT_MINE)],
  },
  barrida: {
    mine: ['La barres limpia: sales de contra, y puedes llegar aunque no adivines.', 'El próximo ataque rival en el último tercio'],
    theirs: ['Te pueden barrer limpio, aunque no te adivinen.', 'Tu próximo ataque en el último tercio'],
    neutral: ['La barre limpia: sale de contra, y puede llegar aunque no adivine.', 'El próximo ataque rival en el último tercio'],
    rows: [R('attackDef', 'counter', DEF_OK, COUNTER_MINE), R('attackWin', 'steal', DEF_NO, CUT_MINE)],
  },
  lesion: {
    mine: ['Juegas con uno menos hasta el cambio: te cuesta quitar la pelota.', 'Tu próxima defensa acertada'],
    theirs: ['El rival juega con uno menos hasta el cambio: le cuesta quitarte la pelota.', 'Tu próximo ataque que te adivinen'],
    neutral: ['Juega con uno menos hasta el cambio: le cuesta quitar la pelota.', 'Su próxima defensa acertada'],
    rows: [R('buildDef', 'steal', ['Si adivinas la salida', 'Si te adivina la salida', 'Si adivina la salida'], ['Recuperas', 'Te la quita', 'Recupera'])],
  },
  errordt: {
    mine: ['Tu DT se equivoca: aunque adivines, el rival puede seguir.', 'Tu próxima defensa acertada'],
    theirs: ['Su DT se equivoca: aunque te adivine, puedes seguir.', 'Tu próximo ataque que te adivinen'],
    neutral: ['El DT se equivoca: aunque adivine, el rival puede seguir.', 'Su próxima defensa acertada'],
    rows: [R('buildDef', 'advance', ['Si adivinas la salida', 'Si te adivina la salida', 'Si adivina la salida'], ['El rival sigue', 'Sigues la jugada', 'El rival sigue'])],
  },
  warning: {
    mine: ['El árbitro llama a tu jugador. No pasa nada más.', ''],
    theirs: ['El árbitro llama a un jugador rival. No pasa nada más.', ''],
    neutral: ['El árbitro lo llama. No pasa nada más.', ''],
  },
  yellow: {
    mine: ['Amarilla para tu jugador: con otra, se va expulsado.', ''],
    theirs: ['Amarilla para un rival: con otra, se va expulsado.', ''],
    neutral: ['Amonestado: con otra amarilla, se va expulsado.', ''],
  },
  freekick: {
    mine: ['Falta cerca del área: tienes tiro libre directo.', 'Ahora'],
    theirs: ['Falta cerca de tu área: el rival tiene tiro libre directo.', 'Ahora'],
    neutral: ['Falta cerca del área: tiro libre directo.', 'Ahora'],
  },
  red: {
    mine: ['Expulsan a tu jugador: juegas con uno menos y te cuesta recuperar.', 'Todo el partido'],
    theirs: ['Expulsan a un rival: juega con uno menos y le cuesta recuperar.', 'Todo el partido'],
    neutral: ['Expulsado: juega con uno menos y le cuesta recuperar.', 'Todo el partido'],
  },
};
