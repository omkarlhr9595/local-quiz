import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { HostNavigation } from "@/components/host/HostNavigation";
import { MainMonitorControls } from "@/components/host/MainMonitorControls";
import { GameControls } from "@/components/host/GameControls";
import { QuizGrid } from "@/components/host/QuizGrid";
import { QuestionPreview } from "@/components/host/QuestionPreview";
import { BuzzerQueue } from "@/components/host/BuzzerQueue";
import { AnswerControls } from "@/components/host/AnswerControls";
import { Leaderboard } from "@/components/host/Leaderboard";
import { QuestionPointOverride } from "@/components/host/QuestionPointOverride";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useGameStore } from "@/store/gameStore";
import { useSocketStore } from "@/store/socketStore";
import { gameApi, quizApi, contestantApi } from "@/lib/api";
import buzzerSound from "@/assets/Bell Ding Sound EFFECT.mp3";

function HostGamePage() {
  const navigate = useNavigate();

  const [selectedQuestion, setSelectedQuestion] = useState<{
    categoryIndex: number;
    questionIndex: number;
  } | null>(null);

  const { game, quiz, setGame, setQuiz, setCurrentQuestion, setBuzzerQueue, setLeaderboard, updateContestantScore, setContestants } = useGameStore();
  const { socket, connect, joinRoom } = useSocketStore();
  
  // Track previous first contestant in queue to detect when someone new becomes first
  const previousFirstContestantRef = useRef<string | null>(null);
  
  // Create audio object for buzzer sound
  const buzzerSoundRef = useRef<HTMLAudioElement | null>(null);
  
  // Initialize audio on mount
  useEffect(() => {
    buzzerSoundRef.current = new Audio(buzzerSound);
    buzzerSoundRef.current.preload = "auto";
    
    return () => {
      if (buzzerSoundRef.current) {
        buzzerSoundRef.current.pause();
        buzzerSoundRef.current = null;
      }
    };
  }, []);

  // Load active game on mount and reload games list
  useEffect(() => {
    const initialize = async () => {
      await loadActiveGame();
      await loadAllGames();
    };
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadActiveGame = async () => {
    try {
      const gameResponse = await gameApi.getActive();
      if (gameResponse.data.success) {
        const gameData = gameResponse.data.data;
        setGame(gameData);

        // Restore game state from DB
        if (gameData.currentQuestion) {
          // Load quiz to get category name
          const quizResponse = await quizApi.getById(gameData.quizId);
          if (quizResponse.data.success) {
            const quizData = quizResponse.data.data;
            setQuiz(quizData);
            
            const category = quizData.categories[gameData.currentQuestion.categoryIndex];
            if (category) {
              setCurrentQuestion({
                question: gameData.currentQuestion.question,
                points: gameData.currentQuestion.points,
                category: category.name,
              });
            }
          }
        } else {
          // Load quiz even if no current question
          const quizResponse = await quizApi.getById(gameData.quizId);
          if (quizResponse.data.success) {
            setQuiz(quizResponse.data.data);
          }
        }

        // Load contestants FIRST (needed for buzzer queue display)
        try {
          const contestantsResponse = await contestantApi.getByGameId(gameData.id);
          if (contestantsResponse.data.success) {
            const contestants = contestantsResponse.data.data;
            // Store contestants in the game store so they can be accessed by BuzzerQueue
            setContestants(contestants.map((c: any) => ({
              id: c.id,
              name: c.name,
              photoUrl: c.photoUrl || "",
              gameId: c.gameId,
              score: c.score || 0,
              route: c.route,
              createdAt: c.createdAt,
            })));
            const sorted = contestants
              .map((c: any, index: number) => ({
                contestantId: c.id,
                name: c.name,
                photoUrl: c.photoUrl,
                score: c.score || 0,
                position: index + 1,
              }))
              .sort((a: any, b: any) => b.score - a.score)
              .map((c: any, index: number) => ({ ...c, position: index + 1 }));
            setLeaderboard(sorted);
          }
        } catch (error) {
          console.error("Error loading contestants for leaderboard:", error);
        }

        // Restore buzzer queue ONLY if there's a current question (otherwise clear it)
        if (gameData.currentQuestion && gameData.buzzerQueue && gameData.buzzerQueue.length > 0) {
          const currentAnswering = gameData.buzzerQueue.length > 0 
            ? gameData.buzzerQueue[0].contestantId 
            : null;
          setBuzzerQueue(gameData.buzzerQueue, currentAnswering);
        } else {
          // Clear queue if no current question
          setBuzzerQueue([], null);
        }
      }
    } catch (error) {
      console.error("Error loading active game:", error);
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
      // Reset previous first contestant so sound can play for new question
      previousFirstContestantRef.current = null;
    });

    socket.on("buzzer-queue-update", (data) => {
      console.log(`\n[HOST] ========== QUEUE UPDATE RECEIVED ==========`);
      console.log(`[HOST] Queue size: ${data.queue.length}`);
      console.log(`[HOST] Current answering: ${data.currentAnswering || "none"}`);
      console.log(`[HOST] Queue order:`);
      data.queue.forEach((entry, index) => {
        console.log(
          `[HOST]   [${index + 1}] Contestant: ${entry.contestantId}, Timestamp: ${entry.timestamp} (${new Date(entry.timestamp).toISOString()})`
        );
      });
      console.log(`[HOST] ========== UPDATE COMPLETE ==========\n`);
      
      // Check if someone new became first in queue
      const newFirstContestant = data.queue.length > 0 ? data.queue[0].contestantId : null;
      const previousFirstContestant = previousFirstContestantRef.current;
      
      // Play sound if someone new became first (queue was empty and now has someone, or first person changed)
      if (newFirstContestant && newFirstContestant !== previousFirstContestant) {
        console.log(`[HOST] New first in queue: ${newFirstContestant} - Playing sound`);
        if (buzzerSoundRef.current) {
          // Reset audio to beginning and play
          buzzerSoundRef.current.currentTime = 0;
          buzzerSoundRef.current.play().catch((error) => {
            console.error("Error playing buzzer sound:", error);
          });
        }
      }
      
      // Update the ref to track the new first contestant
      previousFirstContestantRef.current = newFirstContestant;
      
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
      // If answer is correct, clear current question and selected question
      // so host can select the next question
      if (data.isCorrect) {
        setCurrentQuestion(null);
        setSelectedQuestion(null);
      }
    });

    socket.on("game-update", (data) => {
      // Update game state when it changes (e.g., when questions are answered)
      setGame(data.game);
      // Clear current question if it's been cleared in the game state
      if (!data.game.currentQuestion) {
        setCurrentQuestion(null);
        setSelectedQuestion(null);
      }
    });

    return () => {
      socket.off("question-revealed");
      socket.off("buzzer-queue-update");
      socket.off("score-update");
      socket.off("leaderboard-update");
      socket.off("answer-result");
      socket.off("game-update");
    };
  }, [socket, setCurrentQuestion, setBuzzerQueue, setLeaderboard, updateContestantScore]);

  const handleCardSelect = (categoryIndex: number, questionIndex: number) => {
    setSelectedQuestion({ categoryIndex, questionIndex });
  };

  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [gameToDelete, setGameToDelete] = useState<string | null>(null);

  const loadAllGames = async () => {
    try {
      const response = await gameApi.getAll();
      if (response.data.success) {
        setGames(response.data.data || []);
      }
    } catch (error) {
      console.error("Error loading games:", error);
    }
  };

  const handleActivateGame = async (gameId: string) => {
    setLoading(true);
    try {
      // Activate the game (this will deactivate all others)
      const activateResponse = await gameApi.activate(gameId);
      if (activateResponse.data.success) {
        const gameData = activateResponse.data.data;
        setGame(gameData);

        // Clear buzzer queue when activating (fresh start)
        setBuzzerQueue([], null);
        setCurrentQuestion(null);

        // Load quiz
        const quizResponse = await quizApi.getById(gameData.quizId);
        if (quizResponse.data.success) {
          setQuiz(quizResponse.data.data);
        }

        // Load contestants
        try {
          const contestantsResponse = await contestantApi.getByGameId(gameData.id);
          if (contestantsResponse.data.success) {
            const contestants = contestantsResponse.data.data;
            setContestants(contestants.map((c: any) => ({
              id: c.id,
              name: c.name,
              photoUrl: c.photoUrl || "",
              gameId: c.gameId,
              score: c.score || 0,
              route: c.route,
              createdAt: c.createdAt,
            })));
          }
        } catch (error) {
          console.error("Error loading contestants:", error);
        }

        // Reload games list to show updated statuses
        await loadAllGames();
      }
    } catch (error) {
      console.error("Error activating game:", error);
      alert("Failed to activate game");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (gameId: string) => {
    setGameToDelete(gameId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!gameToDelete) return;

    setLoading(true);
    
    try {
      const response = await gameApi.delete(gameToDelete);
      
      // Check if the deletion was successful
      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to delete game");
      }

      // If the deleted game was the active one, clear it
      if (game && game.id === gameToDelete) {
        setGame(null);
        setQuiz(null);
      }

      // Reload games list
      await loadAllGames();
      
      // If there's an active game, reload it
      try {
        await loadActiveGame();
      } catch {
        // No active game, that's fine
      }

      // Close dialog after successful deletion
      setDeleteDialogOpen(false);
      setGameToDelete(null);
    } catch (error) {
      console.error("Error deleting game:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to delete game";
      alert(errorMessage);
      // Keep dialog open on error - don't close it
      // The dialog will stay open so user can try again or cancel
    } finally {
      setLoading(false);
    }
  };

  // Show setup message if no game loaded
  if (!game) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HostNavigation />
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <Card className="p-8 space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">No Active Game</h2>
              <p className="text-gray-600 mb-6">
                Activate a game to start playing, or set up a new game.
              </p>
            </div>

            {/* Game List */}
            {games.length > 0 ? (
              <div className="space-y-3">
                <Label className="text-sm font-medium block">Available Games</Label>
                {games.map((g) => (
                  <Card
                    key={g.id}
                    className={`p-4 flex items-center justify-between ${
                      g.status === "active" ? "border-green-500 bg-green-50" : ""
                    }`}
                  >
                    <div className="flex-1">
                      <div className="font-semibold">
                        {g.status === "active" && (
                          <Badge className="mr-2 bg-green-600">ACTIVE</Badge>
                        )}
                        Game {g.id.slice(0, 8)}...
                      </div>
                      <div className="text-sm text-gray-600">
                        Status: {g.status} • Created:{" "}
                        {new Date(g.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {g.status !== "active" && (
                        <Button
                          onClick={() => handleActivateGame(g.id)}
                          disabled={loading}
                          size="sm"
                        >
                          {loading ? "Activating..." : "Activate"}
                        </Button>
                      )}
                      <Button
                        onClick={() => navigate("/host/setup")}
                        variant="outline"
                        size="sm"
                      >
                        View/Edit
                      </Button>
                      <Button
                        onClick={() => handleDeleteClick(g.id)}
                        disabled={loading}
                        size="sm"
                        variant="destructive"
                      >
                        Delete
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                No games found. Create a new game to get started.
              </div>
            )}

            <div className="pt-4 border-t">
              <Button onClick={() => navigate("/host/setup")} size="lg" className="w-full">
                Setup New Game →
              </Button>
            </div>
          </Card>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the game
                and all associated contestants from the database.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={async (e) => {
                  e.preventDefault();
                  await handleDeleteConfirm();
                }}
                disabled={loading}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {loading ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
            {game && (
              <div className="flex items-center gap-2">
                <Badge className="bg-green-600">ACTIVE</Badge>
                <span className="text-sm">Game: {game.id.slice(0, 8)}...</span>
              </div>
            )}
            {quiz && <span className="text-sm">Quiz: {quiz.name}</span>}
            {game && game.status !== "active" && (
              <Button
                onClick={() => handleActivateGame(game.id)}
                disabled={loading}
                size="sm"
                variant="outline"
              >
                {loading ? "Activating..." : "Activate This Game"}
              </Button>
            )}
            {game && (
              <Button
                onClick={() => handleDeleteClick(game.id)}
                disabled={loading}
                size="sm"
                variant="destructive"
              >
                Delete Game
              </Button>
            )}
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

          {/* Question Point Override */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h3 className="font-semibold">Award Points Retroactively</h3>
            </div>
            <div className="p-4">
              <QuestionPointOverride />
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the game
              and all associated contestants from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async (e) => {
                e.preventDefault();
                await handleDeleteConfirm();
              }}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default HostGamePage;
