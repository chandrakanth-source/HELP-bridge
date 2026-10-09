const pool = require("../config/database");
const { createNotification } = require("../models/notificationModel");
const { calculateHaversineDistance } = require("../services/knnService");

const getPendingAssignments = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        hr.id AS request_id, hr.title, hr.address, hr.request_type,
        hr.latitude AS request_latitude, hr.longitude AS request_longitude,
        requester.name AS requester_name, pri.created_at AS interested_at,
        provider.id AS provider_id, provider.name AS provider_name,
        provider.phone AS provider_phone, provider.latitude AS provider_latitude,
        provider.longitude AS provider_longitude,
        provider.last_located_at AS provider_last_located_at
      FROM help_requests hr
      JOIN users requester ON requester.id = hr.requester_id
      JOIN provider_request_interests pri ON pri.request_id = hr.id
      JOIN users provider ON provider.id = pri.provider_id
      WHERE hr.status = 'approved' AND hr.assigned_provider_id IS NULL
      ORDER BY hr.created_at ASC, pri.created_at ASC
    `);

    const assignments = new Map();
    for (const row of result.rows) {
      if (!assignments.has(row.request_id)) {
        assignments.set(row.request_id, {
          request_id: row.request_id,
          title: row.title,
          address: row.address,
          request_type: row.request_type,
          requester_name: row.requester_name,
          buffer_started_at: row.interested_at,
          candidates: [],
        });
      }
      const assignment = assignments.get(row.request_id);
      const distance = calculateHaversineDistance(
        Number(row.request_latitude),
        Number(row.request_longitude),
        Number(row.provider_latitude),
        Number(row.provider_longitude),
      );
      assignment.candidates.push({
        provider_id: row.provider_id,
        provider_name: row.provider_name,
        provider_phone: row.provider_phone,
        distance_km: Number(distance.toFixed(2)),
        interested_at: row.interested_at,
        gps_updated_at: row.provider_last_located_at,
      });
    }

    res.status(200).json({
      assignments: Array.from(assignments.values()).map((assignment) => ({
        ...assignment,
        candidates: assignment.candidates.sort(
          (a, b) => a.distance_km - b.distance_km,
        ),
        seconds_remaining: Math.max(
          0,
          (assignment.request_type === "non_emergency" ? 300 : 30) -
            Math.floor(
              (Date.now() - new Date(assignment.buffer_started_at).getTime()) /
                1000,
            ),
        ),
      })),
    });
  } catch (error) {
    console.error("Get pending assignments error:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch pending provider assignments" });
  }
};

const getPendingRequests = async (req, res) => {
  try {
    const query = `
            SELECT help_requests.*, users.name AS requester_name, users.phone AS requester_phone
            FROM help_requests
            JOIN users ON users.id = help_requests.requester_id
            WHERE status = 'pending_verification'
            ORDER BY created_at ASC;
        `;

    const result = await pool.query(query);

    res.status(200).json({
      requests: result.rows,
    });
  } catch (error) {
    console.error("Get pending requests error:", error);

    res.status(500).json({
      message: "Failed to fetch pending requests",
    });
  }
};

const getEmergencyRequests = async (req, res) => {
  try {
    const query = `
            SELECT help_requests.*, users.name AS requester_name, users.phone AS requester_phone
            FROM help_requests
            JOIN users ON users.id = help_requests.requester_id
            WHERE request_type = 'emergency'
            ORDER BY created_at DESC;
        `;

    const result = await pool.query(query);

    res.status(200).json({
      requests: result.rows,
    });
  } catch (error) {
    console.error("Get emergency requests error:", error);

    res.status(500).json({
      message: "Failed to fetch emergency requests",
    });
  }
};

const getNonEmergencyRequests = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        help_requests.*,
        requester.name AS requester_name,
        requester.phone AS requester_phone,
        provider.name AS provider_name,
        provider.phone AS provider_phone
      FROM help_requests
      JOIN users requester ON requester.id = help_requests.requester_id
      LEFT JOIN users provider ON provider.id = help_requests.assigned_provider_id
      WHERE help_requests.request_type = 'non_emergency'
      ORDER BY help_requests.created_at DESC;
    `);

    res.status(200).json({ requests: result.rows });
  } catch (error) {
    console.error("Get non-emergency requests error:", error);
    res.status(500).json({ message: "Failed to fetch non-emergency requests" });
  }
};

const getActiveRequests = async (req, res) => {
  try {
    const query = `
            SELECT
                help_requests.*,
                requester.name AS requester_name,
                requester.phone AS requester_phone,
                provider.name AS provider_name,
                provider.phone AS provider_phone
            FROM help_requests
            JOIN users requester ON requester.id = help_requests.requester_id
            LEFT JOIN users provider ON provider.id = help_requests.assigned_provider_id
            WHERE help_requests.request_type = 'emergency'
              AND help_requests.status IN ('assigned', 'accepted', 'in_progress')
            ORDER BY help_requests.updated_at DESC;
        `;

    const result = await pool.query(query);

    res.status(200).json({
      requests: result.rows,
    });
  } catch (error) {
    console.error("Get active requests error:", error);

    res.status(500).json({
      message: "Failed to fetch active requests",
    });
  }
};

const getCompletedRequests = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        help_requests.*,
        requester.name AS requester_name,
        requester.phone AS requester_phone,
        provider.name AS provider_name,
        provider.phone AS provider_phone
      FROM help_requests
      JOIN users requester ON requester.id = help_requests.requester_id
      LEFT JOIN users provider ON provider.id = help_requests.assigned_provider_id
      WHERE help_requests.request_type = 'emergency'
        AND help_requests.status = 'completed'
      ORDER BY help_requests.updated_at DESC;
    `);

    res.status(200).json({ requests: result.rows });
  } catch (error) {
    console.error("Get completed requests error:", error);
    res.status(500).json({ message: "Failed to fetch completed requests" });
  }
};

const getEmergencyRequestById = async (req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT
          help_requests.*,
          requester.name AS requester_name,
          requester.phone AS requester_phone,
          requester.email AS requester_email,
          provider.name AS provider_name,
          provider.phone AS provider_phone
        FROM help_requests
        JOIN users requester ON requester.id = help_requests.requester_id
        LEFT JOIN users provider ON provider.id = help_requests.assigned_provider_id
        WHERE help_requests.id = $1 AND help_requests.request_type = 'emergency'
      `,
      [req.params.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Emergency request not found" });
    }

    res.status(200).json({ request: result.rows[0] });
  } catch (error) {
    console.error("Get manager emergency request error:", error);
    res.status(500).json({ message: "Failed to fetch emergency request" });
  }
};

const getProviderByIdOrName = async (req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT id, name, email, phone, address, availability_status, verification_status, created_at
        FROM users
        WHERE role IN ('provider', 'seeker', 'user') AND (id::text = $1 OR name = $1)
        LIMIT 1
      `,
      [req.params.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Provider not found" });
    }

    res.status(200).json({ provider: result.rows[0] });
  } catch (error) {
    console.error("Get manager provider error:", error);
    res.status(500).json({ message: "Failed to fetch provider" });
  }
};

const getProviders = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        email,
        phone,
        occupation,
        address,
        availability_status,
        verification_status,
        created_at
      FROM users
      WHERE role IN ('provider', 'seeker', 'user')
      ORDER BY created_at DESC;
    `);

    res.status(200).json({ providers: result.rows });
  } catch (error) {
    console.error("Get providers error:", error);
    res.status(500).json({ message: "Failed to fetch providers" });
  }
};

const getNearbyProviders = async (req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT
          provider.id, provider.name, provider.phone, provider.occupation,
          provider.availability_status, provider.verification_status,
          ROUND((6371 * acos(LEAST(1, GREATEST(-1,
            cos(radians(request.latitude)) * cos(radians(provider.latitude)) *
            cos(radians(provider.longitude) - radians(request.longitude)) +
            sin(radians(request.latitude)) * sin(radians(provider.latitude))
          ))))::numeric, 2) AS distance_km
        FROM help_requests request
        CROSS JOIN users provider
        WHERE request.id = $1
          AND provider.role IN ('provider', 'seeker', 'user')
          AND provider.id <> request.requester_id
          AND (provider.role IN ('seeker', 'user') OR provider.verification_status = 'verified')
          AND provider.availability_status = 'available'
        ORDER BY distance_km ASC;
      `,
      [req.params.id],
    );
    res.status(200).json({ providers: result.rows });
  } catch (error) {
    console.error("Get nearby providers error:", error);
    res.status(500).json({ message: "Failed to fetch nearby providers" });
  }
};

const approveRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
            UPDATE help_requests
            SET status = 'approved',
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
              AND status = 'pending_verification'
            RETURNING *;
        `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Pending request not found",
      });
    }

    await createNotification(
      result.rows[0].requester_id,
      result.rows[0].id,
      "request_approved",
      "Help Request Approved",
      `Your help request "${result.rows[0].title}" has been approved by the manager.`,
    );

    const providersRes = await pool.query(
      `
      SELECT id
      FROM users
      WHERE (
          role = 'provider'
          OR role IN ('seeker', 'user')
        )
        AND availability_status = 'available'
        AND id <> $1
    `,
      [result.rows[0].requester_id],
    );
    for (const prov of providersRes.rows) {
      await createNotification(
        prov.id,
        result.rows[0].id,
        "broadcast_request",
        "New Help Request Available",
        `Request: "${result.rows[0].title}". Respond to accept the nearest available assignment.`,
      );
    }

    res.status(200).json({
      message: "Help request approved successfully",
      request: result.rows[0],
    });
  } catch (error) {
    console.error("Approve request error:", error);

    res.status(500).json({
      message: "Failed to approve request",
    });
  }
};

const rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
            UPDATE help_requests
            SET status = 'rejected',
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
              AND status = 'pending_verification'
            RETURNING *;
        `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Pending request not found",
      });
    }

    res.status(200).json({
      message: "Help request rejected successfully",
      request: result.rows[0],
    });
  } catch (error) {
    console.error("Reject request error:", error);

    res.status(500).json({
      message: "Failed to reject request",
    });
  }
};

const assignProvider = async (req, res) => {
  try {
    const providerId = Number(req.body.provider_id);
    if (!Number.isInteger(providerId)) {
      return res
        .status(400)
        .json({ message: "A valid provider_id is required" });
    }

    const result = await pool.query(
      `
        UPDATE help_requests hr
        SET assigned_provider_id = $1, status = 'assigned', updated_at = CURRENT_TIMESTAMP
        FROM users provider
        WHERE hr.id = $2
          AND provider.id = $1
          AND provider.role IN ('provider', 'seeker', 'user')
          AND provider.id <> hr.requester_id
          AND (provider.role IN ('seeker', 'user') OR provider.verification_status = 'verified')
          AND provider.availability_status = 'available'
          AND hr.status = 'approved'
          AND hr.assigned_provider_id IS NULL
        RETURNING hr.*;
      `,
      [providerId, req.params.id],
    );

    if (result.rows.length === 0) {
      return res.status(409).json({
        message: "Request or provider is not available for assignment",
      });
    }

    const request = result.rows[0];
    await createNotification(
      providerId,
      request.id,
      "request_assigned",
      "New Help Request Assigned",
      `You have been assigned to help with \"${request.title}\".`,
    );
    await createNotification(
      request.requester_id,
      request.id,
      "provider_assigned",
      "Provider Assigned",
      "A verified provider has been assigned to your help request.",
    );

    res
      .status(200)
      .json({ message: "Provider assigned successfully", request });
  } catch (error) {
    console.error("Assign provider error:", error);
    res.status(500).json({ message: "Failed to assign provider" });
  }
};

const completeRequest = async (req, res) => {
  try {
    const result = await pool.query(
      `
        UPDATE help_requests
        SET status = 'completed', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
          AND request_type = 'emergency'
          AND status IN ('assigned', 'accepted', 'in_progress')
        RETURNING *;
      `,
      [req.params.id],
    );

    if (result.rows.length === 0) {
      return res.status(409).json({
        message: "Only active emergency requests can be completed.",
      });
    }

    const request = result.rows[0];
    if (request.assigned_provider_id) {
      await pool.query(
        `UPDATE users SET availability_status = 'available' WHERE id = $1`,
        [request.assigned_provider_id],
      );
    }
    await createNotification(
      request.requester_id,
      request.id,
      "request_completed",
      "Help Request Completed",
      "Your emergency help request has been completed successfully. Please proceed to payment.",
    );

    res.status(200).json({
      message: "Help request completed successfully",
      request,
    });
  } catch (error) {
    console.error("Manager complete request error:", error);
    res.status(500).json({ message: "Failed to complete help request" });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'pending_verification' AND request_type = 'emergency') AS pending_count,
        COUNT(*) FILTER (WHERE status IN ('assigned', 'accepted', 'in_progress') AND request_type = 'emergency') AS active_count,
        COUNT(*) FILTER (WHERE status = 'approved' AND request_type = 'emergency') AS verified_count,
        COUNT(*) FILTER (WHERE status = 'completed' AND request_type = 'emergency') AS completed_count,
        COUNT(*) FILTER (WHERE request_type = 'emergency') AS total_count
      FROM help_requests
    `);

    const notifResult = await pool.query(
      `
      SELECT COUNT(*) AS unread_count
      FROM notifications
      WHERE user_id = $1 AND is_read = false
    `,
      [req.user.id],
    );

    const stats = result.rows[0];
    res.status(200).json({
      pending_count: parseInt(stats.pending_count) || 0,
      active_count: parseInt(stats.active_count) || 0,
      verified_count: parseInt(stats.verified_count) || 0,
      completed_count: parseInt(stats.completed_count) || 0,
      total_count: parseInt(stats.total_count) || 0,
      unread_notifications: parseInt(notifResult.rows[0].unread_count) || 0,
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({ message: "Failed to fetch dashboard stats" });
  }
};

module.exports = {
  getPendingAssignments,
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
  assignProvider,
  completeRequest,
  getDashboardStats,
};

