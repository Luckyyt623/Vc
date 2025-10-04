const http = require("http");
const WebSocket = require("ws");

const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("✅ SlitherControl Voice Server is running!\n");
});

const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  console.log("🔗 New client connected");

  ws.on("message", (data) => {
    // Broadcast message to all other clients
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  });

  ws.on("close", () => {
    console.log("❌ Client disconnected");
  });
});

server.listen(PORT, () => {
  console.log(`✅ Voice server live on port ${PORT}`);
});