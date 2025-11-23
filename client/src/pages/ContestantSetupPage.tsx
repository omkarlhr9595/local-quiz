import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
import { gameApi, quizApi, contestantApi } from "@/lib/api";

interface ContestantForm {
  id?: string;
  name: string;
  photoUrl: string;
  route: string;
}

export default function ContestantSetupPage() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string>("");
  const [gameId, setGameId] = useState<string | null>(null);
  const [contestants, setContestants] = useState<ContestantForm[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const maxContestants = 5;

  useEffect(() => {
    loadQuizzes();
  }, []);

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

  const handleCreateGame = async () => {
    if (!selectedQuizId) {
      alert("Please select a quiz first");
      return;
    }

    setLoading(true);
    try {
      const response = await gameApi.create(selectedQuizId);
      if (response.data.success) {
        setGameId(response.data.data.id);
        // Initialize contestants array
        setContestants([
          {
            name: "",
            photoUrl: "",
            route: "/contestant1",
          },
        ]);
      }
    } catch (error) {
      console.error("Error creating game:", error);
      alert("Failed to create game");
    } finally {
      setLoading(false);
    }
  };

  const handleAddContestant = () => {
    if (contestants.length >= maxContestants) {
      alert(`Maximum ${maxContestants} contestants allowed`);
      return;
    }

    const contestantNumber = contestants.length + 1;
    setContestants([
      ...contestants,
      {
        name: "",
        photoUrl: "",
        route: `/contestant${contestantNumber}`,
      },
    ]);
  };

  const handleRemoveContestant = (index: number) => {
    setContestants(contestants.filter((_, i) => i !== index));
    // Reassign routes
    const updated = contestants.filter((_, i) => i !== index);
    updated.forEach((c, i) => {
      c.route = `/contestant${i + 1}`;
    });
    setContestants(updated);
  };

  const handleNameChange = (index: number, name: string) => {
    const updated = [...contestants];
    updated[index].name = name;
    setContestants(updated);
  };

  const handlePhotoUpload = async (
    index: number,
    file: File
  ) => {
    if (!gameId) {
      alert("Please create a game first");
      return;
    }

    const formData = new FormData();
    formData.append("name", contestants[index].name || `Contestant ${index + 1}`);
    formData.append("gameId", gameId);
    formData.append("route", contestants[index].route);
    formData.append("photo", file);

    try {
      const response = await contestantApi.create(formData);
      if (response.data.success) {
        const newContestant = response.data.data;
        const updated = [...contestants];
        updated[index] = {
          ...updated[index],
          id: newContestant.id,
          photoUrl: newContestant.photoUrl,
        };
        setContestants(updated);
      }
    } catch (error) {
      console.error("Error uploading photo:", error);
      alert("Failed to upload photo");
    }
  };

  const handleSaveAndContinue = async () => {
    if (!gameId) {
      alert("Please create a game first");
      return;
    }

    if (contestants.length === 0) {
      alert("Please add at least one contestant");
      return;
    }

    // Validate all contestants have names
    for (const contestant of contestants) {
      if (!contestant.name.trim()) {
        alert("All contestants must have a name");
        return;
      }
    }

    // Save any contestants that haven't been saved yet
    for (let i = 0; i < contestants.length; i++) {
      const contestant = contestants[i];
      if (!contestant.id && contestant.name.trim()) {
        // Create contestant without photo (photo can be added later)
        const formData = new FormData();
        formData.append("name", contestant.name);
        formData.append("gameId", gameId);
        formData.append("route", contestant.route);
        // Create empty file for photo if needed
        try {
          await contestantApi.create(formData);
        } catch (error) {
          console.error("Error creating contestant:", error);
        }
      }
    }

    // Navigate to game control
    navigate(`/host/game?gameId=${gameId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <HostNavigation />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Game Selection */}
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <Label className="text-lg font-semibold mb-2 block">
                  Quiz
                </Label>
                <Select
                  value={selectedQuizId}
                  onValueChange={setSelectedQuizId}
                  disabled={!!gameId}
                >
                  <SelectTrigger className="w-full">
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
              </div>

              {!gameId && (
                <Button
                  onClick={handleCreateGame}
                  disabled={!selectedQuizId || loading}
                  className="w-full"
                >
                  {loading ? "Creating..." : "+ Create Game"}
                </Button>
              )}

              {gameId && (
                <div className="text-sm text-green-600">
                  ✓ Game created: {gameId.slice(0, 8)}...
                </div>
              )}
            </div>
          </Card>

          {/* Contestants */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">
                  Contestants ({contestants.length}/{maxContestants})
                </Label>
                {contestants.length < maxContestants && (
                  <Button onClick={handleAddContestant} variant="outline">
                    + Add Contestant
                  </Button>
                )}
              </div>

              {contestants.map((contestant, index) => (
                <Card key={index} className="p-4 border-2">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {contestant.photoUrl ? (
                        <img
                          src={contestant.photoUrl}
                          alt={`Contestant ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-400 text-xs text-center px-2">
                          No Photo
                        </span>
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div>
                        <Label className="text-xs text-gray-500">
                          Contestant {index + 1}
                        </Label>
                        <Input
                          value={contestant.name}
                          onChange={(e) =>
                            handleNameChange(index, e.target.value)
                          }
                          placeholder="Enter name"
                          className="mt-1"
                        />
                      </div>
                      <div className="text-xs text-gray-500">
                        Route: {contestant.route}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <input
                        type="file"
                        accept="image/*"
                        ref={(el) => {
                          fileInputRefs.current[index] = el;
                        }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handlePhotoUpload(index, file);
                          }
                        }}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRefs.current[index]?.click()}
                      >
                        Upload Photo
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveContestant(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}

              {contestants.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  No contestants yet. Click "Add Contestant" to get started.
                </div>
              )}
            </div>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              onClick={handleSaveAndContinue}
              disabled={!gameId || contestants.length === 0 || loading}
              size="lg"
              className="flex-1"
            >
              Save & Continue to Game
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

