import { Router } from "express";
import { gameService } from "../services/firestore.service.js";
import type { ApiResponse } from "../../../shared/types/index.js";
import type { GameStatus } from "../../../shared/types/index.js";

const router = Router();

/**
 * POST /api/games
 * Create a new game
 */
router.post("/", async (req, res) => {
  try {
    const { quizId } = req.body;

    if (!quizId) {
      res.status(400).json({
        success: false,
        error: "Missing required field: quizId",
      } as ApiResponse<null>);
      return;
    }

    const game = await gameService.createGame({
      quizId,
      status: "waiting",
      currentQuestion: null,
      buzzerQueue: [],
    });

    res.status(201).json({ success: true, data: game } as ApiResponse<typeof game>);
  } catch (error) {
    console.error("Error creating game:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create game",
    } as ApiResponse<null>);
  }
});

/**
 * GET /api/games/:id
 * Get game by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const game = await gameService.getGameById(id);

    if (!game) {
      res.status(404).json({
        success: false,
        error: "Game not found",
      } as ApiResponse<null>);
      return;
    }

    res.json({ success: true, data: game } as ApiResponse<typeof game>);
  } catch (error) {
    console.error("Error getting game:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get game",
    } as ApiResponse<null>);
  }
});

/**
 * PUT /api/games/:id/pause
 * Pause or resume game
 */
router.put("/:id/pause", async (req, res) => {
  try {
    const { id } = req.params;
    const { paused } = req.body;

    if (typeof paused !== "boolean") {
      res.status(400).json({
        success: false,
        error: "Missing or invalid 'paused' field (must be boolean)",
      } as ApiResponse<null>);
      return;
    }

    const status: GameStatus = paused ? "paused" : "active";
    const game = await gameService.updateGame(id, { status });

    res.json({ success: true, data: game } as ApiResponse<typeof game>);
  } catch (error) {
    console.error("Error updating game status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update game status",
    } as ApiResponse<null>);
  }
});

/**
 * PUT /api/games/:id/reset
 * Reset game state
 */
router.put("/:id/reset", async (req, res) => {
  try {
    const { id } = req.params;

    const game = await gameService.updateGame(id, {
      status: "waiting",
      currentQuestion: null,
      buzzerQueue: [],
    });

    res.json({ success: true, data: game } as ApiResponse<typeof game>);
  } catch (error) {
    console.error("Error resetting game:", error);
    res.status(500).json({
      success: false,
      error: "Failed to reset game",
    } as ApiResponse<null>);
  }
});

export default router;

