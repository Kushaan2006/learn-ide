import express from "express";
import compileRoutes from "./routes/compileRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import { validateApiKey } from "./middleware/validateApiKey.js";
const app = express();

app.use(express.json());

app.use("/api/compile", validateApiKey, compileRoutes);
app.use("/api/health", healthRoutes);
app.get("/", (req, res) => {
  return res.status(200).json({ message: "Welcome to Compiler Service" });
});

export default app;
