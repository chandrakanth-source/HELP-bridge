const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  getProfile,
  updateProfile,
  updateLocation,
  updateAvailability,
} = require("../controllers/profileController");

const router = express.Router();

router.use(authMiddleware);
router.get("/", getProfile);
router.patch("/", updateProfile);
router.patch("/location", updateLocation);
router.patch("/availability", updateAvailability);

module.exports = router;

