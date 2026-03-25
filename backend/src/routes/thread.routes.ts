import { Router } from "express";
import { ThreadController } from "../controllers/thread.controller.js";
import { AuthMiddleware } from "../middlewares/auth.middleware.js";
import { ValidateMiddleware } from "../middlewares/validate.middleware.js";
import { CreateThreadSchema } from "../utils/validators.js";

const router = Router();
const threadController = new ThreadController();

router.post(
  "/",
  AuthMiddleware.authenticate,
  ValidateMiddleware.body(CreateThreadSchema),
  threadController.create
);
router.get("/", AuthMiddleware.optionalAuthenticate, threadController.getAll);
router.get("/:id", AuthMiddleware.optionalAuthenticate, threadController.getById);
router.put("/:id", AuthMiddleware.authenticate, threadController.update);
router.delete("/:id", AuthMiddleware.authenticate, threadController.delete);
router.post("/:id/like", AuthMiddleware.authenticate, threadController.toggleLike);

export default router;
