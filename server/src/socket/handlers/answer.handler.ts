import type { Socket } from "socket.io";
import type { ServerToClientEvents } from "../types.js";
import { gameService, contestantService, quizService } from "../../services/firestore.service.js";

export const handleHostAnswerConfirm = async (
  socket: Socket<never, ServerToClientEvents>,
  gameId: string,
  contestantId: string,
  isCorrect: boolean,
  points: number
) => {
  try {
    const game = await gameService.getGameById(gameId);
    if (!game) {
      socket.emit("error", { message: "Game not found" });
      return;
    }

    // Broadcast answer result
    socket.to(gameId).emit("answer-result", {
      contestantId,
      isCorrect,
      points: isCorrect ? points : 0,
    });
    socket.emit("answer-result", {
      contestantId,
      isCorrect,
      points: isCorrect ? points : 0,
    });

    if (isCorrect) {
      // Update contestant score
      await contestantService.updateScore(contestantId, points);
      const contestant = await contestantService.getContestantById(contestantId);

      if (contestant) {
        // Broadcast score update
        socket.to(gameId).emit("score-update", {
          contestantId,
          newScore: contestant.score,
        });
        socket.emit("score-update", {
          contestantId,
          newScore: contestant.score,
        });

        // Generate and broadcast leaderboard
        await broadcastLeaderboard(socket, gameId);
      }

      // Clear current question and reset buzzer queue
      await gameService.updateGame(gameId, {
        currentQuestion: null,
        buzzerQueue: [],
        status: "waiting",
      });

      console.log(
        `✅ Contestant ${contestantId} answered correctly! +${points} points`
      );
    } else {
      // Remove first contestant from queue
      const updatedQueue = game.buzzerQueue.filter(
        (entry) => entry.contestantId !== contestantId
      );

      // Update game state
      await gameService.updateGame(gameId, {
        buzzerQueue: updatedQueue,
      });

      // Determine next contestant in queue
      const currentAnswering =
        updatedQueue.length > 0 ? updatedQueue[0].contestantId : null;

      // Broadcast queue update
      socket.to(gameId).emit("buzzer-queue-update", {
        queue: updatedQueue,
        currentAnswering,
      });
      socket.emit("buzzer-queue-update", {
        queue: updatedQueue,
        currentAnswering,
      });

      console.log(
        `❌ Contestant ${contestantId} answered incorrectly. Next in queue.`
      );
    }
  } catch (error) {
    console.error("Error confirming answer:", error);
    socket.emit("error", { message: "Failed to confirm answer" });
  }
};

const broadcastLeaderboard = async (
  socket: Socket<never, ServerToClientEvents>,
  gameId: string
) => {
  try {
    const contestants = await contestantService.getContestantsByGameId(gameId);

    // Sort by score (descending)
    const sorted = contestants
      .map((c, index) => ({
        contestantId: c.id,
        name: c.name,
        photoUrl: c.photoUrl,
        score: c.score,
        position: index + 1,
      }))
      .sort((a, b) => b.score - a.score)
      .map((c, index) => ({ ...c, position: index + 1 }));

    // Broadcast leaderboard
    socket.to(gameId).emit("leaderboard-update", {
      leaderboard: sorted,
    });
    socket.emit("leaderboard-update", {
      leaderboard: sorted,
    });
  } catch (error) {
    console.error("Error broadcasting leaderboard:", error);
  }
};

