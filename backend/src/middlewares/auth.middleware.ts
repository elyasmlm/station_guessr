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

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    const [rows] = await pool.execute<
      { id: number; email: string; display_name: string | null }[]
    >("SELECT id, email, display_name FROM users WHERE id = ?", [
      decoded.userId,
    ]);

    if (rows.length === 0) {
      return res
        .status(401)
        .json({ error: { message: "Utilisateur invalide." } });
    }

    const dbUser = rows[0];

    req.user = {
      id: dbUser.id,
      email: dbUser.email,
      displayName: dbUser.display_name,
    };

    next();
  } catch (err) {
    console.error(err);
    return res
      .status(401)
      .json({ error: { message: "Token invalide ou expiré." } });
  }
}
