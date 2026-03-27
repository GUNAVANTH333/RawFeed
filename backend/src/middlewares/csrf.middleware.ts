import { randomBytes } from "node:crypto";
import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../types/express.js";

export class CsrfMiddleware {
  static generateToken(_req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    const csrfToken = randomBytes(32).toString("hex");

    res.cookie("csrf_token", csrfToken, {
      httpOnly: false,
      secure: process.env["NODE_ENV"] === "production",
      sameSite: process.env["NODE_ENV"] === "production" ? "none" : "lax", 
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    next();
  }

  static validate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    const headerToken = req.headers["x-csrf-token"] as string | undefined;
    const cookieToken = req.cookies?.["csrf_token"] as string | undefined;

    if (!headerToken || !cookieToken) {
      res.status(403).json({ error: "CSRF token missing" });
      return;
    }

    if (headerToken !== cookieToken) {
      res.status(403).json({ error: "CSRF token mismatch" });
      return;
    }

    next();
  }
}
