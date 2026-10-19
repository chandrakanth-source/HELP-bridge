const express = require("express");

const router = express.Router();

const {
  register,
  login,
  requestPasswordReset,
  resetPassword,
} = require("../controllers/authController");

const upload = require("../middleware/uploadMiddleware");

const handleDocumentUpload = (req, res, next) => {
  upload.single("document")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || "Document upload failed" });
    }
    next();
  });
};

router.post("/register", handleDocumentUpload, register);

router.post("/login", login);
router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password", resetPassword);

module.exports = router;

