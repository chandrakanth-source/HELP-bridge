const bcrypt = require("bcrypt");
const pool = require("../config/database");

const bootstrapAdmin = async (req, res) => {
  try {
    // ── Secret-key guard ──────────────────────────────────────────────────────
    // The caller must supply the correct key in the x-setup-key header.
    // Set ADMIN_SETUP_KEY in your .env file and never share it publicly.
    const setupKey = process.env.ADMIN_SETUP_KEY;
    if (!setupKey) {
      // If the key is not configured on the server at all, lock setup down.
      return res.status(503).json({
        message: "Admin setup is not enabled on this server.",
      });
    }
    if (req.headers["x-setup-key"] !== setupKey) {
      return res.status(403).json({
        message: "Invalid or missing setup key. Access denied.",
      });
    }
    // ─────────────────────────────────────────────────────────────────────────

    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        message: "Name, email, phone and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const adminCount = await pool.query(
      "SELECT COUNT(*)::int AS count FROM users WHERE role = 'admin'",
    );

    if (adminCount.rows[0].count > 0) {
      return res.status(409).json({
        message:
          "Administrator setup is already complete. Please use the admin login.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `
        INSERT INTO users (name, email, phone, password_hash, role, verification_status)
        VALUES ($1, $2, $3, $4, 'admin', 'verified')
        RETURNING id, name, email, role
      `,
      [name, email, phone, passwordHash],
    );

    res.status(201).json({
      message: "Administrator account created. You can now log in.",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Bootstrap admin error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        message: "That email or phone number is already registered.",
      });
    }

    res.status(500).json({ message: "Unable to create administrator account" });
  }
};

module.exports = { bootstrapAdmin };
