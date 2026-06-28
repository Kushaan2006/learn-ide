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

const rooms = new Map();

function createRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function createUniqueRoomId() {
  let roomId = createRoomId();
  while (rooms.has(roomId)) {
    roomId = createRoomId();
  }
  return roomId;
}

io.on("connection", (socket) => {
  let currentRoomId = null;
  let currentRole = null;
  socket.on("update-code", (code) => {
    socket.to(currentRoomId).emit("code-updated", code);
  });
  socket.on("join-room", (payload) => {
    if (payload.role === "teacher") {
      payload.roomId = createUniqueRoomId();
      rooms.set(payload.roomId, {
        teacher: socket.id,
        student: null,
      });

      currentRoomId = payload.roomId;
      currentRole = payload.role;
    }

    if (payload.role === "student") {
      const room = rooms.get(payload.roomId);
      if (!room) {
        socket.emit(
          "join-error",
          "Room is either not in session or does not exist.",
        );
        return;
      }
      if (room.student) {
        socket.emit("join-error", "Room already has a student");
        return;
      }

      room.student = socket.id;
      currentRoomId = payload.roomId;
      currentRole = payload.role;
    }

    socket.join(payload.roomId);
    socket.emit("joined-room", payload);
  });
  socket.on("disconnect", () => {
    if (!currentRole || !currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room) return;

    if (currentRole === "teacher") {
      rooms.delete(currentRoomId);
      return;
    }

    if (currentRole === "student") {
      room.student = null;
    }
  });
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
