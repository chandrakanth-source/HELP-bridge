const express = require("express");

const router = express.Router();

const {
  createRequest,
  getMyRequests,
  getRequestById,
} = require("../controllers/helpRequestController");

const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, createRequest);

router.get("/my", authMiddleware, getMyRequests);

router.get("/:id", authMiddleware, getRequestById);
router.get("/my-requests", authMiddleware, getMyRequests);
module.exports = router;

