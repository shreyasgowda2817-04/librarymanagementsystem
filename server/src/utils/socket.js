import { Server } from "socket.io";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: true, // Allow any origin that the main app allows
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE"]
    }
  });


  io.on("connection", (socket) => {
    console.log(`🔌 New Socket Connection: ${socket.id}`);

    socket.on("join", (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined their personal room.`);
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Socket Disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io is not initialized!");
  }
  return io;
};
