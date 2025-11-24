import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useGameStore } from "@/store/gameStore";
import { useSocketStore } from "@/store/socketStore";

interface QuestionPreviewProps {
  categoryIndex: number;
  questionIndex: number;
}

export function QuestionPreview({
  categoryIndex,
  questionIndex,
}: QuestionPreviewProps) {
  const { quiz, currentQuestion } = useGameStore();
  const { socket, gameId } = useSocketStore();
  const [isRevealed, setIsRevealed] = useState(false);

  // Reset isRevealed when:
  // 1. The selected question changes (different categoryIndex or questionIndex)
  // 2. The currentQuestion is cleared (becomes null)
  useEffect(() => {
    setIsRevealed(false);
  }, [categoryIndex, questionIndex, currentQuestion]);

  if (!quiz) return null;

  const category = quiz.categories[categoryIndex];
  const question = category?.questions[questionIndex];

  if (!question) return null;

  const handleReveal = () => {
    if (socket && gameId) {
      socket.emit("host-reveal-question", {
        gameId,
        categoryIndex,
        questionIndex,
      });
      setIsRevealed(true);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Badge variant="secondary" className="mr-2">
              {category.name}
            </Badge>
            <Badge variant="outline">{question.points} points</Badge>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm text-gray-500">Question:</Label>
          <p className="text-lg font-medium">{question.question}</p>
        </div>

        <div className="space-y-2 border-t pt-4">
          <Label className="text-sm text-gray-500">Answer:</Label>
          <p className="text-sm text-gray-700">{question.answer}</p>
        </div>

        {!isRevealed && (
          <Button onClick={handleReveal} className="w-full" size="lg">
            Reveal Question
          </Button>
        )}

        {isRevealed && (
          <div className="text-center text-green-600 font-medium">
            ✓ Question Revealed
          </div>
        )}
      </div>
    </Card>
  );
}

