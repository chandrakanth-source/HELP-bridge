const {
  getApprovedRequests,
  getApprovedRequestById,
  acceptHelpRequest,
  startHelpRequest,
  completeHelpRequest,
  getProviderRequests,
} = require("../models/providerModels");
const { createNotification } = require("../models/notificationModel");

const getAvailableRequests = async (req, res) => {
  try {
    const requests = await getApprovedRequests(req.user.id);

    res.status(200).json({
      requests,
    });
  } catch (error) {
    console.error("Get available requests error:", error);

    res.status(500).json({
      message: "Failed to fetch available requests",
    });
  }
};

const getMyRequests = async (req, res) => {
  try {
    const requests = await getProviderRequests(req.user.id);
    res.status(200).json({ requests });
  } catch (error) {
    console.error("Get provider requests error:", error);
    res.status(500).json({ message: "Failed to fetch provider requests" });
  }
};

const getRequestDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await getApprovedRequestById(id);

    if (!request) {
      return res.status(404).json({
        message: "Help request not found",
      });
    }

    res.status(200).json({
      request,
    });
  } catch (error) {
    console.error("Get request details error:", error);

    res.status(500).json({
      message: "Failed to fetch request",
    });
  }
};

const acceptRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const providerId = req.user.id;
    const result = await acceptHelpRequest(id, providerId);
    await createNotification(
      result.request.requester_id,
      result.request.id,
      "request_accepted",
      "Provider Accepted Your Request",
      "A provider has accepted your help request.",
    );

    res.status(200).json({
      message: "Help request accepted successfully",
      request: result.request,
      provider: result.provider,
    });
  } catch (error) {
    console.error("Accept request error:", error);

    if (error.message === "Request is not available for acceptance") {
      return res.status(409).json({
        message: error.message,
      });
    }

    if (error.message === "Provider not found") {
      return res.status(404).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Failed to accept request",
    });
  }
};

const startRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const providerId = req.user.id;

    const request = await startHelpRequest(id, providerId);

    if (!request) {
      return res.status(409).json({
        message:
          "Request cannot be started. It may not be assigned to you or is not in accepted status.",
      });
    }
    await createNotification(
      request.requester_id,
      request.id,
      "request_started",
      "Help Has Started",
      "The assigned provider has started helping you.",
    );

    res.status(200).json({
      message: "Help request started successfully",
      request,
    });
  } catch (error) {
    console.error("Start request error:", error);

    res.status(500).json({
      message: "Failed to start help request",
    });
  }
};

const completeRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const providerId = req.user.id;
    const request = await completeHelpRequest(id, providerId);

    if (!request) {
      return res.status(409).json({
        message:
          "Request cannot be completed. It may not be assigned to you or is not in in_progress status.",
      });
    }

    const pool = require("../config/database");
    await pool.query(
      `UPDATE users SET availability_status = 'available' WHERE id = $1`,
      [providerId],
    );

    await createNotification(
      request.requester_id,
      request.id,
      "request_completed",
      "Help Request Completed",
      "Your help request has been completed successfully. Please proceed to payment.",
    );

    res.status(200).json({
      message: "Help request completed successfully",
      request,
    });
  } catch (error) {
    console.error("Complete request error:", error);

    res.status(500).json({
      message: "Failed to complete help request",
    });
  }
};

const expressInterestAndAssignKNN = async (req, res) => {
  const pool = require("../config/database");
  const client = await pool.connect();

  try {
    const { id } = req.params;

    await client.query("BEGIN");

    const reqRes = await client.query(
      `SELECT * FROM help_requests WHERE id = $1 FOR UPDATE`,
      [id],
    );
    if (reqRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Help request not found." });
    }

    const helpReq = reqRes.rows[0];
    if (helpReq.status !== "approved" || helpReq.assigned_provider_id) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        message: "Request has already been assigned to another provider.",
      });
    }

    const providerRes = await client.query(
      `SELECT id, name, phone, latitude, longitude, availability_status
       FROM users
       WHERE id = $1
         AND latitude IS NOT NULL
         AND longitude IS NOT NULL
         AND last_located_at >= CURRENT_TIMESTAMP - INTERVAL '5 minutes'
       FOR UPDATE`,
      [req.user.id],
    );

    if (providerRes.rows.length === 0) {
      await client.query("ROLLBACK");

      const diagRes = await pool.query(
        `SELECT availability_status, latitude, longitude, last_located_at FROM users WHERE id = $1`,
        [req.user.id],
      );
      const diag = diagRes.rows[0];
      if (!diag) return res.status(404).json({ message: "User not found." });
      if (!diag.latitude || !diag.longitude) {
        return res.status(409).json({ message: "GPS not received yet. Please allow location access and wait for the green GPS banner, then try again." });
      }
      return res.status(409).json({ message: `GPS location is stale (last update: ${diag.last_located_at}). Please keep the page open for GPS to refresh.` });
    }

    const activeRequestRes = await pool.query(
      `SELECT hr.id, hr.title FROM help_requests hr
       WHERE hr.assigned_provider_id = $1
         AND hr.status IN ('assigned', 'accepted', 'in_progress')
       LIMIT 1`,
      [req.user.id],
    );
    if (activeRequestRes.rows.length > 0) {
      await client.query("ROLLBACK");
      const activeReq = activeRequestRes.rows[0];
      return res.status(409).json({
        message: `You are currently handling another request (#${activeReq.id}: "${activeReq.title}"). Please complete or cancel it before accepting a new one.`,
      });
    }

    await client.query(
      `UPDATE users SET availability_status = 'available', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [req.user.id],
    );

    await client.query(
      `INSERT INTO provider_request_interests (request_id, provider_id)
       VALUES ($1, $2)
       ON CONFLICT (request_id, provider_id) DO NOTHING`,
      [id, providerRes.rows[0].id],
    );
    await client.query("COMMIT");

    await createNotification(
      helpReq.requester_id,
      id,
      "provider_interest",
      "Provider Ready to Help",
      helpReq.request_type === "emergency"
        ? "A provider is ready to help. HelpBridge will select the closest interested provider in about 30 seconds."
        : "A provider is ready to help. HelpBridge will assign the nearest provider within 5 minutes.",
    );

    res.status(202).json({
      message:
        helpReq.request_type === "emergency"
          ? "Your interest is recorded. HelpBridge will assign the nearest provider in about 30 seconds."
          : "Your interest is recorded. HelpBridge will assign the nearest provider within 5 minutes.",
      request: helpReq,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Express interest error:", error);
    res.status(500).json({
      message:
        process.env.NODE_ENV === "production"
          ? "Failed to process acceptance request."
          : `Failed to process acceptance request: ${error.message}`,
    });
  } finally {
    client.release();
  }
};

const finalizeProviderInterests = async () => {
  const pool = require("../config/database");
  const { calculateHaversineDistance } = require("../services/knnService");

  const pending = await pool.query(
    `SELECT hr.id
     FROM help_requests hr
     JOIN provider_request_interests pri ON pri.request_id = hr.id
     WHERE hr.status = 'approved'
     GROUP BY hr.id, hr.request_type
     HAVING (
       (hr.request_type = 'emergency'
         AND MIN(pri.created_at) <= CURRENT_TIMESTAMP - INTERVAL '30 seconds')
       OR
       (hr.request_type = 'non_emergency'
         AND MIN(pri.created_at) <= CURRENT_TIMESTAMP - INTERVAL '5 minutes')
       OR
       (hr.request_type NOT IN ('emergency', 'non_emergency')
         AND MIN(pri.created_at) <= CURRENT_TIMESTAMP - INTERVAL '30 seconds')
     )`,
  );

  for (const row of pending.rows) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const requestResult = await client.query(
        `SELECT * FROM help_requests WHERE id = $1 AND status = 'approved' FOR UPDATE`,
        [row.id],
      );
      if (!requestResult.rows.length) { await client.query("ROLLBACK"); continue; }

      const request = requestResult.rows[0];
      const needed = Number(request.providers_needed) || 1;

      const alreadyRes = await client.query(
        `SELECT COUNT(*) AS cnt FROM request_assignments WHERE request_id = $1`,
        [request.id],
      );
      const alreadyAssigned = Number(alreadyRes.rows[0].cnt);
      const remaining = needed - alreadyAssigned;
      if (remaining <= 0) { await client.query("ROLLBACK"); continue; }

      const candidates = await client.query(
        `SELECT u.id, u.name, u.phone, u.latitude, u.longitude
         FROM provider_request_interests pri
         JOIN users u ON u.id = pri.provider_id
         WHERE pri.request_id = $1
           AND u.availability_status = 'available'
           AND u.latitude IS NOT NULL
           AND u.longitude IS NOT NULL
           AND u.id NOT IN (
             SELECT provider_id FROM request_assignments WHERE request_id = $1
           )
         FOR UPDATE OF u`,
        [request.id],
      );

      if (!candidates.rows.length) { await client.query("ROLLBACK"); continue; }

      const ranked = candidates.rows
        .map((p) => ({
          ...p,
          distance_km: calculateHaversineDistance(
            Number(request.latitude), Number(request.longitude),
            Number(p.latitude),      Number(p.longitude),
          ),
        }))
        .sort((a, b) => a.distance_km - b.distance_km)
        .slice(0, remaining);

      for (const winner of ranked) {

        await client.query(
          `INSERT INTO request_assignments (request_id, provider_id, status)
           VALUES ($1, $2, 'accepted')
           ON CONFLICT (request_id, provider_id) DO NOTHING`,
          [request.id, winner.id],
        );

        if (alreadyAssigned === 0 && ranked.indexOf(winner) === 0) {
          await client.query(
            `UPDATE help_requests SET assigned_provider_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
            [winner.id, request.id],
          );
        }

        await client.query(
          `UPDATE users SET availability_status = 'busy', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [winner.id],
        );
      }

      const totalAssigned = alreadyAssigned + ranked.length;
      if (totalAssigned >= needed) {
        await client.query(
          `UPDATE help_requests SET status = 'assigned', updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND status = 'approved'`,
          [request.id],
        );
      }

      await client.query("COMMIT");

      const names = ranked.map((p) => p.name).join(", ");
      const distInfo = ranked.map((p) => `${p.name} (${p.distance_km} km)`).join(", ");
      await createNotification(
        request.requester_id, request.id,
        "provider_assigned", "Provider(s) Assigned",
        needed > 1
          ? `${totalAssigned} of ${needed} providers assigned: ${distInfo}.`
          : `Provider ${ranked[0].name} assigned (${ranked[0].distance_km} km away).`,
      );

      for (const winner of ranked) {
        await createNotification(
          winner.id, request.id,
          "request_assigned", "Help Request Assigned",
          `You were selected to help "${request.title}". Location: ${request.address || `${request.latitude}, ${request.longitude}`}.`,
        );
      }

      const winnerIds = new Set(ranked.map((p) => p.id));
      for (const p of candidates.rows.filter((c) => !winnerIds.has(c.id))) {
        await createNotification(
          p.id, request.id,
          "provider_not_selected", "Provider Not Selected",
          "Another provider was closer for this request. Thank you for responding.",
        );
      }
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Finalize provider interests error:", error);
    } finally {
      client.release();
    }
  }
};

const cancelProvideHelp = async (req, res) => {
  const pool = require("../config/database");
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const providerId = req.user.id;
    await client.query("BEGIN");

    const reqRes = await client.query(
      `SELECT hr.*, u.name AS provider_name
       FROM help_requests hr
       LEFT JOIN users u ON u.id = $1
       WHERE hr.id = $2
      FOR UPDATE OF hr`,
      [providerId, id],
    );

    if (reqRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Help request not found." });
    }

    const helpReq = reqRes.rows[0];

    if (helpReq.assigned_provider_id !== providerId) {
      await client.query("ROLLBACK");
      return res
        .status(403)
        .json({ message: "You are not assigned to this help request." });
    }

    if (!["assigned", "accepted", "in_progress"].includes(helpReq.status)) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        message: "This help request can no longer be cancelled.",
      });
    }

    const updateRes = await client.query(
      `
      UPDATE help_requests
      SET assigned_provider_id = NULL, status = 'approved', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *;
      `,
      [id],
    );

    await client.query(
      `UPDATE users SET availability_status = 'available', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [providerId],
    );
    await client.query("COMMIT");

    await createNotification(
      helpReq.requester_id,
      id,
      "provider_cancelled",
      "Provider Cancelled Assistance",
      `Provider ${helpReq.provider_name || "Assigned Provider"} had to cancel. Re-routing your request to other nearby providers immediately.`,
    );

    const providersRes = await pool.query(
      `SELECT id FROM users WHERE role IN ('provider', 'seeker', 'user') AND availability_status = 'available' AND id <> $1`,
      [providerId],
    );

    for (const prov of providersRes.rows) {
      if (prov.id !== helpReq.requester_id) {
        await createNotification(
          prov.id,
          id,
          "broadcast_request",
          "Help Request Available Again!",
          `Help Request "${helpReq.title}" is available again as previous provider cancelled. Click to respond!`,
        );
      }
    }

    res.status(200).json({
      message:
        "You have cancelled providing help. The request has been re-opened for other nearby providers.",
      request: updateRes.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Cancel provide help error:", error);
    res.status(500).json({ message: "Failed to cancel assistance." });
  } finally {
    client.release();
  }
};

module.exports = {
  getAvailableRequests,
  getMyRequests,
  completeRequest,
  startRequest,
  getRequestDetails,
  acceptRequest,
  expressInterestAndAssignKNN,
  cancelProvideHelp,
  finalizeProviderInterests,
};

