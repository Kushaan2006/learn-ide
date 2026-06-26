const express = require("express");
const http = require("http");
const cors = require("cors");
const app = express();
const PORT = 3000;
const { Server } = require("socket.io");
// Middleware to parse incoming JSON data
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
  },
});

const activeRooms = new Set();

function createRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function createUniqueRoomId() {
  let roomId = createRoomId();
  while (activeRooms.has(roomId)) {
    roomId = createRoomId();
  }
  activeRooms.add(roomId);
  return roomId;
}

io.on("connection", (socket) => {
  socket.on("join-room", (payload) => {
    if (payload.role === "teacher") {
      payload.roomId = createUniqueRoomId();
    }
    if (!activeRooms.has(payload.roomId)) {
      socket.emit("join-error", "Room does not exist.");
      return;
    }
    socket.join(payload.roomId);
    socket.emit("joined-room", payload);
  });
  socket.on("disconnect", () => {});
});

// A simple test route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to my Express backend!" });
});

app.get("/api/health", (req, res) => {
  res.json({ message: "Backend Connected Successfully!" });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
