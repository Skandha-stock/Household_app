import { Server } from "socket.io";

let io: Server;

export function initializeSocket(
  socketServer: Server
) {
  io = socketServer;

  io.on("connection", (socket) => {
    console.log(
      `Socket connected: ${socket.id}`
    );

    socket.on("joinHousehold", (householdId: number) => {
      socket.join(
        `household:${householdId}`
      );

      console.log(
        `Socket ${socket.id} joined household:${householdId}`
      );
    });

    socket.on("disconnect", () => {
      console.log(
        `Socket disconnected: ${socket.id}`
      );
    });
  });
}

export function getIO(): Server {
  if (!io) {
    throw new Error(
      "Socket.IO has not been initialized."
    );
  }

  return io;
}