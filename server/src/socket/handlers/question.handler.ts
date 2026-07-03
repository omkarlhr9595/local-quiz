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

    const isAlreadyAnswered = (game.answeredQuestions || []).some(
      (aq) => aq.categoryIndex === categoryIndex && aq.questionIndex === questionIndex
    );

    if (isAlreadyAnswered) {
      socket.emit("error", { message: "This question has already been answered" });
      return;
    }

    await gameService.updateGame(gameId, {
      currentQuestion: {
        categoryIndex,
        questionIndex,
        points: question.points,
        question: question.question,
        answer: question.answer,
        imageUrl: question.imageUrl,
        type: question.type,
        options: question.options,
        correctOptionId: question.correctOptionId,
      },
      buzzerQueue: [],
      status: "active",
    });

    // Build public payload (no correctOptionId leak)
    const publicPayload = {
      question: question.question,
      points: question.points,
      category: category.name,
      imageUrl: question.imageUrl,
      type: question.type,
      options: question.options, // id+text only, no correctness
    };

    // Build host payload (includes correctOptionId for host-only view)
    const hostPayload = {
      ...publicPayload,
      correctOptionId: question.correctOptionId,
    };

    socket.to(gameId).emit("question-revealed", publicPayload);
    socket.emit("question-revealed", hostPayload);

    socket.to(gameId).emit("buzzer-queue-update", {
      queue: [],
      currentAnswering: null,
    });
    socket.emit("buzzer-queue-update", {
      queue: [],
      currentAnswering: null,
    });
  } catch (error) {
    console.error("Error revealing question:", error);
    socket.emit("error", { message: "Failed to reveal question" });
  }
};

export const handleHostRevealMcqAnswer = async (
  socket: Socket<never, ServerToClientEvents>,
  gameId: string
) => {
  try {
    const game = await gameService.getGameById(gameId);
    if (!game) {
      socket.emit("error", { message: "Game not found" });
      return;
    }

    if (!game.currentQuestion || !game.currentQuestion.correctOptionId) {
      socket.emit("error", { message: "No MCQ question currently revealed" });
      return;
    }

    socket.to(gameId).emit("mcq-answer-revealed", {
      correctOptionId: game.currentQuestion.correctOptionId,
    });
    socket.emit("mcq-answer-revealed", {
      correctOptionId: game.currentQuestion.correctOptionId,
    });
  } catch (error) {
    console.error("Error revealing MCQ answer:", error);
    socket.emit("error", { message: "Failed to reveal MCQ answer" });
  }
};
