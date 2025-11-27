// backend/src/routes/game.routes.ts
import { Router } from "express";
import {
  getTodayGameHandler,
  getGameByDateHandler,
  getStationsHandler,
  recordGameHandler,
  getHistoryHandler,
  getAvailableDatesHandler,
} from "../controllers/game.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

// Partie du jour (publique)
router.get("/today", getTodayGameHandler);

// Liste des stations (publique)
router.get("/stations", getStationsHandler);

// Enregistrement d'une partie (auth requis)
router.post("/record", requireAuth, recordGameHandler);

// Historique perso (auth requis)
router.get("/history", requireAuth, getHistoryHandler);

// Liste des dates où il existe au moins une partie enregistrée en BDD
router.get("/available-dates", getAvailableDatesHandler);

// Partie d'une date donnée (publique)
router.get("/:date", getGameByDateHandler);


export default router;
