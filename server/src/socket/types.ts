import type {
  JoinRoomPayload,
  SelectQuestionPayload,
  HostRevealQuestionPayload,
  BuzzerPressPayload,
  HostAnswerConfirmPayload,
  GameControlPayload,
  Game,
  QuestionType,
  QuestionOption,
  HostMarkQuestionDonePayload,
  HostManualAwardPointsPayload,
} from "../../../shared/types/index.js";

export interface SocketData {
  gameId: string;
  role: "host" | "contestant";
  contestantId?: string;
}

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
    imageUrl?: string;
    type?: QuestionType;
    options?: QuestionOption[];
    correctOptionId?: string;
  }) => void;
  "mcq-answer-revealed": (data: { correctOptionId: string }) => void;
  "buzzer-queue-update": (data: {
    queue: Array<{ contestantId: string; timestamp: number }>;
    currentAnswering: string | null;
  }) => void;
  "answer-result": (data: {
    contestantId: string;
    isCorrect: boolean;
    points: number;
  }) => void;
  "score-update": (data: { contestantId: string; newScore: number; action?: "deduct" | "award"; isManual?: boolean }) => void;
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
  "host-reveal-mcq-answer": (payload: { gameId: string }) => void;
  "buzzer-press": (payload: BuzzerPressPayload) => void;
  "host-answer-confirm": (payload: HostAnswerConfirmPayload) => void;
  "host-mark-question-done": (payload: HostMarkQuestionDonePayload) => void;
  "host-manual-award-points": (payload: HostManualAwardPointsPayload) => void;
  "host-deduct-score": (payload: { gameId: string; contestantId: string; amount: number; action: "deduct" }) => void;
  "host-award-score": (payload: { gameId: string; contestantId: string; amount: number; action: "award" }) => void;
  "game-pause": (payload: GameControlPayload) => void;
  "game-resume": (payload: GameControlPayload) => void;
  "game-reset": (payload: GameControlPayload) => void;
  "main-monitor-view": (payload: { gameId: string; view: "grid" | "question" | "leaderboard" | "photo" }) => void;
  "main-monitor-sound": (payload: { gameId: string; muted: boolean }) => void;
}

