const pool = require("../config/database");

const getOrCreateChatId = async (requestId) => {
  const existing = await pool.query(
    `SELECT id FROM chats WHERE request_id = $1`,
    [requestId],
  );
  if (existing.rows.length) return existing.rows[0].id;

  const created = await pool.query(
    `INSERT INTO chats (request_id) VALUES ($1)
     ON CONFLICT (request_id) DO UPDATE SET request_id = EXCLUDED.request_id
     RETURNING id`,
    [requestId],
  );
  return created.rows[0].id;
};

const createMessage = async (requestId, senderId, message) => {
  const chatId = await getOrCreateChatId(requestId);

  const result = await pool.query(
    `INSERT INTO messages (chat_id, request_id, sender_id, message)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [chatId, requestId, senderId, message],
  );
  return result.rows[0];
};

const getMessagesByRequestId = async (requestId) => {
  const result = await pool.query(
    `SELECT
       m.id,
       m.request_id,
       m.sender_id,
       u.name  AS sender_name,
       u.role  AS sender_role,
       m.message,
       m.sent_at AS created_at
     FROM messages m
     JOIN users u ON u.id = m.sender_id
     WHERE m.request_id = $1
     ORDER BY m.sent_at ASC`,
    [requestId],
  );
  return result.rows;
};

const markMessagesAsRead = async (requestId, userId) => {
  const result = await pool.query(
    `UPDATE messages
     SET is_read = TRUE
     WHERE request_id = $1
       AND sender_id  != $2
       AND is_read = FALSE
     RETURNING *`,
    [requestId, userId],
  );
  return result.rows;
};

const getUnreadMessageCount = async (requestId, userId) => {
  const result = await pool.query(
    `SELECT COUNT(*) AS unread_count
     FROM messages
     WHERE request_id = $1
       AND sender_id != $2
       AND is_read = FALSE`,
    [requestId, userId],
  );
  return parseInt(result.rows[0].unread_count, 10);
};

module.exports = {
  createMessage,
  getMessagesByRequestId,
  markMessagesAsRead,
  getUnreadMessageCount,
};

