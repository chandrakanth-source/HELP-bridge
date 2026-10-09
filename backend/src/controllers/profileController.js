const {
  findUserById,
  updateUserProfile,
  updateUserLocation,
} = require("../models/userModels");

const updateAvailability = async (req, res) => {
  const { status } = req.body;
  if (!["available", "busy", "offline"].includes(status)) {
    return res.status(400).json({ message: "Status must be available, busy, or offline" });
  }
  try {
    const pool = require("../config/database");
    await pool.query(
      `UPDATE users SET availability_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [status, req.user.id],
    );
    res.status(200).json({ message: "Availability updated", status });
  } catch (error) {
    console.error("Update availability error:", error);
    res.status(500).json({ message: "Failed to update availability" });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await findUserById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User profile not found" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({ message: "Failed to load profile" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, phone, occupation, blood_group, address } = req.body;

    if (!name?.trim() || !phone?.trim()) {
      return res.status(400).json({ message: "Name and phone are required" });
    }

    const user = await updateUserProfile(req.user.id, {
      name: name.trim(),
      phone: phone.trim(),
      occupation: occupation?.trim() || null,
      blood_group: blood_group?.trim() || null,
      address: address?.trim() || null,
    });

    if (!user) {
      return res.status(404).json({ message: "User profile not found" });
    }

    return res
      .status(200)
      .json({ message: "Profile updated successfully", user });
  } catch (error) {
    console.error("Update profile error:", error);

    if (error.code === "23505") {
      return res
        .status(409)
        .json({ message: "That phone number is already registered." });
    }

    return res.status(500).json({ message: "Failed to update profile" });
  }
};

const updateLocation = async (req, res) => {
  const latitude = Number(req.body.latitude);
  const longitude = Number(req.body.longitude);
  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    return res
      .status(400)
      .json({ message: "Valid latitude and longitude are required" });
  }
  try {
    const location = await updateUserLocation(req.user.id, latitude, longitude);
    res.status(200).json({ location });
  } catch (error) {
    console.error("Update location error:", error);
    res.status(500).json({ message: "Failed to update location" });
  }
};

module.exports = { getProfile, updateProfile, updateLocation, updateAvailability };

