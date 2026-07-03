import type { Socket } from "socket.io";
import type { ServerToClientEvents } from "../types.js";
import { contestantService } from "../../services/firestore.service.js";

export const handleDeductScore = async (
  socket: Socket<never, ServerToClientEvents>,
  gameId: string,
  contestantId: string,
  amount: number
) => {
  try {
    const contestant = await contestantService.getContestantById(contestantId);
    if (!contestant) {
      socket.emit("error", { message: "Contestant not found" });
      return;
    }

    const newScore = Math.max(0, contestant.score - amount);
    await contestantService.updateContestant(contestantId, { score: newScore });

    socket.to(gameId).emit("score-update", {
      contestantId,
      newScore,
      action: "deduct",
      isManual: true,
    });
    socket.emit("score-update", {
      contestantId,
      newScore,
      action: "deduct",
      isManual: true,
    });
  } catch (error) {
    console.error("Error deducting score:", error);
    socket.emit("error", { message: "Failed to deduct score" });
  }
};

export const handleAwardScore = async (
  socket: Socket<never, ServerToClientEvents>,
  gameId: string,
  contestantId: string,
  amount: number
) => {
  try {
    const contestant = await contestantService.getContestantById(contestantId);
    if (!contestant) {
      socket.emit("error", { message: "Contestant not found" });
      return;
    }

    const newScore = contestant.score + amount;
    await contestantService.updateContestant(contestantId, { score: newScore });

    socket.to(gameId).emit("score-update", {
      contestantId,
      newScore,
      action: "award",
      isManual: true,
    });
    socket.emit("score-update", {
      contestantId,
      newScore,
      action: "award",
      isManual: true,
    });
  } catch (error) {
    console.error("Error awarding score:", error);
    socket.emit("error", { message: "Failed to award score" });
  }
};
