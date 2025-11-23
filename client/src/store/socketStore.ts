import { create } from "zustand";
import { Socket } from "socket.io-client";
import { createSocket } from "../lib/socket.js";
import type { ServerToClientEvents, ClientToServerEvents } from "../../../shared/types/index.js";

interface SocketState {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  isConnected: boolean;
  role: "host" | "contestant" | null;
  gameId: string | null;
  contestantId: string | null;

  connect: () => void;
  disconnect: () => void;
  joinRoom: (gameId: string, role: "host" | "contestant", contestantId?: string) => void;
  leaveRoom: () => void;
  setRole: (role: "host" | "contestant" | null) => void;
  setGameId: (gameId: string | null) => void;
  setContestantId: (contestantId: string | null) => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  role: null,
  gameId: null,
  contestantId: null,

  connect: () => {
    const socket = createSocket();
    socket.connect();

    socket.on("connect", () => {
      console.log("✅ Socket connected");
      set({ isConnected: true });
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
      set({ isConnected: false });
    });

    set({ socket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },

  joinRoom: (gameId, role, contestantId) => {
    const { socket } = get();
    if (socket) {
      socket.emit("join-room", { gameId, role, contestantId });
      set({ gameId, role, contestantId: contestantId || null });
    }
  },

  leaveRoom: () => {
    const { socket, gameId } = get();
    if (socket && gameId) {
      socket.emit("leave-room", { gameId });
      set({ gameId: null, role: null, contestantId: null });
    }
  },

  setRole: (role) => set({ role }),
  setGameId: (gameId) => set({ gameId }),
  setContestantId: (contestantId) => set({ contestantId }),
}));

