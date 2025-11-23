import { BrowserRouter, Routes, Route } from "react-router-dom";
import HostGamePage from "./pages/HostPage";
import QuizSetupPage from "./pages/QuizSetupPage";
import GameSetupPage from "./pages/GameSetupPage";
import MainPage from "./pages/MainPage";
import ContestantPage from "./pages/ContestantPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Host Pages */}
        <Route path="/host/quizzes" element={<QuizSetupPage />} />
        <Route path="/host/setup" element={<GameSetupPage />} />
        <Route path="/host/game" element={<HostGamePage />} />
        <Route path="/host" element={<QuizSetupPage />} />
        
        {/* Other Pages */}
        <Route path="/main" element={<MainPage />} />
        <Route path="/contestant1" element={<ContestantPage contestantNumber={1} />} />
        <Route path="/contestant2" element={<ContestantPage contestantNumber={2} />} />
        <Route path="/contestant3" element={<ContestantPage contestantNumber={3} />} />
        <Route path="/contestant4" element={<ContestantPage contestantNumber={4} />} />
        <Route path="/contestant5" element={<ContestantPage contestantNumber={5} />} />
        <Route path="/" element={<div className="p-8">Select a route: /host/quizzes, /host/contestants, /host/game, /main, /contestant1-5</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
