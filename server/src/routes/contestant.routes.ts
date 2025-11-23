import { Router } from "express";
import upload from "../config/multer.js";
import { contestantService } from "../services/firestore.service.js";
import { uploadContestantPhoto } from "../services/storage.service.js";
import { v4 as uuidv4 } from "uuid";
import type { ApiResponse } from "../../../shared/types/index.js";

const router = Router();

/**
 * POST /api/contestants
 * Create a new contestant (photo is optional)
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

    // Check if contestant with same gameId and route already exists
    const existingContestants = await contestantService.getContestantsByGameId(gameId);
    const existingContestant = existingContestants.find((c) => c.route === route);
    
    if (existingContestant) {
      // Update existing contestant instead of creating duplicate
      console.log("Contestant with same route already exists, updating:", existingContestant.id);
      
      let photoUrl = existingContestant.photoUrl || "";
      
      // Upload new photo if provided
      if (file) {
        try {
          photoUrl = await uploadContestantPhoto({
            file,
            gameId,
            contestantId: existingContestant.id,
          });
        } catch (photoError) {
          console.error("Error uploading photo:", photoError);
          // Keep existing photo if upload fails
        }
      }
      
      // Update existing contestant
      const updatedContestant = await contestantService.updateContestant(existingContestant.id, {
        name,
        photoUrl,
      });
      
      return res
        .status(200)
        .json({ success: true, data: updatedContestant } as ApiResponse<typeof updatedContestant>);
    }

    // Generate contestant ID for new contestant
    const contestantId = uuidv4();
    let photoUrl = "";

    // Upload photo if provided
    if (file) {
      try {
        photoUrl = await uploadContestantPhoto({
          file,
          gameId,
          contestantId,
        });
      } catch (photoError) {
        console.error("Error uploading photo:", photoError);
        // Continue without photo if upload fails
        photoUrl = "";
      }
    }

    // Create new contestant (with or without photo)
    const contestant = await contestantService.createContestant({
      name,
      gameId,
      route,
      photoUrl,
      score: 0,
    });

    return res
      .status(201)
      .json({ success: true, data: contestant } as ApiResponse<typeof contestant>);
  } catch (error) {
    console.error("Error creating contestant:", error);
    return res.status(500).json({
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
    return res.status(400).json({
      success: false,
      error: "gameId query parameter is required",
    } as ApiResponse<null>);
  } catch (error) {
    console.error("Error getting contestants:", error);
    return res.status(500).json({
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

    return res.json({ success: true, data: contestant } as ApiResponse<typeof contestant>);
  } catch (error) {
    console.error("Error getting contestant:", error);
    return res.status(500).json({
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
    return res.json({ success: true, data: contestant } as ApiResponse<typeof contestant>);
  } catch (error) {
    console.error("Error updating contestant:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to update contestant",
    } as ApiResponse<null>);
  }
});

/**
 * DELETE /api/contestants/:id
 * Delete contestant
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await contestantService.deleteContestant(id);
    return res.json({ success: true, data: null } as ApiResponse<null>);
  } catch (error) {
    console.error("Error deleting contestant:", error);
    if (error instanceof Error && error.message === "Contestant not found") {
      return res.status(404).json({
        success: false,
        error: "Contestant not found",
      } as ApiResponse<null>);
    }
    return res.status(500).json({
      success: false,
      error: "Failed to delete contestant",
    } as ApiResponse<null>);
  }
});

export default router;

