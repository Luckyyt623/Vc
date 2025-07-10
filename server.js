// server.js — WebSocket signaling server for Slither.io VC
const WebSocket = require('ws');
const PORT = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port: PORT });

const clients = new Map(); // Map<id, ws>

wss.on('connection', function connection(ws) {
  let userId = null;

  ws.on('message', function incoming(msg) {
    try {
      const data = JSON.parse(msg);

      if (data.type === 'join' && data.id) {
        userId = data.id;
        clients.set(userId, ws);
        console.log(`🟢 ${userId} connected`);
        return;
      }

      if (data.to && clients.has(data.to)) {
        const recipient = clients.get(data.to);
        recipient.send(JSON.stringify({ ...data, from: userId }));
      }
    } catch (e) {
      console.error("❌ Invalid message:", e);
    }
  });

  ws.on('close', () => {
    if (userId && clients.has(userId)) {
      clients.delete(userId);
      console.log(`🔴 ${userId} disconnected`);
    }
  });
});

console.log(`✅ WebSocket VC server running on port ${PORT}`);