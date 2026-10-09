const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const {
  findUserByEmail,
  createUser,
  updatePassword,
} = require("../models/userModels");
const { sendPasswordResetEmail } = require("../services/emailService");

const RESET_TOKEN_EXPIRY = "15m";

const register = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      occupation,
      blood_group,
      latitude,
      longitude,
      address,
      role,
    } = req.body;

    if (!name?.trim() || !email?.trim() || !phone?.trim() || !password) {
      return res.status(400).json({
        message: "Name, email, phone and password are required",
      });
    }

    if (
      password.length < 8 ||
      !/[A-Za-z]/.test(password) ||
      !/\d/.test(password)
    ) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters and include a letter and a number",
      });
    }

    if (!/^\S+@\S+\.\S+$/.test(email.trim()) || phone.trim().length < 7) {
      return res
        .status(400)
        .json({ message: "Enter a valid email address and phone number" });
    }

    const existingUser = await findUserByEmail(email.trim().toLowerCase());

    if (existingUser) {
      return res.status(409).json({
        message: "That email address is already registered.",
      });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const accountRole = ["provider", "seeker", "user"].includes(role)
      ? "user"
      : role;

    const user = await createUser({
      name,
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password_hash,
      occupation,
      blood_group,
      latitude,
      longitude,
      address,
      role: accountRole,
    });

    res.status(201).json({
      message: "Registration successful",
      user,
    });
  } catch (error) {
    console.error("Registration error:", error);

    if (error.code === "23505") {
      const duplicateField = error.constraint?.includes("phone")
        ? "phone number"
        : "email address";

      return res.status(409).json({
        message: `That ${duplicateField} is already registered.`,
      });
    }

    res.status(500).json({
      message: "Registration failed",
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await findUserByEmail(email.trim().toLowerCase());

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (user.role === "manager" && user.verification_status !== "verified") {
      return res.status(403).json({
        message:
          user.verification_status === "rejected"
            ? "Your manager application was rejected."
            : "Your manager application is awaiting administrator approval.",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      message: "Login failed",
    });
  }
};

const requestPasswordReset = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await findUserByEmail(email);
    const response = {
      message:
        "If an account exists for that email, a password reset link has been sent.",
    };

    if (user) {
      const resetToken = jwt.sign(
        { id: user.id, email: user.email, purpose: "password-reset" },
        process.env.JWT_SECRET,
        { expiresIn: RESET_TOKEN_EXPIRY },
      );

      await sendPasswordResetEmail({
        email: user.email,
        name: user.name,
        resetToken,
      });
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error("Password reset request error:", error);
    return res.status(500).json({ message: "Unable to start password reset" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res
        .status(400)
        .json({ message: "Reset token and password are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res
        .status(400)
        .json({ message: "This reset link is invalid or expired" });
    }

    if (decoded.purpose !== "password-reset") {
      return res
        .status(400)
        .json({ message: "This reset link is invalid or expired" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await updatePassword(decoded.id, passwordHash);

    if (!user) {
      return res
        .status(400)
        .json({ message: "This reset link is invalid or expired" });
    }

    return res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Password reset error:", error);
    return res.status(500).json({ message: "Unable to reset password" });
  }
};

module.exports = {
  register,
  login,
  requestPasswordReset,
  resetPassword,
};

