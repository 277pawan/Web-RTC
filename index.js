import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import "./socketServer.js"; // imported socketServer file
import allRoutes from "./routes/route.js";
import { errorHandler } from "./middleware/errorHandler.js";

// Load env variables
dotenv.config();

const app = express();
app.use(express.json());

const corsOptions = {
  credentials: true,
  origin: ["http://localhost:5174", process.env.FRONTEND_URL],
};
app.use(cors(corsOptions));

app.use("/api/v1", allRoutes);

app.use(errorHandler);

app.get("/", (req, res) => {
  res.send("on 3000 port we are:- ");
});

app.listen(3000, () => {
  console.log("listening on the port 3000");
});
