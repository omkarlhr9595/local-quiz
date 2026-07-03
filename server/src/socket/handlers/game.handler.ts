import type { Socket } from "socket.io";
import type { ServerToClientEvents } from "../types.js";
import { gameService } from "../../services/firestore.service.js";

export const handleGamePause = async (
  socket: Socket<never, ServerToClientEvents>,
  gameId: string
) => {
  try {
    const game = await gameService.updateGame(gameId, { status: "paused" });

    socket.to(gameId).emit("game-state-change", { status: game.status });
    socket.emit("game-state-change", { status: game.status });
  } catch (error) {
    console.error("Error pausing game:", error);
    socket.emit("error", { message: "Failed to pause game" });
  }
};

export const handleGameResume = async (
  socket: Socket<never, ServerToClientEvents>,
  gameId: string
) => {
  try {
    const game = await gameService.updateGame(gameId, { status: "active" });

    socket.to(gameId).emit("game-state-change", { status: game.status });
    socket.emit("game-state-change", { status: game.status });
  } catch (error) {
    console.error("Error resuming game:", error);
    socket.emit("error", { message: "Failed to resume game" });
  }
};

export const handleGameReset = async (
  socket: Socket<never, ServerToClientEvents>,
  gameId: string
) => {
  try {
    const game = await gameService.updateGame(gameId, {
      status: "waiting",
      currentQuestion: null,
      buzzerQueue: [],
    });

    socket.to(gameId).emit("game-state-change", { status: game.status });
    socket.emit("game-state-change", { status: game.status });
  } catch (error) {
    console.error("Error resetting game:", error);
    socket.emit("error", { message: "Failed to reset game" });
  }
};

