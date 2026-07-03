import { create } from "zustand";
import type { Game, Contestant, Quiz, LeaderboardEntry } from "../../../shared/types/index.js";

interface GameState {
  // Game data
  game: Game | null;
  quiz: Quiz | null;
  contestants: Contestant[];
  leaderboard: LeaderboardEntry[];

  // Current question
  currentQuestion: {
    question: string;
    points: number;
    category: string;
    imageUrl?: string;
    type?: "text" | "mcq";
    options?: Array<{ id: string; text: string }>;
    correctOptionId?: string;
  } | null;

  // MCQ answer reveal state
  revealedCorrectOptionId: string | null;

  // Buzzer queue
  buzzerQueue: Array<{ contestantId: string; timestamp: number }>;
  currentAnswering: string | null;

  // Actions
  setGame: (game: Game | null) => void;
  setQuiz: (quiz: Quiz | null) => void;
  setContestants: (contestants: Contestant[]) => void;
  setCurrentQuestion: (question: {
    question: string;
    points: number;
    category: string;
    imageUrl?: string;
    type?: "text" | "mcq";
    options?: Array<{ id: string; text: string }>;
    correctOptionId?: string;
  } | null) => void;
  setBuzzerQueue: (queue: Array<{ contestantId: string; timestamp: number }>, currentAnswering: string | null) => void;
  setLeaderboard: (leaderboard: LeaderboardEntry[]) => void;
  setRevealedCorrectOptionId: (optionId: string | null) => void;
  updateContestantScore: (contestantId: string, newScore: number) => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  game: null,
  quiz: null,
  contestants: [],
  leaderboard: [],
  currentQuestion: null,
  buzzerQueue: [],
  currentAnswering: null,
  revealedCorrectOptionId: null,

  setGame: (game) => set({ game }),
  setQuiz: (quiz) => set({ quiz }),
  setContestants: (contestants) => set({ contestants }),
  setCurrentQuestion: (question) => set({ currentQuestion: question, revealedCorrectOptionId: null }),
  setBuzzerQueue: (queue, currentAnswering) =>
    set({ buzzerQueue: queue, currentAnswering }),
  setLeaderboard: (leaderboard) => set({ leaderboard }),
  setRevealedCorrectOptionId: (optionId) => set({ revealedCorrectOptionId: optionId }),
  updateContestantScore: (contestantId, newScore) =>
    set((state) => ({
      contestants: state.contestants.map((c) =>
        c.id === contestantId ? { ...c, score: newScore } : c
      ),
    })),
  reset: () =>
    set({
      game: null,
      quiz: null,
      contestants: [],
      leaderboard: [],
      currentQuestion: null,
      buzzerQueue: [],
      currentAnswering: null,
      revealedCorrectOptionId: null,
    }),
}));

