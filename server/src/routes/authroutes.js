import express from "express";
import { login, register, sendOTP, updateProfile, forgotPassword, resetPassword, verifyOTP, verify2FA, verifyEmail, getLeaderboard, toggleFavorite, getFavorites, getSessions, logoutSession, logoutAllSessions, updateSettings, exportUserData, generateApiKey, listApiKeys, revokeApiKey, googleCallback, getAllUsers, promoteToAdmin, demoteFromAdmin, refreshToken } from "../controllers/authController.js";
import { validate } from "../middleware/validate.js";
import { registerSchema, loginSchema } from "../validators/authValidator.js";
import Member from "../models/member.js";

import passport from "passport";
import "../config/passport.js";

import { protect, admin } from "../middleware/authMiddleware.js";
import multer from "multer";
import path from "path";
import rateLimit from "express-rate-limit";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per 15 minutes for auth endpoints
  message: { message: "Too many requests from this IP, please try again after 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // 5 requests per 10 minutes for OTPs
  message: { message: "Too many OTP requests, please try again after 10 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
});


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

const router = express.Router();

router.post("/refresh", authLimiter, refreshToken);

router.post("/register", authLimiter, validate(registerSchema), register);

router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/send-otp", otpLimiter, sendOTP);
router.post("/verify-2fa", otpLimiter, verify2FA);
// Google OAuth
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get("/google/callback", passport.authenticate("google", { session: false, failureRedirect: "http://localhost:5173/login?error=google_auth_failed" }), googleCallback);


router.post("/forgot-password", otpLimiter, forgotPassword);

router.post("/verify-otp", otpLimiter, verifyOTP);
router.post("/reset-password", resetPassword);

router.post("/verify-email", otpLimiter, verifyEmail);

router.get("/me", protect, async (req, res) => {
  try {
    const member = await Member.findOne({ email: req.user.email });
    res.json({ 
      ...req.user.toJSON(), 
      limits: req.user.limits,
      rollNo: member ? member.rollNo : null,
      department: member ? member.department : null
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});
router.get("/leaderboard", protect, getLeaderboard);
router.put("/profile", protect, upload.single("profilePhoto"), updateProfile);
router.post("/favorites/toggle", protect, toggleFavorite);
router.get("/favorites", protect, getFavorites);
router.get("/sessions", protect, getSessions);
router.post("/sessions/logout", protect, logoutSession);
router.post("/sessions/logout-all", protect, logoutAllSessions);
router.put("/settings", protect, updateSettings);
router.get("/export-data", protect, exportUserData);

// API Key routes
router.get("/api-keys", protect, listApiKeys);
router.post("/api-keys", protect, generateApiKey);
router.delete("/api-keys/:id", protect, revokeApiKey);
// Admin User Management
router.get("/users", protect, admin, getAllUsers);
router.put("/promote/:id", protect, admin, promoteToAdmin);
router.put("/demote/:id", protect, admin, demoteFromAdmin);



export default router;
