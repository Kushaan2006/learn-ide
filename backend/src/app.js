const express = require("express");
const cors = require("cors");

const healthRoutes = require("./routes/healthRoutes");
const compileRoutes = require("./routes/compileRoutes");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  }),
);

app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to the Learn IDE backend!",
  });
});

app.use("/api/health", healthRoutes);
app.use("/api/compile", compileRoutes);

module.exports = app;
