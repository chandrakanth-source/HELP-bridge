const {
  getUserNotifications,
  markNotificationAsRead,
} = require("../models/notificationModel");

const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const notifications = await getUserNotifications(userId);

    res.status(200).json({
      notifications,
    });
  } catch (error) {
    console.error("Get notifications error:", error);

    res.status(500).json({
      message: "Failed to get notifications",
    });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await markNotificationAsRead(id, userId);

    res.status(200).json({
      message: "Notification marked as read",
      result,
    });
  } catch (error) {
    console.error("Mark notification as read error:", error);

    res.status(500).json({
      message: "Failed to mark notification as read",
    });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
};

