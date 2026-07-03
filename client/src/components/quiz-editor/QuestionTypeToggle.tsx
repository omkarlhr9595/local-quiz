import { Button } from "@/components/ui/button";
import type { QuestionType } from "../../../../shared/types/index.js";

interface QuestionTypeToggleProps {
  value: QuestionType | undefined;
  onChange: (type: QuestionType) => void;
}

export const QuestionTypeToggle = ({ value, onChange }: QuestionTypeToggleProps) => {
  const type = value || "text";

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Question Type</label>
      <div className="flex gap-2">
        <Button
          type="button"
          variant={type === "text" ? "default" : "outline"}
          size="sm"
          onClick={() => onChange("text")}
        >
          Text Answer
        </Button>
        <Button
          type="button"
          variant={type === "mcq" ? "default" : "outline"}
          size="sm"
          onClick={() => onChange("mcq")}
        >
          Multiple Choice
        </Button>
      </div>
    </div>
  );
};
