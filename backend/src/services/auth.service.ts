import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../config/db";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

type DbUser = {
  id: number;
  email: string;
  password_hash: string;
  display_name: string | null;
  created_at: Date;
};

export async function registerUser(params: {
  email: string;
  password: string;
  displayName?: string;
}) {
  const { email, password, displayName } = params;

  // Vérifier si l'utilisateur existe déjà
  const [rowsRaw] = await pool.execute(
    "SELECT * FROM users WHERE email = ?",
    [email]
  );

  const rows = rowsRaw as DbUser[];

  if (rows.length > 0) {
    const error: any = new Error("Un compte existe déjà avec cet email.");
    error.status = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [result] = await pool.execute(
    "INSERT INTO users (email, password_hash, display_name) VALUES (?, ?, ?)",
    [email, passwordHash, displayName || null]
  );

  const insertId = (result as any).insertId as number;

  const user = {
    id: insertId,
    email,
    displayName: displayName || null,
  };

  // Cast options pour éviter l'erreur TS sur expiresIn
  const token = jwt.sign(
    { userId: user.id },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN } as any
  );

  return { user, token };
}

export async function loginUser(params: {
  email: string;
  password: string;
}) {
  const { email, password } = params;

  const [rowsRaw] = await pool.execute(
    "SELECT * FROM users WHERE email = ?",
    [email]
  );

  const rows = rowsRaw as DbUser[];

  if (rows.length === 0) {
    const error: any = new Error("Email ou mot de passe incorrect.");
    error.status = 401;
    throw error;
  }

  const userRow = rows[0];

  const ok = await bcrypt.compare(password, userRow.password_hash);
  if (!ok) {
    const error: any = new Error("Email ou mot de passe incorrect.");
    error.status = 401;
    throw error;
  }

  const user = {
    id: userRow.id,
    email: userRow.email,
    displayName: userRow.display_name,
  };

  const token = jwt.sign(
    { userId: user.id },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN } as any
  );

  return { user, token };
}
