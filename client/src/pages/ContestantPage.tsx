import { useState, useEffect, useCallback } from "react";
import { useGameStore } from "@/store/gameStore";
import { useSocketStore } from "@/store/socketStore";
import { contestantApi, gameApi } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ContestantPageProps {
  contestantNumber: number;
}

function ContestantPage({ contestantNumber }: ContestantPageProps) {
  const route = `/contestant${contestantNumber}`;

  const [contestant, setContestant] = useState<any>(null);
  const [isFirstInQueue, setIsFirstInQueue] = useState(false);
  const [isInQueue, setIsInQueue] = useState(false);
  const [buzzerDisabled, setBuzzerDisabled] = useState(false);

  const {
    game,
    currentQuestion,
    buzzerQueue,
    setGame,
    setCurrentQuestion,
    setBuzzerQueue,
  } = useGameStore();

  const { socket, connect, joinRoom } = useSocketStore();

  // Load active game
  useEffect(() => {
    loadActiveGame();
  }, []);

  // Load contestant data when game is loaded
  useEffect(() => {
    if (game) {
      loadContestant();
    }
  }, [game, route]);

  // Connect to Socket.io
  useEffect(() => {
    if (!socket) {
      connect();
    }
  }, [socket, connect]);

  // Join room when socket, game, and contestant are ready
  useEffect(() => {
    if (socket && game && contestant) {
      joinRoom(game.id, "contestant", contestant.id);
    }
  }, [socket, game, contestant, joinRoom]);

  // Listen to Socket.io events
  useEffect(() => {
    if (!socket) return;

    const handleQuestionRevealed = (data: {
      question: string;
      points: number;
      category: string;
    }) => {
      setCurrentQuestion({
        question: data.question,
        points: data.points,
        category: data.category,
      });
      // Reset buzzer state when new question is revealed
      setIsFirstInQueue(false);
      setIsInQueue(false);
      setBuzzerDisabled(false);
    };

    const handleBuzzerQueueUpdate = (data: {
      queue: Array<{ contestantId: string; timestamp: number }>;
      currentAnswering: string | null;
    }) => {
      console.log(`\n[CLIENT-BUZZER] ========== QUEUE UPDATE RECEIVED ==========`);
      console.log(`[CLIENT-BUZZER] Contestant: ${contestant?.id || "unknown"} (${contestant?.name || "unknown"})`);
      console.log(`[CLIENT-BUZZER] Queue size: ${data.queue.length}`);
      console.log(`[CLIENT-BUZZER] Current answering: ${data.currentAnswering || "none"}`);
      console.log(`[CLIENT-BUZZER] Queue order:`);
      data.queue.forEach((entry, index) => {
        const isMe = entry.contestantId === contestant?.id;
        const marker = isMe ? " ⭐ ME" : "";
        console.log(
          `[CLIENT-BUZZER]   [${index + 1}]${marker} Contestant: ${entry.contestantId}, Timestamp: ${entry.timestamp} (${new Date(entry.timestamp).toISOString()})`
        );
      });

      if (contestant) {
        const myPosition = data.queue.findIndex((q) => q.contestantId === contestant.id);
        const inQueue = myPosition !== -1;
        const first = myPosition === 0;

        console.log(`[CLIENT-BUZZER] My position: ${inQueue ? myPosition + 1 : "not in queue"}`);
        console.log(`[CLIENT-BUZZER] Is first: ${first}`);
        console.log(`[CLIENT-BUZZER] In queue: ${inQueue}`);
      }

      setBuzzerQueue(data.queue, data.currentAnswering);
      
      if (!contestant) {
        console.log(`[CLIENT-BUZZER] ========== UPDATE COMPLETE (no contestant) ==========\n`);
        return;
      }

      // Check if this contestant is in the queue
      const inQueue = data.queue.some((entry) => entry.contestantId === contestant.id);
      setIsInQueue(inQueue);

      // Check if this contestant is first in queue
      const first = data.queue.length > 0 && data.queue[0].contestantId === contestant.id;
      setIsFirstInQueue(first);

      // Disable buzzer only if already in queue (not if someone else is answering)
      // Contestants should be able to join the queue even if someone is answering
      setBuzzerDisabled(inQueue);

      console.log(`[CLIENT-BUZZER] State updated: inQueue=${inQueue}, first=${first}, disabled=${inQueue}`);
      console.log(`[CLIENT-BUZZER] ========== UPDATE COMPLETE ==========\n`);
    };

    const handleAnswerResult = (data: {
      contestantId: string;
      isCorrect: boolean;
      points: number;
    }) => {
      // Reset buzzer state after answer is evaluated
      if (data.contestantId === contestant?.id || data.isCorrect) {
        setIsFirstInQueue(false);
        setIsInQueue(false);
        setBuzzerDisabled(false);
      }
    };

    const handleScoreUpdate = (data: { contestantId: string; newScore: number }) => {
      // Update contestant score if it's this contestant
      if (contestant && data.contestantId === contestant.id) {
        console.log(`[CLIENT] Score update received: ${data.newScore} points for ${contestant.name}`);
        setContestant((prev) => {
          if (prev) {
            return { ...prev, score: data.newScore };
          }
          return prev;
        });
      }
    };

    socket.on("question-revealed", handleQuestionRevealed);
    socket.on("buzzer-queue-update", handleBuzzerQueueUpdate);
    socket.on("answer-result", handleAnswerResult);
    socket.on("score-update", handleScoreUpdate);

    return () => {
      socket.off("question-revealed", handleQuestionRevealed);
      socket.off("buzzer-queue-update", handleBuzzerQueueUpdate);
      socket.off("answer-result", handleAnswerResult);
      socket.off("score-update", handleScoreUpdate);
    };
  }, [socket, contestant, setCurrentQuestion, setBuzzerQueue]);

  // Handle spacebar press for buzzer
  const handleBuzzerPress = useCallback(() => {
    if (!socket || !game || !contestant || !currentQuestion) {
      console.log(`[CLIENT-BUZZER] ${contestant?.id || "unknown"} - Cannot buzz: missing prerequisites`);
      return;
    }

    // Don't allow if already disabled or already in queue
    if (buzzerDisabled || isInQueue) {
      console.log(`[CLIENT-BUZZER] ${contestant.id} - Cannot buzz: disabled=${buzzerDisabled}, inQueue=${isInQueue}`);
      return;
    }

    // Capture timestamp IMMEDIATELY when buzzer is pressed (before any async operations)
    // This ensures the timestamp reflects the actual moment the user pressed, not when the checks completed
    const timestamp = Date.now();
    const requestId = `${contestant.id}-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;

    console.log(`\n[CLIENT-BUZZER] ========== BUZZ PRESS [${requestId}] ==========`);
    console.log(`[CLIENT-BUZZER] Contestant: ${contestant.id} (${contestant.name})`);
    console.log(`[CLIENT-BUZZER] Timestamp captured: ${timestamp} (${new Date(timestamp).toISOString()})`);
    console.log(`[CLIENT-BUZZER] Game ID: ${game.id}`);
    console.log(`[CLIENT-BUZZER] Emitting buzzer-press event...`);

    socket.emit("buzzer-press", {
      gameId: game.id,
      contestantId: contestant.id,
      timestamp,
    });

    console.log(`[CLIENT-BUZZER] [${requestId}] Event emitted at: ${Date.now()} (${new Date().toISOString()})`);

    // Disable buzzer temporarily to prevent spam
    // The buzzer-queue-update event will re-enable it if not in queue
    setBuzzerDisabled(true);
    console.log(`[CLIENT-BUZZER] [${requestId}] Buzzer disabled locally\n`);
  }, [socket, game, contestant, currentQuestion, buzzerDisabled, isInQueue]);

  // Listen for spacebar keypress
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "Space" && currentQuestion && !buzzerDisabled) {
        e.preventDefault();
        // handleBuzzerPress captures timestamp immediately when called
        handleBuzzerPress();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [currentQuestion, buzzerDisabled, handleBuzzerPress]);

  const loadActiveGame = async () => {
    try {
      const gameResponse = await gameApi.getActive();
      if (gameResponse.data.success) {
        setGame(gameResponse.data.data);
      }
    } catch (error) {
      console.error("Error loading active game:", error);
    }
  };

  const loadContestant = async () => {
    if (!game) return;

    try {
      // Load all contestants for the game
      const response = await contestantApi.getByGameId(game.id);
      if (response.data.success) {
        const contestants = response.data.data;
        // Find contestant by route
        const foundContestant = contestants.find((c: any) => c.route === route);
        if (foundContestant) {
          setContestant(foundContestant);
        } else {
          console.error("Contestant not found for route:", route);
        }
      }
    } catch (error) {
      console.error("Error loading contestant:", error);
    }
  };

  if (!game) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center p-8">
        <Card className="p-8 max-w-md w-full text-center">
          <h1 className="text-3xl font-bold mb-4">Contestant {contestantNumber}</h1>
          <p className="text-gray-600 mb-4">
            No active game found. Please start a game from the host panel.
          </p>
        </Card>
      </div>
    );
  }

  if (!contestant) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center p-8">
        <Card className="p-8 max-w-md w-full text-center">
          <h1 className="text-3xl font-bold mb-4">Loading...</h1>
          <p className="text-gray-600">Loading contestant data...</p>
        </Card>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "min-h-screen transition-all duration-500",
        isFirstInQueue
          ? "bg-green-500"
          : isInQueue
          ? "bg-yellow-400"
          : "bg-blue-50"
      )}
    >
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">{contestant.name || `Contestant ${contestantNumber}`}</h1>
          <Badge className="text-xl px-4 py-2">
            Score: {contestant.score || 0} pts
          </Badge>
        </div>

        {/* Status Indicator */}
        <Card className="p-6 mb-6 text-center">
          {isFirstInQueue ? (
            <div className="space-y-2">
              <div className="text-6xl mb-2">🎯</div>
              <div className="text-2xl font-bold text-green-600">YOUR TURN!</div>
              <div className="text-gray-600">You're first in line to answer</div>
            </div>
          ) : isInQueue ? (
            <div className="space-y-2">
              <div className="text-4xl mb-2">⏳</div>
              <div className="text-xl font-bold text-yellow-600">Waiting in Queue</div>
              <div className="text-gray-600">You're #{buzzerQueue.findIndex((q) => q.contestantId === contestant.id) + 1} in line</div>
            </div>
          ) : currentQuestion ? (
            <div className="space-y-2">
              <div className="text-4xl mb-2">⌨️</div>
              <div className="text-xl font-bold">Press SPACEBAR to buzz in!</div>
              <div className="text-sm text-gray-600">Fastest finger first</div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-4xl mb-2">⏸️</div>
              <div className="text-xl font-bold text-gray-600">Waiting for question...</div>
            </div>
          )}
        </Card>


        {/* Buzzer Instructions */}
        {currentQuestion && !isInQueue && (
          <Card className="p-6 bg-gray-100 text-center">
            <div className="space-y-2">
              <div className="text-2xl font-bold">Press SPACEBAR to buzz in!</div>
              <div className="text-gray-600">
                The first person to press spacebar gets to answer first
              </div>
            </div>
          </Card>
        )}

        {/* Contestant Photo */}
        <div className="mt-8 flex justify-center">
          <div className="w-32 h-32 rounded-full bg-gray-200 overflow-hidden border-4 border-white shadow-lg">
            {contestant.photoUrl ? (
              <img
                src={contestant.photoUrl}
                alt={contestant.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl text-gray-400">
                👤
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContestantPage;
