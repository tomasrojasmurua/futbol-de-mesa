# Calcciopoli

Juego de fútbol de cartas para celular, para 2 jugadores en una sala (o contra la IA, con tres niveles). Cada jugada se decide eligiendo cartas a la vez, como un piedra-papel-tijera, y el partido se ve en una cancha pixelada mientras se desarrolla.

## Cómo se juega

1. **Sorteo**: el que entra a la sala elige cara o sello. El ganador saca.
2. **Salida**: quien tiene la pelota elige izquierda, centro o derecha; el rival elige qué zona cierra. Si adivina, recupera la pelota.
3. **Último tercio**: centro al área, pase filtrado o gambeta, contra cerrar bandas, achicar espacios o doble marca.
4. **Remate**: el atacante elige palo izquierdo, medio o palo derecho; el arquero rival elige hacia dónde se tira. Cada remate se ve en una escena animada a pantalla completa, desde atrás del tirador, con su nombre y el del arquero.

Si el partido termina empatado se define por penales (cinco por lado y después muerte súbita). Al final aparecen los goleadores con minuto y asistencia, la figura del partido y las estadísticas.

El local juega en una versión pixelada de su estadio (`src/stadiums.js`): colores de butacas, techo, pista de atletismo, letras en la tribuna y rasgos como la cordillera detrás de San Carlos, el arco de Wembley o la torre del Centenario.

Cada equipo tiene su once titular probable (temporada 2025-26) en `src/squads.js`; el nombre de quien lleva la pelota aparece en la cancha y en el relato.

El dado aparece en momentos clave. Cada cara muestra un símbolo de lo que pasa, y las reglas son iguales para los dos equipos:

| Situación | Dado |
|---|---|
| La defensa adivina en la salida | 1: falta y sigue el ataque · 2-5: recupera · 6: contragolpe |
| La defensa adivina en el área | 1: córner · 2: falta y sigue el ataque · 3-5: recupera · 6: contragolpe |
| El arquero adivina | 1: rebote al córner · 2-5: ataja · 6: saque rápido de contra |
| El remate supera al arquero | 1: palo · 2: afuera · 3-6: gol (igual para remate, cabezazo, mano a mano y penal) |
| Gambeta exitosa | 6: penal |

Las tres opciones de ataque valen lo mismo (un 33% de gol por llegada contra una defensa al azar), así que gana quien lee mejor al rival. `node scripts/fair-sim.js` lo comprueba.

### Situaciones de juego

Dos mazos (`src/situations.js`) traen el azar de un partido real. Las cartas nunca tocan el duelo de adivinar: solo cambian caras de los cuatro dados (salida defendida, ataque defendido, atajada y remate). Caras nuevas que pueden aparecer: «sigue la jugada», «remate directo» y «penal».

**Mazo de partido** (60 cartas, 21 situaciones): se roba cuatro veces por partido, dos por tiempo, siempre en una salida. Casi todas duran una jugada y vencen al terminar el tiempo; la Lluvia dura el resto del partido.

| Carta | Copias | A quién | Qué hace |
|---|---|---|---|
| Ánimo de la hinchada | 3 | va perdiendo (empate: tiene la pelota) | En su próximo remate que supere al arquero, todo es gol: ni palo ni afuera. |
| Entran suplentes | 3 | no tiene la pelota | Piernas frescas: en su próxima defensa acertada, casi toda pelota recuperada sale de contragolpe. |
| Lesión | 4 | no tiene la pelota | Con uno menos hasta el cambio: en su próxima defensa acertada, dos caras «recupera» pasan a favor del rival. |
| Habilitación larga | 4 | tiene la pelota | Si le adivinan la próxima salida, tres caras pasan a «pase largo»: la pelota llega al último tercio. |
| Remate de primera | 4 | tiene la pelota | Si le adivinan el próximo ataque en el último tercio, el dado queda: córner, falta, recupera y 3 remate al arco. |
| Cambio táctico: todo al ataque | 4 | va perdiendo (empate: no tiene la pelota) | En su próximo ataque que le adivinen, el rival pierde la contra y la jugada sigue con 3 caras. |
| Fortuna de arquero | 3 | no tiene la pelota | En el próximo remate rival que lo supere, tres caras de gol pasan a «atajada al córner». |
| Capitán inspirado | 3 | tiene la pelota | Tiki-taka: en su próximo ataque que le adivinen, tres caras pasan a favor de su equipo. |
| Genialidad del crack | 3 | tiene la pelota | En su próximo ataque que le adivinen, tres caras pasan a favor de su equipo. |
| Decisión polémica | 3 | tiene la pelota | En su próximo ataque en el último tercio: si se lo adivinan, el dado queda córner, recupera, 3 penal y contra; si gana la gambeta, 3 de 6 son penal (y la carta sigue). Ese penal, si supera al arquero, tiene 5 caras de gol. |
| Lluvia | 2 | los dos | Se larga a llover y no para: hasta el final, en los remates de los dos equipos una cara de gol pasa a «afuera». |
| Error del DT | 2 | va ganando (empate: tiene la pelota) | En su próxima defensa acertada pierde la contra y el rival sigue la jugada con 3 caras. |
| Tiro colocado | 2 | tiene la pelota | En su próximo remate que supere al arquero, todo es gol: ni palo ni afuera. |
| Arquero nervioso | 2 | tiene la pelota | Si le atajan el próximo remate, el dado queda: córner, 2 atajada y 3 gol. |
| Desorden defensivo | 2 | tiene la pelota | En su próximo ataque que le adivinen, el rival pierde la contra y la jugada sigue con 4 caras. |
| Instrucción del DT | 3 | tiene la pelota | En su próximo ataque que le adivinen, el rival pierde la contra: 3 caras de pase largo en la salida o de remate en el último tercio. |
| Defensa sólida | 2 | no tiene la pelota | Si adivina el próximo ataque rival en el último tercio, el dado queda: córner y 5 contra. |
| Barrida quirúrgica | 3 | no tiene la pelota | Si adivina el próximo ataque rival en el último tercio, la quita limpia: 1 recupera y 5 contra, sin falta ni córner. |
| Despeje en la línea | 3 | no tiene la pelota | En el próximo remate rival que supere al arquero (no en penales), dos caras de gol pasan a «despeje»: un defensor la saca en la línea. |
| Presión alta | 3 | no tiene la pelota | Si adivina la próxima salida rival, lo apura sin falta: toda pelota recuperada sale de contra. |
| Achique del arquero | 2 | no tiene la pelota | Si su arquero adivina el próximo remate rival, sale rápido: 1 atajada y 5 contra, sin córner. |

**Mazo de disciplina** (se roba con cada falta): advertencia del árbitro (sin efecto), amarilla (la segunda al mismo jugador es roja), tiro libre directo y roja (resto del partido: al defender, 1 «recupera» pasa a falta en la salida o córner en el último tercio). Hay un mazo por duración para que salga una roja cada 5 partidos en promedio, contando las de doble amarilla:

| Duración | Faltas por partido | Advertencia | Amarilla | Tiro libre | Roja | Rojas por partido |
|---|---|---|---|---|---|---|
| Corto | 0,9 | 4 | 10 | 3 | 5 | 0,20 |
| Normal | 1,4 | 4 | 13 | 3 | 3 | 0,20 |
| Largo | 2,2 | 7 | 17 | 3 | 2 | 0,20 |

Con cartas un partido corto tiene unos 0,2 goles más, el que saca primero sigue ganando la mitad y leer al rival pesa lo mismo (`node scripts/fair-sim.js 20000 sin-cartas` para comparar).

Cada carta tiene 12 segundos; si se acaba el tiempo, se elige sola. La duración se elige en el menú: corto (unas 21 decisiones, 3 a 5 minutos), normal (unas 34, 5 a 8 minutos) o largo (unas 53, 10 a 14 minutos). En una sala manda la de quien la crea.

## Modo carrera

«Modo carrera (ligas)» tiene 10 ligas reales completas (Chile, Argentina, Brasil, México, España, Inglaterra, Italia, Alemania, Francia y Portugal). Eliges liga y equipo, solo ida o ida y vuelta, nivel de la IA y duración de los partidos; juegas o simulas cada fecha, con tabla, goleadores y temporadas siguientes. Cada liga guarda su propia carrera en el celular. Los datos de cada liga están en `src/leagues/`.

## Torneo

«Torneo contra la IA» arma una eliminación directa de 8 o 16 equipos (clubes o selecciones, según tu equipo). Tus partidos se juegan contra la IA, que sube de fácil a difícil ronda a ronda; el resto se simula con el mismo motor. Los empates van a penales y el torneo queda guardado en el celular para seguirlo después.

Hay 235 equipos: los clubes de las 10 ligas, otros clubes y selecciones.

## Liga

En el menú, «Crear liga» abre una sala para 2 a 4 jugadores, que entran con el mismo código. Se juega todos contra todos (con 2 jugadores, ida y vuelta): con 4, los dos partidos de cada fecha van en simultáneo; con 3, el que descansa mira el otro partido en vivo, y quien termina antes puede mirar el que sigue. Triunfo 3 puntos, empate 1 (sin penales); desempate por diferencia de gol y goles a favor. Los partidos son cortos por defecto. Quien crea la liga es la autoridad de todos los partidos y arranca cada fecha; si alguien se va, pierde 3-0 sus partidos pendientes.

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera dist/
npm test         # simula 2000 partidos y muestra duración y goles promedio
```

## Salas en línea

Las salas usan un broker MQTT público y gratuito por WebSocket seguro (EMQX, con HiveMQ y Mosquitto de respaldo): los dos celulares se mandan los mensajes a través de él, así que funciona también con datos móviles, donde una conexión directa WebRTC suele fallar. El que crea la sala es la autoridad del partido: resuelve las jugadas y tira los dados. Si un celular pierde la señal unos segundos, al volver recibe el último estado y sigue el partido.

Para probar sin internet, levanta un broker local con `npm run broker` y abre `http://localhost:5173/?broker=ws://127.0.0.1:8883` en dos pestañas.

## Publicar en Netlify

El repositorio ya trae `netlify.toml` (build `npm run build`, carpeta `dist`). En Netlify: **Add new site → Import an existing project → GitHub → futbol-de-mesa** y desplegar con la configuración detectada.

## Estructura

- `src/game.js`: reglas puras del partido (situaciones, dados, reloj, relato).
- `src/host.js`: autoridad del partido y rival de la IA (Fácil, Normal, Difícil).
- `src/net.js`: salas por relevo MQTT.
- `src/league.js`: fixture, tabla y autoridad de la liga.
- `src/cup.js`: cuadro y simulación del torneo.
- `src/render.js`: cancha, jugadores, cámara y animación de cada jugada.
- `src/cutscene.js`: escena animada de cada remate.
- `src/squads.js`: planteles con los nombres de los jugadores.
- `src/stadiums.js`: estadios de cada equipo.
- `src/main.js`: pantallas, cartas y flujo del partido.
- `src/teams.js`: equipos y camisetas.
