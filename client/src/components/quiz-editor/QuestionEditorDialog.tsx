import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { QuestionTypeToggle } from "./QuestionTypeToggle";
import { McqOptionsEditor } from "./McqOptionsEditor";
import { ImageUploader } from "./ImageUploader";
import type { Question, QuestionType, QuestionOption } from "../../../../shared/types/index.js";

interface QuestionEditorDialogProps {
  isOpen: boolean;
  question?: Question;
  questionIndex?: number | null;
  onSave: (question: Question) => void;
  onClose: () => void;
}

const DEFAULT_QUESTION: Question = {
  points: 100,
  question: "",
  answer: "",
  type: "text",
  options: [],
};

const getDefaultPoints = (questionIndex: number | null | undefined): number => {
  if (questionIndex === null || questionIndex === undefined) {
    return 100;
  }
  // Points scale: 1st=100, 2nd=200, 3rd=300, 4th=400, 5th=500
  return Math.min((questionIndex + 1) * 100, 500);
};

export const QuestionEditorDialog = ({
  isOpen,
  question: initialQuestion,
  questionIndex,
  onSave,
  onClose,
}: QuestionEditorDialogProps) => {
  const getInitialQuestion = (): Question => {
    if (initialQuestion) {
      return initialQuestion;
    }
    // When adding a new question, use index-based default points
    const defaultPoints = getDefaultPoints(questionIndex);
    return { ...DEFAULT_QUESTION, points: defaultPoints };
  };

  const [question, setQuestion] = useState<Question>(getInitialQuestion());
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      // Defer state update to prevent cascading renders
      setTimeout(() => {
        setQuestion(getInitialQuestion());
        setErrors({});
      }, 0);
    }
  }, [isOpen, initialQuestion, questionIndex]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!question.question || !question.question.trim()) {
      newErrors.question = "Question text is required";
    }

    if (typeof question.points !== "number" || question.points <= 0) {
      newErrors.points = "Points must be a positive number";
    }

    if (question.type === "mcq") {
      if (!question.options || question.options.length < 2) {
        newErrors.options = "MCQ must have at least 2 options";
      }
      if (question.options && question.options.length > 6) {
        newErrors.options = "MCQ cannot have more than 6 options";
      }
      if (!question.correctOptionId) {
        newErrors.correctOptionId = "Please select the correct answer";
      }
    } else {
      if (!question.answer || !question.answer.trim()) {
        newErrors.answer = "Answer is required for text questions";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      onSave(question);
      onClose();
    }
  };

  const handleTypeChange = (type: QuestionType) => {
    if (type === "mcq" && !question.options) {
      setQuestion({
        ...question,
        type,
        options: [
          { id: "opt-1", text: "" },
          { id: "opt-2", text: "" },
        ],
        correctOptionId: undefined,
      });
    } else {
      setQuestion({ ...question, type });
    }
  };

  const handleOptionsChange = (options: QuestionOption[]) => {
    setQuestion({ ...question, options });
  };

  const handleCorrectOptionChange = (optionId: string) => {
    const selectedOption = question.options?.find((opt) => opt.id === optionId);
    setQuestion({
      ...question,
      correctOptionId: optionId,
      answer: selectedOption?.text || question.answer,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialQuestion ? "Edit Question" : "Add Question"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Points */}
          <div className="space-y-2">
            <Label htmlFor="points">Points</Label>
            <Input
              id="points"
              type="number"
              value={question.points}
              onChange={(e) => setQuestion({ ...question, points: Number(e.target.value) })}
              min="1"
              step="10"
            />
            {errors.points && <p className="text-sm text-destructive">{errors.points}</p>}
          </div>

          {/* Question Text */}
          <div className="space-y-2">
            <Label htmlFor="question">Question</Label>
            <Textarea
              id="question"
              value={question.question}
              onChange={(e) => setQuestion({ ...question, question: e.target.value })}
              placeholder="Enter your question here..."
              rows={3}
            />
            {errors.question && <p className="text-sm text-destructive">{errors.question}</p>}
          </div>

          {/* Question Type Toggle */}
          <QuestionTypeToggle
            value={question.type}
            onChange={handleTypeChange}
          />

          {/* Answer Options - Text or MCQ */}
          {question.type === "mcq" ? (
            <div className="space-y-2">
              <McqOptionsEditor
                options={question.options || []}
                correctOptionId={question.correctOptionId}
                onChange={handleOptionsChange}
                onCorrectOptionChange={handleCorrectOptionChange}
              />
              {errors.options && <p className="text-sm text-destructive">{errors.options}</p>}
              {errors.correctOptionId && (
                <p className="text-sm text-destructive">{errors.correctOptionId}</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="answer">Answer</Label>
              <Textarea
                id="answer"
                value={question.answer}
                onChange={(e) => setQuestion({ ...question, answer: e.target.value })}
                placeholder="Enter the correct answer..."
                rows={2}
              />
              {errors.answer && <p className="text-sm text-destructive">{errors.answer}</p>}
            </div>
          )}

          {/* Image Upload */}
          <ImageUploader
            imageUrl={question.imageUrl}
            onImageUrlChange={(url) => setQuestion({ ...question, imageUrl: url })}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Question
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
