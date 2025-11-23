import type { Socket } from "socket.io";
import type { ServerToClientEvents } from "../types.js";
import { gameService } from "../../services/firestore.service.js";

export const handleBuzzerPress = async (
  socket: Socket<never, ServerToClientEvents>,
  gameId: string,
  contestantId: string,
  timestamp: number
) => {
  try {
    const game = await gameService.getGameById(gameId);
    if (!game) {
      socket.emit("error", { message: "Game not found" });
      return;
    }

    // Check if there's an active question
    if (!game.currentQuestion) {
      socket.emit("error", { message: "No active question" });
      return;
    }

    // Check if game is active
    if (game.status !== "active") {
      socket.emit("error", { message: "Game is not active" });
      return;
    }

    // Check if contestant is already in queue
    const alreadyInQueue = game.buzzerQueue.some(
      (entry) => entry.contestantId === contestantId
    );

    if (alreadyInQueue) {
      socket.emit("error", { message: "Already in buzzer queue" });
      return;
    }

    // Add to queue
    const updatedQueue = [
      ...game.buzzerQueue,
      { contestantId, timestamp },
    ].sort((a, b) => a.timestamp - b.timestamp); // Sort by timestamp (fastest first)

    // Update game state
    const updatedGame = await gameService.updateGame(gameId, {
      buzzerQueue: updatedQueue,
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
      `🔔 Contestant ${contestantId} buzzed in (position ${updatedQueue.length} in queue)`
    );
  } catch (error) {
    console.error("Error handling buzzer press:", error);
    socket.emit("error", { message: "Failed to process buzzer press" });
  }
};

