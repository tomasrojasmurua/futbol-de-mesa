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

**Mazo de partido** (40 cartas): se roba en una salida al 40% y al 80% de cada tiempo.

| Carta | Copias | A quién | Qué cambia | Dura |
|---|---|---|---|---|
| Ánimo de la hinchada | 3 | va perdiendo (empate: tiene la pelota) | remate: «afuera» pasa a gol | 1 remate |
| Entran suplentes | 3 | no tiene la pelota | al defender: 1 «recupera» pasa a contra | 2 tiradas |
| Lesión | 4 | no tiene la pelota | al defender: 1 «recupera» pasa a «sigue la jugada» del rival | 3 tiradas |
| Habilitación larga | 4 | tiene la pelota | salida defendida: 1 «recupera» pasa a «remate directo» | 1 tirada |
| Cambio táctico | 4 | va perdiendo (empate: no tiene la pelota) | al atacar: 1 «recupera» pasa a «sigue»; al defender, lo mismo para el rival | 3 atacando, 1 defendiendo |
| Arquero inspirado | 3 | no tiene la pelota | remate rival: 1 gol pasa a «atajada al córner» | 1 remate |
| Capitán inspirado | 3 | tiene la pelota | al atacar: 1 «recupera» pasa a «sigue la jugada» | 3 tiradas |
| Genialidad del crack | 3 | tiene la pelota | al atacar: 2 «recupera» pasan a «sigue la jugada» | 1 tirada |
| Decisión polémica | 3 | tiene la pelota | ataque defendido: 1 «recupera» pasa a penal | 1 tirada |
| Lluvia | 2 | los dos | remate: 1 gol pasa a «afuera» | hasta el entretiempo |
| Error del DT | 2 | va ganando (empate: tiene la pelota) | al defender: 1 «recupera» pasa a «sigue la jugada» del rival | 2 tiradas |
| Golpe de iluminación | 2 | tiene la pelota | remate: «palo» pasa a gol | 1 remate |
| Golazo de chilena | 2 | tiene la pelota | atajada: 1 «atajada» pasa a gol | 1 remate |
| Error en la defensa | 2 | tiene la pelota | al atacar: 3 «recupera» pasan a «sigue la jugada» | 1 tirada |

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
