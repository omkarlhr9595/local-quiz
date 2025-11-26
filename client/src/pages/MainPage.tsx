import { useState, useEffect, useCallback } from "react";
import { useGameStore } from "@/store/gameStore";
import { useSocketStore } from "@/store/socketStore";
import { gameApi, quizApi, contestantApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Game, Quiz } from "../../../shared/types/index.js";

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
    setBuzzerQueue,
  } = useGameStore();

  const { socket, connect, joinRoom } = useSocketStore();

  const loadGameData = useCallback(async () => {
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
  }, [setGame, setQuiz, setContestants]);

  // Load active game data
  useEffect(() => {
    loadGameData();
  }, [loadGameData]);

  // Restore game state when game is loaded
  useEffect(() => {
    if (game) {
      // Restore current question if one is active
      if (game.currentQuestion && quiz) {
        const category = quiz.categories[game.currentQuestion.categoryIndex];
        if (category) {
          setCurrentQuestion({
            question: game.currentQuestion.question,
            points: game.currentQuestion.points,
            category: category.name,
          });
        }
      }

      // Restore buzzer queue
      if (game.buzzerQueue && game.buzzerQueue.length > 0) {
        const currentAnswering = game.buzzerQueue.length > 0 
          ? game.buzzerQueue[0].contestantId 
          : null;
        setBuzzerQueue(game.buzzerQueue, currentAnswering);
      }

      // Generate leaderboard from contestants
      if (contestants.length > 0) {
        const sorted = contestants
          .map((c, index) => ({
            contestantId: c.id,
            name: c.name,
            photoUrl: c.photoUrl,
            score: c.score || 0,
            position: index + 1,
          }))
          .sort((a, b) => b.score - a.score)
          .map((c, index) => ({ ...c, position: index + 1 }));
        setLeaderboard(sorted);
      }
    }
  }, [game, quiz, contestants, setCurrentQuestion, setBuzzerQueue, setLeaderboard]);

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
            
            // After 5 seconds on leaderboard, return to grid
            setTimeout(() => {
              setView("grid");
            }, 5000);
          }, 3000);
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

    const handleGameUpdate = (data: { game: Game }) => {
      // Update game state when it changes (e.g., when questions are answered)
      // This ensures the grid updates to show answered questions
      setGame(data.game);
    };

    socket.on("main-monitor-view", handleMainMonitorView);
    socket.on("question-revealed", handleQuestionRevealed);
    socket.on("answer-result", handleAnswerResult);
    socket.on("leaderboard-update", handleLeaderboardUpdate);
    socket.on("score-update", handleScoreUpdate);
    socket.on("game-update", handleGameUpdate);

    return () => {
      socket.off("main-monitor-view", handleMainMonitorView);
      socket.off("question-revealed", handleQuestionRevealed);
      socket.off("answer-result", handleAnswerResult);
      socket.off("leaderboard-update", handleLeaderboardUpdate);
      socket.off("score-update", handleScoreUpdate);
      socket.off("game-update", handleGameUpdate);
    };
  }, [socket, contestants, currentQuestion, setCurrentQuestion, setLeaderboard, setContestants, setGame]);

  const isQuestionAnswered = (categoryIndex: number, questionIndex: number) => {
    if (!game) return false;
    
    // Check if this question has been answered (from DB)
    const isAnswered = (game.answeredQuestions || []).some(
      (aq) => aq.categoryIndex === categoryIndex && aq.questionIndex === questionIndex
    );
    
    // Also check if this question is currently revealed
    const isCurrentlyRevealed = game.currentQuestion?.categoryIndex === categoryIndex &&
      game.currentQuestion?.questionIndex === questionIndex;
    
    return isAnswered || isCurrentlyRevealed;
  };

  if (!quiz || !game) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold mb-4 text-gray-800">Loading...</h1>
          <p className="text-2xl text-gray-600">Loading game data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {view === "grid" && <GridView quiz={quiz} isQuestionAnswered={isQuestionAnswered} view={view} />}
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
function GridView({ 
  quiz, 
  isQuestionAnswered, 
  view 
}: { 
  quiz: Quiz; 
  isQuestionAnswered: (catIdx: number, qIdx: number) => boolean;
  view: MonitorView;
}) {
  const maxQuestions = Math.max(...quiz.categories.map((cat) => cat.questions.length));

  return (
    <div className="p-12 min-h-screen bg-gray-50">
      <div className="max-w-[95vw] mx-auto">
        {/* Header with title and toggle buttons */}
        <div className="flex justify-between items-start mb-12">
          <div className="flex-1" />
          <h1 className="text-7xl font-bold text-center flex-1">
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
              {quiz.name || "General Knowledge Quiz"}
            </span>
          </h1>
          <div className="flex gap-3 flex-1 justify-end">
           
          </div>
        </div>
        
        <div className="space-y-8">
          {/* Category Headers */}
          <div
            className="grid gap-8"
            style={{ gridTemplateColumns: `repeat(${quiz.categories.length}, 1fr)` }}
          >
            {quiz.categories.map((category, catIdx: number) => (
              <div
                key={catIdx}
                className="text-center font-bold text-4xl bg-blue-600 text-white p-6 rounded-2xl shadow-xl"
              >
                {category.name}
              </div>
            ))}
          </div>

          {/* Question Rows */}
          {Array.from({ length: maxQuestions }).map((_, qIdx) => (
            <div
              key={qIdx}
              className="grid gap-8"
              style={{ gridTemplateColumns: `repeat(${quiz.categories.length}, 1fr)` }}
            >
              {quiz.categories.map((category, catIdx: number) => {
                const question = category.questions[qIdx];
                if (!question) return <div key={catIdx} />;

                const answered = isQuestionAnswered(catIdx, qIdx);

                return (
                  <div
                    key={catIdx}
                    className={cn(
                      "text-center transition-all rounded-2xl shadow-md",
                      answered
                        ? "bg-gray-200 opacity-50 cursor-not-allowed"
                        : "bg-blue-500 hover:bg-blue-600 cursor-pointer transform hover:scale-105 hover:shadow-lg"
                    )}
                    style={{ 
                      minHeight: '140px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <div className={cn(
                      "text-5xl font-bold",
                      answered ? "text-gray-400" : "text-white"
                    )}>
                      {answered ? "✓" : `${question.points}`}
                    </div>
                  </div>
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
    <div className="min-h-screen flex items-center justify-center p-12 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
      <div className="max-w-6xl w-full text-center">
        {/* Category Badge */}
        <div className="mb-12">
          <div className="inline-block px-12 py-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-3xl font-semibold shadow-xl mb-8">
            {question.category}
          </div>
        </div>
        
        {/* Points Display */}
        <div className="mb-16">
          <div className="inline-block px-16 py-6 rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-7xl font-bold shadow-xl">
            {question.points} pts
          </div>
        </div>
        
        {/* Question Box with Corner Brackets */}
        <div className="relative">
          <div className="relative bg-blue-800 p-16 rounded-3xl shadow-2xl">
            {/* Corner Brackets */}
            <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-yellow-400 rounded-tl-3xl" />
            <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-yellow-400 rounded-tr-3xl" />
            <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-yellow-400 rounded-bl-3xl" />
            <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-yellow-400 rounded-br-3xl" />
            
            <div className="text-6xl font-semibold leading-tight text-white">
              {question.question}
            </div>
          </div>
        </div>
        
        {/* Progress Dots */}
        <div className="flex justify-center gap-4 mt-12">
          <div className="w-4 h-4 rounded-full bg-yellow-400 shadow-lg" />
          <div className="w-4 h-4 rounded-full bg-yellow-400 shadow-lg" />
          <div className="w-4 h-4 rounded-full bg-yellow-400 shadow-lg" />
        </div>
      </div>
    </div>
  );
}

// Trophy Icon Component
const TrophyIcon = () => (
  <svg className="w-12 h-12 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

// Leaderboard View Component
function LeaderboardView({ 
  contestants, 
  leaderboard 
}: { 
  contestants: Array<{ id: string; name: string; photoUrl?: string; score?: number }>; 
  leaderboard: Array<{ contestantId: string; name: string; photoUrl?: string; score: number; position: number }> 
}) {
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

  const top3 = sortedContestants.slice(0, 3);
  const rest = sortedContestants.slice(3);

  const getRankColor = (position: number) => {
    if (position === 1) return "from-yellow-400 via-yellow-500 to-yellow-600";
    if (position === 2) return "from-gray-300 via-gray-400 to-gray-500";
    if (position === 3) return "from-orange-400 via-orange-500 to-orange-600";
    return "from-blue-400 to-blue-600";
  };

  const getRankBadgeColor = (position: number) => {
    if (position === 1) return "bg-yellow-500";
    if (position === 2) return "bg-gray-400";
    if (position === 3) return "bg-orange-500";
    return "bg-green-500";
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-12 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl w-full">
        {/* Title */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-4 mb-4">
            <TrophyIcon />
            <h1 className="text-8xl font-bold">
              <span className="bg-gradient-to-r from-yellow-500 to-yellow-600 bg-clip-text text-transparent">
                Leader
              </span>
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                board
              </span>
            </h1>
            <TrophyIcon />
          </div>
          <div className="h-2 bg-gradient-to-r from-yellow-400 via-blue-500 to-purple-600 rounded-full mx-auto max-w-2xl" />
        </div>

        {/* Top 3 Podium */}
        {top3.length > 0 && (
          <div className="flex items-end justify-center gap-8 mb-16">
            {/* 2nd Place */}
            {top3[1] && (
              <div className="flex flex-col items-center flex-1 max-w-xs">
                <div className="relative mb-4">
                  <div className="w-40 h-40 rounded-full bg-blue-600 overflow-hidden border-4 border-gray-300 shadow-2xl relative">
                    {top3[1].photoUrl ? (
                      <img
                        src={top3[1].photoUrl}
                        alt={top3[1].name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl text-white">
                        👤
                      </div>
                    )}
                  </div>
                  <div className="absolute -top-2 -right-2">
                    <svg className="w-10 h-10 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                </div>
                <div className="text-4xl font-bold text-gray-700 mb-2">{top3[1].name}</div>
                <div className={`px-6 py-2 rounded-xl ${getRankBadgeColor(2)} text-white text-2xl font-semibold mb-4`}>
                  {top3[1].score || 0} pts
                </div>
                <div className={`w-full h-32 bg-gradient-to-b ${getRankColor(2)} rounded-t-3xl flex items-center justify-center shadow-2xl`}>
                  <span className="text-6xl font-bold text-white">#2</span>
                </div>
              </div>
            )}

            {/* 1st Place */}
            {top3[0] && (
              <div className="flex flex-col items-center flex-1 max-w-xs">
                <div className="relative mb-4">
                  <div className="w-48 h-48 rounded-full bg-blue-600 overflow-hidden border-4 border-yellow-400 shadow-2xl relative">
                    {top3[0].photoUrl ? (
                      <img
                        src={top3[0].photoUrl}
                        alt={top3[0].name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-7xl text-white">
                        👤
                      </div>
                    )}
                  </div>
                  <div className="absolute -top-2 -right-2">
                    <svg className="w-12 h-12 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                </div>
                <div className="text-5xl font-bold text-gray-800 mb-2">{top3[0].name}</div>
                <div className={`px-8 py-3 rounded-xl ${getRankBadgeColor(1)} text-white text-3xl font-semibold mb-4`}>
                  {top3[0].score || 0} pts
                </div>
                <div className={`w-full h-40 bg-gradient-to-b ${getRankColor(1)} rounded-t-3xl flex items-center justify-center shadow-2xl`}>
                  <span className="text-7xl font-bold text-white">#1</span>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {top3[2] && (
              <div className="flex flex-col items-center flex-1 max-w-xs">
                <div className="relative mb-4">
                  <div className="w-40 h-40 rounded-full bg-blue-600 overflow-hidden border-4 border-orange-400 shadow-2xl relative">
                    {top3[2].photoUrl ? (
                      <img
                        src={top3[2].photoUrl}
                        alt={top3[2].name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl text-white">
                        👤
                      </div>
                    )}
                  </div>
                  <div className="absolute -top-2 -right-2">
                    <svg className="w-10 h-10 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                </div>
                <div className="text-4xl font-bold text-gray-700 mb-2">{top3[2].name}</div>
                <div className={`px-6 py-2 rounded-xl ${getRankBadgeColor(3)} text-white text-2xl font-semibold mb-4`}>
                  {top3[2].score || 0} pts
                </div>
                <div className={`w-full h-28 bg-gradient-to-b ${getRankColor(3)} rounded-t-3xl flex items-center justify-center shadow-2xl`}>
                  <span className="text-6xl font-bold text-white">#3</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Rest of the contestants */}
        {rest.length > 0 && (
          <div className="space-y-6 max-w-4xl mx-auto">
            {rest.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-8 p-6 bg-blue-100 rounded-2xl shadow-lg hover:shadow-xl transition-all"
              >
                <div className="px-6 py-3 bg-blue-600 text-white text-3xl font-bold rounded-xl">
                  #{entry.position}
                </div>
                <div className="w-24 h-24 rounded-full bg-blue-600 overflow-hidden flex-shrink-0 border-4 border-blue-300">
                  {entry.photoUrl ? (
                    <img
                      src={entry.photoUrl}
                      alt={entry.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl text-white">
                      👤
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-4xl font-bold text-gray-800">{entry.name}</div>
                </div>
                <div className="px-8 py-4 bg-green-500 text-white text-3xl font-semibold rounded-xl">
                  {entry.score || 0} pts
                </div>
              </div>
          ))}
        </div>
        )}
      </div>
    </div>
  );
}

// Photo View Component (shows contestant photo with points earned)
function PhotoView({ photoDisplay }: { photoDisplay: PhotoDisplayData }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-12 bg-gradient-to-br from-green-400 via-emerald-500 to-green-600">
      <div className="text-center">
        <div className="mb-12">
          <div className="w-80 h-80 rounded-full bg-white overflow-hidden mx-auto mb-8 shadow-2xl border-8 border-yellow-300">
            {photoDisplay.photoUrl ? (
              <img
                src={photoDisplay.photoUrl}
                alt={photoDisplay.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-8xl text-gray-400">
                👤
              </div>
            )}
          </div>
          <div className="text-6xl font-bold mb-6 text-white drop-shadow-lg">{photoDisplay.name}</div>
          <div className="text-9xl font-bold text-yellow-300 drop-shadow-2xl" style={{
            textShadow: '0 0 40px rgba(234, 179, 8, 0.8), 0 0 80px rgba(234, 179, 8, 0.6)'
          }}>
            +{photoDisplay.points} Points!
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainPage;
