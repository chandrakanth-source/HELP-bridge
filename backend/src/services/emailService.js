const nodemailer = require("nodemailer");

const requiredEmailSettings = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASSWORD",
  "MAIL_FROM",
];

const getTransporter = () => {
  const missingSettings = requiredEmailSettings.filter(
    (setting) => !process.env[setting],
  );

  if (missingSettings.length > 0) {
    throw new Error(
      `Missing email configuration: ${missingSettings.join(", ")}`,
    );
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

const sendPasswordResetEmail = async ({ email, name, resetToken }) => {
  const appUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const resetUrl = `${appUrl}/reset_password?token=${encodeURIComponent(resetToken)}`;
  const transporter = getTransporter();

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: email,
    subject: "Reset your HelpBridge password",
    text: [
      `Hello ${name || "there"},`,
      "",
      "We received a request to reset your HelpBridge password.",
      `Reset your password here: ${resetUrl}`,
      "",
      "This link expires in 15 minutes. If you did not request this, you can ignore this email.",
    ].join("\n"),
    html: `
      <p>Hello ${name || "there"},</p>
      <p>We received a request to reset your HelpBridge password.</p>
      <p><a href="${resetUrl}">Reset your password</a></p>
      <p>This link expires in 15 minutes. If you did not request this, you can ignore this email.</p>
    `,
  });
};

module.exports = { sendPasswordResetEmail };

