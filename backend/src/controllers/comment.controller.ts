import type { Response } from "express";
import { CommentService } from "../services/comment.service.js";
import type { AuthenticatedRequest } from "../types/express.js";

export class CommentController {
  private commentService: CommentService;

  constructor() {
    this.commentService = new CommentService();
  }

  create = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const { threadId } = req.params as { threadId: string };
      const { content, parentId } = req.body as {
        content?: string;
        parentId?: string;
      };

      if (!content || content.trim().length === 0) {
        res.status(400).json({ error: "Comment content is required" });
        return;
      }

      const comment = await this.commentService.createComment(
        req.userId,
        threadId,
        content.trim(),
        parentId
      );

      res.status(201).json({
        message: "Comment created successfully",
        comment,
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  };

  getByThread = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { threadId } = req.params as { threadId: string };
      const userId = req.userId;

      const comments = await this.commentService.getCommentsByThread(
        threadId,
        userId
      );

      res.status(200).json({ comments });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  };

  vote = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const { id } = req.params as { id: string };
      const { type } = req.body as { type?: string };

      if (type !== "up" && type !== "down") {
        res.status(400).json({ error: "Vote type must be 'up' or 'down'" });
        return;
      }

      const result = await this.commentService.voteComment(
        req.userId,
        id,
        type
      );

      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  };
}
