import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { HostNavigation } from "@/components/host/HostNavigation";
import { MainMonitorControls } from "@/components/host/MainMonitorControls";
import { GameControls } from "@/components/host/GameControls";
import { QuizGrid } from "@/components/host/QuizGrid";
import { QuestionPreview } from "@/components/host/QuestionPreview";
import { BuzzerQueue } from "@/components/host/BuzzerQueue";
import { AnswerControls } from "@/components/host/AnswerControls";
import { Leaderboard } from "@/components/host/Leaderboard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGameStore } from "@/store/gameStore";
import { useSocketStore } from "@/store/socketStore";
import { gameApi, quizApi } from "@/lib/api";

function HostGamePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const gameIdFromUrl = searchParams.get("gameId");

  const [selectedQuestion, setSelectedQuestion] = useState<{
    categoryIndex: number;
    questionIndex: number;
  } | null>(null);

  const { game, quiz, setGame, setQuiz, setCurrentQuestion, setBuzzerQueue, setLeaderboard, updateContestantScore } = useGameStore();
  const { socket, connect, joinRoom } = useSocketStore();

  // Load game and quiz on mount
  useEffect(() => {
    if (gameIdFromUrl) {
      loadGame(gameIdFromUrl);
    }
  }, [gameIdFromUrl]);

  const loadGame = async (gameId: string) => {
    try {
      const gameResponse = await gameApi.getById(gameId);
      if (gameResponse.data.success) {
        const gameData = gameResponse.data.data;
        setGame(gameData);

        // Load quiz
        const quizResponse = await quizApi.getById(gameData.quizId);
        if (quizResponse.data.success) {
          setQuiz(quizResponse.data.data);
        }
      }
    } catch (error) {
      console.error("Error loading game:", error);
    }
  };

  // Connect socket on mount
  useEffect(() => {
    connect();
    return () => {
      // Cleanup on unmount
    };
  }, [connect]);

  // Join room when game is loaded
  useEffect(() => {
    if (socket && game) {
      joinRoom(game.id, "host");
    }
  }, [socket, game, joinRoom]);

  // Set up Socket.io event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on("question-revealed", (data) => {
      setCurrentQuestion({
        question: data.question,
        points: data.points,
        category: data.category,
      });
    });

    socket.on("buzzer-queue-update", (data) => {
      setBuzzerQueue(data.queue, data.currentAnswering);
    });

    socket.on("score-update", (data) => {
      updateContestantScore(data.contestantId, data.newScore);
    });

    socket.on("leaderboard-update", (data) => {
      setLeaderboard(data.leaderboard);
    });

    socket.on("answer-result", (data) => {
      // Handle answer result if needed
      console.log("Answer result:", data);
    });

    return () => {
      socket.off("question-revealed");
      socket.off("buzzer-queue-update");
      socket.off("score-update");
      socket.off("leaderboard-update");
      socket.off("answer-result");
    };
  }, [socket, setCurrentQuestion, setBuzzerQueue, setLeaderboard, updateContestantScore]);

  const handleCardSelect = (categoryIndex: number, questionIndex: number) => {
    setSelectedQuestion({ categoryIndex, questionIndex });
  };

  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string>("");
  const [selectedGameId, setSelectedGameId] = useState<string>("");

  useEffect(() => {
    loadQuizzes();
  }, []);

  useEffect(() => {
    if (selectedQuizId) {
      loadGames(selectedQuizId);
    }
  }, [selectedQuizId]);

  const loadQuizzes = async () => {
    try {
      const response = await quizApi.getAll();
      if (response.data.success) {
        setQuizzes(response.data.data || []);
      }
    } catch (error) {
      console.error("Error loading quizzes:", error);
    }
  };

  const loadGames = async (quizId: string) => {
    try {
      const response = await gameApi.getAll(quizId);
      if (response.data.success) {
        setGames(response.data.data || []);
      }
    } catch (error) {
      console.error("Error loading games:", error);
    }
  };

  const handleSelectGame = async (gameId: string) => {
    setSelectedGameId(gameId);
    navigate(`/host/game?gameId=${gameId}`);
  };

  // Show setup message if no game loaded
  if (!gameIdFromUrl || !game) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HostNavigation />
        <div className="container mx-auto px-4 py-16 max-w-2xl">
          <Card className="p-8 space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">No Game Loaded</h2>
              <p className="text-gray-600 mb-6">
                Select a quiz and game to start playing, or set up a new game.
              </p>
            </div>

            {/* Game Selection */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Select Quiz</Label>
                <Select value={selectedQuizId} onValueChange={setSelectedQuizId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a quiz..." />
                  </SelectTrigger>
                  <SelectContent>
                    {quizzes.map((q) => (
                      <SelectItem key={q.id} value={q.id}>
                        {q.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedQuizId && games.length > 0 && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">Select Game</Label>
                  <Select value={selectedGameId} onValueChange={handleSelectGame}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a game..." />
                    </SelectTrigger>
                    <SelectContent>
                      {games.map((g) => (
                        <SelectItem key={g.id} value={g.id}>
                          Game {g.id.slice(0, 8)}... ({g.status}) -{" "}
                          {new Date(g.createdAt).toLocaleDateString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedQuizId && games.length === 0 && (
                <div className="text-sm text-gray-500 text-center">
                  No games found for this quiz
                </div>
              )}

              <div className="pt-4 border-t">
                <Button onClick={() => navigate("/host/setup")} size="lg" className="w-full">
                  Setup New Game →
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HostNavigation />

      {/* Game Info Bar */}
      <div className="border-b bg-white px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {game && <span className="text-sm">Game: {game.id.slice(0, 8)}...</span>}
            {quiz && <span className="text-sm">Quiz: {quiz.name}</span>}
          </div>
          <GameControls />
        </div>
      </div>

      {/* Main Monitor Controls */}
      <MainMonitorControls />

      {/* Main Content - Split Layout */}
      <div className="flex gap-6 p-6">
        {/* Left Panel - Quiz Grid (60%) */}
        <div className="flex-1 bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold">Quiz Grid</h2>
          </div>
          <QuizGrid onCardSelect={handleCardSelect} />
        </div>

        {/* Right Panel - Controls (40%) */}
        <div className="w-[40%] space-y-6">
          {/* Question Preview */}
          {selectedQuestion && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h3 className="font-semibold">Selected Question</h3>
              </div>
              <div className="p-4">
                <QuestionPreview
                  categoryIndex={selectedQuestion.categoryIndex}
                  questionIndex={selectedQuestion.questionIndex}
                />
              </div>
            </div>
          )}

          {/* Buzzer Queue */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h3 className="font-semibold">Buzzer Queue</h3>
            </div>
            <div className="p-4">
              <BuzzerQueue />
            </div>
          </div>

          {/* Answer Controls */}
          <div className="bg-white rounded-lg shadow p-4">
            <AnswerControls />
          </div>

          {/* Leaderboard */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h3 className="font-semibold">Leaderboard</h3>
            </div>
            <div className="p-4">
              <Leaderboard />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HostGamePage;
