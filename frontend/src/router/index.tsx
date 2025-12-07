import { Routes, Route } from "react-router-dom";
import GamePage from "../pages/GamePage";
import HistoryPage from "../pages/HistoryPage";
import AccountPage from "../pages/AccountPage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import LeaderboardPage from "../pages/LeaderboardPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<GamePage />} />
      <Route path="/history" element={<HistoryPage />} />
      <Route path="/account" element={<AccountPage />} />
      <Route path="/leaderboard" element={<LeaderboardPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
    </Routes>
  );
}
