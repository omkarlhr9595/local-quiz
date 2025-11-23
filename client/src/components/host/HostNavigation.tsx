import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HostNavigation() {
  const location = useLocation();

  const navItems = [
    { path: "/host/quizzes", label: "📝 Quizzes", icon: "📝" },
    { path: "/host/setup", label: "🎮 Setup Game", icon: "🎮" },
    { path: "/host/game", label: "▶️ Play Game", icon: "▶️" },
  ];

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 h-14">
          <Link to="/host/quizzes" className="mr-4 font-bold text-lg">
            🏠 Host
          </Link>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "h-9",
                    isActive && "bg-primary text-primary-foreground"
                  )}
                >
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

