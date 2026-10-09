const pool = require("../config/database");
const { calculateHaversineDistance } = require("../services/knnService");

const updateUserLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const userId = req.user.id;

    if (
      latitude === undefined ||
      longitude === undefined ||
      isNaN(parseFloat(latitude)) ||
      isNaN(parseFloat(longitude))
    ) {
      return res.status(400).json({ message: "Valid latitude and longitude are required." });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    await pool.query(
      `
      UPDATE users
      SET latitude = $1, longitude = $2, last_located_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3;
      `,
      [lat, lon, userId]
    );

    await pool.query(
      `
      INSERT INTO locations (user_id, latitude, longitude)
      VALUES ($1, $2, $3);
      `,
      [userId, lat, lon]
    );

    res.status(200).json({
      message: "Location updated successfully",
      latitude: lat,
      longitude: lon,
    });
  } catch (error) {
    console.error("Update user location error:", error);
    res.status(500).json({ message: "Failed to update location" });
  }
};

const getRequestTrackingData = async (req, res) => {
  try {
    const { requestId } = req.params;

    const result = await pool.query(
      `
      SELECT
        hr.id AS request_id,
        hr.status,
        hr.title,
        hr.latitude AS request_latitude,
        hr.longitude AS request_longitude,
        hr.address AS request_address,
        req_user.id AS requester_id,
        req_user.name AS requester_name,
        req_user.phone AS requester_phone,
        req_user.latitude AS requester_live_lat,
        req_user.longitude AS requester_live_lon,
        prov_user.id AS provider_id,
        prov_user.name AS provider_name,
        prov_user.phone AS provider_phone,
        prov_user.latitude AS provider_live_lat,
        prov_user.longitude AS provider_live_lon,
        prov_user.last_located_at AS provider_last_located_at
      FROM help_requests hr
      JOIN users req_user ON hr.requester_id = req_user.id
      LEFT JOIN users prov_user ON hr.assigned_provider_id = prov_user.id
      WHERE hr.id = $1;
      `,
      [requestId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Help request not found." });
    }

    const data = result.rows[0];

    let distance_km = null;
    const reqLat = data.requester_live_lat || data.request_latitude;
    const reqLon = data.requester_live_lon || data.request_longitude;
    const provLat = data.provider_live_lat;
    const provLon = data.provider_live_lon;

    if (reqLat && reqLon && provLat && provLon) {
      distance_km = calculateHaversineDistance(
        parseFloat(reqLat),
        parseFloat(reqLon),
        parseFloat(provLat),
        parseFloat(provLon)
      );
    }

    res.status(200).json({
      tracking: {
        ...data,
        distance_km,
      },
    });
  } catch (error) {
    console.error("Get request tracking error:", error);
    res.status(500).json({ message: "Failed to fetch live tracking data" });
  }
};

module.exports = {
  updateUserLocation,
  getRequestTrackingData,
};

