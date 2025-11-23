import { Router } from "express";
import { quizService } from "../services/firestore.service.js";
import type { ApiResponse } from "../../../shared/types/index.js";

const router = Router();

/**
 * POST /api/quizzes
 * Create a new quiz
 */
router.post("/", async (req, res) => {
  try {
    const { name, categories } = req.body;

    if (!name || !categories || !Array.isArray(categories)) {
      res.status(400).json({
        success: false,
        error: "Missing required fields: name and categories",
      } as ApiResponse<null>);
      return;
    }

    const quiz = await quizService.createQuiz({ name, categories });
    res.status(201).json({ success: true, data: quiz } as ApiResponse<typeof quiz>);
  } catch (error) {
    console.error("Error creating quiz:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create quiz",
    } as ApiResponse<null>);
  }
});

/**
 * GET /api/quizzes/:id
 * Get quiz by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const quiz = await quizService.getQuizById(id);

    if (!quiz) {
      res.status(404).json({
        success: false,
        error: "Quiz not found",
      } as ApiResponse<null>);
      return;
    }

    res.json({ success: true, data: quiz } as ApiResponse<typeof quiz>);
  } catch (error) {
    console.error("Error getting quiz:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get quiz",
    } as ApiResponse<null>);
  }
});

/**
 * GET /api/quizzes
 * Get all quizzes
 */
router.get("/", async (_req, res) => {
  try {
    const quizzes = await quizService.getAllQuizzes();
    res.json({ success: true, data: quizzes } as ApiResponse<typeof quizzes>);
  } catch (error) {
    console.error("Error getting quizzes:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get quizzes",
    } as ApiResponse<null>);
  }
});

export default router;

