import { useState, useEffect } from "react";
import { HostNavigation } from "@/components/host/HostNavigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QuizForm } from "@/components/quiz-editor/QuizForm";
import { quizApi } from "@/lib/api";
import type { Quiz, Category } from "../../../shared/types/index.js";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface SaveMessage {
  type: "success" | "error";
  text: string;
}

export default function QuizSetupPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [quizName, setQuizName] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<SaveMessage | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    loadQuizzes();
  }, []);

  useEffect(() => {
    if (selectedQuizId) {
      loadQuiz(selectedQuizId);
    } else {
      resetForm();
    }
  }, [selectedQuizId]);

  const loadQuizzes = async () => {
    try {
      const response = await quizApi.getAll();
      if (response.data.success) {
        setQuizzes(response.data.data || []);
      }
    } catch (error) {
      console.error("Error loading quizzes:", error);
    }
  };

  const loadQuiz = async (quizId: string) => {
    try {
      const response = await quizApi.getById(quizId);
      if (response.data.success && response.data.data) {
        const quiz = response.data.data;
        setQuizName(quiz.name);
        setCategories(quiz.categories || []);
      }
    } catch (error) {
      console.error("Error loading quiz:", error);
      setSaveMessage({ type: "error", text: "Failed to load quiz" });
    }
  };

  const resetForm = () => {
    setQuizName("");
    setCategories([]);
  };

  const handleNewQuiz = () => {
    setSelectedQuizId(null);
    resetForm();
    setSaveMessage(null);
  };

  const validateForm = (): string | null => {
    if (!quizName.trim()) {
      return "Please enter a quiz name";
    }

    if (categories.length === 0) {
      return "Please add at least one category";
    }

    for (const category of categories) {
      if (!category.name.trim()) {
        return "All categories must have a name";
      }
      if (category.questions.length === 0) {
        return `Category "${category.name}" must have at least one question`;
      }
      for (const question of category.questions) {
        if (!question.question.trim()) {
          return "All questions must have question text";
        }
        if (question.type === "mcq") {
          if (!question.options || question.options.length < 2) {
            return "MCQ questions must have at least 2 options";
          }
          if (!question.correctOptionId) {
            return "MCQ questions must have a correct answer selected";
          }
        } else {
          if (!question.answer.trim()) {
            return "Text questions must have an answer";
          }
        }
        if (question.points <= 0) {
          return "All questions must have positive point values";
        }
      }
    }

    return null;
  };

  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      setSaveMessage({ type: "error", text: validationError });
      return;
    }

    setLoading(true);
    try {
      const quizData = {
        name: quizName,
        categories,
      };

      if (selectedQuizId) {
        await quizApi.update(selectedQuizId, quizData);
        setSaveMessage({ type: "success", text: "Quiz updated successfully!" });
      } else {
        await quizApi.create(quizData);
        setSaveMessage({ type: "success", text: "Quiz created successfully!" });
      }

      await loadQuizzes();
      setTimeout(() => handleNewQuiz(), 1500);
    } catch (error) {
      console.error("Error saving quiz:", error);
      setSaveMessage({
        type: "error",
        text: selectedQuizId ? "Failed to update quiz" : "Failed to create quiz",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedQuizId) return;
    setShowDeleteConfirm(false);
    // TODO: Implement delete once endpoint is available
    setSaveMessage({ type: "error", text: "Delete functionality coming soon" });
  };

  return (
    <div className="min-h-screen bg-background">
      <HostNavigation />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Save Message Banner */}
          {saveMessage && (
            <div
              className={`p-4 rounded-lg flex items-center gap-3 ${
                saveMessage.type === "success"
                  ? "bg-green-50 border border-green-200 text-green-900"
                  : "bg-red-50 border border-red-200 text-red-900"
              }`}
            >
              {saveMessage.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <p className="text-sm font-medium flex-1">{saveMessage.text}</p>
              <button
                onClick={() => setSaveMessage(null)}
                className="text-xs opacity-60 hover:opacity-100"
              >
                ✕
              </button>
            </div>
          )}

          {/* Quiz Management */}
          <Card className="p-4 flex items-center gap-4">
            <Select
              value={selectedQuizId || ""}
              onValueChange={(value) => setSelectedQuizId(value || null)}
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select Quiz" />
              </SelectTrigger>
              <SelectContent>
                {quizzes.map((quiz) => (
                  <SelectItem key={quiz.id} value={quiz.id}>
                    {quiz.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleNewQuiz} variant="outline">
              + New Quiz
            </Button>
            {selectedQuizId && (
              <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="text-destructive">
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogTitle>Delete Quiz?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this quiz? This action cannot be undone.
                  </AlertDialogDescription>
                  <div className="flex gap-2 justify-end">
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive">
                      Delete
                    </AlertDialogAction>
                  </div>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </Card>

          {/* Quiz Form */}
          <Card className="p-6">
            <QuizForm
              quizName={quizName}
              categories={categories}
              onQuizNameChange={setQuizName}
              onCategoriesChange={setCategories}
            />

            {/* Actions */}
            <div className="flex gap-4 pt-8 border-t mt-8">
              <Button onClick={handleSave} disabled={loading} size="lg">
                {loading ? "Saving..." : "Save Quiz"}
              </Button>
              <Button
                variant="outline"
                onClick={handleNewQuiz}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

