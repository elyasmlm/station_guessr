import { Request, Response, NextFunction } from "express";
import {
  getTodayDailyGame,
  getGameForDate,
  getAllStations,
  recordGame,
  getGamesHistoryForUser,
  getAvailableDailyGameDates,
  getDailyGameByDate,
  getLeaderboard,
} from "../services/game.service";

function parseLinesSafe(raw: any): string[] {
  if (Array.isArray(raw)) {
    return raw as string[];
  }

  if (typeof raw === "string") {
    const trimmed = raw.trim();

    // Cas JSON valide
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed as string[];
        }
      } catch {
        // on tombera sur le split après
      }
    }

    // Fallback : chaîne type "ORLYVAL,TRAM 7"
    return trimmed
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  // Fallback ultime
  return [];
}


export async function getTodayGameHandler(
  req: Request,
  res: Response
) {
  try {
    const game = await getTodayDailyGame();
    if (!game) {
      return res.status(404).json({ error: "Aucune partie disponible aujourd'hui." });
    }

    res.json({
      date: game.date,
      station: {
        name: game.station_name,
        city: game.city,
        arrondissement: game.arrondissement,
        lines: parseLinesSafe(game.lines_json),
      }
    });
  } catch (err) {
    console.error("API Error:", err);
    res.status(500).json({ error: "Erreur serveur." });
  }
}


export async function getGameByDateHandler(
  req: Request,
  res: Response
) {
  try {
    const game = await getDailyGameByDate(req.params.date);
    if (!game) {
      return res.status(404).json({ error: "Aucune partie pour cette date." });
    }

    res.json({
      date: game.date,
      station: {
        name: game.station_name,
        city: game.city,
        arrondissement: game.arrondissement,
        lines: game.lines_json,
      }
    });
  } catch (err) {
    console.error("API Error:", err);
    res.status(500).json({ error: "Erreur serveur." });
  }
}

export async function getStationsHandler(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const stations = await getAllStations();
    // On renvoie tout pour l’instant (id, name, lines, city)
    res.json(stations);
  } catch (err) {
    next(err);
  }
}

export async function recordGameHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ error: { message: "Authentification requise." } });
    }

    const { date, attempts, extraLines, cityRevealed, score } = req.body || {};

    if (
      !date ||
      typeof attempts !== "number" ||
      typeof extraLines !== "number" ||
      typeof cityRevealed !== "boolean" ||
      typeof score !== "number"
    ) {
      return res.status(400).json({
        error: {
          message: "Payload invalide pour l'enregistrement de la partie.",
        },
      });
    }

    // recordGame will resolve the station from daily_games for the provided date
    const game = await recordGame({
      userId: req.user.id,
      date,
      attempts,
      extraLines,
      cityRevealed,
      score,
    });

    res.status(201).json(game);
  } catch (err) {
    next(err);
  }
}

export async function getHistoryHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ error: { message: "Authentification requise." } });
    }

    const history = await getGamesHistoryForUser(req.user.id);
    res.json(history);
  } catch (err) {
    next(err);
  }
}

export async function getAvailableDatesHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const limitParam = req.query.limit as string | undefined;
    let limit = 60;

    if (limitParam) {
      const parsed = parseInt(limitParam, 10);
      if (!Number.isNaN(parsed) && parsed > 0) {
        limit = Math.min(parsed, 365);
      }
    }

    const dates = await getAvailableDailyGameDates(limit);
    res.json({ dates });
  } catch (err) {
    next(err);
  }
}

export async function getLeaderboardHandler(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const rows = await getLeaderboard(50);
    res.json({ leaderboard: rows });
  } catch (err) {
    next(err);
  }
}

