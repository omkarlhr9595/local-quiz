import { Router } from "express";
import quizRoutes from "./quiz.routes.js";
import contestantRoutes from "./contestant.routes.js";
import gameRoutes from "./game.routes.js";

const router = Router();

// API routes
router.use("/quizzes", quizRoutes);
router.use("/contestants", contestantRoutes);
router.use("/games", gameRoutes);

// Health check
router.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default router;

