import type {
  JoinRoomPayload,
  SelectQuestionPayload,
  HostRevealQuestionPayload,
  BuzzerPressPayload,
  HostAnswerConfirmPayload,
  GameControlPayload,
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
  error: (data: { message: string }) => void;
}

export interface ClientToServerEvents {
  "join-room": (payload: JoinRoomPayload) => void;
  "leave-room": (payload: { gameId: string }) => void;
  "select-question": (payload: SelectQuestionPayload) => void;
  "host-reveal-question": (payload: HostRevealQuestionPayload) => void;
  "buzzer-press": (payload: BuzzerPressPayload) => void;
  "host-answer-confirm": (payload: HostAnswerConfirmPayload) => void;
  "game-pause": (payload: GameControlPayload) => void;
  "game-resume": (payload: GameControlPayload) => void;
  "game-reset": (payload: GameControlPayload) => void;
}

