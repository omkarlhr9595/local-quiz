import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";

export function QuestionPointOverride() {
  const { game, quiz, contestants } = useGameStore();
  const { socket, gameId } = useSocketStore();
  const [selectedQuestions, setSelectedQuestions] = useState<{
    [key: string]: { contestantId: string; points: number };
  }>({});

  if (!game || !quiz || !game.answeredQuestions || game.answeredQuestions.length === 0) {
    return null;
  }

  const handleAwardPoints = (
    categoryIndex: number,
    questionIndex: number,
    contestantId: string,
    points: number
  ) => {
    if (socket && gameId) {
      socket.emit("host-manual-award-points", {
        gameId,
        categoryIndex,
        questionIndex,
        contestantId,
        points,
      });

      // Clear selection for this question
      const key = `${categoryIndex}-${questionIndex}`;
      setSelectedQuestions((prev) => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
    }
  };

  const getQuestionInfo = (categoryIndex: number, questionIndex: number) => {
    const category = quiz.categories[categoryIndex];
    if (!category) return null;

    const question = category.questions[questionIndex];
    if (!question) return null;

    return {
      categoryName: category.name,
      questionText: question.question,
      points: question.points,
    };
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="font-semibold text-sm mb-3">Award Points for Answered Questions</div>
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {game.answeredQuestions.map((aq, index) => {
            const questionInfo = getQuestionInfo(aq.categoryIndex, aq.questionIndex);
            if (!questionInfo) return null;

            const key = `${aq.categoryIndex}-${aq.questionIndex}`;
            const selection = selectedQuestions[key] || { contestantId: "", points: questionInfo.points };

            return (
              <Card key={index} className="p-3 border">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{questionInfo.categoryName}</Badge>
                    <Badge variant="outline">{questionInfo.points} pts</Badge>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {questionInfo.questionText}
                  </p>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label className="text-xs text-gray-500 mb-1 block">
                        Contestant
                      </Label>
                      <Select
                        value={selection.contestantId}
                        onValueChange={(value) => {
                          setSelectedQuestions((prev) => ({
                            ...prev,
                            [key]: { ...selection, contestantId: value },
                          }));
                        }}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select contestant" />
                        </SelectTrigger>
                        <SelectContent>
                          {contestants.map((contestant) => (
                            <SelectItem key={contestant.id} value={contestant.id}>
                              {contestant.name || `Contestant ${contestant.id.slice(0, 8)}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-24">
                      <Label className="text-xs text-gray-500 mb-1 block">
                        Points
                      </Label>
                      <input
                        type="number"
                        min="0"
                        max={questionInfo.points * 2}
                        value={selection.points}
                        onChange={(e) => {
                          const points = parseInt(e.target.value) || 0;
                          setSelectedQuestions((prev) => ({
                            ...prev,
                            [key]: { ...selection, points },
                          }));
                        }}
                        className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={() =>
                        handleAwardPoints(
                          aq.categoryIndex,
                          aq.questionIndex,
                          selection.contestantId,
                          selection.points
                        )
                      }
                      disabled={!selection.contestantId || selection.points <= 0}
                    >
                      Award
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

