import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2, Image as ImageIcon } from "lucide-react";
import type { Question } from "../../../../shared/types/index.js";

interface QuestionCardProps {
  question: Question;
  index: number;
  onEdit: (question: Question) => void;
  onDelete: () => void;
}

export const QuestionCard = ({ question, index, onEdit, onDelete }: QuestionCardProps) => {
  const truncatedQuestion = question.question.length > 60
    ? `${question.question.substring(0, 60)}...`
    : question.question;

  return (
    <Card className="p-3 flex items-center justify-between gap-3 hover:bg-accent/50 transition-colors">
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {question.points} pts
          </Badge>
          {question.type === "mcq" && (
            <Badge variant="outline" className="text-xs">
              MCQ
            </Badge>
          )}
          {question.imageUrl && (
            <ImageIcon className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">
          Q{index + 1}: {truncatedQuestion}
        </p>
      </div>

      <div className="flex gap-1 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(question)}
          className="text-foreground"
        >
          <Edit2 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
};
