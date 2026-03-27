import { Router } from "express";
import { UserController } from "../controllers/user.controller.js";
import { AuthMiddleware } from "../middlewares/auth.middleware.js";
import { ValidateMiddleware } from "../middlewares/validate.middleware.js";
import { RegisterSchema, LoginSchema, UpdateUsernameSchema, UpdateProfileSchema } from "../utils/validators.js";

const router = Router();
const userController = new UserController();

router.post("/register", ValidateMiddleware.body(RegisterSchema), userController.register);
router.post("/login", ValidateMiddleware.body(LoginSchema), userController.login);
router.get("/profile", AuthMiddleware.authenticate, userController.getProfile);
router.put("/username", AuthMiddleware.authenticate, ValidateMiddleware.body(UpdateUsernameSchema), userController.updateUsername);
router.put("/profile", AuthMiddleware.authenticate, ValidateMiddleware.body(UpdateProfileSchema), userController.updateProfile);
router.get("/:username", userController.getPublicProfile);
router.post("/logout", userController.logout);

export default router;
