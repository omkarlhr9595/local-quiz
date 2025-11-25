import type { Socket } from "socket.io";
import type { ServerToClientEvents } from "../types.js";
import { gameService, contestantService } from "../../services/firestore.service.js";

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

      // Mark question as answered and clear current question
      const answeredQuestion = game.currentQuestion
        ? {
            categoryIndex: game.currentQuestion.categoryIndex,
            questionIndex: game.currentQuestion.questionIndex,
          }
        : null;

      const updatedAnsweredQuestions = answeredQuestion
        ? [...(game.answeredQuestions || []), answeredQuestion]
        : game.answeredQuestions || [];

      // Clear current question and reset buzzer queue
      // Keep status as "active" so game can continue
      const updatedGame = await gameService.updateGame(gameId, {
        currentQuestion: null,
        buzzerQueue: [],
        status: "active", // Keep game active so host can select next question
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
        `✅ Contestant ${contestantId} answered correctly! +${points} points`
      );
    } else {
      // Remove first contestant from queue
      const updatedQueue = game.buzzerQueue.filter(
        (entry) => entry.contestantId !== contestantId
      );

      // Check if queue is now empty (all contestants failed to answer)
      if (updatedQueue.length === 0 && game.currentQuestion) {
        // All contestants failed - mark question as answered so it can't be revealed again
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
          `❌ All contestants failed to answer. Question marked as answered and cannot be revealed again.`
        );
      } else {
        // Still have contestants in queue - continue with next contestant
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
    }
  } catch (error) {
    console.error("Error confirming answer:", error);
    socket.emit("error", { message: "Failed to confirm answer" });
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

