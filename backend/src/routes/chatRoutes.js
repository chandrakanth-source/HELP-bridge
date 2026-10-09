const express = require("express");

const router = express.Router();

const {
  sendMessage,
  getMessages,
  markAsRead,
  getUnreadCount,
} = require("../controllers/messageController");

const { handleChatbotQuery } = require("../controllers/chatbotController");

const authMiddleware = require("../middleware/authMiddleware");
const chatMiddleware = require("../middleware/chatMiddleware");

router.post("/assistant", handleChatbotQuery);

router.get(
  "/:requestId/messages/unread",
  authMiddleware,
  chatMiddleware,
  getUnreadCount,
);
router.put(
  "/:requestId/messages/read",
  authMiddleware,
  chatMiddleware,
  markAsRead,
);
router.post(
  "/:requestId/messages",
  authMiddleware,
  chatMiddleware,
  sendMessage,
);

router.get("/:requestId/messages", authMiddleware, chatMiddleware, getMessages);

module.exports = router;

