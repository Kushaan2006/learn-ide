import { codeUpdateSocketHandler } from "./codeUpdateSocketHandler.js";
import { roomSocketHandler } from "./roomSocketHandler.js";
import { consoleSocketHandler } from "./consoleSocketHandler.js";

export const registerSocketHandlers = (io) => {
  io.on("connection", (socket) => {
    console.log(`Socket recovered? ${socket.recovered}`);
    console.log(`Socket connected: ${socket.id}`);

    roomSocketHandler(socket);
    codeUpdateSocketHandler(socket);
    consoleSocketHandler(socket);
  });
};
