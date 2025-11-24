import { useState, useEffect } from "react";
import { useGameStore } from "@/store/gameStore";
import { useSocketStore } from "@/store/socketStore";
import { gameApi, quizApi, contestantApi } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type MonitorView = "grid" | "question" | "leaderboard" | "photo";

interface PhotoDisplayData {
  contestantId: string;
  name: string;
  photoUrl: string;
  points: number;
}

function MainPage() {
  const [view, setView] = useState<MonitorView>("grid");
  const [photoDisplay, setPhotoDisplay] = useState<PhotoDisplayData | null>(null);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set());

  const {
    game,
    quiz,
    contestants,
    currentQuestion,
    leaderboard,
    setGame,
    setQuiz,
    setContestants,
    setCurrentQuestion,
    setLeaderboard,
  } = useGameStore();

  const { socket, connect, joinRoom } = useSocketStore();

  // Load active game data
  useEffect(() => {
    loadGameData();
  }, []);

  // Connect to Socket.io
  useEffect(() => {
    if (!socket) {
      connect();
    }
  }, [socket, connect]);

  // Join room when socket and game are ready
  useEffect(() => {
    if (socket && game) {
      joinRoom(game.id, "contestant"); // Main monitor acts as a spectator
    }
  }, [socket, game, joinRoom]);

  // Listen to Socket.io events
  useEffect(() => {
    if (!socket) return;

    const handleMainMonitorView = (data: { view: MonitorView }) => {
      setView(data.view);
    };

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
      setView("question");
    };

    const handleAnswerResult = (data: {
      contestantId: string;
      isCorrect: boolean;
      points: number;
    }) => {
      if (data.isCorrect) {
        // Find contestant
        const contestant = contestants.find((c) => c.id === data.contestantId);
        if (contestant) {
          setPhotoDisplay({
            contestantId: contestant.id,
            name: contestant.name,
            photoUrl: contestant.photoUrl,
            points: data.points,
          });
          setView("photo");

          // Play victory sound (if not muted)
          // TODO: Add sound toggle

          // After 3 seconds, show leaderboard
          setTimeout(() => {
            setView("leaderboard");
            setPhotoDisplay(null);
          }, 3000);
        }

        // Mark question as answered
        if (currentQuestion) {
          const questionKey = `${currentQuestion.category}-${currentQuestion.points}`;
          setAnsweredQuestions((prev) => new Set(prev).add(questionKey));
        }
      }
    };

    const handleLeaderboardUpdate = (data: {
      leaderboard: Array<{
        contestantId: string;
        name: string;
        photoUrl: string;
        score: number;
        position: number;
      }>;
    }) => {
      setLeaderboard(data.leaderboard);
    };

    const handleScoreUpdate = (data: { contestantId: string; newScore: number }) => {
      // Update contestant score in store
      const updatedContestants = contestants.map((c) =>
        c.id === data.contestantId ? { ...c, score: data.newScore } : c
      );
      setContestants(updatedContestants);
    };

    socket.on("main-monitor-view", handleMainMonitorView);
    socket.on("question-revealed", handleQuestionRevealed);
    socket.on("answer-result", handleAnswerResult);
    socket.on("leaderboard-update", handleLeaderboardUpdate);
    socket.on("score-update", handleScoreUpdate);

    return () => {
      socket.off("main-monitor-view", handleMainMonitorView);
      socket.off("question-revealed", handleQuestionRevealed);
      socket.off("answer-result", handleAnswerResult);
      socket.off("leaderboard-update", handleLeaderboardUpdate);
      socket.off("score-update", handleScoreUpdate);
    };
  }, [socket, contestants, currentQuestion, setCurrentQuestion, setLeaderboard, setContestants]);

  const loadGameData = async () => {
    try {
      // Load active game
      const gameResponse = await gameApi.getActive();
      if (gameResponse.data.success) {
        const gameData = gameResponse.data.data;
        setGame(gameData);

        // Load quiz
        if (gameData.quizId) {
          const quizResponse = await quizApi.getById(gameData.quizId);
          if (quizResponse.data.success) {
            setQuiz(quizResponse.data.data);
          }
        }

        // Load contestants
        const contestantsResponse = await contestantApi.getByGameId(gameData.id);
        if (contestantsResponse.data.success) {
          setContestants(contestantsResponse.data.data);
        }
      }
    } catch (error) {
      console.error("Error loading game data:", error);
    }
  };

  const isQuestionAnswered = (categoryIndex: number, questionIndex: number) => {
    if (!quiz) return false;
    const category = quiz.categories[categoryIndex];
    if (!category) return false;
    const question = category.questions[questionIndex];
    if (!question) return false;
    const questionKey = `${category.name}-${question.points}`;
    return answeredQuestions.has(questionKey);
  };

  if (!quiz || !game) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Loading...</h1>
          <p className="text-gray-400">Loading game data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {view === "grid" && <GridView quiz={quiz} isQuestionAnswered={isQuestionAnswered} />}
      {view === "question" && currentQuestion && (
        <QuestionView question={currentQuestion} />
      )}
      {view === "leaderboard" && (
        <LeaderboardView contestants={contestants} leaderboard={leaderboard} />
      )}
      {view === "photo" && photoDisplay && (
        <PhotoView photoDisplay={photoDisplay} />
      )}
    </div>
  );
}

// Grid View Component
function GridView({ quiz, isQuestionAnswered }: { quiz: any; isQuestionAnswered: (catIdx: number, qIdx: number) => boolean }) {
  const maxQuestions = Math.max(...quiz.categories.map((cat: any) => cat.questions.length));

  return (
    <div className="p-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold mb-8 text-center">Quiz Game</h1>
        
        <div className="space-y-6">
          {/* Category Headers */}
          <div
            className="grid gap-6"
            style={{ gridTemplateColumns: `repeat(${quiz.categories.length}, 1fr)` }}
          >
            {quiz.categories.map((category: any, catIdx: number) => (
              <div
                key={catIdx}
                className="text-center font-bold text-3xl bg-blue-600 p-4 rounded-lg"
              >
                {category.name}
              </div>
            ))}
          </div>

          {/* Question Rows */}
          {Array.from({ length: maxQuestions }).map((_, qIdx) => (
            <div
              key={qIdx}
              className="grid gap-6"
              style={{ gridTemplateColumns: `repeat(${quiz.categories.length}, 1fr)` }}
            >
              {quiz.categories.map((category: any, catIdx: number) => {
                const question = category.questions[qIdx];
                if (!question) return <div key={catIdx} />;

                const answered = isQuestionAnswered(catIdx, qIdx);

                return (
                  <Card
                    key={catIdx}
                    className={cn(
                      "p-6 text-center transition-all",
                      answered
                        ? "bg-gray-700 opacity-50 cursor-not-allowed"
                        : "bg-blue-500 hover:bg-blue-600 cursor-pointer"
                    )}
                  >
                    <div className="text-4xl font-bold">
                      {answered ? "✓" : question.points}
                    </div>
                  </Card>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Question View Component
function QuestionView({ question }: { question: { question: string; points: number; category: string } }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-4xl w-full text-center">
        <div className="mb-8">
          <Badge className="text-2xl px-6 py-2 mb-4">{question.category}</Badge>
          <div className="text-6xl font-bold mb-4">{question.points} Points</div>
        </div>
        <Card className="p-12 bg-blue-600">
          <div className="text-5xl font-semibold leading-tight">{question.question}</div>
        </Card>
      </div>
    </div>
  );
}

// Leaderboard View Component
function LeaderboardView({ contestants, leaderboard }: { contestants: any[]; leaderboard: any[] }) {
  // Use leaderboard if available, otherwise sort contestants
  const sortedContestants = leaderboard.length > 0
    ? leaderboard.map((entry) => ({
        id: entry.contestantId,
        name: entry.name,
        photoUrl: entry.photoUrl,
        score: entry.score,
        position: entry.position,
      }))
    : [...contestants]
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .map((c, index) => ({
          ...c,
          position: index + 1,
        }));

  const getMedal = (position: number) => {
    if (position === 1) return "🥇";
    if (position === 2) return "🥈";
    if (position === 3) return "🥉";
    return "";
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        <h1 className="text-6xl font-bold mb-12 text-center">Leaderboard</h1>
        <div className="space-y-4">
          {sortedContestants.map((entry) => (
            <Card
              key={entry.id}
              className="p-6 bg-gray-800 hover:bg-gray-700 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <span className="text-5xl">{getMedal(entry.position)}</span>
                  <div className="w-24 h-24 rounded-full bg-gray-600 overflow-hidden flex-shrink-0">
                    {entry.photoUrl ? (
                      <img
                        src={entry.photoUrl}
                        alt={entry.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl text-gray-400">
                        👤
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-3xl font-bold">{entry.name}</div>
                    <div className="text-xl text-gray-400">#{entry.position}</div>
                  </div>
                </div>
                <Badge className="text-3xl px-8 py-3 bg-green-600">
                  {entry.score || 0} pts
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// Photo View Component (shows contestant photo with points earned)
function PhotoView({ photoDisplay }: { photoDisplay: PhotoDisplayData }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-green-600 to-green-800">
      <div className="text-center">
        <div className="mb-8">
          <div className="w-64 h-64 rounded-full bg-white overflow-hidden mx-auto mb-6 shadow-2xl">
            {photoDisplay.photoUrl ? (
              <img
                src={photoDisplay.photoUrl}
                alt={photoDisplay.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl text-gray-400">
                👤
              </div>
            )}
          </div>
          <div className="text-5xl font-bold mb-4">{photoDisplay.name}</div>
          <div className="text-7xl font-bold text-yellow-300">
            +{photoDisplay.points} Points!
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainPage;
