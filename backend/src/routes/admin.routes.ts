import { Router } from "express";
import { AdminController } from "../controllers/admin.controller.js";
import { AuthMiddleware } from "../middlewares/auth.middleware.js";
import { ValidateMiddleware } from "../middlewares/validate.middleware.js";
import {
  AdminResolveReportSchema,
  AdminBanUserSchema,
  AdminShadowScoreSchema,
} from "../utils/validators.js";

const router = Router();
const adminController = new AdminController();

const auth = AuthMiddleware.authenticate;
const isAdmin = AuthMiddleware.requireAdmin;

router.get("/reports", auth, isAdmin, adminController.getReports);
router.patch("/reports/:id", auth, isAdmin, ValidateMiddleware.body(AdminResolveReportSchema), adminController.resolveReport);

router.get("/users", auth, isAdmin, adminController.getUsers);
router.patch("/users/:id/ban", auth, isAdmin, ValidateMiddleware.body(AdminBanUserSchema), adminController.banUser);
router.patch("/users/:id/unban", auth, isAdmin, adminController.unbanUser);
router.patch("/users/:id/shadow-score", auth, isAdmin, ValidateMiddleware.body(AdminShadowScoreSchema), adminController.adjustShadowScore);

router.delete("/threads/:id", auth, isAdmin, adminController.forceDeleteThread);
router.delete("/comments/:id", auth, isAdmin, adminController.forceDeleteComment);

export default router;
