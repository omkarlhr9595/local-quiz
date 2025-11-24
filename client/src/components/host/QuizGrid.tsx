import { useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { useSocketStore } from "@/store/socketStore";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface QuizGridProps {
  onCardSelect: (categoryIndex: number, questionIndex: number) => void;
}

export function QuizGrid({ onCardSelect }: QuizGridProps) {
  const { quiz, game } = useGameStore();
  const [selectedCard, setSelectedCard] = useState<{
    categoryIndex: number;
    questionIndex: number;
  } | null>(null);

  if (!quiz || !quiz.categories.length) {
    return (
      <div className="p-8 text-center text-gray-500">
        No quiz loaded. Please select a quiz.
      </div>
    );
  }

  const isCardAnswered = (categoryIndex: number, questionIndex: number) => {
    if (!game) return false;
    
    // Check if this question has been answered
    const isAnswered = game.answeredQuestions?.some(
      (aq) => aq.categoryIndex === categoryIndex && aq.questionIndex === questionIndex
    );
    
    // Also check if this question is currently revealed
    const isCurrentlyRevealed = game.currentQuestion?.categoryIndex === categoryIndex &&
      game.currentQuestion?.questionIndex === questionIndex;
    
    return isAnswered || isCurrentlyRevealed;
  };

  const handleCardClick = (categoryIndex: number, questionIndex: number) => {
    if (isCardAnswered(categoryIndex, questionIndex)) return;
    
    setSelectedCard({ categoryIndex, questionIndex });
    onCardSelect(categoryIndex, questionIndex);
  };

  const maxQuestions = Math.max(
    ...quiz.categories.map((cat) => cat.questions.length)
  );

  return (
    <div className="p-6">
      <div className="space-y-4">
        {/* Category Headers */}
        <div className="grid gap-4" style={{
          gridTemplateColumns: `repeat(${quiz.categories.length}, 1fr)`,
        }}>
          {quiz.categories.map((category, catIdx) => (
            <div key={catIdx} className="text-center font-bold text-lg">
              {category.name}
            </div>
          ))}
        </div>

        {/* Question Rows */}
        {Array.from({ length: maxQuestions }).map((_, qIdx) => (
          <div
            key={qIdx}
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${quiz.categories.length}, 1fr)`,
            }}
          >
            {quiz.categories.map((category, catIdx) => {
              const question = category.questions[qIdx];
              if (!question) return <div key={catIdx} />;

              const isSelected =
                selectedCard?.categoryIndex === catIdx &&
                selectedCard?.questionIndex === qIdx;
              const isAnswered = isCardAnswered(catIdx, qIdx);

              return (
                <Card
                  key={catIdx}
                  className={cn(
                    "p-4 cursor-pointer transition-all hover:shadow-lg",
                    isSelected && "ring-2 ring-yellow-500 bg-yellow-50",
                    isAnswered && "opacity-50 cursor-not-allowed bg-gray-100",
                    !isSelected && !isAnswered && "hover:bg-blue-50"
                  )}
                  onClick={() => handleCardClick(catIdx, qIdx)}
                >
                  <div className="text-center">
                    <Badge variant="secondary" className="text-lg font-bold">
                      {question.points}
                    </Badge>
                    {isSelected && (
                      <div className="mt-2 text-xs text-yellow-600">
                        Selected
                      </div>
                    )}
                    {isAnswered && (
                      <div className="mt-2 text-xs text-gray-500">✓</div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

