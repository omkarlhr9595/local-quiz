import type { Socket } from "socket.io";
import type { SocketData, ServerToClientEvents } from "../types.js";
import { gameService } from "../../services/firestore.service.js";

export const handleJoinRoom = async (
  socket: Socket<never, ServerToClientEvents, never, SocketData>,
  gameId: string,
  role: "host" | "contestant",
  contestantId?: string
) => {
  try {
    // Verify game exists
    const game = await gameService.getGameById(gameId);
    if (!game) {
      socket.emit("error", { message: "Game not found" });
      return;
    }

    // Store socket data
    socket.data = {
      gameId,
      role,
      contestantId,
    };

    // Join the room
    await socket.join(gameId);

    // Emit confirmation
    socket.emit("room-joined", { gameId, role });

    console.log(
      `✅ ${role} ${contestantId || ""} joined game ${gameId} (socket: ${socket.id})`
    );
  } catch (error) {
    console.error("Error joining room:", error);
    socket.emit("error", { message: "Failed to join room" });
  }
};

export const handleLeaveRoom = async (
  socket: Socket<never, ServerToClientEvents, never, SocketData>
) => {
  try {
    const { gameId, role, contestantId } = socket.data;

    if (gameId) {
      await socket.leave(gameId);
      console.log(
        `👋 ${role} ${contestantId || ""} left game ${gameId} (socket: ${socket.id})`
      );
    }
  } catch (error) {
    console.error("Error leaving room:", error);
  }
};

