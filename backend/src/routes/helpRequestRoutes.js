const express = require("express");

const router = express.Router();

const {
  createRequest,
  getMyRequests,
  getRequestById,
} = require("../controllers/helpRequestController");

const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const handleUpload = (req, res, next) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || "File upload failed" });
    }
    next();
  });
};

router.post("/", authMiddleware, handleUpload, createRequest);

router.get("/my", authMiddleware, getMyRequests);

router.get("/:id", authMiddleware, getRequestById);
router.get("/my-requests", authMiddleware, getMyRequests);
module.exports = router;

