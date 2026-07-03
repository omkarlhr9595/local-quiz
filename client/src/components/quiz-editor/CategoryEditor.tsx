import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { QuestionCard } from "./QuestionCard";
import { QuestionEditorDialog } from "./QuestionEditorDialog";
import { Trash2, Plus } from "lucide-react";
import type { Category, Question } from "../../../../shared/types/index.js";

interface CategoryEditorProps {
  category: Category;
  categoryIndex: number;
  onUpdate: (category: Category) => void;
  onDelete: () => void;
}

export const CategoryEditor = ({
  category,
  categoryIndex,
  onUpdate,
  onDelete,
}: CategoryEditorProps) => {
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | undefined>();
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);

  const handleCategoryNameChange = (name: string) => {
    onUpdate({ ...category, name });
  };

  const handleAddQuestion = () => {
    setSelectedQuestion(undefined);
    setIsAddingQuestion(true);
    setIsEditingQuestion(true);
  };

  const handleEditQuestion = (question: Question) => {
    setSelectedQuestion(question);
    setIsAddingQuestion(false);
    setIsEditingQuestion(true);
  };

  const handleSaveQuestion = (question: Question) => {
    const questionIndex = category.questions.findIndex(
      (q) => q.question === selectedQuestion?.question
    );

    let updatedQuestions: Question[];
    if (isAddingQuestion) {
      // Add new question
      updatedQuestions = [...category.questions, question];
    } else {
      // Update existing question
      updatedQuestions = [...category.questions];
      updatedQuestions[questionIndex] = question;
    }

    onUpdate({ ...category, questions: updatedQuestions });
    setIsEditingQuestion(false);
    setSelectedQuestion(undefined);
  };

  const handleDeleteQuestion = (index: number) => {
    const updatedQuestions = category.questions.filter((_, i) => i !== index);
    onUpdate({ ...category, questions: updatedQuestions });
  };

  return (
    <Card className="p-4 space-y-4 border-l-4 border-l-primary">
      {/* Category Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 space-y-2">
          <Label htmlFor={`category-${categoryIndex}`} className="text-xs text-muted-foreground">
            Category Name
          </Label>
          <Input
            id={`category-${categoryIndex}`}
            value={category.name}
            onChange={(e) => handleCategoryNameChange(e.target.value)}
            placeholder="E.g., Science, History..."
          />
        </div>
        <div className="flex flex-col gap-2 items-end">
          <Badge variant="secondary">{category.questions.length} questions</Badge>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogTitle>Delete Category?</AlertDialogTitle>
              <AlertDialogDescription>
                This will delete the category "{category.name}" and all its {category.questions.length} questions. This action cannot be undone.
              </AlertDialogDescription>
              <div className="flex gap-2 justify-end">
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete} className="bg-destructive">
                  Delete
                </AlertDialogAction>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Questions</Label>
        </div>
        <div className="space-y-2">
          {category.questions.map((question, index) => (
            <QuestionCard
              key={`${question.question}-${index}`}
              question={question}
              index={index}
              onEdit={() => handleEditQuestion(question)}
              onDelete={() => handleDeleteQuestion(index)}
            />
          ))}
        </div>
      </div>

      {/* Add Question Button */}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleAddQuestion}
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Question
      </Button>

      {/* Question Editor Dialog */}
      <QuestionEditorDialog
        isOpen={isEditingQuestion}
        question={selectedQuestion}
        onSave={handleSaveQuestion}
        onClose={() => setIsEditingQuestion(false)}
      />
    </Card>
  );
};
