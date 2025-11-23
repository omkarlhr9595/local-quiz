import type { Socket } from "socket.io";
import type { ServerToClientEvents } from "../types.js";
import { gameService, quizService } from "../../services/firestore.service.js";

export const handleSelectQuestion = async (
  socket: Socket<never, ServerToClientEvents>,
  gameId: string,
  categoryIndex: number,
  questionIndex: number,
  contestantId: string
) => {
  try {
    const game = await gameService.getGameById(gameId);
    if (!game) {
      socket.emit("error", { message: "Game not found" });
      return;
    }

    // Broadcast to all in room (especially host)
    socket.to(gameId).emit("question-selected", {
      categoryIndex,
      questionIndex,
      contestantId,
    });

    console.log(
      `❓ Contestant ${contestantId} selected question: Category ${categoryIndex}, Question ${questionIndex}`
    );
  } catch (error) {
    console.error("Error selecting question:", error);
    socket.emit("error", { message: "Failed to select question" });
  }
};

export const handleHostRevealQuestion = async (
  socket: Socket<never, ServerToClientEvents>,
  gameId: string,
  categoryIndex: number,
  questionIndex: number
) => {
  try {
    const game = await gameService.getGameById(gameId);
    if (!game) {
      socket.emit("error", { message: "Game not found" });
      return;
    }

    const quiz = await quizService.getQuizById(game.quizId);
    if (!quiz) {
      socket.emit("error", { message: "Quiz not found" });
      return;
    }

    const category = quiz.categories[categoryIndex];
    if (!category) {
      socket.emit("error", { message: "Category not found" });
      return;
    }

    const question = category.questions[questionIndex];
    if (!question) {
      socket.emit("error", { message: "Question not found" });
      return;
    }

    // Update game state
    await gameService.updateGame(gameId, {
      currentQuestion: {
        categoryIndex,
        questionIndex,
        points: question.points,
        question: question.question,
        answer: question.answer,
      },
      buzzerQueue: [], // Reset buzzer queue for new question
      status: "active",
    });

    // Broadcast to all in room
    socket.to(gameId).emit("question-revealed", {
      question: question.question,
      points: question.points,
      category: category.name,
    });
    socket.emit("question-revealed", {
      question: question.question,
      points: question.points,
      category: category.name,
    });

    console.log(
      `📢 Host revealed question: ${category.name} - ${question.points} points`
    );
  } catch (error) {
    console.error("Error revealing question:", error);
    socket.emit("error", { message: "Failed to reveal question" });
  }
};

