const express = require("express");
const {
  getManagers,
  updateManagerStatus,
} = require("../controllers/adminController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

router.use(authMiddleware, adminMiddleware);
router.get("/managers", getManagers);
router.patch("/managers/:id", updateManagerStatus);

module.exports = router;

