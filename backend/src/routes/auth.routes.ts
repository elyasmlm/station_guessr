import { Router } from "express";
import {
  loginHandler,
  registerHandler,
  meHandler,
  logoutHandler,
} from "../controllers/auth.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

// POST /auth/register
router.post("/register", registerHandler);

// POST /auth/login
router.post("/login", loginHandler);

// GET /auth/me (protégé)
router.get("/me", requireAuth, meHandler);

// POST /auth/logout (stateless, informatif)
router.post("/logout", requireAuth, logoutHandler);

export default router;
