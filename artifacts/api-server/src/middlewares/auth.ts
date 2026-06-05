import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.SESSION_SECRET || "ujima-sacco-secret-2024";

export interface AuthRequest extends Request {
  user?: typeof usersTable.$inferSelect;
  userId?: number;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "No token provided" });
    return;
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number; role: string };
    req.userId = payload.userId;
    db.select().from(usersTable).where(eq(usersTable.id, payload.userId)).limit(1)
      .then(([user]) => {
        if (!user || !user.isActive) {
          res.status(401).json({ error: "User not found or inactive" });
          return;
        }
        req.user = user;
        next();
      })
      .catch(() => res.status(500).json({ error: "Auth error" }));
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}

export function generateTokens(userId: number, role: string) {
  const accessToken = jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: "1h" });
  const refreshToken = jwt.sign({ userId, role, type: "refresh" }, JWT_SECRET, { expiresIn: "7d" });
  return { accessToken, refreshToken };
}

export { JWT_SECRET };
