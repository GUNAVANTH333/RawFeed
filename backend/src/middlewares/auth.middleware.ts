import type { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { AuthenticatedRequest } from "../types/express.js";

const JWT_SECRET = process.env["JWT_SECRET"] ?? "fallback_secret";

interface JwtPayload {
  userId: string;
}

export class AuthMiddleware {
  static authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      const token = req.cookies?.["token"] as string | undefined;

      if (!token) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }

      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      req.userId = decoded.userId;

      next();
    } catch (error) {
      res.status(401).json({ error: "Invalid or expired token" });
    }
  };

  static optionalAuthenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      const token = req.cookies?.["token"] as string | undefined;

      if (token) {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
        req.userId = decoded.userId;
      }

      next();
    } catch (error) {
      next();
    }
  };
}
