import { Router } from "express";
import { CommentController } from "../controllers/comment.controller.js";
import { AuthMiddleware } from "../middlewares/auth.middleware.js";
import { ValidateMiddleware } from "../middlewares/validate.middleware.js";
import { CreateCommentSchema, VoteSchema, ReportSchema } from "../utils/validators.js";

const router = Router();
const commentController = new CommentController();

router.post(
  "/threads/:threadId/comments",
  AuthMiddleware.authenticate,
  AuthMiddleware.checkBanned,
  ValidateMiddleware.body(CreateCommentSchema),
  commentController.create
);

router.get("/threads/:threadId/comments", AuthMiddleware.optionalAuthenticate, commentController.getByThread);

router.post(
  "/comments/:id/vote",
  AuthMiddleware.authenticate,
  ValidateMiddleware.body(VoteSchema),
  commentController.vote
);

router.delete(
  "/comments/:id",
  AuthMiddleware.authenticate,
  commentController.delete
);

router.post(
  "/comments/:id/report",
  AuthMiddleware.authenticate,
  ValidateMiddleware.body(ReportSchema),
  commentController.reportComment
);

export default router;
