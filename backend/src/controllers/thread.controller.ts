import type { Response } from "express";
import { ThreadService } from "../services/thread.service.js";
import type { AuthenticatedRequest } from "../types/express.js";

export class ThreadController {
  private threadService: ThreadService;

  constructor() {
    this.threadService = new ThreadService();
  }

  create = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const { title, url, domain, imageUrl } = req.body as {
        title?: string;
        url?: string;
        domain?: string;
        imageUrl?: string;
      };

      if (!title) {
        res.status(400).json({ error: "Title is required" });
        return;
      }

      const thread = await this.threadService.createThread(req.userId, {
        title,
        ...(url !== undefined && { url }),
        ...(domain !== undefined && { domain }),
        ...(imageUrl !== undefined && { imageUrl }),
      });

      res.status(201).json({
        message: "Thread created successfully",
        thread,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("Unique constraint")
      ) {
        res
          .status(409)
          .json({ error: "A thread with this URL already exists" });
        return;
      }
      res.status(500).json({ error: "Internal server error" });
    }
  };

  getAll = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query["page"] as string) || 1;
      const limit = parseInt(req.query["limit"] as string) || 20;

      const result = await this.threadService.getAllThreads(page, limit, req.userId);

      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  };

  getById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const userId = req.userId;

      const thread = await this.threadService.getThreadById(id, userId);

      if (!thread) {
        res.status(404).json({ error: "Thread not found" });
        return;
      }

      res.status(200).json({ thread });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const { id } = req.params as { id: string };

      await this.threadService.deleteThread(id, req.userId);

      res.status(200).json({ message: "Thread deleted successfully" });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "NOT_FOUND") {
          res.status(404).json({ error: "Thread not found" });
          return;
        }
        if (error.message === "FORBIDDEN") {
          res.status(403).json({ error: "You can only delete your own threads" });
          return;
        }
      }
      res.status(500).json({ error: "Internal server error" });
    }
  };

  update = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const { id } = req.params as { id: string };
      const { title, url, imageUrl } = req.body as {
        title?: string;
        url?: string;
        imageUrl?: string;
      };

      const data: { title?: string; url?: string; imageUrl?: string } = {};
      if (title !== undefined) data.title = title;
      if (url !== undefined) data.url = url;
      if (imageUrl !== undefined) data.imageUrl = imageUrl;

      const thread = await this.threadService.updateThread(id, req.userId, data);

      res.status(200).json({ message: "Thread updated successfully", thread });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "NOT_FOUND") {
          res.status(404).json({ error: "Thread not found" });
          return;
        }
        if (error.message === "FORBIDDEN") {
          res.status(403).json({ error: "You can only edit your own threads" });
          return;
        }
      }
      res.status(500).json({ error: "Internal server error" });
    }
  };

  toggleLike = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const { id } = req.params as { id: string };

      const result = await this.threadService.toggleLike(id, req.userId);

      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  };
}
