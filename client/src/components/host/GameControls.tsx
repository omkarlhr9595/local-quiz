import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useGameStore } from "@/store/gameStore";
import { useSocketStore } from "@/store/socketStore";
import type { GameStatus } from "@shared/types";

export function GameControls() {
  const { game } = useGameStore();
  const { socket, gameId } = useSocketStore();
  const [isPending, setIsPending] = useState(false);
  const prevStatusRef = useRef(game?.status);

  // Clear pending state when game status changes
  useEffect(() => {
    if (prevStatusRef.current !== game?.status) {
      prevStatusRef.current = game?.status;
      // Defer state update to avoid cascading render warning
      const timer = setTimeout(() => setIsPending(false), 0);
      return () => clearTimeout(timer);
    }
  }, [game?.status]);

  const handlePause = () => {
    if (socket && gameId && !isPending) {
      setIsPending(true);
      socket.emit(game?.status === "paused" ? "game-resume" : "game-pause", {
        gameId,
      });
    }
  };

  const handleReset = () => {
    if (socket && gameId && !isPending) {
      setIsPending(true);
      socket.emit("game-reset", { gameId });
    }
  };

  const getStatusBadge = (status: GameStatus | undefined) => {
    const statusMap: Record<GameStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      waiting: { label: "Waiting", variant: "secondary" },
      active: { label: "Active", variant: "default" },
      paused: { label: "Paused", variant: "outline" },
      ended: { label: "Ended", variant: "secondary" },
    };

    const current = status || "waiting";
    const config = statusMap[current];

    // Apply custom styling for paused state (yellow)
    const className = current === "paused" ? "bg-yellow-500 text-white" : undefined;

    return { label: config.label, variant: config.variant, className };
  };

  const statusBadge = getStatusBadge(game?.status as GameStatus | undefined);

  return (
    <div className="flex items-center gap-4 p-4 border-b">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Status:</span>
        <Badge variant={statusBadge.variant} className={statusBadge.className}>
          {statusBadge.label}
        </Badge>
      </div>

      <div className="flex gap-2 ml-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePause}
          disabled={!game || isPending}
        >
          {isPending && game?.status === "active"
            ? "Pausing..."
            : isPending && game?.status === "paused"
            ? "Resuming..."
            : game?.status === "paused"
            ? "▶ Resume"
            : "⏸ Pause"}
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={!game || isPending}
            >
              🔄 Reset
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset Game?</AlertDialogTitle>
              <AlertDialogDescription>
                This will clear the current question and buzzer queue. Are you sure?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-2 justify-end">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleReset} disabled={isPending}>
                {isPending ? "Resetting..." : "Reset"}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

