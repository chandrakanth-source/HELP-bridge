const {
  getManagerApplications,
  updateManagerVerification,
} = require("../models/adminModels");

const getManagers = async (req, res) => {
  try {
    const managers = await getManagerApplications();
    res.status(200).json({ managers });
  } catch (error) {
    console.error("Get manager applications error:", error);
    res.status(500).json({ message: "Failed to fetch manager applications" });
  }
};

const updateManagerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["verified", "rejected"].includes(status)) {
      return res.status(400).json({
        message: "Status must be verified or rejected",
      });
    }

    const manager = await updateManagerVerification(id, status);

    if (!manager) {
      return res.status(404).json({ message: "Manager application not found" });
    }

    res.status(200).json({
      message: `Manager application ${status}`,
      manager,
    });
  } catch (error) {
    console.error("Update manager application error:", error);
    res.status(500).json({ message: "Failed to update manager application" });
  }
};

module.exports = {
  getManagers,
  updateManagerStatus,
};

