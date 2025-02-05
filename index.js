const { Server } = require("socket.io");
const express = require("express");
const app = express();
const corsOptions = {
    credentials: true,
    origin: ['http://localhost:5173', 'https://9f07-122-186-71-238.ngrok-free.app/'] // Whitelist the domains you want to allow
};
app.use(require("cors")(corsOptions));
require("dotenv").config();
const io = new Server(process.env.PORT, {
  cors: false,
});

const emailToSocketId = new Map();
const socketIdToEmail = new Map();

io.on("connection", (socket) => {
  console.log("Socket Connected:", socket.id);

  socket.on("roomjoin", (data) => {
    try {
      const { email, room } = data;
      emailToSocketId.set(email, socket.id);
      socketIdToEmail.set(socket.id, email);
      io.to(room).emit("user:joined", { email, id: socket.id });
      socket.join(room);
      io.to(socket.id).emit("room:join", data);
    } catch (error) {
      console.error("Error in roomjoin event:", error);
    }
  });

  socket.on("user:call", ({ to, offer }) => {
    try {
      io.to(to).emit("incoming:call", { from: socket.id, offer });
    } catch (error) {
      console.error("Error in user:call event:", error);
    }
  });

  socket.on("call:accepted", ({ to, ans }) => {
    try {
      io.to(to).emit("call:accepted", { from: socket.id, ans });
    } catch (error) {
      console.error("Error in call:accepted event:", error);
    }
  });

  socket.on("peer:nego:needed", ({ to, offer }) => {
    try {
      console.log("peer:nego:needed", offer);
      io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
    } catch (error) {
      console.error("Error in peer:nego:needed event:", error);
    }
  });

  socket.on("peer:nego:done", ({ to, ans }) => {
    try {
      console.log("peer:nego:done", ans);
      io.to(to).emit("peer:nego:final", { from: socket.id, ans });
    } catch (error) {
      console.error("Error in peer:nego:done event:", error);
    }
  });
});
