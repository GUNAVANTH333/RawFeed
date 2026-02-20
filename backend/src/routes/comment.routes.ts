import { Router } from "express";
import { CommentController } from "../controllers/comment.controller.js";
import { AuthMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();
const commentController = new CommentController();

router.post(
  "/threads/:threadId/comments",
  AuthMiddleware.authenticate,
  commentController.create
);

router.get("/threads/:threadId/comments", commentController.getByThread);

router.post(
  "/comments/:id/vote",
  AuthMiddleware.authenticate,
  commentController.vote
);

export default router;
