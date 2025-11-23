import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { gameApi, quizApi } from "@/lib/api";
import { useGameStore } from "@/store/gameStore";
import { useSocketStore } from "@/store/socketStore";

export function GameSelector() {
  const [games, setGames] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { game, setGame, setQuiz } = useGameStore();
  const { socket, joinRoom } = useSocketStore();

  useEffect(() => {
    loadQuizzes();
    loadGames();
  }, []);

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

  const loadGames = async () => {
    try {
      // For now, we'll create games on demand
      // In future, we can add a GET /api/games endpoint
      setGames([]);
    } catch (error) {
      console.error("Error loading games:", error);
    }
  };

  const handleCreateGame = async () => {
    if (!quizzes.length) {
      alert("Please create a quiz first");
      return;
    }

    setLoading(true);
    try {
      const response = await gameApi.create(quizzes[0].id);
      if (response.data.success) {
        const newGame = response.data.data;
        setGame(newGame);
        if (socket) {
          joinRoom(newGame.id, "host");
        }
      }
    } catch (error) {
      console.error("Error creating game:", error);
      alert("Failed to create game");
    } finally {
      setLoading(false);
    }
  };

  const handleGameSelect = async (gameId: string) => {
    try {
      const response = await gameApi.getById(gameId);
      if (response.data.success) {
        const selectedGame = response.data.data;
        setGame(selectedGame);
        if (socket) {
          joinRoom(selectedGame.id, "host");
        }
      }
    } catch (error) {
      console.error("Error loading game:", error);
    }
  };

  const handleQuizSelect = async (quizId: string) => {
    try {
      const response = await quizApi.getById(quizId);
      if (response.data.success) {
        setQuiz(response.data.data);
      }
    } catch (error) {
      console.error("Error loading quiz:", error);
    }
  };

  return (
    <div className="space-y-4 p-4 border-b">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Game</label>
          <div className="flex gap-2">
            <Select
              value={game?.id || ""}
              onValueChange={handleGameSelect}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Game" />
              </SelectTrigger>
              <SelectContent>
                {games.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    Game {g.id.slice(0, 8)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleCreateGame} disabled={loading}>
              + New Game
            </Button>
          </div>
        </div>

        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Quiz</label>
          <Select onValueChange={handleQuizSelect}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Quiz" />
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
      </div>
    </div>
  );
}

