// backend/src/services/game.service.ts
import axios from "axios";
import { pool } from "../config/db";

/* -------------------------------------------------------------------------- */
/*                         Types stations / partie du jour                    */
/* -------------------------------------------------------------------------- */

export type Station = {
  id: string;
  name: string;             // nom_long
  lines: string[];          // ex: ["METRO 8", "RER A"]
  city: string;             // ville (via géocodage)
  arrondissement?: number;  // pour Paris uniquement
};

export type TodayGame = {
  date: string;        // YYYY-MM-DD
  stationId: string;
  revealedLines: string[];
};

const IDF_API_URL =
  "https://data.iledefrance.fr/api/explore/v2.1/catalog/datasets/gares-et-stations-du-reseau-ferre-dile-de-france-donnee-generalisee/records";

const BAN_REVERSE_URL = "https://api-adresse.data.gouv.fr/reverse/";

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

type RawGeoPoint =
  | {
      lat: number;
      lon: number;
    }
  | [number, number];

type RawRecord = {
  codeunique: number;
  nom_long: string;
  nom_zdc?: string | null;
  nom_zda?: string | null;
  res_com?: string | null;
  metro?: number | string;
  rer?: number | string;
  tramway?: number | string;

  // ⚠️ suivant les datasets Opendatasoft, ça peut être un objet OU un tableau
  geo_point_2d?: RawGeoPoint | null;
};

function parseLines(resCom: string | null | undefined): string[] {
  if (!resCom) return [];
  return resCom
    .split("/")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/* -------------------------- Extraction des coordonnées -------------------- */

function extractLatLonFromRecord(
  rec: RawRecord
): { lat: number; lon: number } | null {
  const gp = rec.geo_point_2d as any;

  if (!gp) return null;

  // Cas tableau [lat, lon]
  if (Array.isArray(gp) && gp.length >= 2) {
    const lat = Number(gp[0]);
    const lon = Number(gp[1]);
    if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
      return { lat, lon };
    }
  }

  // Cas objet { lat, lon }
  if (typeof gp === "object" && gp !== null) {
    const lat = Number(gp.lat ?? gp.Lat ?? gp.latitude);
    const lon = Number(gp.lon ?? gp.Lon ?? gp.lng ?? gp.longitude);
    if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
      return { lat, lon };
    }
  }

  return null;
}

/* -------------------------- Géocodage inverse BAN ------------------------- */

type ReverseGeocodeResult = {
  city: string;
  arrondissement?: number;
};

async function reverseGeocodeFromLatLon(
  lat: number,
  lon: number
): Promise<ReverseGeocodeResult | null> {
  try {
    const { data } = await axios.get(BAN_REVERSE_URL, {
      params: {
        lat,
        lon,
      },
      timeout: 3000,
    });

    const feature = data?.features?.[0];
    if (!feature) return null;

    const props = feature.properties || {};
    const city: string = props.city || props.name || "";
    const postcode: string | undefined = props.postcode;

    if (!city) return null;

    let arrondissement: number | undefined;

    // Déduction de l'arrondissement pour Paris via le code postal
    if (city === "Paris" && postcode && /^75\d{3}$/.test(postcode)) {
      const arr = parseInt(postcode.slice(3, 5), 10);
      if (!Number.isNaN(arr) && arr >= 1 && arr <= 20) {
        arrondissement = arr;
      }
    }

    return { city, arrondissement };
  } catch (err) {
    console.error("Erreur reverse geocoding BAN:", err);
    return null;
  }
}

/* ---------------------- Mapping des enregistrements ----------------------- */

function mapRawRecordToStationSkeleton(rec: RawRecord): Station | null {
  const hasMetro = rec.metro === 1 || rec.metro === "1";
  const hasRer = rec.rer === 1 || rec.rer === "1";
  const hasTram = rec.tramway === 1 || rec.tramway === "1";

  // On veut au moins un mode ferré
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

  return {
    id,
    name,
    lines,
    // on remplira via géocodage ensuite
    city: "",
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

      // ⚠️ v2.1 renvoie directement les champs dans results[*]
      const results = (response.data?.results ?? []) as RawRecord[];

      const stationsPage = (
        await Promise.all(
          results.map(async (rec) => {
            const base = mapRawRecordToStationSkeleton(rec);
            if (!base) return null;

            const coords = extractLatLonFromRecord(rec);

            if (coords) {
              const geoResult = await reverseGeocodeFromLatLon(
                coords.lat,
                coords.lon
              );

              if (geoResult) {
                base.city = geoResult.city;
                if (geoResult.arrondissement !== undefined) {
                  base.arrondissement = geoResult.arrondissement;
                }
              }
            }

            // Si le géocodage a échoué, on met au moins quelque chose de lisible
            if (!base.city) {
              const fallback =
                (rec.nom_zdc || rec.nom_zda || "").toString().trim();
              base.city = fallback || "Inconnue";
            }

            return base;
          })
        )
      ).filter((s): s is Station => s !== null);

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
    station,
  };
}

/**
 * Partie du jour basée sur la date du système.
 */
export async function getTodayDailyGame() {
  const today = getTodayDateString();

  // Retourne la date formatée côté SQL pour éviter les conversions en Date JS
  const [rowsRaw] = await pool.query(
    `SELECT DATE_FORMAT(date, '%Y-%m-%d') AS date, station_name, city, arrondissement, lines_json
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

  const [rowsRaw] = await pool.query("SELECT * FROM games WHERE id = ?", [
    insertId,
  ]);
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
    `SELECT DATE_FORMAT(date, '%Y-%m-%d') AS date, station_name, city, arrondissement, lines_json
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
