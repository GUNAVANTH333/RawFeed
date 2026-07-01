import type { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { AuthenticatedRequest } from "../types/express.js";
import prisma from "../utils/prisma.js";

const JWT_SECRET = process.env["JWT_SECRET"] ?? "fallback_secret";

interface JwtPayload {
  userId: string;
  role: string;
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

  static requireAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.userId) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { role: true },
      });

      if (user?.role !== "ADMIN") {
        res.status(403).json({ error: "Admin access required" });
        return;
      }

      req.userRole = "ADMIN";
      next();
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  };

  static checkBanned = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.userId) {
        next();
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { isBanned: true },
      });

      if (user?.isBanned) {
        res.status(403).json({ error: "Your account has been suspended" });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  };
}
