export function codeUpdateSocketHandler(socket) {
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
}
