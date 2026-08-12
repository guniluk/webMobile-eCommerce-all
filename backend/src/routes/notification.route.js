import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
} from "../controllers/notification.controller.js";

const router = Router();

router.use(protectRoute);

router.get("/", getUserNotifications);
router.patch("/read-all", markAllNotificationsAsRead);
router.put("/read-all", markAllNotificationsAsRead);
router.patch("/:id/read", markNotificationAsRead);
router.put("/:id/read", markNotificationAsRead);
router.delete("/:id", deleteNotification);
router.delete("/", clearAllNotifications);

export default router;
