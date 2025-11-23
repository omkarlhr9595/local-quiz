import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGameStore } from "@/store/gameStore";

export function Leaderboard() {
  const { contestants } = useGameStore();

  const sortedContestants = useMemo(() => {
    return [...contestants]
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .map((c, index) => ({
        ...c,
        position: index + 1,
      }));
  }, [contestants]);

  if (sortedContestants.length === 0) {
    return (
      <Card className="p-4">
        <div className="text-center text-gray-500 text-sm">
          No scores yet
        </div>
      </Card>
    );
  }

  const getMedal = (position: number) => {
    if (position === 1) return "🥇";
    if (position === 2) return "🥈";
    if (position === 3) return "🥉";
    return "";
  };

  return (
    <Card className="p-4">
      <div className="space-y-2">
        <div className="font-semibold text-sm mb-3">Leaderboard</div>
        {sortedContestants.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center justify-between p-3 rounded bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{getMedal(entry.position)}</span>
              <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                {entry.photoUrl ? (
                  <img
                    src={entry.photoUrl}
                    alt={entry.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                    No Photo
                  </div>
                )}
              </div>
              <span className="font-medium">{entry.name}</span>
            </div>
            <Badge variant="secondary" className="text-lg font-bold">
              {entry.score || 0} pts
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}

