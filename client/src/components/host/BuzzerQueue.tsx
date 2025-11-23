import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGameStore } from "@/store/gameStore";

export function BuzzerQueue() {
  const { buzzerQueue, currentAnswering, contestants } = useGameStore();

  const getContestantName = (contestantId: string) => {
    const contestant = contestants.find((c) => c.id === contestantId);
    return contestant?.name || `Contestant ${contestantId.slice(0, 8)}`;
  };

  if (buzzerQueue.length === 0) {
    return (
      <Card className="p-4">
        <div className="text-center text-gray-500 text-sm">
          No one has buzzed in yet
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="space-y-2">
        <div className="font-semibold text-sm mb-3">Buzzer Queue</div>
        {buzzerQueue.map((entry, index) => {
          const isCurrent = entry.contestantId === currentAnswering;
          return (
            <div
              key={entry.contestantId}
              className={`flex items-center justify-between p-2 rounded ${
                isCurrent
                  ? "bg-green-100 border-2 border-green-500"
                  : "bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-2">
                <Badge variant={isCurrent ? "default" : "secondary"}>
                  #{index + 1}
                </Badge>
                <span className="text-sm">
                  {getContestantName(entry.contestantId)}
                </span>
              </div>
              {isCurrent && (
                <Badge variant="default" className="bg-green-500">
                  Answering
                </Badge>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

