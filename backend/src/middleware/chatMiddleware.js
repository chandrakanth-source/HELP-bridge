const pool = require("../config/database");

const chatMiddleware = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT id, requester_id, assigned_provider_id, status FROM help_requests WHERE id = $1`,
      [requestId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Help request not found" });
    }

    const request = result.rows[0];
    const isRequester = Number(request.requester_id) === Number(userId);
    const isSingleProvider = Number(request.assigned_provider_id) === Number(userId);

    let isAssignedProvider = isSingleProvider;
    if (!isAssignedProvider) {
      const assignRes = await pool.query(
        `SELECT 1 FROM request_assignments WHERE request_id = $1 AND provider_id = $2 LIMIT 1`,
        [requestId, userId],
      );
      isAssignedProvider = assignRes.rows.length > 0;
    }

    if (!isRequester && !isAssignedProvider) {
      return res.status(403).json({ message: "Access denied. You are not part of this help request." });
    }

    req.helpRequest = request;
    next();
  } catch (error) {
    console.error("Chat authorization error:", error);
    res.status(500).json({ message: "Chat authorization failed" });
  }
};

module.exports = chatMiddleware;

