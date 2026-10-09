const KNOWLEDGE_BASE = [
  {
    keywords: ["emergency", "sos", "danger", "police", "fire", "ambulance", "hospital"],
    response: "🚨 **Emergency Assistance**: For critical life-threatening situations, please use the red **SOS Button** on the dashboard immediately. HelpBridge will automatically broadcast your live GPS coordinates to verified emergency providers nearby."
  },
  {
    keywords: ["bargain", "price", "negotiate", "money", "cost", "fee", "cheap", "charge"],
    response: "💰 **Price Bargaining**: For non-emergency requests, HelpBridge allows direct price negotiation between Seekers and Providers! Once you submit an offer, the provider can accept or send a counter-offer. You can negotiate up to 3 rounds per candidate."
  },
  {
    keywords: ["tracking", "location", "gps", "map", "live", "where"],
    response: "📍 **Live GPS Tracking**: Once a request is accepted, both the Seeker and Provider can see each other's live location on the interactive tracking map with real-time distance updates."
  },
  {
    keywords: ["manager", "approve", "verification", "verify"],
    response: "🛡️ **Verification**: All non-emergency requests undergo brief manager verification to prevent spam, while emergency SOS requests trigger instant auto-broadcast to all nearby providers!"
  },
  {
    keywords: ["hello", "hi", "hey", "help", "who are you"],
    response: "Hello! I am **HelpBridge AI Assistant**. How can I help you today? You can ask me about emergency SOS help, price bargaining, live location tracking, or account verification."
  }
];

async function getBotResponse(userMessage, context = {}) {
  const prompt = (userMessage || "").toLowerCase();

  for (const item of KNOWLEDGE_BASE) {
    if (item.keywords.some((kw) => prompt.includes(kw))) {
      return item.response;
    }
  }

  return "I'm here to help with your HelpBridge experience! You can request emergency assistance via the SOS page, negotiate pricing on non-emergency tasks, or track your assigned provider in real time on the live map.";
}

module.exports = {
  getBotResponse,
};

