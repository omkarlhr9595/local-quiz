import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGameStore } from "@/store/gameStore";
import { useSocketStore } from "@/store/socketStore";

export function GameControls() {
  const { game } = useGameStore();
  const { socket, gameId } = useSocketStore();

  const handlePause = () => {
    if (socket && gameId) {
      socket.emit(game?.status === "paused" ? "game-resume" : "game-pause", {
        gameId,
      });
    }
  };

  const handleReset = () => {
    if (socket && gameId) {
      socket.emit("game-reset", { gameId });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "paused":
        return "bg-yellow-500";
      case "waiting":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="flex items-center gap-4 p-4 border-b">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Status:</span>
        <Badge className={getStatusColor(game?.status || "waiting")}>
          {game?.status || "Waiting"}
        </Badge>
      </div>

      <div className="flex gap-2 ml-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePause}
          disabled={!game}
        >
          {game?.status === "paused" ? "▶ Resume" : "⏸ Pause"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          disabled={!game}
        >
          🔄 Reset
        </Button>
      </div>
    </div>
  );
}

