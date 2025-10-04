// server.js
// Simple signaling server for WebRTC voice chat (mesh). Port 3000 by default.
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3000 });
console.log('Signaling server listening ws://0.0.0.0:3000');

let clients = new Map(); // id -> ws

function broadcastClientList() {
  const list = Array.from(clients.keys());
  const msg = JSON.stringify({ type: 'peers', peers: list });
  for (const ws of clients.values()) {
    if (ws.readyState === WebSocket.OPEN) ws.send(msg);
  }
}

wss.on('connection', (ws) => {
  const id = Date.now().toString(36) + Math.floor(Math.random()*999).toString(36);
  clients.set(id, ws);
  console.log('client connected', id);

  // tell the client its id
  ws.send(JSON.stringify({ type: 'id', id }));

  // broadcast updated peer list
  broadcastClientList();

  ws.on('message', (raw) => {
    let data;
    try { data = JSON.parse(raw); } catch (e) { return; }
    // routing messages: { type: 'offer'|'answer'|'candidate', to, from, payload }
    if (data.to && clients.has(data.to)) {
      const target = clients.get(data.to);
      if (target.readyState === WebSocket.OPEN) {
        target.send(JSON.stringify(data));
      }
    } else {
      // fallback: broadcast (not recommended for offers)
      if (data.type === 'broadcast') {
        const msg = JSON.stringify(data);
        for (const [cid, cws] of clients.entries()) {
          if (cid === id) continue;
          if (cws.readyState === WebSocket.OPEN) cws.send(msg);
        }
      }
    }
  });

  ws.on('close', () => {
    clients.delete(id);
    console.log('client disconnected', id);
    broadcastClientList();
  });

  ws.on('error', (e) => {
    clients.delete(id);
    console.log('ws error', id, e && e.message);
    broadcastClientList();
  });
});