import { Router } from "express";
import { CommentController } from "../controllers/comment.controller.js";
import { AuthMiddleware } from "../middlewares/auth.middleware.js";
import { ValidateMiddleware } from "../middlewares/validate.middleware.js";
import { CreateCommentSchema, VoteSchema } from "../utils/validators.js";

const router = Router();
const commentController = new CommentController();

router.post(
  "/threads/:threadId/comments",
  AuthMiddleware.authenticate,
  ValidateMiddleware.body(CreateCommentSchema),
  commentController.create
);

router.get("/threads/:threadId/comments", commentController.getByThread);

router.post(
  "/comments/:id/vote",
  AuthMiddleware.authenticate,
  ValidateMiddleware.body(VoteSchema),
  commentController.vote
);

export default router;
