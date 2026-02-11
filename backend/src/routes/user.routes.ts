import { Router } from "express";
import { UserController } from "../controllers/user.controller.js";
import { AuthMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();
const userController = new UserController();

router.post("/register", userController.register);
router.post("/login", userController.login);
router.get("/profile", AuthMiddleware.authenticate, userController.getProfile);
router.post("/logout", userController.logout);

export default router;
