import { io, Socket } from "socket.io-client";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
} from "../../../shared/types/index.js";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";

export const createSocket = (): Socket<ServerToClientEvents, ClientToServerEvents> => {
  return io(SOCKET_URL, {
    transports: ["websocket"],
    autoConnect: false,
  });
};

