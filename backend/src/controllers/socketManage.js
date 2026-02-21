import { Server } from "socket.io";

const connections = {};
const messages = {};
const timeOnline = {};

const connectToSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    socket.on("join-call", (roomId) => {
      socket.join(roomId);

      if (!connections[roomId]) {
        connections[roomId] = [];
      }

      if (!connections[roomId].includes(socket.id)) {
        connections[roomId].push(socket.id);
      }

      timeOnline[socket.id] = new Date();

      io.to(roomId).emit("user-joined", socket.id, connections[roomId]);

      if (messages[roomId]) {
        messages[roomId].forEach((msg) => {
          io.to(socket.id).emit(
            "chat-message",
            msg.data,
            msg.sender,
            msg.socketId,
          );
        });
      }
    });

    socket.on("signal", (toId, message) => {
      io.to(toId).emit("signal", socket.id, message);
    });

    socket.on("leave-call", (roomId) => {
      socket.leave(roomId);

      if (connections[roomId]) {
        connections[roomId] = connections[roomId].filter(
          (id) => id !== socket.id,
        );

        socket.to(roomId).emit("user-left", socket.id);

        if (connections[roomId].length === 0) {
          delete connections[roomId];
        }
      }
    });

    socket.on("disconnect", () => {
      for (const roomId in connections) {
        if (connections[roomId].includes(socket.id)) {
          connections[roomId] = connections[roomId].filter(
            (id) => id !== socket.id,
          );

          socket.to(roomId).emit("user-left", socket.id);

          if (connections[roomId].length === 0) {
            delete connections[roomId];
          }
        }
      }

      delete timeOnline[socket.id];

      console.log("socket disconnected:", socket.id);
    });
  });

  return io;
};

export default connectToSocket;
