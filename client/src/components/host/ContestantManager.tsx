import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { contestantApi } from "@/lib/api";
import { useGameStore } from "@/store/gameStore";
import type { Contestant as ContestantType } from "../../../../shared/types/index";

interface Contestant {
  id: string;
  name: string;
  photoUrl: string;
  route: string;
}

export function ContestantManager() {
  const { game, setContestants } = useGameStore();
  const [localContestants, setLocalContestants] = useState<Contestant[]>([]);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const maxContestants = 5;

  const handlePhotoUpload = async (
    contestantNumber: number,
    file: File
  ) => {
    if (!game) {
      alert("Please create a game first");
      return;
    }

    // Get the current contestant name or use default
    const currentContestant = localContestants[contestantNumber - 1];
    const contestantName = currentContestant?.name || `Contestant ${contestantNumber}`;

    const formData = new FormData();
    formData.append("name", contestantName);
    formData.append("gameId", game.id);
    formData.append("route", `/contestant${contestantNumber}`);
    formData.append("photo", file);

    try {
      console.log("Uploading photo for contestant:", contestantNumber, "File:", file.name);
      const response = await contestantApi.create(formData);
      console.log("Upload response:", response.data);
      
      if (response.data.success) {
        const newContestant = response.data.data;
        console.log("Contestant created/updated:", newContestant);
        
        // Update local state
        setLocalContestants((prev) => {
          const updated = [...prev];
          updated[contestantNumber - 1] = newContestant;
          return updated;
        });
        
        // Update global contestants - get current state and update
        const { contestants: currentContestants } = useGameStore.getState();
        const existingIndex = currentContestants.findIndex((c: ContestantType) => c.id === newContestant.id || c.route === newContestant.route);
        if (existingIndex >= 0) {
          // Update existing contestant
          const updated = [...currentContestants];
          updated[existingIndex] = newContestant;
          setContestants(updated);
        } else {
          // Add new contestant
          setContestants([...currentContestants, newContestant]);
        }
        
        // Reset file input so same file can be selected again
        const fileInput = fileInputRefs.current[contestantNumber];
        if (fileInput) {
          fileInput.value = "";
        }
      } else {
        console.error("Upload failed:", response.data);
        alert("Failed to upload photo: " + (response.data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error uploading photo:", error);
      alert("Failed to upload photo. Check console for details.");
    }
  };

  const handleNameChange = (contestantNumber: number, name: string) => {
    setLocalContestants((prev) => {
      const updated = [...prev];
      if (!updated[contestantNumber - 1]) {
        updated[contestantNumber - 1] = {
          id: `temp-${contestantNumber}`,
          name: "",
          photoUrl: "",
          route: `/contestant${contestantNumber}`,
        };
      }
      updated[contestantNumber - 1].name = name;
      return updated;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">
          Contestants ({localContestants.filter((c) => c?.photoUrl).length}/
          {maxContestants})
        </h3>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {Array.from({ length: maxContestants }).map((_, idx) => {
          const contestantNumber = idx + 1;
          const contestant = localContestants[idx];

          return (
            <Card key={idx} className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {contestant?.photoUrl ? (
                    <img
                      src={contestant.photoUrl}
                      alt={`Contestant ${contestantNumber}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-400 text-xs">
                      No Photo
                    </span>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <div>
                    <Label className="text-xs text-gray-500">
                      Contestant {contestantNumber}
                    </Label>
                    <Input
                      placeholder="Enter name"
                      value={contestant?.name || ""}
                      onChange={(e) =>
                        handleNameChange(contestantNumber, e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                  <div className="text-xs text-gray-500">
                    Route: /contestant{contestantNumber}
                  </div>
                </div>

                <div>
                  <input
                    type="file"
                    accept="image/*"
                    ref={(el) => {
                      fileInputRefs.current[contestantNumber] = el;
                    }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handlePhotoUpload(contestantNumber, file);
                      }
                    }}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      fileInputRefs.current[contestantNumber]?.click()
                    }
                  >
                    Upload Photo
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

