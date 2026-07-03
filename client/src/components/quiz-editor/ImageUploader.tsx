import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { quizApi } from "@/lib/api";
import { Loader2, Trash2, Image as ImageIcon } from "lucide-react";

interface ImageUploaderProps {
  imageUrl: string | undefined;
  onImageUrlChange: (url: string | undefined) => void;
}

export const ImageUploader = ({ imageUrl, onImageUrlChange }: ImageUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const response = await quizApi.uploadQuestionImage(file);
      if (response.data.success) {
        onImageUrlChange(response.data.data.imageUrl);
      } else {
        setError("Failed to upload image");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setIsUploading(false);
      // Reset input
      event.target.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <Label>Question Image (Optional)</Label>

      {imageUrl && (
        <div className="relative inline-block">
          <img
            src={imageUrl}
            alt="Question preview"
            className="max-h-48 max-w-full rounded-lg border object-contain"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => onImageUrlChange(undefined)}
            className="absolute top-2 right-2"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )}

      {!imageUrl && (
        <div className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center gap-2 bg-card hover:bg-accent/50 transition-colors">
          <ImageIcon className="w-8 h-8 text-muted-foreground" />
          <p className="text-sm font-medium text-center">Upload an image for this question</p>
          <p className="text-xs text-muted-foreground">JPEG, PNG, GIF, or WebP (max 5MB)</p>

          <Label htmlFor="image-upload" className="cursor-pointer">
            <Button
              type="button"
              variant="outline"
              size="sm"
              asChild
              disabled={isUploading}
            >
              <span>
                {isUploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Choose Image
              </span>
            </Button>
          </Label>
          <Input
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={isUploading}
            className="hidden"
          />
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
};
