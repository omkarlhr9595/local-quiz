import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGameStore } from "@/store/gameStore";
import { useSocketStore } from "@/store/socketStore";
import { Badge } from "@/components/ui/badge";

export function ScoreAdjustment() {
  const { game, contestants } = useGameStore();
  const { socket, gameId } = useSocketStore();
  const [selectedContestant, setSelectedContestant] = useState("");
  const [amount, setAmount] = useState(0);
  const [action, setAction] = useState<"deduct" | "award">("deduct");

  const handleAdjustScore = () => {
    if (!socket || !gameId || !selectedContestant || amount <= 0) {
      return;
    }

    if (action === "deduct") {
      socket.emit("host-deduct-score", {
        gameId,
        contestantId: selectedContestant,
        amount,
        action: "deduct",
      });
    } else {
      socket.emit("host-award-score", {
        gameId,
        contestantId: selectedContestant,
        amount,
        action: "award",
      });
    }

    // Reset form
    setSelectedContestant("");
    setAmount(0);
  };

  if (!game || !contestants || contestants.length === 0) {
    return null;
  }

  const selectedContestantData = contestants.find((c) => c.id === selectedContestant);

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="font-semibold text-sm mb-3">Adjust Contestant Score</div>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">
              Contestant
            </Label>
            <Select value={selectedContestant} onValueChange={setSelectedContestant}>
              <SelectTrigger>
                <SelectValue placeholder="Select contestant" />
              </SelectTrigger>
              <SelectContent>
                {contestants.map((contestant) => (
                  <SelectItem key={contestant.id} value={contestant.id}>
                    <div className="flex items-center gap-2">
                      <span>{contestant.name || `Contestant ${contestant.id.slice(0, 8)}`}</span>
                      <Badge variant="secondary" className="text-xs">
                        {contestant.score} pts
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedContestantData && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm font-medium text-blue-900">
                Current Score: {selectedContestantData.score} pts
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <div className="flex-1">
              <Label className="text-xs text-gray-500 mb-1 block">
                Action
              </Label>
              <Select value={action} onValueChange={(value) => setAction(value as "deduct" | "award")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deduct">Deduct Points</SelectItem>
                  <SelectItem value="award">Award Points</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label className="text-xs text-gray-500 mb-1 block">
                Amount
              </Label>
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                placeholder="Enter amount"
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              />
            </div>
          </div>

          <Button
            onClick={handleAdjustScore}
            disabled={!selectedContestant || amount <= 0}
            className="w-full"
            variant={action === "deduct" ? "destructive" : "default"}
          >
            {action === "deduct" ? "Deduct" : "Award"} {amount} Points
          </Button>
        </div>
      </div>
    </Card>
  );
}
