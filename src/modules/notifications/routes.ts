import { Router } from "express";
import { NotificationController } from "./controllers/notification.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();
const notificationController = new NotificationController();

router.get("/", authMiddleware, notificationController.getNotifications);
router.get("/unread/count", authMiddleware, notificationController.getUnreadCount);
router.patch("/:id/read", authMiddleware, notificationController.markAsRead);
router.patch("/read-all", authMiddleware, notificationController.markAllAsRead);
router.delete("/:id", authMiddleware, notificationController.deleteNotification);

export default router;
