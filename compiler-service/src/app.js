import express from "express";
import compileRoutes from "./routes/compileRoutes.js";

const app = express();

app.use(express.json());

app.use("/api/compile", compileRoutes);

app.get("/", (req, res) => {
  return res.status(200).json({ message: "Welcome to Compiler Service" });
});

export default app;
