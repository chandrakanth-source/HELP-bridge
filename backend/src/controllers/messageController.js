const {
  createMessage,
  getMessagesByRequestId,
  markMessagesAsRead,
  getUnreadMessageCount,
} = require("../models/messageModels");

const getUnreadCount = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;

    const unreadCount = await getUnreadMessageCount(requestId, userId);

    res.status(200).json({
      requestId,
      unreadCount,
    });
  } catch (error) {
    console.error("Get unread count error:", error);

    res.status(500).json({
      message: "Failed to get unread message count",
    });
  }
};
const markAsRead = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;

    const messages = await markMessagesAsRead(requestId, userId);

    res.status(200).json({
      message: "Messages marked as read",
      messages,
    });
  } catch (error) {
    console.error("Mark messages as read error:", error);

    res.status(500).json({
      message: "Failed to mark messages as read",
    });
  }
};
const sendMessage = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { message } = req.body;

    const senderId = req.user.id;

    if (!message || message.trim() === "") {
      return res.status(400).json({
        message: "Message cannot be empty",
      });
    }

    const newMessage = await createMessage(requestId, senderId, message.trim());

    res.status(201).json({
      message: "Message sent successfully",
      data: newMessage,
    });
  } catch (error) {
    console.error("Send message error:", error);

    res.status(500).json({
      message: "Failed to send message",
    });
  }
};

const getMessages = async (req, res) => {
  try {
    const { requestId } = req.params;

    const messages = await getMessagesByRequestId(requestId);

    res.status(200).json({
      messages,
    });
  } catch (error) {
    console.error("Get messages error:", error);

    res.status(500).json({
      message: "Failed to fetch messages",
    });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  markAsRead,
  getUnreadCount,
};

