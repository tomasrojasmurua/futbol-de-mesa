# Calcciopoli

Juego de fútbol de cartas para celular, para 2 jugadores en una sala (o contra la IA, con tres niveles). Cada jugada se decide eligiendo cartas a la vez, como un piedra-papel-tijera, y el partido se ve en una cancha pixelada mientras se desarrolla.

## Cómo se juega

1. **Sorteo**: el que entra a la sala elige cara o sello. El ganador saca.
2. **Salida**: quien tiene la pelota elige izquierda, centro o derecha; el rival elige qué zona cierra. Si adivina, recupera la pelota.
3. **Último tercio**: centro al área, pase filtrado o gambeta, contra cerrar bandas, achicar la línea o doble marca.
4. **Remate**: el atacante elige palo izquierdo, medio o palo derecho; el arquero rival elige hacia dónde se tira.

El dado aparece en momentos clave. Cada cara muestra un símbolo de lo que pasa, y las reglas son iguales para los dos equipos:

| Situación | Dado |
|---|---|
| La defensa adivina en la salida | 1: falta y sigue el ataque · 2-5: recupera · 6: contragolpe |
| La defensa adivina en el área | 1: córner · 2-5: recupera · 6: contragolpe |
| El arquero adivina | 1: rebote al córner · 2-5: ataja · 6: saque rápido de contra |
| El remate supera al arquero | 1-2: palo · 3-4: afuera · 5-6: gol (igual para remate, cabezazo, mano a mano y penal) |
| Gambeta exitosa | 6: penal |

Las tres opciones de ataque valen lo mismo (un 16% de gol por llegada contra una defensa al azar), así que gana quien lee mejor al rival. `node scripts/fair-sim.js` lo comprueba.

Cada carta tiene 12 segundos; si se acaba el tiempo, se elige sola. La duración se elige en el menú: corto (unas 21 decisiones, 3 a 5 minutos), normal (unas 34, 5 a 8 minutos) o largo (unas 53, 10 a 14 minutos). En una sala manda la de quien la crea.

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
- `src/render.js`: cancha, jugadores, cámara y animación de cada jugada.
- `src/main.js`: pantallas, cartas y flujo del partido.
- `src/teams.js`: equipos y camisetas.
