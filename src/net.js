import Peer from 'peerjs';

const PREFIX = 'futbolmesa-v1-';
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function makeCode() {
  let c = '';
  for (let i = 0; i < 5; i++) c += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return c;
}

// Permite apuntar a un servidor PeerJS propio con ?peerhost=...&peerport=...
function peerOptions() {
  const p = new URLSearchParams(location.search);
  const host = p.get('peerhost');
  const opts = { debug: 1 };
  if (host) {
    opts.host = host;
    opts.port = Number(p.get('peerport') || 443);
    opts.path = p.get('peerpath') || '/';
    opts.secure = p.get('peersecure') ? p.get('peersecure') === '1' : opts.port === 443;
  }
  return opts;
}

// Crea una sala. onGuest(conn) se llama cuando entra el rival.
export function createRoom({ onReady, onGuest, onError }) {
  const code = makeCode();
  const peer = new Peer(PREFIX + code, peerOptions());
  let taken = false;
  peer.on('open', () => onReady(code));
  peer.on('connection', (conn) => {
    if (taken) { conn.on('open', () => { conn.send({ t: 'full' }); setTimeout(() => conn.close(), 300); }); return; }
    taken = true;
    conn.on('open', () => onGuest(wrap(conn)));
  });
  peer.on('error', (e) => {
    if (e.type === 'unavailable-id') { peer.destroy(); createRoom({ onReady, onGuest, onError }); return; }
    onError(e);
  });
  return { destroy: () => peer.destroy() };
}

export function joinRoom(code, { onOpen, onError }) {
  const peer = new Peer(undefined, peerOptions());
  let opened = false;
  const timer = setTimeout(() => { if (!opened) onError({ type: 'timeout' }); }, 15000);
  peer.on('open', () => {
    const conn = peer.connect(PREFIX + code.toUpperCase().trim(), { reliable: true });
    conn.on('open', () => { opened = true; clearTimeout(timer); onOpen(wrap(conn)); });
    conn.on('error', (e) => onError(e));
  });
  peer.on('error', (e) => { clearTimeout(timer); onError(e); });
  return { destroy: () => peer.destroy() };
}

function wrap(conn) {
  const handlers = { message: [], close: [] };
  conn.on('data', (d) => handlers.message.forEach((h) => h(d)));
  conn.on('close', () => handlers.close.forEach((h) => h()));
  conn.on('error', () => handlers.close.forEach((h) => h()));
  // Detecta celulares que se duermen o pierden señal.
  let last = Date.now();
  conn.on('data', () => (last = Date.now()));
  const ping = setInterval(() => {
    try { conn.send({ t: 'ping' }); } catch { /* conexión caída */ }
    if (Date.now() - last > 20000) { clearInterval(ping); handlers.close.forEach((h) => h()); }
  }, 4000);
  return {
    send: (m) => { try { conn.send(m); } catch { /* ignorar */ } },
    on: (type, h) => handlers[type].push(h),
    close: () => { clearInterval(ping); conn.close(); },
  };
}
