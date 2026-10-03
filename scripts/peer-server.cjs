// Servidor PeerJS local para probar salas sin internet: npm run peer
// Luego abre http://localhost:5173/?peerhost=127.0.0.1&peerport=9000&peersecure=0
const http = require('http');
const express = require('express');
const { ExpressPeerServer } = require('peer');
const app = express();
const server = http.createServer(app);
app.use('/', ExpressPeerServer(server, { path: '/' }));
server.listen(9000, '127.0.0.1', () => console.log('PeerJS en 127.0.0.1:9000'));
