const { getBotResponse } = require("../services/chatbotService");

const handleChatbotQuery = async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ message: "Message text is required." });
    }

    const reply = await getBotResponse(message, context);

    res.status(200).json({
      reply,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Chatbot controller error:", error);
    res.status(500).json({ message: "Chatbot service temporarily unavailable." });
  }
};

module.exports = {
  handleChatbotQuery,
};

