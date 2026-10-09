require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const helmet = require("helmet");
const jwt = require("jsonwebtoken");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const notificationRoutes = require("./routes/notificationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const adminSetupRoutes = require("./routes/adminSetupRoutes");
const pool = require("./config/database");
const app = express();
const server = http.createServer(app);
const authRoutes = require("./routes/authRoutes");
const helpRequestRoutes = require("./routes/helpRequestRoutes");
const managerRoutes = require("./routes/managerRoutes");
const providerRoutes = require("./routes/providerRoutes");
const chatRoutes = require("./routes/chatRoutes");
const profileRoutes = require("./routes/profileRoutes");
const { Server } = require("socket.io");
const { createNotification } = require("./models/notificationModel");
const {
  finalizeProviderInterests,
} = require("./controllers/providerController");
const { createMessage } = require("./models/messageModels");
const paymentRoutes = require("./routes/paymentRoutes");
const bargainRoutes = require("./routes/bargainRoutes");
const locationRoutes = require("./routes/locationRoutes");
const PORT = process.env.PORT || 5000;
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication token required"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    socket.user = decoded;

    next();
  } catch (error) {
    console.error("Socket authentication failed:", error.message);
    next(new Error("Invalid authentication token"));
  }
});
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.user.id}`);

  console.log(`Socket ID: ${socket.id}`);

  socket.on("join_request", async (requestId) => {
    try {
      const result = await pool.query(
        `SELECT requester_id, assigned_provider_id FROM help_requests WHERE id = $1`,
        [requestId],
      );

      if (result.rows.length === 0) {
        socket.emit("chat_error", { message: "Help request not found" });
        return;
      }

      const request = result.rows[0];
      const userId  = socket.user.id;

      const isRequester = Number(request.requester_id)        === Number(userId);
      const isProvider  = Number(request.assigned_provider_id) === Number(userId);

      let isAssignedProvider = isProvider;
      if (!isAssignedProvider) {
        const assignRes = await pool.query(
          `SELECT 1 FROM request_assignments WHERE request_id = $1 AND provider_id = $2 LIMIT 1`,
          [requestId, userId],
        );
        isAssignedProvider = assignRes.rows.length > 0;
      }

      if (!isRequester && !isAssignedProvider) {
        socket.emit("chat_error", { message: "Access denied. You are not part of this help request." });
        return;
      }

      const room = `request_${requestId}`;
      socket.join(room);
      socket.emit("joined_request", { requestId, message: "Joined chat successfully" });
    } catch (error) {
      console.error("Join request error:", error);
      socket.emit("chat_error", { message: "Unable to join chat" });
    }
  });
  socket.on("send_message", async (data) => {
    try {
      const { requestId, message } = data;
      const senderId = socket.user.id;
      const requestResult = await pool.query(
        `
    SELECT requester_id, assigned_provider_id
    FROM help_requests
    WHERE id = $1
    `,
        [requestId],
      );

      const request = requestResult.rows[0];

      let receiverId;

      if (Number(request.requester_id) === Number(senderId)) {
        receiverId = request.assigned_provider_id;
      } else {
        receiverId = request.requester_id;
      }

      if (receiverId) {
        await createNotification(
          receiverId,
          requestId,
          "new_message",
          "New Chat Message",
          "You have received a new message.",
        );
      }
      if (!message || !message.trim()) {
        socket.emit("chat_error", {
          message: "Message cannot be empty",
        });

        return;
      }

      const room = `request_${requestId}`;

      const savedMessage = await createMessage(
        requestId,
        senderId,
        message.trim(),
      );

      io.to(room).emit("receive_message", {
        id: savedMessage.id,
        requestId: savedMessage.request_id,
        senderId: savedMessage.sender_id,
        message: savedMessage.message,
        createdAt: savedMessage.sent_at ?? savedMessage.created_at,
      });
    } catch (error) {
      console.error("Socket send message error:", error);

      socket.emit("chat_error", {
        message: "Failed to send message",
      });
    }
  });
  socket.on("leave_request", (requestId) => {
    const room = `request_${requestId}`;

    socket.leave(room);

    console.log(`Socket ${socket.id} left ${room}`);
  });

  socket.on("provider_location_update", async (data) => {
    try {
      const { requestId, latitude, longitude } = data;
      if (!requestId || latitude == null || longitude == null) return;

      const result = await pool.query(
        `SELECT assigned_provider_id, requester_id FROM help_requests WHERE id = $1`,
        [requestId],
      );
      if (!result.rows.length) return;
      const req = result.rows[0];
      if (Number(req.assigned_provider_id) !== Number(socket.user.id)) return;

      await pool.query(
        `UPDATE users SET latitude = $1, longitude = $2, last_located_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
        [latitude, longitude, socket.user.id],
      );
      await pool.query(
        `INSERT INTO locations (user_id, latitude, longitude) VALUES ($1, $2, $3)`,
        [socket.user.id, latitude, longitude],
      );

      const room = `request_${requestId}`;
      io.to(room).emit("tracking_update", {
        requestId,
        providerId: socket.user.id,
        latitude,
        longitude,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error("provider_location_update error:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes("*") ||
        allowedOrigins.includes(origin) ||
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:") ||
        origin.endsWith(".vercel.app")
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 500,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});
app.use("/api/auth", authRateLimit);
app.use("/api/payments", paymentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/manager", managerRoutes);
app.use("/api/help-requests", helpRequestRoutes);
app.use("/api/provider", providerRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/bargain", bargainRoutes);
app.use("/api/location", locationRoutes);
app.get("/api/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      success: true,
      message: "HelpBridge API is running",
      database: "PostgreSQL connected",
      time: result.rows[0].now,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});
app.use("/api/notifications", notificationRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin-setup", adminSetupRoutes);

const runStartupMigrations = async () => {

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS last_located_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS provider_request_interests (
      id SERIAL PRIMARY KEY,
      request_id INTEGER NOT NULL REFERENCES help_requests(id) ON DELETE CASCADE,
      provider_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (request_id, provider_id)
    );
  `);

  await pool.query(`
    ALTER TABLE messages
    ADD COLUMN IF NOT EXISTS request_id INTEGER REFERENCES help_requests(id) ON DELETE CASCADE;
  `);

  await pool.query(`
    UPDATE messages m
    SET request_id = c.request_id
    FROM chats c
    WHERE m.chat_id = c.id
      AND m.request_id IS NULL;
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_messages_request_id ON messages(request_id);
  `);

  await pool.query(`
    ALTER TABLE help_requests
    ADD COLUMN IF NOT EXISTS providers_needed INTEGER NOT NULL DEFAULT 1;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS request_assignments (
      id SERIAL PRIMARY KEY,
      request_id  INTEGER NOT NULL REFERENCES help_requests(id) ON DELETE CASCADE,
      provider_id INTEGER NOT NULL REFERENCES users(id)          ON DELETE CASCADE,
      status      VARCHAR(20) NOT NULL DEFAULT 'accepted',
      assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (request_id, provider_id)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS bargain_offers (
      id SERIAL PRIMARY KEY,
      request_id INTEGER NOT NULL REFERENCES help_requests(id) ON DELETE CASCADE,
      provider_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      seeker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      sender_role VARCHAR(20) NOT NULL,
      offered_price DECIMAL(10, 2) NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      round_number INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

const startServer = async () => {
  try {
    await runStartupMigrations();
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      setInterval(() => void finalizeProviderInterests(), 10000);
    });
  } catch (error) {
    console.error("Database startup migration failed:", error);
    process.exitCode = 1;
  }
};

void startServer();

