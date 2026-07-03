import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useGameStore } from "@/store/gameStore";
import { useSocketStore } from "@/store/socketStore";
import { CheckCircle2 } from "lucide-react";

interface QuestionPreviewProps {
  categoryIndex: number;
  questionIndex: number;
}

export function QuestionPreview({
  categoryIndex,
  questionIndex,
}: QuestionPreviewProps) {
  const { quiz } = useGameStore();
  const { socket, gameId } = useSocketStore();
  const [isRevealed, setIsRevealed] = useState(false);
  const [mcqAnswerRevealed, setMcqAnswerRevealed] = useState(false);
  const prevKeyRef = useRef(`${categoryIndex}-${questionIndex}`);

  // Reset states when question changes
  useEffect(() => {
    const currentKey = `${categoryIndex}-${questionIndex}`;
    if (prevKeyRef.current !== currentKey) {
      prevKeyRef.current = currentKey;
      const timer = setTimeout(() => {
        setIsRevealed(false);
        setMcqAnswerRevealed(false);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [categoryIndex, questionIndex]);

  // Listen for MCQ answer reveal
  useEffect(() => {
    if (!socket) return;

    socket.on("mcq-answer-revealed", () => {
      setMcqAnswerRevealed(true);
    });

    return () => {
      socket.off("mcq-answer-revealed");
    };
  }, [socket]);

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

  const handleRevealMcqAnswer = () => {
    if (socket && gameId) {
      socket.emit("host-reveal-mcq-answer", { gameId });
      setMcqAnswerRevealed(true);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Badge variant="secondary">
              {category.name}
            </Badge>
            <Badge variant="outline">{question.points} points</Badge>
            {question.type === "mcq" && (
              <Badge variant="outline">MCQ</Badge>
            )}
          </div>
        </div>

        {/* Question Image */}
        {question.imageUrl && (
          <div className="rounded-lg border overflow-hidden">
            <img
              src={question.imageUrl}
              alt="Question"
              className="max-h-64 w-full object-contain bg-muted"
            />
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Question:</Label>
          <p className="text-lg font-medium">{question.question}</p>
        </div>

        {/* MCQ Options (host sees correct answer marked) */}
        {question.type === "mcq" && question.options ? (
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Options:</Label>
            <div className="space-y-2">
              {question.options.map((option) => (
                <div
                  key={option.id}
                  className={`p-3 rounded-lg border flex items-start gap-2 ${
                    option.id === question.correctOptionId
                      ? "bg-green-50 border-green-300"
                      : "bg-card border-border"
                  }`}
                >
                  {option.id === question.correctOptionId && (
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  )}
                  <p className="text-sm">{option.text}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Text Answer */
          <div className="space-y-2 border-t pt-4">
            <Label className="text-sm text-muted-foreground">Answer:</Label>
            <p className="text-sm font-medium text-foreground">{question.answer}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {!isRevealed && (
            <Button onClick={handleReveal} className="flex-1" size="lg">
              Reveal Question
            </Button>
          )}

          {isRevealed && question.type === "mcq" && (
            <Button
              onClick={handleRevealMcqAnswer}
              disabled={mcqAnswerRevealed}
              className="flex-1"
              variant={mcqAnswerRevealed ? "outline" : "default"}
            >
              {mcqAnswerRevealed ? "✓ Answer Revealed" : "Reveal Correct Answer"}
            </Button>
          )}

          {isRevealed && (
            <div className="flex-1 flex items-center justify-center text-green-600 font-medium text-sm">
              ✓ Revealed
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

