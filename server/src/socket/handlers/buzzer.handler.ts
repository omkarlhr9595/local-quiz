import type { Socket } from "socket.io";
import type { ServerToClientEvents } from "../types.js";
import { db } from "../../config/firebase.js";

export const handleBuzzerPress = async (
  socket: Socket<never, ServerToClientEvents>,
  gameId: string,
  contestantId: string,
  timestamp: number
) => {
  try {
    // Use a transaction to ensure atomic queue updates and prevent race conditions
    const updatedQueue = await db.runTransaction(async (transaction) => {
      const gameRef = db.collection("games").doc(gameId);
      const gameDoc = await transaction.get(gameRef);

      if (!gameDoc.exists) {
        throw new Error("Game not found");
      }

      const gameData = gameDoc.data()!;

      // Check if there's an active question
      if (!gameData.currentQuestion) {
        throw new Error("No active question");
      }

      // Check if game is active
      if (gameData.status !== "active") {
        throw new Error("Game is not active");
      }

      // Get current buzzer queue
      const currentQueue = (gameData.buzzerQueue || []) as Array<{
        contestantId: string;
        timestamp: number;
      }>;

      // Check if contestant is already in queue
      const alreadyInQueue = currentQueue.some(
        (entry) => entry.contestantId === contestantId
      );

      if (alreadyInQueue) {
        throw new Error("Already in buzzer queue");
      }

      // Add to queue and sort by timestamp (fastest first)
      const updatedQueue = [...currentQueue, { contestantId, timestamp }].sort(
        (a, b) => a.timestamp - b.timestamp
      );

      // Update game state atomically within transaction
      transaction.update(gameRef, {
        buzzerQueue: updatedQueue,
        updatedAt: new Date().toISOString(),
      });

      return updatedQueue;
    });

    // Determine who's currently answering (first in queue)
    const currentAnswering =
      updatedQueue.length > 0 ? updatedQueue[0].contestantId : null;

    // Broadcast queue update to all in room
    socket.to(gameId).emit("buzzer-queue-update", {
      queue: updatedQueue,
      currentAnswering,
    });
    socket.emit("buzzer-queue-update", {
      queue: updatedQueue,
      currentAnswering,
    });

    console.log(
      `🔔 Contestant ${contestantId} buzzed in (position ${updatedQueue.findIndex((q) => q.contestantId === contestantId) + 1} in queue)`
    );
  } catch (error) {
    console.error("Error handling buzzer press:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to process buzzer press";
    socket.emit("error", { message: errorMessage });
  }
};
