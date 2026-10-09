const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware");
const {
  submitOffer,
  getHistory,
  acceptOffer,
  rejectOffer,
} = require("../controllers/bargainController");

router.post("/offer", authenticateToken, submitOffer);
router.get("/history/:requestId", authenticateToken, getHistory);
router.post("/accept/:offerId", authenticateToken, acceptOffer);
router.post("/reject/:offerId", authenticateToken, rejectOffer);

module.exports = router;

