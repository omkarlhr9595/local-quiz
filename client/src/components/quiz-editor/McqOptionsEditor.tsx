import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Trash2 } from "lucide-react";
import type { QuestionOption } from "../../../../shared/types/index.js";

interface McqOptionsEditorProps {
  options: QuestionOption[];
  correctOptionId: string | undefined;
  onChange: (options: QuestionOption[]) => void;
  onCorrectOptionChange: (optionId: string) => void;
}

export const McqOptionsEditor = ({
  options,
  correctOptionId,
  onChange,
  onCorrectOptionChange,
}: McqOptionsEditorProps) => {
  const handleAddOption = () => {
    if (options.length < 6) {
      const newOption: QuestionOption = {
        id: `opt-${Date.now()}`,
        text: "",
      };
      onChange([...options, newOption]);
    }
  };

  const handleUpdateOption = (id: string, text: string) => {
    onChange(
      options.map((opt) =>
        opt.id === id ? { ...opt, text } : opt
      )
    );
  };

  const handleDeleteOption = (id: string) => {
    const newOptions = options.filter((opt) => opt.id !== id);
    onChange(newOptions);

    // If we deleted the correct option, clear the selection
    if (correctOptionId === id) {
      onCorrectOptionChange("");
    }
  };

  return (
    <div className="space-y-4">
      <Label>Answer Options</Label>
      <RadioGroup value={correctOptionId || ""} onValueChange={onCorrectOptionChange}>
        <div className="space-y-3">
          {options.map((option, index) => (
            <div key={option.id} className="flex items-start gap-3 p-3 border rounded-lg bg-card">
              <RadioGroupItem
                value={option.id}
                id={`option-${option.id}`}
                className="mt-2.5"
              />
              <div className="flex-1 space-y-1">
                <Label htmlFor={`option-${option.id}`} className="text-sm font-normal">
                  Option {index + 1}
                </Label>
                <Input
                  value={option.text}
                  onChange={(e) => handleUpdateOption(option.id, e.target.value)}
                  placeholder="Enter option text..."
                  className="text-sm"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteOption(option.id)}
                disabled={options.length <= 2}
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </RadioGroup>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAddOption}
        disabled={options.length >= 6}
        className="w-full"
      >
        + Add Option {options.length < 6 && `(${options.length}/6)`}
      </Button>

      {!correctOptionId && options.length > 0 && (
        <p className="text-sm text-amber-600">Please select the correct answer</p>
      )}
    </div>
  );
};
