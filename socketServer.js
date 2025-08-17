import { Server } from "socket.io";

const emailToSocketId = new Map();
const socketIdToEmail = new Map();
const roomToUsers = new Map();

// Socket IO Server configration
export function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: ["http://localhost:5174", `${process.env.FRONTEND_URL}`],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Socket Connected:", socket.id);

    // Handle room joining
    socket.on("roomjoin", (data) => {
      try {
        const { email, room } = data;
        console.log(`User ${email} (${socket.id}) joining room ${room}`);

        // Store mappings
        emailToSocketId.set(email, socket.id);
        socketIdToEmail.set(socket.id, email);

        // Initialize room if it doesn't exist
        if (!roomToUsers.has(room)) {
          roomToUsers.set(room, []);
        }

        // Add user to room
        roomToUsers.get(room).push(socket.id);

        // Join socket.io room
        socket.join(room);

        // Notify other users in the room
        socket.to(room).emit("user:joined", { email, id: socket.id });

        // Send confirmation to the joining user
        io.to(socket.id).emit("room:join", data);

        // Send list of current users to the new user
        const currentUsers = roomToUsers
          .get(room)
          .filter((id) => id !== socket.id);

        console.log(`Sending roomUsers event to ${socket.id}:`, currentUsers);
        io.to(socket.id).emit("roomUsers", currentUsers);
      } catch (error) {
        console.error("Error in roomjoin event:", error);
      }
    });

    // Handle call initiation
    socket.on("user:call", ({ to, offer }) => {
      try {
        console.log(`Call from ${socket.id} to ${to}`);
        io.to(to).emit("incoming:call", { from: socket.id, offer });
      } catch (error) {
        console.error("Error in user:call event:", error);
      }
    });

    // Handle call acceptance
    socket.on("call:accepted", ({ to, ans }) => {
      try {
        console.log(`Call accepted: ${socket.id} → ${to}`);
        io.to(to).emit("call:accepted", { from: socket.id, ans });
      } catch (error) {
        console.error("Error in call:accepted event:", error);
      }
    });

    // Handle negotiation
    socket.on("peer:nego:needed", ({ to, offer }) => {
      try {
        console.log(`Negotiation needed: ${socket.id} → ${to}`);
        io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
      } catch (error) {
        console.error("Error in peer:nego:needed event:", error);
      }
    });

    socket.on("peer:nego:done", ({ to, ans }) => {
      try {
        console.log(`Negotiation complete: ${socket.id} → ${to}`);
        io.to(to).emit("peer:nego:final", { from: socket.id, ans });
      } catch (error) {
        console.error("Error in peer:nego:done event:", error);
      }
    });

    // Handle ICE candidates
    socket.on("sendICECandidate", ({ to, candidate }) => {
      try {
        console.log(`ICE candidate: ${socket.id} → ${to}`);
        io.to(to).emit("iceCandidate", { from: socket.id, candidate });
      } catch (error) {
        console.error("Error in sendICECandidate event:", error);
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);

      // Find which rooms this user was in
      roomToUsers.forEach((users, roomId) => {
        const index = users.indexOf(socket.id);
        if (index !== -1) {
          // Remove from room
          users.splice(index, 1);
          console.log(`User ${socket.id} removed from room ${roomId}`);

          // Notify others in the room
          socket.to(roomId).emit("userLeft", socket.id);
        }
      });

      // Clean up mappings
      const email = socketIdToEmail.get(socket.id);
      if (email) {
        emailToSocketId.delete(email);
        socketIdToEmail.delete(socket.id);
      }
    });
  });
}
