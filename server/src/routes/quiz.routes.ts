import { Router } from "express";
import { quizService } from "../services/firestore.service.js";
import { uploadQuestionImage } from "../services/storage.service.js";
import upload from "../config/multer.js";
import type { ApiResponse, Category, Question } from "../../../shared/types/index.js";

const router = Router();

/**
 * Validate quiz categories and questions structure
 * @returns Error message if invalid, null if valid
 */
function validateCategories(categories: unknown): string | null {
  if (!Array.isArray(categories)) {
    return "Categories must be an array";
  }

  for (let i = 0; i < categories.length; i++) {
    const category = categories[i] as Record<string, unknown>;

    if (!category.name || typeof category.name !== "string" || !category.name.trim()) {
      return `Category ${i + 1}: name is required and must be non-empty`;
    }

    if (!Array.isArray(category.questions)) {
      return `Category ${i + 1}: questions must be an array`;
    }

    if (category.questions.length === 0) {
      return `Category ${i + 1}: must have at least one question`;
    }

    for (let j = 0; j < category.questions.length; j++) {
      const question = category.questions[j] as Record<string, unknown>;

      if (!question.question || typeof question.question !== "string" || !question.question.toString().trim()) {
        return `Category ${i + 1}, Question ${j + 1}: question text is required`;
      }

      if (!question.answer || typeof question.answer !== "string" || !question.answer.toString().trim()) {
        return `Category ${i + 1}, Question ${j + 1}: answer is required`;
      }

      if (typeof question.points !== "number" || question.points <= 0) {
        return `Category ${i + 1}, Question ${j + 1}: points must be a positive number`;
      }

      // MCQ-specific validation
      if (question.type === "mcq") {
        if (!Array.isArray(question.options)) {
          return `Category ${i + 1}, Question ${j + 1}: MCQ must have options array`;
        }

        if (question.options.length < 2 || question.options.length > 6) {
          return `Category ${i + 1}, Question ${j + 1}: MCQ must have 2-6 options`;
        }

        const optionIds = new Set<string>();
        for (const option of question.options) {
          const opt = option as Record<string, unknown>;
          if (!opt.id || typeof opt.id !== "string" || !opt.id.trim()) {
            return `Category ${i + 1}, Question ${j + 1}: each option must have a non-empty id`;
          }
          if (!opt.text || typeof opt.text !== "string" || !opt.text.toString().trim()) {
            return `Category ${i + 1}, Question ${j + 1}: each option must have non-empty text`;
          }
          if (optionIds.has(opt.id as string)) {
            return `Category ${i + 1}, Question ${j + 1}: option ids must be unique`;
          }
          optionIds.add(opt.id as string);
        }

        if (!question.correctOptionId || typeof question.correctOptionId !== "string") {
          return `Category ${i + 1}, Question ${j + 1}: MCQ must have a correctOptionId`;
        }

        if (!optionIds.has(question.correctOptionId as string)) {
          return `Category ${i + 1}, Question ${j + 1}: correctOptionId must match one of the options`;
        }
      }
    }
  }

  return null;
}

/**
 * POST /api/quizzes
 * Create a new quiz
 */
router.post("/", async (req, res) => {
  try {
    const { name, categories } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json({
        success: false,
        error: "Quiz name is required",
      } as ApiResponse<null>);
      return;
    }

    const validationError = validateCategories(categories);
    if (validationError) {
      res.status(400).json({
        success: false,
        error: validationError,
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

/**
 * PUT /api/quizzes/:id
 * Update an existing quiz
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, categories } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json({
        success: false,
        error: "Quiz name is required",
      } as ApiResponse<null>);
      return;
    }

    const validationError = validateCategories(categories);
    if (validationError) {
      res.status(400).json({
        success: false,
        error: validationError,
      } as ApiResponse<null>);
      return;
    }

    const quiz = await quizService.updateQuiz(id, { name, categories });
    res.json({ success: true, data: quiz } as ApiResponse<typeof quiz>);
  } catch (error) {
    console.error("Error updating quiz:", error);
    if (error instanceof Error && error.message === "Quiz not found") {
      res.status(404).json({
        success: false,
        error: "Quiz not found",
      } as ApiResponse<null>);
      return;
    }
    res.status(500).json({
      success: false,
      error: "Failed to update quiz",
    } as ApiResponse<null>);
  }
});

/**
 * POST /api/quizzes/images
 * Upload a question image
 */
router.post("/images", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: "No image file provided",
      } as ApiResponse<null>);
      return;
    }

    const imageUrl = await uploadQuestionImage({ file: req.file });

    res.status(201).json({
      success: true,
      data: { imageUrl },
    } as ApiResponse<{ imageUrl: string }>);
  } catch (error) {
    console.error("Error uploading question image:", error);
    res.status(500).json({
      success: false,
      error: "Failed to upload question image",
    } as ApiResponse<null>);
  }
});

export default router;
