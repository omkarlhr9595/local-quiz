import { useState, useEffect } from "react";
import { HostNavigation } from "@/components/host/HostNavigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { quizApi } from "@/lib/api";
import type { Quiz, Category, Question } from "../../../shared/types/index.js";

export default function QuizSetupPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [quizName, setQuizName] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

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
    }
  };

  const resetForm = () => {
    setQuizName("");
    setCategories([]);
  };

  const handleNewQuiz = () => {
    setSelectedQuizId(null);
    resetForm();
  };

  const handleAddCategory = () => {
    setCategories([
      ...categories,
      {
        name: "",
        questions: [],
      },
    ]);
  };

  const handleDeleteCategory = (index: number) => {
    setCategories(categories.filter((_, i) => i !== index));
  };

  const handleCategoryNameChange = (index: number, name: string) => {
    const updated = [...categories];
    updated[index].name = name;
    setCategories(updated);
  };

  const handleAddQuestion = (categoryIndex: number) => {
    const updated = [...categories];
    updated[categoryIndex].questions.push({
      points: 100,
      question: "",
      answer: "",
    });
    setCategories(updated);
  };

  const handleDeleteQuestion = (categoryIndex: number, questionIndex: number) => {
    const updated = [...categories];
    updated[categoryIndex].questions = updated[categoryIndex].questions.filter(
      (_, i) => i !== questionIndex
    );
    setCategories(updated);
  };

  const handleQuestionChange = (
    categoryIndex: number,
    questionIndex: number,
    field: keyof Question,
    value: string | number
  ) => {
    const updated = [...categories];
    updated[categoryIndex].questions[questionIndex] = {
      ...updated[categoryIndex].questions[questionIndex],
      [field]: value,
    };
    setCategories(updated);
  };

  const handleSave = async () => {
    if (!quizName.trim()) {
      alert("Please enter a quiz name");
      return;
    }

    if (categories.length === 0) {
      alert("Please add at least one category");
      return;
    }

    for (const category of categories) {
      if (!category.name.trim()) {
        alert("All categories must have a name");
        return;
      }
      if (category.questions.length === 0) {
        alert(`Category "${category.name}" must have at least one question`);
        return;
      }
      for (const question of category.questions) {
        if (!question.question.trim() || !question.answer.trim()) {
          alert("All questions must have both question and answer text");
          return;
        }
        if (question.points <= 0) {
          alert("All questions must have positive point values");
          return;
        }
      }
    }

    setLoading(true);
    try {
      const quizData = {
        name: quizName,
        categories: categories.map((cat) => ({
          name: cat.name,
          questions: cat.questions.map((q) => ({
            points: typeof q.points === "number" ? q.points : parseInt(String(q.points), 10),
            question: q.question,
            answer: q.answer,
          })),
        })),
      };

      if (selectedQuizId) {
        // Update existing quiz
        await quizApi.update(selectedQuizId, quizData);
        alert("Quiz updated successfully!");
      } else {
        // Create new quiz
        await quizApi.create(quizData);
        alert("Quiz created successfully!");
      }

      await loadQuizzes();
      handleNewQuiz();
    } catch (error) {
      console.error("Error saving quiz:", error);
      alert(selectedQuizId ? "Failed to update quiz" : "Failed to create quiz");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedQuizId) return;
    if (!confirm("Are you sure you want to delete this quiz?")) return;

    // TODO: Add delete API endpoint
    alert("Delete functionality coming soon");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <HostNavigation />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-6">
          {/* Quiz Management */}
          <Card className="p-6">
            <div className="flex items-center gap-4 mb-4">
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
              <Button onClick={handleNewQuiz}>+ New Quiz</Button>
              {selectedQuizId && (
                <>
                  <Button variant="outline" onClick={handleDelete}>
                    Delete
                  </Button>
                </>
              )}
            </div>
          </Card>

          {/* Quiz Form */}
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <Label htmlFor="quiz-name" className="text-lg font-semibold">
                  Quiz Name
                </Label>
                <Input
                  id="quiz-name"
                  value={quizName}
                  onChange={(e) => setQuizName(e.target.value)}
                  placeholder="Enter quiz name"
                  className="mt-2"
                />
              </div>

              {/* Categories */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold">Categories</Label>
                  <Button onClick={handleAddCategory} variant="outline">
                    + Add Category
                  </Button>
                </div>

                {categories.map((category, catIndex) => (
                  <Card key={catIndex} className="p-4 border-2">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Input
                          value={category.name}
                          onChange={(e) =>
                            handleCategoryNameChange(catIndex, e.target.value)
                          }
                          placeholder="Category name"
                          className="flex-1"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteCategory(catIndex)}
                        >
                          Delete Category
                        </Button>
                      </div>

                      {/* Questions */}
                      <div className="space-y-3 pl-4 border-l-2">
                        {category.questions.map((question, qIndex) => (
                          <Card key={qIndex} className="p-3 bg-gray-50">
                            <div className="grid grid-cols-12 gap-3">
                              <div className="col-span-2">
                                <Label className="text-xs">Points</Label>
                                <Input
                                  type="number"
                                  value={question.points}
                                  onChange={(e) =>
                                    handleQuestionChange(
                                      catIndex,
                                      qIndex,
                                      "points",
                                      parseInt(e.target.value, 10) || 0
                                    )
                                  }
                                  className="mt-1"
                                />
                              </div>
                              <div className="col-span-8">
                                <Label className="text-xs">Question</Label>
                                <Input
                                  value={question.question}
                                  onChange={(e) =>
                                    handleQuestionChange(
                                      catIndex,
                                      qIndex,
                                      "question",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Enter question"
                                  className="mt-1"
                                />
                              </div>
                              <div className="col-span-2">
                                <Label className="text-xs">Answer</Label>
                                <Input
                                  value={question.answer}
                                  onChange={(e) =>
                                    handleQuestionChange(
                                      catIndex,
                                      qIndex,
                                      "answer",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Enter answer"
                                  className="mt-1"
                                />
                              </div>
                            </div>
                            <div className="mt-2">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() =>
                                  handleDeleteQuestion(catIndex, qIndex)
                                }
                              >
                                Delete Question
                              </Button>
                            </div>
                          </Card>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddQuestion(catIndex)}
                        >
                          + Add Question
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}

                {categories.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    No categories yet. Click "Add Category" to get started.
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4">
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
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

