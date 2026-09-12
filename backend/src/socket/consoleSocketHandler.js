export function consoleSocketHandler(socket) {
  socket.on("code-running", ({ isRunning, output }) => {
    socket.to(socket.data.roomId).emit("code-executed", { isRunning, output });
    console.log(`${socket.data.roomId} - Running Code`);
  });

  socket.on("input-update", (input) => {
    socket.to(socket.data.roomId).emit("input-updated", input);
  });
}
