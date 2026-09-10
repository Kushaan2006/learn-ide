import express from "express";
import compileRoutes from "./routes/compileRoutes.js";

const app = express();

app.use(express.json());

app.use("/api/compile", compileRoutes);

export default app;
