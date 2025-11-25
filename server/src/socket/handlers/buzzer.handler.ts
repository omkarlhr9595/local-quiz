import type { Socket } from "socket.io";
import type { ServerToClientEvents } from "../types.js";
import { db } from "../../config/firebase.js";

export const handleBuzzerPress = async (
  socket: Socket<never, ServerToClientEvents>,
  gameId: string,
  contestantId: string,
  timestamp: number // Client timestamp - when contestant actually pressed
) => {
  try {
    const serverReceivedAt = Date.now();
    const networkDelay = serverReceivedAt - timestamp;

    // Validate timestamp - should be within reasonable bounds (not more than 5 seconds in the past or future)
    // This helps catch clock skew issues
    if (Math.abs(networkDelay) > 5000) {
      console.warn(
        `[BUZZER] Suspicious timestamp for contestant ${contestantId}: network delay is ${networkDelay}ms (client clock may be skewed)`
      );
      // Still process it, but log the warning
    }

    // Use a transaction to ensure atomic queue updates and prevent race conditions
    // Firestore transactions automatically retry on conflicts, ensuring all buzzer presses are processed
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

      console.log(
        `[BUZZER] Contestant ${contestantId} - Client timestamp: ${timestamp}, Server received: ${serverReceivedAt}, Network delay: ${networkDelay}ms, Current queue size: ${currentQueue.length}`
      );

      // Check if contestant is already in queue
      const alreadyInQueue = currentQueue.some(
        (entry) => entry.contestantId === contestantId
      );

      if (alreadyInQueue) {
        throw new Error("Already in buzzer queue");
      }

      // Add to queue using CLIENT timestamp (when they actually pressed)
      // Sort by timestamp (fastest first) - this ensures fairness based on actual press time
      const updatedQueue = [...currentQueue, { contestantId, timestamp }].sort(
        (a, b) => {
          // Primary sort: by timestamp (earliest first)
          if (a.timestamp !== b.timestamp) {
            return a.timestamp - b.timestamp;
          }
          // Tiebreaker: if timestamps are identical (unlikely but possible), use contestantId for deterministic ordering
          return a.contestantId.localeCompare(b.contestantId);
        }
      );

      console.log(
        `[BUZZER] Updated queue after adding ${contestantId}:`,
        updatedQueue.map((q) => ({
          id: q.contestantId,
          ts: q.timestamp,
          pos: updatedQueue.findIndex((e) => e.contestantId === q.contestantId) + 1,
        }))
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
