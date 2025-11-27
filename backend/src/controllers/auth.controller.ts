import { Request, Response, NextFunction } from "express";
import { loginUser, registerUser } from "../services/auth.service";

export async function registerHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { email, password, displayName } = req.body || {};

    if (
      !email ||
      typeof email !== "string" ||
      !password ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        error: { message: "Email et mot de passe sont requis." },
      });
    }

    const { user, token } = await registerUser({
      email: email.trim().toLowerCase(),
      password,
      displayName,
    });

    res.status(201).json({ user, token });
  } catch (err: any) {
    if (err.status) {
      return res.status(err.status).json({ error: { message: err.message } });
    }
    next(err);
  }
}

export async function loginHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { email, password } = req.body || {};

    if (
      !email ||
      typeof email !== "string" ||
      !password ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        error: { message: "Email et mot de passe sont requis." },
      });
    }

    const { user, token } = await loginUser({
      email: email.trim().toLowerCase(),
      password,
    });

    res.json({ user, token });
  } catch (err: any) {
    if (err.status) {
      return res.status(err.status).json({ error: { message: err.message } });
    }
    next(err);
  }
}

export async function meHandler(
  req: Request,
  res: Response,
  _next: NextFunction
) {
  if (!req.user) {
    return res
      .status(401)
      .json({ error: { message: "Non authentifié." } });
  }

  res.json({ user: req.user });
}

/**
 * Logout côté API stateless : côté backend, on ne "supprime" pas le JWT,
 * on laisse le front juste oublier le token.
 * On expose quand même un endpoint pour cohérence.
 */
export async function logoutHandler(
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  res.json({ message: "Déconnecté côté client. Supprime le token localement." });
}
