import express from "express";
import { compileRequestController } from "../controllers/compileRequestController.js";
const router = express.Router();

router.post("/", compileRequestController);

export default router;
