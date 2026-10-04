import mqtt from 'mqtt';

// Salas por relevo: los dos celulares se conectan a un broker MQTT público por
// WebSocket seguro y se mandan los mensajes a través de él. A diferencia de una
// conexión directa (WebRTC), esto funciona con datos móviles y redes con NAT
// estricto, que es justo donde fallaban las salas.
const DEFAULT_BROKERS = [
  'wss://broker.emqx.io:8084/mqtt',
  'wss://broker.hivemq.com:8884/mqtt',
  'wss://test.mosquitto.org:8081/mqtt',
];
const PREFIX = 'futbolmesa/v2/';
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function brokers() {
  // ?broker=ws://127.0.0.1:8883 para probar con un broker local.
  const b = new URLSearchParams(location.search).get('broker');
  return b ? [b] : DEFAULT_BROKERS;
}

export function makeCode() {
  let c = '';
  for (let i = 0; i < 5; i++) c += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return c;
}

const rid = () => Math.random().toString(36).slice(2, 10);

// Conecta al primer broker que responda (empezando por `start`).
function connectAny(start = 0, timeoutMs = 6000) {
  const list = brokers();
  return new Promise((resolve, reject) => {
    let i = 0;
    const next = () => {
      if (i >= list.length) { reject({ type: 'network' }); return; }
      const idx = (start + i++) % list.length;
      const client = mqtt.connect(list[idx], {
        clientId: 'fdm_' + rid(), clean: true, connectTimeout: timeoutMs, reconnectPeriod: 0, keepalive: 20,
      });
      let done = false;
      const fail = () => { if (done) return; done = true; client.end(true); next(); };
      const timer = setTimeout(fail, timeoutMs + 500);
      client.once('connect', () => {
        if (done) return;
        done = true; clearTimeout(timer);
        // A partir de acá, que reintente solo si se corta (celular que se duerme).
        client.options.reconnectPeriod = 1500;
        resolve({ client, idx });
      });
      client.once('error', fail);
    };
    next();
  });
}

function decode(buf) {
  try { return JSON.parse(new TextDecoder().decode(buf)); } catch { return null; }
}

// Canal de mensajes entre dos jugadores sobre un cliente MQTT. Con `peerId`
// sólo acepta mensajes de ese jugador y le dirige los propios (para salas con
// varios invitados sobre el mismo tópico).
function channel(client, inTopic, outTopic, myId, peerId = null) {
  const handlers = { message: [], close: [] };
  let closed = false, last = Date.now();
  const close = () => { if (closed) return; closed = true; clearInterval(ping); handlers.close.forEach((h) => h()); };
  client.on('message', (topic, payload) => {
    if (topic !== inTopic) return;
    const m = decode(payload);
    if (!m || m.from === myId || (m.to && m.to !== myId) || (peerId && m.from !== peerId)) return;
    last = Date.now();
    if (m.t === 'ping') return;
    if (m.t === 'bye') { close(); return; }
    handlers.message.forEach((h) => h(m));
  });
  const send = (m) => { if (!closed) client.publish(outTopic, JSON.stringify(peerId ? { ...m, from: myId, to: peerId } : { ...m, from: myId }), { qos: 1 }); };
  const ping = setInterval(() => {
    send({ t: 'ping' });
    if (Date.now() - last > 25000) close();
  }, 4000);
  client.on('reconnect', () => { last = Date.now(); });
  client.on('connect', () => handlers.message.forEach((h) => h({ t: 'reconnected' })));
  return {
    send,
    on: (type, h) => handlers[type].push(h),
    close: () => { send({ t: 'bye' }); closed = true; clearInterval(ping); setTimeout(() => client.end(true), 300); },
  };
}

// Crea una sala. onGuest(conn, hello) se llama cuando entra cada invitado.
// max: cuántos invitados acepta (1 en un partido, hasta 3 en una liga).
export function createRoom({ onReady, onGuest, onError, max = 1, mode = 'match' }) {
  let client = null, dead = false, locked = false;
  const guests = new Map();
  const code = makeCode();
  const base = PREFIX + code;
  const hostId = 'h_' + rid();
  const closeRoom = () => { if (client) client.publish(base + '/room', '', { qos: 1, retain: true }); };
  connectAny().then(({ client: c, idx }) => {
    if (dead) { c.end(true); return; }
    client = c;
    // Aviso "retenido": así quien entra con el código sabe que la sala existe.
    client.publish(base + '/room', JSON.stringify({ open: true, mode, at: Date.now() }), { qos: 1, retain: true });
    client.subscribe([base + '/h'], { qos: 1 }, (err) => {
      if (err) { onError({ type: 'network' }); return; }
      onReady(code, idx);
    });
    client.on('message', (topic, payload) => {
      if (topic !== base + '/h') return;
      const m = decode(payload);
      if (!m || m.t !== 'join') return;
      const welcome = () => client.publish(base + '/g', JSON.stringify({ t: 'welcome', mode, to: m.from, from: hostId }), { qos: 1 });
      if (guests.has(m.from)) { welcome(); return; } // reintento del mismo invitado
      if (locked || guests.size >= max) {
        client.publish(base + '/g', JSON.stringify({ t: 'full', to: m.from, from: hostId }), { qos: 1 });
        return;
      }
      welcome();
      const conn = channel(client, base + '/h', base + '/g', hostId, m.from);
      conn.guestId = m.from;
      guests.set(m.from, conn);
      // La sala ya no está disponible para otros.
      if (guests.size >= max) closeRoom();
      onGuest(conn, m);
    });
  }).catch((e) => onError(e));
  return {
    // No acepta más invitados (la liga empezó).
    lock: () => { locked = true; closeRoom(); },
    destroy: () => {
      dead = true;
      if (client) {
        closeRoom();
        if (guests.size) guests.forEach((g) => g.close()); else setTimeout(() => client.end(true), 300);
      }
    },
  };
}

export function joinRoom(rawCode, { onOpen, onError, team, brokerHint = 0 }) {
  const code = rawCode.toUpperCase().trim();
  const base = PREFIX + code;
  const guestId = 'g_' + rid();
  let dead = false, client = null;
  const list = brokers();

  // Prueba cada broker hasta encontrar el aviso de la sala.
  const tryBroker = async (k) => {
    if (dead) return;
    if (k >= list.length) { onError({ type: 'peer-unavailable' }); return; }
    let conn;
    try { conn = await connectAny((brokerHint + k) % list.length); } catch (e) { onError(e); return; }
    client = conn.client;
    let found = false, welcomed = false;
    const lookTimer = setTimeout(() => { if (!found && !dead) { client.end(true); tryBroker(k + 1); } }, 3500);
    client.on('message', (topic, payload) => {
      const m = decode(payload);
      if (topic === base + '/room' && m && m.open && !found) {
        found = true; clearTimeout(lookTimer);
        client.subscribe(base + '/g', { qos: 1 }, () => {
          const hello = () => !welcomed && client.publish(base + '/h', JSON.stringify({ t: 'join', team, from: guestId }), { qos: 1 });
          hello();
          const again = setInterval(() => { if (welcomed || dead) clearInterval(again); else hello(); }, 2000);
          setTimeout(() => { if (!welcomed && !dead) { clearInterval(again); onError({ type: 'timeout' }); } }, 12000);
        });
      }
      if (topic === base + '/g' && m && m.to === guestId && !welcomed) {
        if (m.t === 'full') { onError({ type: 'full' }); return; }
        if (m.t === 'welcome') {
          welcomed = true;
          onOpen(channel(client, base + '/g', base + '/h', guestId), m);
        }
      }
    });
    client.subscribe(base + '/room', { qos: 1 });
  };
  tryBroker(0);
  return { destroy: () => { dead = true; if (client) setTimeout(() => client.end(true), 300); } };
}
