require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const app = require("./app");
const registerSocketHandlers = require("./socket/socketHandlers");

const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
  },
});

registerSocketHandlers(io);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
