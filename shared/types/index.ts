// Quiz Types
export interface Question {
  points: number;
  question: string;
  answer: string;
}

export interface Category {
  name: string;
  questions: Question[];
}

export interface Quiz {
  id: string;
  name: string;
  categories: Category[];
  createdAt: Date;
}

// Contestant Types
export interface Contestant {
  id: string;
  name: string;
  photoUrl: string;
  gameId: string;
  score: number;
  route: string; // '/contestant1', '/contestant2', etc.
  createdAt: Date;
}

// Game Types
export type GameStatus = "waiting" | "active" | "paused" | "ended";

export interface CurrentQuestion {
  categoryIndex: number;
  questionIndex: number;
  points: number;
  question: string;
  answer: string;
}

export interface BuzzerQueueEntry {
  contestantId: string;
  timestamp: number;
}

export interface Game {
  id: string;
  quizId: string;
  status: GameStatus;
  currentQuestion: CurrentQuestion | null;
  buzzerQueue: BuzzerQueueEntry[];
  createdAt: Date;
  updatedAt: Date;
}

// Leaderboard Types
export interface LeaderboardEntry {
  contestantId: string;
  name: string;
  photoUrl: string;
  score: number;
  position: number;
}

// Socket.io Event Types
export interface JoinRoomPayload {
  gameId: string;
  role: "host" | "contestant";
  contestantId?: string;
}

export interface SelectQuestionPayload {
  gameId: string;
  categoryIndex: number;
  questionIndex: number;
  contestantId: string;
}

export interface HostRevealQuestionPayload {
  gameId: string;
  categoryIndex: number;
  questionIndex: number;
}

export interface BuzzerPressPayload {
  gameId: string;
  contestantId: string;
  timestamp: number;
}

export interface HostAnswerConfirmPayload {
  gameId: string;
  contestantId: string;
  isCorrect: boolean;
  points: number;
}

export interface GameControlPayload {
  gameId: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

