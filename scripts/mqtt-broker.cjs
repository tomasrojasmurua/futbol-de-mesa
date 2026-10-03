// Broker MQTT local para probar salas sin internet: npm run broker
// Luego abre http://localhost:5173/?broker=ws://127.0.0.1:8883 en dos pestañas.
const aedes = require('aedes')();
const http = require('http');
const { WebSocketServer, createWebSocketStream } = require('ws');
const server = http.createServer();
const wss = new WebSocketServer({ server });
wss.on('connection', (ws) => aedes.handle(createWebSocketStream(ws)));
server.listen(8883, '127.0.0.1', () => console.log('Broker MQTT en ws://127.0.0.1:8883'));
