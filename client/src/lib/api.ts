import axios from "axios";
import type { Category } from "../../../shared/types/index.js";

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

// Request interceptor to remove Content-Type for FormData so axios can set it automatically
api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    // Remove Content-Type header to let axios set it automatically with boundary
    if (config.headers) {
      delete (config.headers as any)["Content-Type"];
    }
  }
  return config;
});

// Quiz API
export const quizApi = {
  create: (data: { name: string; categories: Category[] }) =>
    api.post("/quizzes", data),
  update: (id: string, data: { name: string; categories: Category[] }) =>
    api.put(`/quizzes/${id}`, data),
  getById: (id: string) => api.get(`/quizzes/${id}`),
  getAll: () => api.get("/quizzes"),
  uploadQuestionImage: (file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    return api.post<{ success: boolean; data: { imageUrl: string } }>("/quizzes/images", formData);
  },
};

// Game API
export const gameApi = {
  create: (quizId: string) => api.post("/games", { quizId }),
  getAll: (quizId?: string) =>
    api.get("/games", { params: quizId ? { quizId } : {} }),
  getById: (id: string) => api.get(`/games/${id}`),
  getActive: () => api.get("/games/active"),
  activate: (id: string) => api.put(`/games/${id}/activate`),
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

