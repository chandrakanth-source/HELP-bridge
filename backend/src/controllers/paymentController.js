const Razorpay = require("razorpay");
const crypto = require("crypto");

const paymentModel = require("../models/paymentModel");
const pool = require("../config/database");

const getRazorpayClient = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return null;
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

const createOrder = async (req, res) => {
  try {
    const razorpay = getRazorpayClient();
    if (!razorpay) {
      return res.status(503).json({
        message:
          "Online payments are not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to backend/.env.",
      });
    }
    const { requestId } = req.body;

    if (!requestId) {
      return res.status(400).json({
        message: "Request ID is required",
      });
    }

    const result = await pool.query(
      `
            SELECT
                id,
                requester_id,
                assigned_provider_id,
                status
            FROM help_requests
            WHERE id = $1
            `,
      [requestId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Help request not found",
      });
    }

    const request = result.rows[0];

    if (request.requester_id !== req.user.id) {
      return res.status(403).json({
        message: "You are not authorized to make this payment",
      });
    }

    if (request.status !== "completed") {
      return res.status(400).json({
        message: "Payment is available only after the help is completed",
      });
    }

    const amount = 10000;

    const options = {
      amount: amount,
      currency: "INR",
      receipt: `helpbridge_${requestId}`,
    };

    const order = await razorpay.orders.create(options);

    const payment = await paymentModel.createPayment({
      requestId: request.id,
      seekerId: request.requester_id,
      providerId: request.assigned_provider_id,
      amount: amount / 100,
      razorpayOrderId: order.id,
    });

    res.status(201).json({
      message: "Razorpay order created successfully",
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      paymentId: payment.id,
    });
  } catch (error) {
    console.error("Create payment order error:", error);

    res.status(500).json({
      message: "Failed to create payment order",
    });
  }
};

const verifyPayment = async (req, res) => {
  try {
    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res
        .status(503)
        .json({ message: "Online payments are not configured." });
    }
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        message: "Payment verification details are required",
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "utf8");
    const receivedBuffer = Buffer.from(razorpay_signature, "utf8");
    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      return res.status(400).json({
        message: "Invalid payment signature",
      });
    }

    const payment = await paymentModel.updatePaymentStatus(
      razorpay_order_id,
      "successful",
      razorpay_payment_id,
      req.user.id,
    );

    if (!payment) {
      return res.status(404).json({
        message: "Payment record not found",
      });
    }

    res.status(200).json({
      message: "Payment verified successfully",
      payment,
    });
  } catch (error) {
    console.error("Payment verification error:", error);

    res.status(500).json({
      message: "Payment verification failed",
    });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
};

