export interface Station {
  name: string;
  lines: string[];
  city: string;
  arrondissement: number | null;
}

export interface TodayGame {
  date: string; // YYYY-MM-DD
  stationId: string;
  revealedLines: string[];
  station: Station;
}

export interface Guess {
  id: number;
  text: string;
  isCorrect: boolean;
}

export interface RecordedGame {
  id: number;
  userId: string;
  date: string;
  stationName: string;
  attempts: number;
  extraLines: number;
  cityRevealed: boolean;
  score: number;
  createdAt: string;
}
