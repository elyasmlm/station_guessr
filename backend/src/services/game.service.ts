// backend/src/services/game.service.ts
import axios from "axios";
import { pool } from "../config/db";

/* -------------------------------------------------------------------------- */
/*                         Types stations / partie du jour                    */
/* -------------------------------------------------------------------------- */

export type Station = {
  id: string;
  name: string;        // nom_long
  lines: string[];     // ex: ["METRO 8", "RER A"]
  city: string;        // nom_zdc / nom_zda
  arrondissement?: number; // pour plus tard si tu croises avec un autre dataset
};

export type TodayGame = {
  date: string;        // YYYY-MM-DD
  stationId: string;
  revealedLines: string[];
};

const IDF_API_URL =
  "https://data.iledefrance.fr/api/explore/v2.1/catalog/datasets/gares-et-stations-du-reseau-ferre-dile-de-france-donnee-generalisee/records";

/* -------------------------------------------------------------------------- */
/*                           Utilitaires de date                              */
/* -------------------------------------------------------------------------- */

function getTodayDateString(): string {
  const today = new Date();
  return today.toISOString().slice(0, 10); // YYYY-MM-DD
}

/**
 * Petit hash déterministe sur la date "YYYY-MM-DD"
 * pour répartir les stations.
 */
function hashDate(date: string): number {
  let h = 0;
  for (let i = 0; i < date.length; i++) {
    h = (h * 31 + date.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/* -------------------------------------------------------------------------- */
/*                     Chargement des stations depuis l'API IDF              */
/* -------------------------------------------------------------------------- */

let stationsCache: Station[] | null = null;
let stationsPromise: Promise<Station[]> | null = null;

type RawRecord = {
  codeunique: number;
  nom_long: string;
  nom_zdc?: string | null;
  nom_zda?: string | null;
  res_com?: string | null;
  metro?: number | string;
  rer?: number | string;
  tramway?: number | string;
};

function parseLines(resCom: string | null | undefined): string[] {
  if (!resCom) return [];
  return resCom
    .split("/")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function mapRawRecordToStation(rec: RawRecord): Station | null {
  const hasMetro = rec.metro === 1 || rec.metro === "1";
  const hasRer = rec.rer === 1 || rec.rer === "1";
  const hasTram = rec.tramway === 1 || rec.tramway === "1";

  // On veut au moins un mode ferre
  if (!hasMetro && !hasRer && !hasTram) {
    return null;
  }

  const lines = parseLines(rec.res_com ?? "");

  // ⚠️ On garde seulement les stations avec AU MOINS 2 lignes
  if (lines.length < 2) {
    return null;
  }

  const id = String(rec.codeunique);
  const name = rec.nom_long;
  const city = (rec.nom_zdc || rec.nom_zda || "").toString();

  return {
    id,
    name,
    lines,
    city,
    arrondissement: undefined,
  };
}

async function loadStationsFromAPI(): Promise<Station[]> {
  if (stationsCache) return stationsCache;
  if (stationsPromise) return stationsPromise;

  stationsPromise = (async () => {
    const allStations: Station[] = [];
    const limit = 100;
    let offset = 0;

    while (true) {
      const response = await axios.get(IDF_API_URL, {
        params: { limit, offset },
      });

      const results = (response.data?.results ?? []) as RawRecord[];

      const stationsPage = results
        .map(mapRawRecordToStation)
        .filter((s): s is Station => s !== null);

      allStations.push(...stationsPage);

      if (results.length < limit) {
        break;
      }

      offset += limit;
    }

    if (allStations.length === 0) {
      throw new Error("Aucune station METRO/RER/TRAM trouvée dans l'API IDF.");
    }

    stationsCache = allStations;
    return allStations;
  })();

  try {
    return await stationsPromise;
  } finally {
    stationsPromise = null;
  }
}

/**
 * Accessible au contrôleur pour l'autocomplétion.
 */
export async function getAllStations(): Promise<Station[]> {
  return loadStationsFromAPI();
}

/* -------------------------------------------------------------------------- */
/*                         Génération des parties                             */
/* -------------------------------------------------------------------------- */

/**
 * Génère la partie pour une date donnée (1 station par date, déterministe).
 */
export async function getGameForDate(
  date: string
): Promise<TodayGame & { station: Station }> {

  // Vérifie simplement que la date respecte YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const error: any = new Error("Date invalide");
    error.status = 400;
    throw error;
  }

  const stations = await loadStationsFromAPI();
  if (stations.length === 0) {
    const error: any = new Error("Aucune station disponible.");
    error.status = 500;
    throw error;
  }

  const idx = hashDate(date) % stations.length;
  const station = stations[idx];

  return {
    date,
    stationId: station.id,
    revealedLines: station.lines.slice(0, 2),
    station
  };
}


/**
 * Partie du jour basée sur la date du système.
 */
export async function getTodayDailyGame() {
  const today = getTodayDateString();

  const [rowsRaw] = await pool.query(
    `SELECT date, station_name, city, arrondissement, lines_json
     FROM daily_games
     WHERE date = ?
     LIMIT 1`,
    [today]
  );

  const rows = rowsRaw as {
    date: string;
    station_name: string;
    city: string;
    arrondissement: number | null;
    lines_json: string;
  }[];

  return rows[0] || null;
}



/* -------------------------------------------------------------------------- */
/*                              Historique parties                            */
/* -------------------------------------------------------------------------- */

export type RecordedGame = {
  id: number;
  userId: number;
  date: string; // YYYY-MM-DD
  stationName: string;
  attempts: number;
  extraLines: number;
  cityRevealed: boolean;
  score: number;
  createdAt: string;
};

export type RecordGameInput = {
  userId: number;
  date: string; // YYYY-MM-DD
  stationName: string;
  attempts: number;
  extraLines: number;
  cityRevealed: boolean;
  score: number;
};

export async function recordGame(
  input: RecordGameInput
): Promise<RecordedGame> {
  const [result] = await pool.execute<any>(
    "INSERT INTO games (user_id, date, station_name, attempts, extra_lines, city_revealed, score) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [
      input.userId,
      input.date,
      input.stationName,
      input.attempts,
      input.extraLines,
      input.cityRevealed ? 1 : 0,
      input.score,
    ]
  );

  const insertId = result.insertId as number;

  const [rowsRaw] = await pool.query("SELECT * FROM games WHERE id = ?", [insertId]);
  const rows = rowsRaw as {
    id: number;
    user_id: number;
    date: Date;
    station_name: string;
    attempts: number;
    extra_lines: number;
    city_revealed: number;
    score: number;
    created_at: Date;
  }[];

  const g = rows[0];

  return {
    id: g.id,
    userId: g.user_id,
    date: g.date.toISOString().slice(0, 10),
    stationName: g.station_name,
    attempts: g.attempts,
    extraLines: g.extra_lines,
    cityRevealed: !!g.city_revealed,
    score: g.score,
    createdAt: g.created_at.toISOString(),
  };
}

export async function getGamesHistoryForUser(userId: number) {
  const [rowsRaw] = await pool.query(
    "SELECT id, user_id, date, station_name, attempts, extra_lines, city_revealed, score, created_at FROM games_history WHERE user_id = ? ORDER BY date DESC",
    [userId]
  );

  const rows = rowsRaw as {
    id: number;
    user_id: number;
    date: Date;
    station_name: string;
    attempts: number;
    extra_lines: number;
    city_revealed: number;
    score: number;
    created_at: Date;
  }[];

  return rows;
}

export async function getDailyGameByDate(date: string) {
  const [rowsRaw] = await pool.query(
    `SELECT date, station_name, city, arrondissement, lines_json
     FROM daily_games
     WHERE date = ?
     LIMIT 1`,
    [date]
  );

  const rows = rowsRaw as {
    date: string;
    station_name: string;
    city: string;
    arrondissement: number | null;
    lines_json: string;
  }[];

  return rows[0] || null;
}

export async function getAvailableDailyGameDates(limit = 60) {
  // Récupère la date déjà formatée côté SQL pour éviter la conversion
  // en objet Date JS (qui peut provoquer un décalage via toISOString()).
  const [rowsRaw] = await pool.query(
    `SELECT DATE_FORMAT(date, '%Y-%m-%d') AS date FROM daily_games
     WHERE date <= CURDATE()
     ORDER BY date DESC
     LIMIT ?`,
    [limit]
  );

  const rows = rowsRaw as { date: string }[];

  return rows.map((r) => r.date);
}


