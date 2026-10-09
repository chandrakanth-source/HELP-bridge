const managerMiddleware = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (req.user.role !== "manager") {
      return res.status(403).json({
        message: "Access denied. Manager access required.",
      });
    }

    next();
  } catch (error) {
    console.error("Manager authorization error:", error);

    res.status(500).json({
      message: "Authorization failed",
    });
  }
};

module.exports = managerMiddleware;

