import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../config/jwt";

export interface AuthRequest extends Request {
  user?: { id: string };
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    const payload = verifyToken(token);
    req.user = { id: payload.userId };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}


