import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import allRoutes from "./routes/route.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { initSocket } from "./socketServer.js";

// Load env variables
dotenv.config();

const app = express();
app.use(express.json());

const corsOptions = {
  credentials: true,
  origin: ["http://localhost:5173", process.env.FRONTEND_URL],
};
app.use(cors(corsOptions));

app.use("/api/v1", allRoutes);

app.get("/", (req, res) => {
  res.send("Server is UP ⚡");
});

app.use(errorHandler);

const server = app.listen(process.env.PORT || 3000, () => {
  console.log("Server is running!", process.env.PORT);
});
initSocket(server);
