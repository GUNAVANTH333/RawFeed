import type { Response } from "express";
import { AdminService } from "../services/admin.service.js";
import type { AuthenticatedRequest } from "../types/express.js";

export class AdminController {
  private adminService: AdminService;

  constructor() {
    this.adminService = new AdminService();
  }

  getReports = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query["page"] as string) || 1;
      const limit = parseInt(req.query["limit"] as string) || 20;
      const resolvedParam = req.query["resolved"] as string | undefined;
      const resolved = resolvedParam === "true" ? true : resolvedParam === "false" ? false : undefined;

      const result = await this.adminService.getReports(page, limit, resolved);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  };

  resolveReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const { id } = req.params as { id: string };
      const { action } = req.body as { action: string };

      const report = await this.adminService.resolveReport(id, action, req.userId);
      res.status(200).json({ message: "Report resolved", report });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "NOT_FOUND") {
          res.status(404).json({ error: "Report not found" });
          return;
        }
        if (error.message === "ALREADY_RESOLVED") {
          res.status(409).json({ error: "Report is already resolved" });
          return;
        }
      }
      res.status(500).json({ error: "Internal server error" });
    }
  };

  getUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query["page"] as string) || 1;
      const limit = parseInt(req.query["limit"] as string) || 20;

      const result = await this.adminService.getUsers(page, limit);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  };

  banUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params as { id: string };

      const user = await this.adminService.banUser(id);
      res.status(200).json({ message: "User banned", user });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "NOT_FOUND") {
          res.status(404).json({ error: "User not found" });
          return;
        }
        if (error.message === "CANNOT_BAN_ADMIN") {
          res.status(403).json({ error: "Cannot ban another admin" });
          return;
        }
      }
      res.status(500).json({ error: "Internal server error" });
    }
  };

  unbanUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params as { id: string };

      const user = await this.adminService.unbanUser(id);
      res.status(200).json({ message: "User unbanned", user });
    } catch (error) {
      if (error instanceof Error && error.message === "NOT_FOUND") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.status(500).json({ error: "Internal server error" });
    }
  };

  adjustShadowScore = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const { delta } = req.body as { delta: number };

      const user = await this.adminService.adjustShadowScore(id, delta);
      res.status(200).json({ message: "Shadow score updated", user });
    } catch (error) {
      if (error instanceof Error && error.message === "NOT_FOUND") {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.status(500).json({ error: "Internal server error" });
    }
  };

  forceDeleteThread = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params as { id: string };

      await this.adminService.forceDeleteThread(id);
      res.status(200).json({ message: "Thread deleted" });
    } catch (error) {
      if (error instanceof Error && error.message === "NOT_FOUND") {
        res.status(404).json({ error: "Thread not found" });
        return;
      }
      res.status(500).json({ error: "Internal server error" });
    }
  };

  forceDeleteComment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params as { id: string };

      await this.adminService.forceDeleteComment(id);
      res.status(200).json({ message: "Comment deleted" });
    } catch (error) {
      if (error instanceof Error && error.message === "NOT_FOUND") {
        res.status(404).json({ error: "Comment not found" });
        return;
      }
      res.status(500).json({ error: "Internal server error" });
    }
  };
}
