import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { pool } from "../config/db";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

interface JwtPayload {
  userId: number;
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: { message: "Token manquant. Authentification requise." },
    });
  }

  const token = authHeader.slice("Bearer ".length).trim();

  // Handle common bad token values sent from clients (e.g. "null" or "undefined")
  if (token === "null" || token === "undefined" || token.length === 0) {
    return res.status(401).json({ error: { message: "Token invalide ou expiré." } });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    const [rowsRaw] = await pool.execute(
      "SELECT id, email, display_name FROM users WHERE id = ?",
      [decoded.userId]
    );

    const rows = rowsRaw as {
      id: number;
      email: string;
      display_name: string | null;
    }[];

    const dbUser = rows[0];

    req.user = {
      id: dbUser.id,
      email: dbUser.email,
      displayName: dbUser.display_name,
    };

    next();
  } catch (err: any) {
    // Don't print full stack traces for malformed tokens — log a concise warning.
    const name = err && err.name ? err.name : "JwtError";
    const message = err && err.message ? err.message : String(err);
    console.warn(`JWT verify failed: ${name}: ${message}`);
    return res.status(401).json({ error: { message: "Token invalide ou expiré." } });
  }
}
