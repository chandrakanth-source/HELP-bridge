const {
  createHelpRequest,
  getHelpRequestsByUser,
  getHelpRequestById,
} = require("../models/helpRequestModels");

const createRequest = async (req, res) => {
  try {
    const {
      request_type,
      emergency_type,
      title,
      description,
      latitude,
      longitude,
      address,
    } = req.body;

    if (
      !request_type ||
      !title ||
      latitude === undefined ||
      longitude === undefined ||
      !["emergency", "non_emergency"].includes(request_type) ||
      !Number.isFinite(Number(latitude)) ||
      Number(latitude) < -90 ||
      Number(latitude) > 90 ||
      !Number.isFinite(Number(longitude)) ||
      Number(longitude) < -180 ||
      Number(longitude) > 180
    ) {
      return res.status(400).json({
        message: "Request type, title, latitude and longitude are required",
      });
    }

    const requester_id = req.user.id;

    const pool = require("../config/database");
    const { createNotification } = require("../models/notificationModel");

    const request = await createHelpRequest({
      requester_id,
      request_type,
      emergency_type,
      title,
      description,
      latitude,
      longitude,
      address,
    });

    const managersRes = await pool.query(
      `SELECT id FROM users WHERE role = 'manager'`,
    );
    for (const mgr of managersRes.rows) {
      await createNotification(
        mgr.id,
        request.id,
        "request_pending_verification",
        request_type === "emergency"
          ? "NEW EMERGENCY SOS REQUEST"
          : "New Help Request Needs Approval",
        `Request: "${title}". Pending manager approval.`,
      );
    }

    res.status(201).json({
      message:
        request_type === "emergency"
          ? "Emergency SOS request sent to Manager for approval."
          : "Help request created successfully",
      request,
    });
  } catch (error) {
    console.error("Create help request error:", error);

    res.status(500).json({
      message: "Failed to create help request",
    });
  }
};

const getMyRequests = async (req, res) => {
  try {
    const requester_id = req.user.id;

    const requests = await getHelpRequestsByUser(requester_id);

    res.status(200).json({
      requests,
    });
  } catch (error) {
    console.error("Get my requests error:", error);

    res.status(500).json({
      message: "Failed to fetch help requests",
    });
  }
};

const getRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    const pool = require("../config/database");
    const result = await pool.query(
      `SELECT hr.*,
              u_req.name AS requester_name, u_req.phone AS requester_phone,
              u_prov.name AS provider_name,  u_prov.phone AS provider_phone,
              u_prov.latitude AS provider_live_lat, u_prov.longitude AS provider_live_lon
       FROM help_requests hr
       JOIN users u_req ON u_req.id = hr.requester_id
       LEFT JOIN users u_prov ON u_prov.id = hr.assigned_provider_id
       WHERE hr.id = $1`,
      [id],
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Help request not found" });
    }

    res.status(200).json({ request: result.rows[0] });
  } catch (error) {
    console.error("Get help request error:", error);
    res.status(500).json({ message: "Failed to fetch help request" });
  }
};

module.exports = {
  createRequest,
  getMyRequests,
  getRequestById,
};

