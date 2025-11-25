import type { Socket } from "socket.io";
import type { ServerToClientEvents } from "../types.js";
import { db } from "../../config/firebase.js";

export const handleBuzzerPress = async (
  socket: Socket<never, ServerToClientEvents>,
  gameId: string,
  contestantId: string,
  clientTimestamp: number // Client timestamp (kept for logging/debugging, but NOT used for ordering)
) => {
  // CRITICAL: Use server-side timestamp for queue ordering to prevent clock skew issues
  // The server timestamp is captured IMMEDIATELY when the request is received,
  // ensuring fair ordering based on when requests actually arrive at the server
  const serverTimestamp = Date.now();
  
  // Generate unique request ID for tracking this buzzer press through the entire flow
  const requestId = `${contestantId}-${serverTimestamp}-${Math.random().toString(36).substr(2, 9)}`;
  const networkDelay = serverTimestamp - clientTimestamp;

  console.log(`\n[BUZZER] ========== REQUEST START [${requestId}] ==========`);
  console.log(`[BUZZER] Contestant: ${contestantId}`);
  console.log(`[BUZZER] Client timestamp: ${clientTimestamp} (${new Date(clientTimestamp).toISOString()})`);
  console.log(`[BUZZER] Server timestamp (USED FOR ORDERING): ${serverTimestamp} (${new Date(serverTimestamp).toISOString()})`);
  console.log(`[BUZZER] Network delay: ${networkDelay}ms`);
  console.log(`[BUZZER] Game ID: ${gameId}`);

  // Warn if client clock is significantly skewed (more than 1 second difference)
  if (Math.abs(networkDelay) > 1000) {
    console.warn(
      `[BUZZER] ⚠️  [${requestId}] Client clock skew detected: ${networkDelay}ms difference. Using server timestamp for fairness.`
    );
  }

  try {
    let transactionAttempts = 0;
    // Use a transaction to ensure atomic queue updates and prevent race conditions
    // Firestore transactions automatically retry on conflicts, ensuring all buzzer presses are processed
    const updatedQueue = await db.runTransaction(async (transaction) => {
      transactionAttempts++;
      console.log(`[BUZZER] [${requestId}] Transaction attempt #${transactionAttempts}`);

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

      console.log(`[BUZZER] [${requestId}] Current queue BEFORE update (size: ${currentQueue.length}):`);
      if (currentQueue.length > 0) {
        currentQueue.forEach((entry, index) => {
          const timeDiff = serverTimestamp - entry.timestamp;
          console.log(
            `[BUZZER]   [${index + 1}] Contestant: ${entry.contestantId}, Server timestamp: ${entry.timestamp} (${new Date(entry.timestamp).toISOString()}), Time diff from new: ${timeDiff}ms`
          );
        });
      } else {
        console.log(`[BUZZER]   Queue is empty`);
      }

      // Check if contestant is already in queue
      const alreadyInQueue = currentQueue.some(
        (entry) => entry.contestantId === contestantId
      );

      if (alreadyInQueue) {
        console.log(`[BUZZER] [${requestId}] ❌ Contestant ${contestantId} is already in queue`);
        throw new Error("Already in buzzer queue");
      }

      // CRITICAL FIX: Use SERVER timestamp for queue ordering to prevent clock skew issues
      // This ensures fair ordering based on when requests arrive at the server,
      // not when clients think they pressed (which can be affected by clock differences)
      const queueBeforeSort = [...currentQueue, { contestantId, timestamp: serverTimestamp }];
      console.log(`[BUZZER] [${requestId}] Queue before sort (size: ${queueBeforeSort.length}):`);
      queueBeforeSort.forEach((entry, index) => {
        console.log(
          `[BUZZER]   [${index}] Contestant: ${entry.contestantId}, Server timestamp: ${entry.timestamp}`
        );
      });

      const updatedQueue = queueBeforeSort.sort((a, b) => {
        // Primary sort: by server timestamp (earliest first)
        // This ensures fairness - whoever's request arrives first gets priority
        if (a.timestamp !== b.timestamp) {
          return a.timestamp - b.timestamp;
        }
        // Tiebreaker: if timestamps are identical (unlikely but possible), use contestantId for deterministic ordering
        return a.contestantId.localeCompare(b.contestantId);
      });

      console.log(`[BUZZER] [${requestId}] Queue AFTER sort (size: ${updatedQueue.length}):`);
      updatedQueue.forEach((entry, index) => {
        const isNewEntry = entry.contestantId === contestantId;
        const marker = isNewEntry ? " ⭐ NEW" : "";
        console.log(
          `[BUZZER]   [${index + 1}]${marker} Contestant: ${entry.contestantId}, Server timestamp: ${entry.timestamp} (${new Date(entry.timestamp).toISOString()})`
        );
      });

      const newPosition = updatedQueue.findIndex((q) => q.contestantId === contestantId) + 1;
      console.log(`[BUZZER] [${requestId}] ✅ Contestant ${contestantId} will be at position ${newPosition} in queue`);

      // Update game state atomically within transaction
      transaction.update(gameRef, {
        buzzerQueue: updatedQueue,
        updatedAt: new Date().toISOString(),
      });

      console.log(`[BUZZER] [${requestId}] Transaction update committed`);

      return updatedQueue;
    });

    if (transactionAttempts > 1) {
      console.log(`[BUZZER] [${requestId}] ⚠️  Transaction required ${transactionAttempts} attempts (retries due to conflicts)`);
    }

    // Determine who's currently answering (first in queue)
    const currentAnswering =
      updatedQueue.length > 0 ? updatedQueue[0].contestantId : null;

    const finalPosition = updatedQueue.findIndex((q) => q.contestantId === contestantId) + 1;

    console.log(`[BUZZER] [${requestId}] Broadcasting queue update to all clients`);
    console.log(`[BUZZER] [${requestId}] Final queue state:`);
    updatedQueue.forEach((entry, index) => {
      console.log(
        `[BUZZER]   [${index + 1}] Contestant: ${entry.contestantId}, Timestamp: ${entry.timestamp}`
      );
    });
    console.log(`[BUZZER] [${requestId}] Current answering: ${currentAnswering || "none"}`);
    console.log(`[BUZZER] [${requestId}] Contestant ${contestantId} final position: ${finalPosition}`);

    // Broadcast queue update to all in room
    socket.to(gameId).emit("buzzer-queue-update", {
      queue: updatedQueue,
      currentAnswering,
    });
    socket.emit("buzzer-queue-update", {
      queue: updatedQueue,
      currentAnswering,
    });

    console.log(`[BUZZER] ========== REQUEST COMPLETE [${requestId}] ==========\n`);
  } catch (error) {
    console.error(`[BUZZER] [${requestId}] ❌ ERROR:`, error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to process buzzer press";
    socket.emit("error", { message: errorMessage });
    console.log(`[BUZZER] ========== REQUEST FAILED [${requestId}] ==========\n`);
  }
};
