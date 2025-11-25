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
  answeredQuestions: Array<{ categoryIndex: number; questionIndex: number }>;
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

export interface HostMarkQuestionDonePayload {
  gameId: string;
}

export interface HostManualAwardPointsPayload {
  gameId: string;
  categoryIndex: number;
  questionIndex: number;
  contestantId: string;
  points: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Socket.io Event Types
export interface ServerToClientEvents {
  "room-joined": (data: { gameId: string; role: string }) => void;
  "question-selected": (data: {
    categoryIndex: number;
    questionIndex: number;
    contestantId: string;
  }) => void;
  "question-revealed": (data: {
    question: string;
    points: number;
    category: string;
  }) => void;
  "buzzer-queue-update": (data: {
    queue: Array<{ contestantId: string; timestamp: number }>;
    currentAnswering: string | null;
  }) => void;
  "answer-result": (data: {
    contestantId: string;
    isCorrect: boolean;
    points: number;
  }) => void;
  "score-update": (data: { contestantId: string; newScore: number }) => void;
  "leaderboard-update": (data: {
    leaderboard: Array<{
      contestantId: string;
      name: string;
      photoUrl: string;
      score: number;
      position: number;
    }>;
  }) => void;
  "game-state-change": (data: { status: string }) => void;
  "game-update": (data: { game: Game }) => void;
  "main-monitor-view": (data: { view: "grid" | "question" | "leaderboard" | "photo" }) => void;
  error: (data: { message: string }) => void;
}

export interface ClientToServerEvents {
  "join-room": (payload: JoinRoomPayload) => void;
  "leave-room": (payload: { gameId: string }) => void;
  "select-question": (payload: SelectQuestionPayload) => void;
  "host-reveal-question": (payload: HostRevealQuestionPayload) => void;
  "buzzer-press": (payload: BuzzerPressPayload) => void;
  "host-answer-confirm": (payload: HostAnswerConfirmPayload) => void;
  "host-mark-question-done": (payload: HostMarkQuestionDonePayload) => void;
  "host-manual-award-points": (payload: HostManualAwardPointsPayload) => void;
  "game-pause": (payload: GameControlPayload) => void;
  "game-resume": (payload: GameControlPayload) => void;
  "game-reset": (payload: GameControlPayload) => void;
  "main-monitor-view": (payload: { gameId: string; view: "grid" | "question" | "leaderboard" | "photo" }) => void;
  "main-monitor-sound": (payload: { gameId: string; muted: boolean }) => void;
}

