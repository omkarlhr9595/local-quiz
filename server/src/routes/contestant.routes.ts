import { Router } from "express";
import upload from "../config/multer.js";
import { contestantService } from "../services/firestore.service.js";
import { uploadContestantPhoto } from "../services/storage.service.js";
import { v4 as uuidv4 } from "uuid";
import type { ApiResponse } from "../../../shared/types/index.js";

const router = Router();

/**
 * POST /api/contestants
 * Create a new contestant with photo upload
 */
router.post("/", upload.single("photo"), async (req, res) => {
  try {
    const { name, gameId, route } = req.body;
    const file = req.file;

    if (!name || !gameId || !route) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: name, gameId, and route",
      } as ApiResponse<null>);
    }

    if (!file) {
      return res.status(400).json({
        success: false,
        error: "Photo file is required",
      } as ApiResponse<null>);
    }

    // Generate contestant ID
    const contestantId = uuidv4();

    // Upload photo to Firebase Storage
    const photoUrl = await uploadContestantPhoto({
      file,
      gameId,
      contestantId,
    });

    // Create contestant
    const contestant = await contestantService.createContestant({
      name,
      gameId,
      route,
      photoUrl,
      score: 0,
    });

    res
      .status(201)
      .json({ success: true, data: contestant } as ApiResponse<typeof contestant>);
  } catch (error) {
    console.error("Error creating contestant:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create contestant",
    } as ApiResponse<null>);
  }
});

/**
 * GET /api/contestants
 * Get all contestants (optionally filtered by gameId)
 */
router.get("/", async (req, res) => {
  try {
    const { gameId } = req.query;

    if (gameId && typeof gameId === "string") {
      const contestants = await contestantService.getContestantsByGameId(gameId);
      return res.json({
        success: true,
        data: contestants,
      } as ApiResponse<typeof contestants>);
    }

    // If no gameId, return all contestants (or implement pagination)
    res.status(400).json({
      success: false,
      error: "gameId query parameter is required",
    } as ApiResponse<null>);
  } catch (error) {
    console.error("Error getting contestants:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get contestants",
    } as ApiResponse<null>);
  }
});

/**
 * GET /api/contestants/:id
 * Get contestant by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const contestant = await contestantService.getContestantById(id);

    if (!contestant) {
      return res.status(404).json({
        success: false,
        error: "Contestant not found",
      } as ApiResponse<null>);
    }

    res.json({ success: true, data: contestant } as ApiResponse<typeof contestant>);
  } catch (error) {
    console.error("Error getting contestant:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get contestant",
    } as ApiResponse<null>);
  }
});

/**
 * PUT /api/contestants/:id
 * Update contestant
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const contestant = await contestantService.updateContestant(id, updates);
    res.json({ success: true, data: contestant } as ApiResponse<typeof contestant>);
  } catch (error) {
    console.error("Error updating contestant:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update contestant",
    } as ApiResponse<null>);
  }
});

export default router;

