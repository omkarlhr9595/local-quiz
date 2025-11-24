import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { HostNavigation } from "@/components/host/HostNavigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

export default function GameSetupPage() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string>("");
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
  const [selectedGameId, setSelectedGameId] = useState<string>("");
  const [gameId, setGameId] = useState<string | null>(null);
  const [contestants, setContestants] = useState<ContestantForm[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingContestants, setSavingContestants] = useState<Set<number>>(new Set());
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const maxContestants = 5;

  useEffect(() => {
    loadQuizzes();
  }, []);

  useEffect(() => {
    if (selectedQuizId) {
      const quiz = quizzes.find((q) => q.id === selectedQuizId);
      setSelectedQuiz(quiz || null);
      loadGames(selectedQuizId);
    } else {
      setSelectedQuiz(null);
      setGames([]);
    }
  }, [selectedQuizId, quizzes]);

  useEffect(() => {
    if (selectedGameId) {
      loadGame(selectedGameId);
    } else {
      setGameId(null);
      setContestants([]);
    }
  }, [selectedGameId]);

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

  const loadGames = async (quizId: string) => {
    try {
      const response = await gameApi.getAll(quizId);
      if (response.data.success) {
        const gamesList = response.data.data || [];
        console.log("Loaded games:", gamesList);
        setGames(gamesList);
      }
    } catch (error) {
      console.error("Error loading games:", error);
    }
  };

  const loadGame = async (id: string) => {
    try {
      console.log("Loading game:", id);
      const response = await gameApi.getById(id);
      if (response.data.success) {
        const game = response.data.data;
        console.log("Game loaded:", game);
        setGameId(game.id);
        
        // Load contestants for this game
        try {
          const contestantsResponse = await contestantApi.getByGameId(game.id);
          console.log("Contestants response:", contestantsResponse.data);
          if (contestantsResponse.data.success) {
            const loadedContestants = contestantsResponse.data.data || [];
            console.log("Loaded contestants:", loadedContestants);
            if (loadedContestants.length > 0) {
              setContestants(
                loadedContestants.map((c: any) => ({
                  id: c.id,
                  name: c.name,
                  photoUrl: c.photoUrl || "",
                  route: c.route,
                }))
              );
            } else {
              console.log("No contestants found, initializing empty");
              // No contestants yet, initialize with one empty
              setContestants([
                {
                  name: "",
                  photoUrl: "",
                  route: "/contestant1",
                },
              ]);
            }
          } else {
            console.error("Failed to load contestants:", contestantsResponse.data.error);
            // Initialize with empty if API call fails
            setContestants([
              {
                name: "",
                photoUrl: "",
                route: "/contestant1",
              },
            ]);
          }
        } catch (contestantError) {
          console.error("Error loading contestants:", contestantError);
          // Initialize with empty on error
          setContestants([
            {
              name: "",
              photoUrl: "",
              route: "/contestant1",
            },
          ]);
        }
      }
    } catch (error) {
      console.error("Error loading game:", error);
      alert("Failed to load game. Please try again.");
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
        const newGame = response.data.data;
        setGameId(newGame.id);
        setSelectedGameId(newGame.id);
        // Reload games list
        await loadGames(selectedQuizId);
        // Initialize with one empty contestant
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

  const handleSelectGame = async (gameId: string) => {
    setSelectedGameId(gameId);
    await loadGame(gameId);
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

  const handleRemoveContestant = async (index: number) => {
    const contestant = contestants[index];
    
    // If contestant has been saved to database, delete it
    if (contestant.id) {
      try {
        await contestantApi.delete(contestant.id);
        console.log("Contestant deleted from database:", contestant.id);
      } catch (error) {
        console.error("Error deleting contestant:", error);
        alert("Failed to delete contestant from database");
        return; // Don't remove from UI if delete failed
      }
    }

    // Remove from UI
    const updated = contestants.filter((_, i) => i !== index);
    // Reassign routes
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

  const handleSaveContestant = async (index: number) => {
    if (!gameId) {
      alert("Please create a game first");
      return;
    }

    const contestant = contestants[index];
    if (!contestant.name.trim()) {
      alert("Please enter a name first");
      return;
    }

    // If already saved, skip
    if (contestant.id) {
      return;
    }

    // Prevent duplicate saves
    if (savingContestants.has(index)) {
      console.log("Already saving contestant", index);
      return;
    }

    setSavingContestants((prev) => new Set(prev).add(index));

    try {
      // Create contestant without photo
      const formData = new FormData();
      formData.append("name", contestant.name);
      formData.append("gameId", gameId);
      formData.append("route", contestant.route);
      // No photo file - backend now accepts this

      console.log("Saving contestant:", contestant.name, "for game:", gameId);
      const response = await contestantApi.create(formData);
      if (response.data.success) {
        const newContestant = response.data.data;
        const updated = [...contestants];
        updated[index] = {
          ...updated[index],
          id: newContestant.id,
          photoUrl: newContestant.photoUrl || "",
        };
        setContestants(updated);
        console.log("Contestant saved successfully:", newContestant);
      }
    } catch (error) {
      console.error("Error saving contestant:", error);
      alert("Failed to save contestant");
    } finally {
      setSavingContestants((prev) => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
  };

  const handlePhotoUpload = async (index: number, file: File) => {
    if (!gameId) {
      alert("Please create a game first");
      return;
    }

    const contestant = contestants[index];
    
    // If contestant already has an ID, we can't update photo yet
    // TODO: Add photo update endpoint
    if (contestant.id) {
      alert("Photo update for existing contestants coming soon. Please remove and re-add the contestant to upload a new photo.");
      return;
    }

    // Ensure contestant has a name before uploading photo
    if (!contestant.name.trim()) {
      alert("Please enter a name first");
      return;
    }

    // If contestant doesn't have ID yet, save it first, then upload photo
    // But actually, we can create with photo in one go
    const formData = new FormData();
    formData.append("name", contestant.name);
    formData.append("gameId", gameId);
    formData.append("route", contestant.route);
    formData.append("photo", file);

    try {
      console.log("Creating contestant with photo for game:", gameId);
      const response = await contestantApi.create(formData);
      if (response.data.success) {
        const newContestant = response.data.data;
        console.log("Contestant created with photo:", newContestant);
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

  const handleStartGame = async () => {
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
        await handleSaveContestant(i);
      }
    }

    // Navigate to game control
    navigate(`/host/game`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <HostNavigation />

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold mb-2">Setup Game</h1>
            <p className="text-gray-600">
              Select a quiz template, then choose an existing game or create a new one
            </p>
          </div>

          {/* Step 1: Select Quiz */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary">Step 1</Badge>
                <Label className="text-lg font-semibold">Select Quiz Template</Label>
              </div>

              <Select
                value={selectedQuizId}
                onValueChange={(value) => {
                  setSelectedQuizId(value);
                  setSelectedGameId("");
                  setGameId(null);
                  setContestants([]);
                }}
                disabled={!!gameId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a quiz..." />
                </SelectTrigger>
                <SelectContent>
                  {quizzes.map((quiz) => (
                    <SelectItem key={quiz.id} value={quiz.id}>
                      {quiz.name} ({quiz.categories?.length || 0} categories)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedQuiz && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm font-medium text-blue-900 mb-2">
                    Quiz Preview:
                  </div>
                  <div className="text-sm text-blue-700">
                    <div>Categories: {selectedQuiz.categories?.length || 0}</div>
                    <div>
                      Total Questions:{" "}
                      {selectedQuiz.categories?.reduce(
                        (sum: number, cat: any) =>
                          sum + (cat.questions?.length || 0),
                        0
                      ) || 0}
                    </div>
                  </div>
                </div>
              )}

              {/* Existing Games */}
              {selectedQuizId && (
                <div className="mt-4 space-y-2">
                  {games.length > 0 && (
                    <>
                      <Label className="text-sm font-medium">
                        Or select an existing game:
                      </Label>
                      <Select value={selectedGameId} onValueChange={handleSelectGame}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select existing game..." />
                        </SelectTrigger>
                        <SelectContent>
                          {games.map((game) => (
                            <SelectItem key={game.id} value={game.id}>
                              Game {game.id.slice(0, 8)}... ({game.status}) -{" "}
                              {new Date(game.createdAt).toLocaleDateString()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </>
                  )}
                  {games.length === 0 && selectedQuizId && (
                    <div className="text-sm text-gray-500">
                      No existing games found for this quiz
                    </div>
                  )}
                </div>
              )}

              {/* Create New Game Button */}
              {!gameId && (
                <div className="mt-4">
                  <Button
                    onClick={handleCreateGame}
                    disabled={!selectedQuizId || loading}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? "Creating Game..." : "+ Create New Game"}
                  </Button>
                </div>
              )}

              {gameId && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <div className="text-sm font-medium text-green-900">
                    ✓ Game selected: {gameId.slice(0, 8)}...
                  </div>
                  {contestants.length > 0 && (
                    <div className="text-xs text-green-700 mt-1">
                      Loaded {contestants.length} contestant(s)
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Step 2: Add Contestants */}
          {gameId && (
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Step 2</Badge>
                    <Label className="text-lg font-semibold">
                      Add Contestants ({contestants.length}/{maxContestants})
                    </Label>
                  </div>
                  {contestants.length < maxContestants && (
                    <Button onClick={handleAddContestant} variant="outline">
                      + Add Contestant
                    </Button>
                  )}
                </div>

                {contestants.length > 0 && (
                  <div className="text-sm text-blue-600 mb-2 p-2 bg-blue-50 rounded">
                    ✓ Found {contestants.length} contestant(s) for this game
                  </div>
                )}
                
                {contestants.map((contestant, index) => (
                  <Card key={contestant.id || index} className="p-4 border-2">
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
                          <div className="flex gap-2">
                            <Input
                              value={contestant.name}
                              onChange={(e) => handleNameChange(index, e.target.value)}
                              onBlur={() => {
                                // Auto-save when name is entered and field loses focus
                                // Only save if not already saved and not currently saving
                                if (
                                  contestants[index].name.trim() &&
                                  !contestants[index].id &&
                                  !savingContestants.has(index)
                                ) {
                                  handleSaveContestant(index);
                                }
                              }}
                              placeholder="Enter name"
                              className="mt-1 flex-1"
                              disabled={savingContestants.has(index)}
                            />
                            {savingContestants.has(index) && (
                              <Badge variant="secondary" className="mt-1 flex items-center">
                                Saving...
                              </Badge>
                            )}
                            {!contestant.id && contestant.name.trim() && !savingContestants.has(index) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSaveContestant(index)}
                                className="mt-1"
                                disabled={savingContestants.has(index)}
                              >
                                Save
                              </Button>
                            )}
                            {contestant.id && !savingContestants.has(index) && (
                              <Badge variant="secondary" className="mt-1 flex items-center">
                                ✓ Saved
                              </Badge>
                            )}
                          </div>
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
                    Click "Add Contestant" to get started
                  </div>
                )}

                {/* Start Game Button */}
                {contestants.length > 0 && (
                  <div className="pt-4 border-t">
                    <Button
                      onClick={handleStartGame}
                      disabled={loading}
                      size="lg"
                      className="w-full"
                    >
                      Start Game →
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Info Box */}
          <Card className="p-4 bg-gray-50">
            <div className="text-sm text-gray-600">
              <strong>How it works:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Select a quiz template (created in Quizzes page)</li>
                <li>Choose an existing game or create a new one</li>
                <li>Add contestants (up to 5) with photos and names</li>
                <li>Start the game to begin playing</li>
              </ol>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

