const { Server } = require("socket.io");
const express = require("express");
const app = express();
const corsOptions = {
  credentials: true,
  origin: ["http://localhost:5174", `${process.env.FRONTEND_URL}`],
};
app.use(require("cors")(corsOptions));
require("dotenv").config();
require("./socketServer.js");

app.get("/", (req, res) => {
  res.send("on 3000 port we are:- ");
});

app.listen(3000, () => {
  console.log("listening on the port 3000");
});
