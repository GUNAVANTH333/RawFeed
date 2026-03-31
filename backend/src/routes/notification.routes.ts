import { Router } from "express";
import type { Response } from "express";
import type { AuthenticatedRequest } from "../types/express.js";
import { AuthMiddleware } from "../middlewares/auth.middleware.js";
import { getNotifications, markAllRead, markOneRead } from "../services/notification.service.js";

const router = Router();

// GET /api/notifications — fetch all notifications for the logged-in user
router.get("/", AuthMiddleware.authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await getNotifications(req.userId!);
    res.status(200).json(result);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/notifications/read-all — mark all as read
router.put("/read-all", AuthMiddleware.authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    await markAllRead(req.userId!);
    res.status(200).json({ message: "All notifications marked as read" });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/notifications/:id/read — mark one as read
router.put("/:id/read", AuthMiddleware.authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    await markOneRead(req.params["id"] as string, req.userId!);
    res.status(200).json({ message: "Notification marked as read" });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
