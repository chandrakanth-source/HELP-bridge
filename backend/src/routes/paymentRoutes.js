const express = require("express");

const router = express.Router();

const {
  createOrder,
  verifyPayment,
} = require("../controllers/paymentController");
const { getCompletedPaymentsForSeeker } = require("../models/paymentModel");

const authMiddleware = require("../middleware/authMiddleware");
const rateLimit = require("express-rate-limit");

const paymentRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

router.post("/create-order", paymentRateLimit, authMiddleware, createOrder);

router.post("/verify", paymentRateLimit, authMiddleware, verifyPayment);

router.get("/completed", authMiddleware, async (req, res) => {
  try {
    const payments = await getCompletedPaymentsForSeeker(req.user.id);
    res.status(200).json({ payments });
  } catch (error) {
    console.error("Get completed payments error:", error);
    res.status(500).json({ message: "Failed to fetch payment history" });
  }
});

module.exports = router;

