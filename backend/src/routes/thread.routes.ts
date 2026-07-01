import { Router } from "express";
import { ThreadController } from "../controllers/thread.controller.js";
import { AuthMiddleware } from "../middlewares/auth.middleware.js";
import { ValidateMiddleware } from "../middlewares/validate.middleware.js";
import { CreateThreadSchema, ReportSchema } from "../utils/validators.js";

const router = Router();
const threadController = new ThreadController();

router.post(
  "/",
  AuthMiddleware.authenticate,
  AuthMiddleware.checkBanned,
  ValidateMiddleware.body(CreateThreadSchema),
  threadController.create
);
router.get("/", AuthMiddleware.optionalAuthenticate, threadController.getAll);
router.get("/me/anonymous", AuthMiddleware.authenticate, threadController.getMyAnonymous);
router.get("/user/:username", AuthMiddleware.optionalAuthenticate, threadController.getByUser);
router.get("/:id", AuthMiddleware.optionalAuthenticate, threadController.getById);
router.put("/:id", AuthMiddleware.authenticate, threadController.update);
router.delete("/:id", AuthMiddleware.authenticate, threadController.delete);
router.post("/:id/like", AuthMiddleware.authenticate, threadController.toggleLike);
router.post("/:id/report", AuthMiddleware.authenticate, ValidateMiddleware.body(ReportSchema), threadController.reportThread);

export default router;
