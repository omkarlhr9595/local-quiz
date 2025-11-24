import axios from "axios";

// Get the backend URL - use environment variable if set, otherwise detect from current hostname
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // In development, use current hostname (works for local network access)
  if (import.meta.env.DEV) {
    const hostname = typeof window !== "undefined" ? window.location.hostname : "localhost";
    return `http://${hostname}:3001/api`;
  }
  
  // Production fallback
  return "http://localhost:3001/api";
};

const API_BASE_URL = getApiBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Quiz API
export const quizApi = {
  create: (data: { name: string; categories: any[] }) =>
    api.post("/quizzes", data),
  update: (id: string, data: { name: string; categories: any[] }) =>
    api.put(`/quizzes/${id}`, data),
  getById: (id: string) => api.get(`/quizzes/${id}`),
  getAll: () => api.get("/quizzes"),
};

// Game API
export const gameApi = {
  create: (quizId: string) => api.post("/games", { quizId }),
  getAll: (quizId?: string) =>
    api.get("/games", { params: quizId ? { quizId } : {} }),
  getById: (id: string) => api.get(`/games/${id}`),
  getActive: () => api.get("/games/active"),
  activate: (id: string) => api.put(`/games/${id}/activate`),
  pause: (id: string, paused: boolean) =>
    api.put(`/games/${id}/pause`, { paused }),
  reset: (id: string) => api.put(`/games/${id}/reset`),
  delete: (id: string) => api.delete(`/games/${id}`),
};

// Contestant API
export const contestantApi = {
  create: (data: FormData) => api.post("/contestants", data),
  getByGameId: (gameId: string) => api.get(`/contestants?gameId=${gameId}`),
  getById: (id: string) => api.get(`/contestants/${id}`),
  update: (id: string, data: any) => api.put(`/contestants/${id}`, data),
  delete: (id: string) => api.delete(`/contestants/${id}`),
};

