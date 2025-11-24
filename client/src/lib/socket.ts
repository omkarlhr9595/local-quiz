import { io, Socket } from "socket.io-client";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
} from "../../../shared/types/index.js";

// Get the socket URL - use environment variable if set, otherwise detect from current hostname
const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  
  // In development, use current hostname (works for local network access)
  if (import.meta.env.DEV) {
    const hostname = typeof window !== "undefined" ? window.location.hostname : "localhost";
    return `http://${hostname}:3001`;
  }
  
  // Production fallback
  return "http://localhost:3001";
};

const SOCKET_URL = getSocketUrl();

export const createSocket = (): Socket<ServerToClientEvents, ClientToServerEvents> => {
  return io(SOCKET_URL, {
    transports: ["websocket"],
    autoConnect: false,
  });
};

