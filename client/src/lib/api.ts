import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

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
  pause: (id: string, paused: boolean) =>
    api.put(`/games/${id}/pause`, { paused }),
  reset: (id: string) => api.put(`/games/${id}/reset`),
};

// Contestant API
export const contestantApi = {
  create: (data: FormData) => api.post("/contestants", data),
  getByGameId: (gameId: string) => api.get(`/contestants?gameId=${gameId}`),
  getById: (id: string) => api.get(`/contestants/${id}`),
  update: (id: string, data: any) => api.put(`/contestants/${id}`, data),
  delete: (id: string) => api.delete(`/contestants/${id}`),
};

