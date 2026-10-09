const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware");
const {
  updateUserLocation,
  getRequestTrackingData,
} = require("../controllers/locationController");

router.post("/update", authenticateToken, updateUserLocation);
router.get("/track/:requestId", authenticateToken, getRequestTrackingData);

module.exports = router;

