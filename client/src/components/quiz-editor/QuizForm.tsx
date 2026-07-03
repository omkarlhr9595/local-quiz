import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { CategoryEditor } from "./CategoryEditor";
import { Plus } from "lucide-react";
import type { Category } from "../../../../shared/types/index.js";

interface QuizFormProps {
  quizName: string;
  categories: Category[];
  onQuizNameChange: (name: string) => void;
  onCategoriesChange: (categories: Category[]) => void;
}

export const QuizForm = ({
  quizName,
  categories,
  onQuizNameChange,
  onCategoriesChange,
}: QuizFormProps) => {
  const handleAddCategory = () => {
    const newCategory: Category = {
      name: "",
      questions: [],
    };
    onCategoriesChange([...categories, newCategory]);
  };

  const handleUpdateCategory = (categoryIndex: number, category: Category) => {
    const updatedCategories = [...categories];
    updatedCategories[categoryIndex] = category;
    onCategoriesChange(updatedCategories);
  };

  const handleDeleteCategory = (categoryIndex: number) => {
    const updatedCategories = categories.filter((_, i) => i !== categoryIndex);
    onCategoriesChange(updatedCategories);
  };

  return (
    <div className="space-y-6">
      {/* Quiz Name */}
      <Card className="p-4 space-y-2 bg-gradient-to-r from-primary/5 to-primary/10">
        <Label htmlFor="quiz-name" className="text-sm font-semibold">
          Quiz Name
        </Label>
        <Input
          id="quiz-name"
          value={quizName}
          onChange={(e) => onQuizNameChange(e.target.value)}
          placeholder="Enter quiz name (e.g., 'General Knowledge 101')"
          className="text-lg font-medium"
        />
      </Card>

      {/* Categories */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-semibold">Categories ({categories.length})</h3>
        </div>

        {categories.length === 0 ? (
          <Card className="p-8 text-center border-dashed">
            <p className="text-sm text-muted-foreground mb-4">
              No categories yet. Click below to add your first category.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {categories.map((category, index) => (
              <CategoryEditor
                key={index}
                category={category}
                categoryIndex={index}
                onUpdate={(updated) => handleUpdateCategory(index, updated)}
                onDelete={() => handleDeleteCategory(index)}
              />
            ))}
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleAddCategory}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>
    </div>
  );
};
