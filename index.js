// api/socket.js
import { Server } from "socket.io";

const emailToSocketId = new Map();
const socketIdToEmail = new Map();

const ioHandler = (req, res) => {
  if (!res.socket.server.io) {
    console.log("New Socket.io server...");
    const io = new Server(res.socket.server, {
      path: "/api/socket",
      addTrailingSlash: false,
      cors: {
        origin: ["http://localhost:5173", "https://your-frontend.vercel.app"],
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    // Socket.IO event handlers
    io.on("connection", (socket) => {
      console.log("Socket Connected:", socket.id);

      socket.on("roomjoin", (data) => {
        const { email, room } = data;
        emailToSocketId.set(email, socket.id);
        socketIdToEmail.set(socket.id, email);
        io.to(room).emit("user:joined", { email, id: socket.id });
        socket.join(room);
        io.to(socket.id).emit("room:join", data);
      });

      socket.on("user:call", ({ to, offer }) => {
        io.to(to).emit("incoming:call", { from: socket.id, offer });
      });

      socket.on("call:accepted", ({ to, ans }) => {
        io.to(to).emit("call:accepted", { from: socket.id, ans });
      });

      socket.on("peer:nego:needed", ({ to, offer }) => {
        console.log("peer:nego:needed", offer);
        io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
      });

      socket.on("peer:nego:done", ({ to, ans }) => {
        console.log("peer:nego:done", ans);
        io.to(to).emit("peer:nego:final", { from: socket.id, ans });
      });

      socket.on("disconnect", () => {
        const email = socketIdToEmail.get(socket.id);
        emailToSocketId.delete(email);
        socketIdToEmail.delete(socket.id);
      });
    });

    res.socket.server.io = io;
  }
  res.end();
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export default ioHandler;
