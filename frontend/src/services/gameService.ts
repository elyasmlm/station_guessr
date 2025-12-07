import { apiClient } from "./apiClient";
import type { TodayGame, RecordedGame } from "../types/game";

export async function fetchTodayGame(): Promise<TodayGame> {
  const response = await apiClient.get<TodayGame>("/games/today");
  const data = response.data as any;

  if (!data || !data.station || !Array.isArray(data.station.lines)) {
    throw new Error("Réponse invalide du serveur pour /games/today");
  }

  return data;
}


export async function fetchGameByDate(date: string): Promise<TodayGame> {
  const response = await apiClient.get<TodayGame>(`/games/${date}`);
  return response.data;
}

interface RecordGamePayload {
  date: string;
  attempts: number;
  extraLines: number;
  cityRevealed: boolean;
  score: number;
}

export async function recordGame(
  payload: RecordGamePayload
): Promise<RecordedGame> {
  const response = await apiClient.post<RecordedGame>("/games/record", payload);
  return response.data;
}

export async function fetchGamesHistory(): Promise<RecordedGame[]> {
  const response = await apiClient.get<RecordedGame[]>("/games/history");
  return response.data;
}

export type LeaderboardRow = {
  userId: number;
  name: string;
  totalScore: number;
  gamesCount: number;
};

export async function fetchLeaderboard(limit = 50): Promise<LeaderboardRow[]> {
  const response = await apiClient.get<{ leaderboard: LeaderboardRow[] }>(`/games/leaderboard?limit=${limit}`);
  return response.data.leaderboard;
}

export async function fetchAvailableDates(): Promise<string[]> {
  const response = await apiClient.get<{ dates: string[] }>(
    "/games/available-dates"
  );
  return response.data.dates;
}
