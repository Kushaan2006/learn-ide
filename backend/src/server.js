import "dotenv/config";
import http from "http";

import { Server } from "socket.io";

import app from "./app.js";
import { registerSocketHandlers } from "./socket/socketHandlers.js";

const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: false,
  },
});

registerSocketHandlers(io);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
