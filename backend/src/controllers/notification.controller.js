import { Notification } from "../models/notification.model.js";

/**
 * 1. 로그인 유저의 알림 목록 및 읽지 않은 알림 수 조회
 * GET /api/notifications
 */
export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      userId,
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 2. 특정 알림 읽음 표시 처리
 * PATCH /api/notifications/:id/read
 */
export const markNotificationAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const notificationId = req.params.id;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true },
      { returnDocument: "after" },
    );

    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "알림을 찾을 수 없습니다." });
    }

    const unreadCount = await Notification.countDocuments({
      userId,
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      notification,
      unreadCount,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 3. 로그인 유저의 모든 알림 일괄 읽음 표시 처리
 * PATCH /api/notifications/read-all
 */
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.updateMany(
      { userId, isRead: false },
      { $set: { isRead: true } },
    );

    return res.status(200).json({
      success: true,
      message: "모든 알림을 읽음 처리했습니다.",
      unreadCount: 0,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 4. 특정 알림 삭제
 * DELETE /api/notifications/:id
 */
export const deleteNotification = async (req, res) => {
  try {
    const userId = req.user._id;
    const notificationId = req.params.id;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId,
    });

    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "삭제할 알림을 찾을 수 없습니다." });
    }

    const unreadCount = await Notification.countDocuments({
      userId,
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      message: "알림이 삭제되었습니다.",
      unreadCount,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 5. 모든 알림 일괄 삭제
 * DELETE /api/notifications
 */
export const clearAllNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.deleteMany({ userId });

    return res.status(200).json({
      success: true,
      message: "모든 알림이 삭제되었습니다.",
      unreadCount: 0,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
