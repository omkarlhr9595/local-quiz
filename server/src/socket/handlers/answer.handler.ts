import type { Socket } from "socket.io";
import type { ServerToClientEvents } from "../types.js";
import { gameService, contestantService } from "../../services/firestore.service.js";
import { db } from "../../config/firebase.js";

export const handleHostAnswerConfirm = async (
  socket: Socket<never, ServerToClientEvents>,
  gameId: string,
  contestantId: string,
  isCorrect: boolean,
  points: number
) => {
  try {
    // Use transaction to ensure atomic queue updates and prevent race conditions
    const result = await db.runTransaction(async (transaction) => {
      const gameRef = db.collection("games").doc(gameId);
      const gameDoc = await transaction.get(gameRef);

      if (!gameDoc.exists) {
        throw new Error("Game not found");
      }

      const game = gameDoc.data()!;

      // Validate that there's a current question
      if (!game.currentQuestion) {
        throw new Error("No active question");
      }

      // CRITICAL: Validate that the contestant is actually first in the queue
      const buzzerQueue = (game.buzzerQueue || []) as Array<{
        contestantId: string;
        timestamp: number;
      }>;

      if (buzzerQueue.length === 0) {
        throw new Error("Buzzer queue is empty");
      }

      const firstInQueue = buzzerQueue[0].contestantId;
      if (firstInQueue !== contestantId) {
        throw new Error(
          `Contestant ${contestantId} is not first in queue. First is ${firstInQueue}`
        );
      }

      // Broadcast answer result (outside transaction to avoid blocking)
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
        // Update contestant score (outside transaction)
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

        // Mark question as answered and clear current question
        const answeredQuestion = {
          categoryIndex: game.currentQuestion.categoryIndex,
          questionIndex: game.currentQuestion.questionIndex,
        };

        const updatedAnsweredQuestions = [
          ...(game.answeredQuestions || []),
          answeredQuestion,
        ];

        // Clear current question and reset buzzer queue atomically
        transaction.update(gameRef, {
          currentQuestion: null,
          buzzerQueue: [],
          status: "active",
          answeredQuestions: updatedAnsweredQuestions,
          updatedAt: new Date().toISOString(),
        });

        console.log(
          `✅ Contestant ${contestantId} answered correctly! +${points} points`
        );

        return { type: "correct", queue: [] };
      } else {
        // Remove first contestant from queue atomically
        const updatedQueue = buzzerQueue.filter(
          (entry) => entry.contestantId !== contestantId
        );

        // Check if queue is now empty (all contestants failed to answer)
        if (updatedQueue.length === 0) {
          // All contestants failed - mark question as answered
          const answeredQuestion = {
            categoryIndex: game.currentQuestion.categoryIndex,
            questionIndex: game.currentQuestion.questionIndex,
          };

          const updatedAnsweredQuestions = [
            ...(game.answeredQuestions || []),
            answeredQuestion,
          ];

          // Clear current question and mark as answered atomically
          transaction.update(gameRef, {
            currentQuestion: null,
            buzzerQueue: [],
            status: "active",
            answeredQuestions: updatedAnsweredQuestions,
            updatedAt: new Date().toISOString(),
          });

          console.log(
            `❌ All contestants failed to answer. Question marked as answered and cannot be revealed again.`
          );

          return { type: "all_failed", queue: [] };
        } else {
          // Still have contestants in queue - continue with next contestant
          // Ensure queue is still sorted (should be, but double-check)
          const sortedQueue = updatedQueue.sort((a, b) => a.timestamp - b.timestamp);

          // Update game state atomically
          transaction.update(gameRef, {
            buzzerQueue: sortedQueue,
            updatedAt: new Date().toISOString(),
          });

          const currentAnswering: string | null =
            sortedQueue.length > 0 ? sortedQueue[0].contestantId : null;

          console.log(
            `❌ Contestant ${contestantId} answered incorrectly. Next in queue: ${currentAnswering || "none"}`
          );

          return { type: "incorrect" as const, queue: sortedQueue, currentAnswering };
        }
      }
    });

    // After transaction completes, broadcast updates
    if (result.type === "correct" || result.type === "all_failed") {
      // Reload game to get updated state
      const updatedGame = await gameService.getGameById(gameId);
      if (updatedGame) {
        // Broadcast game state update so frontend can update the grid
        socket.to(gameId).emit("game-update", {
          game: updatedGame,
        });
        socket.emit("game-update", {
          game: updatedGame,
        });
      }

      // Broadcast queue update to clear buzzer queue on all clients
      socket.to(gameId).emit("buzzer-queue-update", {
        queue: [],
        currentAnswering: null,
      });
      socket.emit("buzzer-queue-update", {
        queue: [],
        currentAnswering: null,
      });
    } else if (result.type === "incorrect") {
      // Broadcast queue update with remaining contestants
      socket.to(gameId).emit("buzzer-queue-update", {
        queue: result.queue,
        currentAnswering: result.currentAnswering || null,
      });
      socket.emit("buzzer-queue-update", {
        queue: result.queue,
        currentAnswering: result.currentAnswering || null,
      });
    }
  } catch (error) {
    console.error("Error confirming answer:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to confirm answer";
    socket.emit("error", { message: errorMessage });
  }
};

export const handleHostMarkQuestionDone = async (
  socket: Socket<never, ServerToClientEvents>,
  gameId: string
) => {
  try {
    const game = await gameService.getGameById(gameId);
    if (!game) {
      socket.emit("error", { message: "Game not found" });
      return;
    }

    // Check if there's a current question
    if (!game.currentQuestion) {
      socket.emit("error", { message: "No active question to mark as done" });
      return;
    }

    // Mark question as answered
    const answeredQuestion = {
      categoryIndex: game.currentQuestion.categoryIndex,
      questionIndex: game.currentQuestion.questionIndex,
    };

    const updatedAnsweredQuestions = [
      ...(game.answeredQuestions || []),
      answeredQuestion,
    ];

    // Clear current question and mark as answered
    const updatedGame = await gameService.updateGame(gameId, {
      currentQuestion: null,
      buzzerQueue: [],
      status: "active",
      answeredQuestions: updatedAnsweredQuestions,
    });

    // Broadcast game state update so frontend can update the grid
    socket.to(gameId).emit("game-update", {
      game: updatedGame,
    });
    socket.emit("game-update", {
      game: updatedGame,
    });

    // Broadcast queue update to clear buzzer queue on all clients
    socket.to(gameId).emit("buzzer-queue-update", {
      queue: [],
      currentAnswering: null,
    });
    socket.emit("buzzer-queue-update", {
      queue: [],
      currentAnswering: null,
    });

    console.log(
      `✅ Host marked question as done. Question cannot be revealed again.`
    );
  } catch (error) {
    console.error("Error marking question as done:", error);
    socket.emit("error", { message: "Failed to mark question as done" });
  }
};

export const handleHostManualAwardPoints = async (
  socket: Socket<never, ServerToClientEvents>,
  gameId: string,
  categoryIndex: number,
  questionIndex: number,
  contestantId: string,
  points: number
) => {
  try {
    const game = await gameService.getGameById(gameId);
    if (!game) {
      socket.emit("error", { message: "Game not found" });
      return;
    }

    // Verify the question is in answeredQuestions
    const isAnswered = (game.answeredQuestions || []).some(
      (aq) => aq.categoryIndex === categoryIndex && aq.questionIndex === questionIndex
    );

    if (!isAnswered) {
      socket.emit("error", { message: "Question must be answered before points can be awarded" });
      return;
    }

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

    console.log(
      `✅ Host manually awarded ${points} points to contestant ${contestantId} for question ${categoryIndex}-${questionIndex}`
    );
  } catch (error) {
    console.error("Error manually awarding points:", error);
    socket.emit("error", { message: "Failed to award points" });
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

