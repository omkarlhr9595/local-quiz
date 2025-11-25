import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useSocketStore } from "@/store/socketStore";

type MonitorView = "grid" | "question" | "leaderboard";

export function MainMonitorControls() {
  const [activeView, setActiveView] = useState<MonitorView>("grid");
  const [soundMuted, setSoundMuted] = useState(false);
  const { socket, gameId } = useSocketStore();

  const handleViewChange = (view: MonitorView) => {
    setActiveView(view);
    // Emit event to main monitor to change view
    if (socket && gameId) {
      socket.emit("main-monitor-view", { gameId, view });
    }
  };

  const handleMuteToggle = () => {
    setSoundMuted(!soundMuted);
    if (socket && gameId) {
      socket.emit("main-monitor-sound", { gameId, muted: !soundMuted });
    }
  };

  return (
    <div className="p-4 border-b bg-gray-50">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium mr-2">Main Monitor:</span>
        
        <Button
          variant={activeView === "grid" ? "default" : "outline"}
          size="sm"
          onClick={() => handleViewChange("grid")}
        >
          📊 Show Grid
        </Button>
        
        <Button
          variant={activeView === "question" ? "default" : "outline"}
          size="sm"
          onClick={() => handleViewChange("question")}
        >
          ❓ Show Question
        </Button>
        
        <Button
          variant={activeView === "leaderboard" ? "default" : "outline"}
          size="sm"
          onClick={() => handleViewChange("leaderboard")}
        >
          🏆 Show Leaderboard
        </Button>
        
        <div className="ml-auto">
          <Button
            variant={soundMuted ? "destructive" : "outline"}
            size="sm"
            onClick={handleMuteToggle}
          >
            {soundMuted ? "🔇 Muted" : "🔊 Sound On"}
          </Button>
        </div>
      </div>
    </div>
  );
}

