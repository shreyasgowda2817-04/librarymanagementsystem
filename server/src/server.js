import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import logger from "./utils/logger.js";
// Triggering server restart for AI sync... 17405786842521740578684252

import cors from "cors";
import passport from "passport";
import cookieParser from "cookie-parser";

import mongoose from "mongoose";

import dotenv from "dotenv";
import http from "http";
import { initSocket } from "./utils/socket.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

import bookRoutes from "./routes/bookroutes.js";
import memberRoutes from "./routes/memberroutes.js";
import transactionRoutes from "./routes/transactionroutes.js";
import authRoutes from "./routes/authroutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import reservationRoutes from "./routes/reservationRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import bookRequestRoutes from "./routes/bookRequestRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import automationRoutes from "./routes/automationRoutes.js";
import configRoutes from "./routes/configRoutes.js";
import auditRoutes from "./routes/auditRoutes.js";
import adminSettingsRoutes from "./routes/adminSettingsRoutes.js";
import adminToolsRoutes from "./routes/adminToolsRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import connectorRoutes from "./routes/connectorRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import workspaceRoutes from "./routes/workspaceRoutes.js";
import acquisitionsRoutes from "./routes/acquisitionsRoutes.js";
import cronRoutes from "./routes/cronRoutes.js";
import { maintenanceMode } from "./middleware/maintenanceMiddleware.js";
import { initScheduler } from "./scheduler.js";

const app = express();

const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(cors({
  origin: function (origin, callback) {
    // Allow any localhost or 127.0.0.1 origin in development
    const isLocal = !origin || origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:");
    const isConfigured = origin === frontendUrl;
    const isVercel = origin && origin.endsWith(".vercel.app");
    
    if (isLocal || isConfigured || isVercel) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));



app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

// FAST PING WAKEUP ROUTE (No DB, Instant 200 OK)
app.get("/api/ping", (req, res) => res.status(200).json({ status: "alive" }));

// Global Request Logger using Winston
app.use((req, res, next) => {
  logger.info(`Incoming Request`, { method: req.method, path: req.path, ip: req.ip });
  next();
});

app.use(maintenanceMode);

// Serve static files from the uploads directory
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/libraryDB";
console.log("Attempting to connect to MongoDB...");

mongoose.connect(mongoUri)
  .then(() => console.log(`✅ MongoDB Connected Successfully to: ${mongoUri.split('/').pop()}`))
  .catch(err => {
    console.error("❌ MongoDB Connection Error:");
    console.error(err.message);
    if (err.message.includes("ECONNREFUSED")) {
      console.error("👉 Tip: Make sure your MongoDB server is running (e.g., run 'brew services start mongodb-community')");
    }
  });

app.get("/", (req, res) => {
  res.send("✅ Library Backend Running Successfully!");
});

app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/book-requests", bookRequestRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/automation", automationRoutes);
app.use("/api/config", configRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/admin/settings", adminSettingsRoutes);
app.use("/api/admin", adminToolsRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/connectors", connectorRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/acquisitions", acquisitionsRoutes);
app.use("/api/cron", cronRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("🔥 Global Error Handler Caught:", err.message);
  console.error(err.stack);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "production" ? null : err.stack
  });
});

// Production Setup: Serve Frontend

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../../dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../../dist", "index.html"));
  });
}


const PORT = process.env.PORT || 5001;
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Initialize Automated Background Jobs (Cron)
initScheduler();

server.listen(PORT, "0.0.0.0", () => {
  logger.info(`✅ Backend running on http://127.0.0.1:${PORT}`);
});