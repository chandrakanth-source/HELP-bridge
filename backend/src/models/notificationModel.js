const db = require("../config/database");

const createNotification = async (userId, requestId, type, title, message) => {
  const result = await db.query(
    `
      INSERT INTO notifications (user_id, request_id, type, title, message, is_read, created_at)
      VALUES ($1, $2, $3, $4, $5, false, NOW())
      RETURNING *
    `,
    [userId, requestId, type, title, message],
  );

  return result.rows[0];
};

const getUserNotifications = async (userId) => {
  const result = await db.query(
    `
      SELECT *
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
    `,
    [userId],
  );

  return result.rows;
};

const markNotificationAsRead = async (notificationId, userId) => {
  const result = await db.query(
    `
      UPDATE notifications
      SET is_read = true
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `,
    [notificationId, userId],
  );

  return result.rows;
};

module.exports = {
  createNotification,
  getUserNotifications,
  markNotificationAsRead,
};

