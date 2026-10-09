const express = require("express");

const router = express.Router();

const {
  getAvailableRequests,
  getRequestDetails,
  getMyRequests,
  acceptRequest,
  startRequest,
  completeRequest,
  expressInterestAndAssignKNN,
  cancelProvideHelp,
} = require("../controllers/providerController");

const authMiddleware = require("../middleware/authMiddleware");

const providerMiddleware = require("../middleware/providerMiddleware");

router.post(
  "/requests/:id/express-interest",
  authMiddleware,
  providerMiddleware,
  expressInterestAndAssignKNN,
);
router.put(
  "/requests/:id/cancel",
  authMiddleware,
  providerMiddleware,
  cancelProvideHelp,
);
router.put(
  "/requests/:id/start",
  authMiddleware,
  providerMiddleware,
  startRequest,
);

router.get(
  "/requests/available",
  authMiddleware,
  providerMiddleware,
  getAvailableRequests,
);

router.get("/requests/mine", authMiddleware, providerMiddleware, getMyRequests);

router.get(
  "/requests/:id",
  authMiddleware,
  providerMiddleware,
  getRequestDetails,
);

router.put(
  "/requests/:id/accept",
  authMiddleware,
  providerMiddleware,
  acceptRequest,
);
router.put(
  "/requests/:id/complete",
  authMiddleware,
  providerMiddleware,
  completeRequest,
);

module.exports = router;

