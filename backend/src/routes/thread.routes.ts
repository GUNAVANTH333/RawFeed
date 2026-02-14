import { Router } from "express";
import { ThreadController } from "../controllers/thread.controller.js";
import { AuthMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();
const threadController = new ThreadController();

router.post("/", AuthMiddleware.authenticate, threadController.create);
router.get("/", threadController.getAll);
router.get("/:id", threadController.getById);

export default router;
