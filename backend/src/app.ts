import express from "express";
import cors from "cors";
import { json } from "body-parser";

import gameRouter from "./routes/game.routes";
import authRouter from "./routes/auth.routes";
import { errorHandler } from "./middlewares/error.middleware";

const app = express();

app.use(
  cors({
    origin: true, // accepte toutes les origines en dev
    credentials: true,
  })
);

app.use(json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Auth
app.use("/api/auth", authRouter);
// Also expose auth without the `/api` prefix for reverse-proxy setups
app.use("/auth", authRouter);

// Jeux
app.use("/api/games", gameRouter);
// Also accept `/games` (some proxies strip the `/api` prefix)
app.use("/games", gameRouter);

// Erreurs
app.use(errorHandler);

export default app;
