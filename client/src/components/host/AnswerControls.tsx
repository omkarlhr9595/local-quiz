import { Button } from "@/components/ui/button";
import { useGameStore } from "@/store/gameStore";
import { useSocketStore } from "@/store/socketStore";

export function AnswerControls() {
  const { currentAnswering, currentQuestion, contestants } = useGameStore();
  const { socket, gameId } = useSocketStore();

  const answeringContestant = contestants.find(
    (c) => c.id === currentAnswering
  );

  if (!currentAnswering || !currentQuestion) {
    return null;
  }

  const handleAnswer = (isCorrect: boolean) => {
    if (socket && gameId && currentAnswering) {
      socket.emit("host-answer-confirm", {
        gameId,
        contestantId: currentAnswering,
        isCorrect,
        points: isCorrect ? currentQuestion.points : 0,
      });
    }
  };

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">
        Contestant Answering: {answeringContestant?.name || currentAnswering}
      </div>
      <div className="flex gap-3">
        <Button
          onClick={() => handleAnswer(true)}
          className="flex-1 bg-green-600 hover:bg-green-700"
          size="lg"
        >
          ✓ Correct
        </Button>
        <Button
          onClick={() => handleAnswer(false)}
          variant="destructive"
          className="flex-1"
          size="lg"
        >
          ✗ Incorrect
        </Button>
      </div>
    </div>
  );
}

