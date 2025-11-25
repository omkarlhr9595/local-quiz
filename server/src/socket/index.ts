import type { Server } from "socket.io";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  SocketData,
} from "./types.js";
import { handleJoinRoom, handleLeaveRoom } from "./handlers/room.handler.js";
import { handleSelectQuestion, handleHostRevealQuestion } from "./handlers/question.handler.js";
import { handleBuzzerPress } from "./handlers/buzzer.handler.js";
import { handleHostAnswerConfirm, handleHostMarkQuestionDone } from "./handlers/answer.handler.js";
import {
  handleGamePause,
  handleGameResume,
  handleGameReset,
} from "./handlers/game.handler.js";

export const setupSocketIO = (io: Server) => {
  io.on("connection", (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Room Management
    socket.on("join-room", async (payload) => {
      await handleJoinRoom(
        socket,
        payload.gameId,
        payload.role,
        payload.contestantId
      );
    });

    socket.on("leave-room", async (payload) => {
      await handleLeaveRoom(socket);
    });

    // Question Flow
    socket.on("select-question", async (payload) => {
      const { gameId, role } = socket.data;
      if (!gameId) {
        socket.emit("error", { message: "Not in a room" });
        return;
      }

      await handleSelectQuestion(
        socket,
        payload.gameId,
        payload.categoryIndex,
        payload.questionIndex,
        payload.contestantId
      );
    });

    socket.on("host-reveal-question", async (payload) => {
      const { gameId, role } = socket.data;
      if (!gameId || role !== "host") {
        socket.emit("error", { message: "Only host can reveal questions" });
        return;
      }

      await handleHostRevealQuestion(
        socket,
        payload.gameId,
        payload.categoryIndex,
        payload.questionIndex
      );
    });

    // Buzzer System
    socket.on("buzzer-press", async (payload) => {
      const { gameId } = socket.data;
      if (!gameId) {
        socket.emit("error", { message: "Not in a room" });
        return;
      }

      await handleBuzzerPress(
        socket,
        payload.gameId,
        payload.contestantId,
        payload.timestamp
      );
    });

    // Answer Evaluation
    socket.on("host-answer-confirm", async (payload) => {
      const { gameId, role } = socket.data;
      if (!gameId || role !== "host") {
        socket.emit("error", { message: "Only host can confirm answers" });
        return;
      }

      await handleHostAnswerConfirm(
        socket,
        payload.gameId,
        payload.contestantId,
        payload.isCorrect,
        payload.points
      );
    });

    socket.on("host-mark-question-done", async (payload) => {
      const { gameId, role } = socket.data;
      if (!gameId || role !== "host") {
        socket.emit("error", { message: "Only host can mark questions as done" });
        return;
      }

      await handleHostMarkQuestionDone(socket, payload.gameId);
    });

    // Game Controls
    socket.on("game-pause", async (payload) => {
      const { gameId, role } = socket.data;
      if (!gameId || role !== "host") {
        socket.emit("error", { message: "Only host can pause game" });
        return;
      }

      await handleGamePause(socket, payload.gameId);
    });

    socket.on("game-resume", async (payload) => {
      const { gameId, role } = socket.data;
      if (!gameId || role !== "host") {
        socket.emit("error", { message: "Only host can resume game" });
        return;
      }

      await handleGameResume(socket, payload.gameId);
    });

    socket.on("game-reset", async (payload) => {
      const { gameId, role } = socket.data;
      if (!gameId || role !== "host") {
        socket.emit("error", { message: "Only host can reset game" });
        return;
      }

      await handleGameReset(socket, payload.gameId);
    });

    // Main Monitor Controls
    socket.on("main-monitor-view", async (payload) => {
      const { gameId, role } = socket.data;
      if (!gameId || role !== "host") {
        socket.emit("error", { message: "Only host can control main monitor" });
        return;
      }

      // Broadcast view change to all clients in the room
      io.to(gameId).emit("main-monitor-view", { view: payload.view });
    });

    socket.on("main-monitor-sound", async (payload) => {
      const { gameId, role } = socket.data;
      if (!gameId || role !== "host") {
        socket.emit("error", { message: "Only host can control main monitor" });
        return;
      }

      // Broadcast sound setting to all clients in the room
      // This could be used to mute/unmute sounds on the main monitor
      io.to(gameId).emit("main-monitor-sound", { muted: payload.muted });
    });

    // Disconnect
    socket.on("disconnect", async () => {
      await handleLeaveRoom(socket);
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  console.log("✅ Socket.io handlers registered");
};

