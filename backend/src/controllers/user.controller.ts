import type { Request, Response } from "express";
import { UserService } from "../services/user.service.js";
import { generateToken, clearToken } from "../utils/jwt.js";
import type { AuthenticatedRequest } from "../types/express.js";

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, username } = req.body as { email: string; password: string; username: string };

      const existingUser = await this.userService.findByEmail(email);
      if (existingUser) {
        res.status(409).json({ error: "Email already exists" });
        return;
      }

      const existingUsername = await this.userService.findByUsername(username);
      if (existingUsername) {
        res.status(409).json({ error: "Username already exists" });
        return;
      }

      const user = await this.userService.createUser(email, password, username);

      generateToken(res, user.id);

      res.status(201).json({
        message: "User registered successfully",
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  login = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { identifier, password } = req.body as { identifier: string; password: string };

      if (!identifier || !password) {
        res.status(400).json({ error: "Email/Username and password are required" });
        return;
      }

      const user = identifier.includes("@")
        ? await this.userService.findByEmail(identifier)
        : await this.userService.findByUsername(identifier);

      if (!user) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      const isPasswordValid = await this.userService.comparePasswords(password, user.password);

      if (!isPasswordValid) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      generateToken(res, user.id);

      res.status(200).json({
        message: "Logged in successfully",
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const user = await this.userService.getProfile(req.userId);

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.status(200).json({ user });
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  logout = async (_req: Request, res: Response): Promise<void> => {
    try {
      clearToken(res);
      res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  updateUsername = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const { username } = req.body as { username: string };

      const existingUser = await this.userService.findByUsername(username);
      if (existingUser && existingUser.id !== req.userId) {
        res.status(409).json({ error: "Username already exists" });
        return;
      }

      const updatedUser = await this.userService.updateUsername(req.userId, username);

      res.status(200).json({
        message: "Username updated successfully",
        user: updatedUser,
      });
    } catch (error) {
      console.error("Update username error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const { bio, profilePhoto } = req.body as { bio?: string | null; profilePhoto?: string | null };

      const updatedUser = await this.userService.updateProfile(req.userId, bio, profilePhoto);

      res.status(200).json({
        message: "Profile updated successfully",
        user: updatedUser,
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  getPublicProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { username } = req.params as { username: string };

      const profile = await this.userService.getPublicProfile(username);
      if (!profile) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.status(200).json({ user: profile });
    } catch (error) {
      console.error("Get public profile error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}
