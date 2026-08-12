const {
  createTeacherRoom,
  joinStudentRoom,
  removeUserFromRoom,
} = require("../services/roomService");

function registerSocketHandlers(io) {
  io.on("connection", (socket) => {
    console.log(`Socket recovered? ${socket.recovered}`);
    console.log(`Socket connected: ${socket.id}`);

    socket.data.roomId = null;
    socket.data.role = null;
    socket.data.username = null;

    socket.on("join-room", (payload) => {
      if (!payload?.username || !payload?.role) {
        socket.emit("join-error", "Invalid room information.");
        return;
      }

      socket.data.username = payload.username;

      if (payload.role === "teacher") {
        const roomId = createTeacherRoom(socket.id);

        const joinedPayload = {
          ...payload,
          roomId,
        };

        socket.data.roomId = roomId;
        socket.data.role = "teacher";

        socket.join(roomId);
        console.log(
          `${roomId} - Socket registered on ROOM ID on (${socket.data.role}): ${socket.data.username}`,
        );
        socket.emit("joined-room", joinedPayload);
        console.log(
          `${roomId} - Socket Joined ROOM on (${socket.data.role}): ${socket.data.username}`,
        );
        return;
      }

      if (payload.role === "student") {
        const roomId = payload.roomId?.trim().toUpperCase();

        if (!roomId) {
          socket.emit("join-error", "Room ID is required.");
          return;
        }

        const result = joinStudentRoom(roomId, socket.id);

        if (result.error) {
          socket.emit("join-error", result.error);
          return;
        }

        const joinedPayload = {
          ...payload,
          roomId,
        };

        socket.data.roomId = roomId;
        socket.data.role = "student";

        socket.join(roomId);
        console.log(
          `${roomId} - Socket registered on ROOM ID on (${socket.data.role}): ${socket.data.username}`,
        );
        socket.emit("joined-room", joinedPayload);
        console.log(
          `${roomId} - Socket Joined ROOM on (${socket.data.role}): ${socket.data.username}`,
        );
        return;
      }

      socket.emit("join-error", "Invalid role.");
      console.log(
        `${socket.data.roomId} - JOIN ERROR FOR (${socket.data.role}): ${socket.data.username}`,
      );
    });

    socket.on("live-code-update", (code) => {
      if (socket.data.role !== "student") {
        return;
      }

      if (!socket.data.roomId) {
        return;
      }

      socket.to(socket.data.roomId).emit("live-code-updated", code);
      console.log(
        `${socket.data.roomId} - Live Code Update Sent to (teacher) from: ${socket.data.username}`,
      );
    });

    socket.on("code-running", ({ isRunning, output }) => {
      socket
        .to(socket.data.roomId)
        .emit("code-executed", { isRunning, output });
    });

    socket.on("review-code-update", (code) => {
      if (socket.data.role !== "student" && socket.data.role !== "teacher") {
        return;
      }

      if (!socket.data.roomId) {
        return;
      }

      socket.to(socket.data.roomId).emit("review-code-updated", {
        code,
        roomId: socket.data.roomId,
        username: socket.data.username,
        role: socket.data.role,
      });

      console.log(
        `${socket.data.roomId} - Review code update forwarded by (${socket.data.role}): ${socket.data.username}`,
      );
    });

    socket.on("input-update", (input) => {
      socket.to(socket.data.roomId).emit("input-updated", input);
    });

    // socket.on("voice-offer", (offer) => {
    //   const { roomId } = socket.data;

    //   if (!roomId) {
    //     return;
    //   }

    //   console.log(`Forwarding voice offer in room ${roomId}`);

    //   socket.to(roomId).emit("voice-offer", offer);
    // });

    // socket.on("voice-answer", (answer) => {
    //   const { roomId } = socket.data;

    //   if (!roomId) {
    //     return;
    //   }

    //   socket.to(roomId).emit("voice-answer", answer);
    // });

    // socket.on("voice-ice-candidate", (candidate) => {
    //   const { roomId } = socket.data;

    //   if (!roomId) {
    //     return;
    //   }

    //   socket.to(roomId).emit("voice-ice-candidate", candidate);
    // });

    // socket.on("voice-leave", () => {
    //   const { roomId } = socket.data;

    //   if (!roomId) {
    //     return;
    //   }

    //   socket.to(roomId).emit("voice-user-left");
    // });

    socket.on("disconnect", () => {
      const { roomId, role } = socket.data;

      if (roomId && role) {
        removeUserFromRoom(roomId, role);
      }

      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
}

module.exports = registerSocketHandlers;
