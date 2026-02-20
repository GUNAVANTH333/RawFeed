import { randomBytes } from "node:crypto";
import type { Response } from "express";
import jwt from "jsonwebtoken";
import { UserService } from "../services/user.service.js";
import type { AuthenticatedRequest } from "../types/express.js";

const JWT_SECRET = process.env["JWT_SECRET"] ?? "fallback_secret";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  register = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body as { email: string; password: string };

      if (!email || !password) {
        res.status(400).json({ error: "Email and password are required" });
        return;
      }

      const existingUser = await this.userService.findByEmail(email);
      if (existingUser) {
        res.status(409).json({ error: "User with this email already exists" });
        return;
      }

      const user = await this.userService.createUser(email, password);

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env["NODE_ENV"] === "production",
        sameSite: "lax",
        maxAge: COOKIE_MAX_AGE,
      });

      const csrfToken = randomBytes(32).toString("hex");
      res.cookie("csrf_token", csrfToken, {
        httpOnly: false,
        secure: process.env["NODE_ENV"] === "production",
        sameSite: "lax",
        maxAge: COOKIE_MAX_AGE,
      });

      res.status(201).json({
        message: "User registered successfully",
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  };

  login = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body as { email: string; password: string };

      if (!email || !password) {
        res.status(400).json({ error: "Email and password are required" });
        return;
      }

      const user = await this.userService.findByEmail(email);
      if (!user) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      if (user.isBanned) {
        res.status(403).json({ error: "This account has been banned" });
        return;
      }

      const isPasswordValid = await this.userService.comparePasswords(password, user.password);
      if (!isPasswordValid) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env["NODE_ENV"] === "production",
        sameSite: "lax",
        maxAge: COOKIE_MAX_AGE,
      });

      const csrfToken = randomBytes(32).toString("hex");
      res.cookie("csrf_token", csrfToken, {
        httpOnly: false,
        secure: process.env["NODE_ENV"] === "production",
        sameSite: "lax",
        maxAge: COOKIE_MAX_AGE,
      });

      res.status(200).json({
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  };

  getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const profile = await this.userService.getProfile(req.userId);
      if (!profile) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.status(200).json({ user: profile });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  };

  logout = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      res.clearCookie("token", {
        httpOnly: true,
        secure: process.env["NODE_ENV"] === "production",
        sameSite: "lax",
      });

      res.clearCookie("csrf_token", {
        httpOnly: false,
        secure: process.env["NODE_ENV"] === "production",
        sameSite: "lax",
      });

      res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  };
}
