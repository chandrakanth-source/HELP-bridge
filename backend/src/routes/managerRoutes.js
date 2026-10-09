const express = require("express");

const router = express.Router();

const {
  getPendingRequests,
  getEmergencyRequests,
  getNonEmergencyRequests,
  getActiveRequests,
  getCompletedRequests,
  getEmergencyRequestById,
  getProviderByIdOrName,
  getProviders,
  getNearbyProviders,
  approveRequest,
  rejectRequest,
  completeRequest,
  getDashboardStats,
  assignProvider,
  getPendingAssignments,
} = require("../controllers/managerController");

const authMiddleware = require("../middleware/authMiddleware");
const managerMiddleware = require("../middleware/managerMiddleware");

router.get(
  "/requests/pending",
  authMiddleware,
  managerMiddleware,
  getPendingRequests,
);

router.get(
  "/requests/emergency",
  authMiddleware,
  managerMiddleware,
  getEmergencyRequests,
);

router.get(
  "/requests/non-emergency",
  authMiddleware,
  managerMiddleware,
  getNonEmergencyRequests,
);

router.get(
  "/requests/active",
  authMiddleware,
  managerMiddleware,
  getActiveRequests,
);

router.get(
  "/requests/pending-assignments",
  authMiddleware,
  managerMiddleware,
  getPendingAssignments,
);

router.get(
  "/requests/completed",
  authMiddleware,
  managerMiddleware,
  getCompletedRequests,
);

router.get(
  "/requests/emergency/:id",
  authMiddleware,
  managerMiddleware,
  getEmergencyRequestById,
);

router.get(
  "/providers/:id",
  authMiddleware,
  managerMiddleware,
  getProviderByIdOrName,
);

router.get("/providers", authMiddleware, managerMiddleware, getProviders);

router.get(
  "/requests/:id/nearby-providers",
  authMiddleware,
  managerMiddleware,
  getNearbyProviders,
);

router.put(
  "/requests/:id/approve",
  authMiddleware,
  managerMiddleware,
  approveRequest,
);

router.put(
  "/requests/:id/reject",
  authMiddleware,
  managerMiddleware,
  rejectRequest,
);

router.put(
  "/requests/:id/assign",
  authMiddleware,
  managerMiddleware,
  assignProvider,
);

router.put(
  "/requests/:id/complete",
  authMiddleware,
  managerMiddleware,
  completeRequest,
);

router.get(
  "/dashboard/stats",
  authMiddleware,
  managerMiddleware,
  getDashboardStats,
);

module.exports = router;

