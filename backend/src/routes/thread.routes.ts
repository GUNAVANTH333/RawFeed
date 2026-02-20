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
router.get("/", threadController.getAll);
router.get("/:id", threadController.getById);

export default router;
