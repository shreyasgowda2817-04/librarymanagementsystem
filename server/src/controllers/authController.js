import User from "../models/user.js";
import mongoose from "mongoose";
import path from "path";

const uploadToGridFS = async (buffer, filename, mimetype) => {
  return new Promise((resolve, reject) => {
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: "media"
    });
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: mimetype
    });
    uploadStream.end(buffer);
    uploadStream.on('finish', () => resolve(uploadStream.id));
    uploadStream.on('error', reject);
  });
};
import jwt from "jsonwebtoken";
import { generateAccessToken, generateRefreshToken } from "../utils/generateToken.js";
import crypto from "crypto";
import Member from "../models/member.js";
import Transaction from "../models/transaction.js";
import Notification from "../models/notification.js";
import AuditLog from "../models/auditLog.js";
import sendEmail, { emailTemplates, sendOTPEmail } from "../services/emailService.js";
import bcrypt from "bcryptjs";

export const googleCallback = async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  if (!req.user) {
    // Check for specific error messages from passport
    const info = req.authInfo || {};
    if (info.message === "account_link_required") {
      return res.redirect(`${frontendUrl}/login?error=account_link_required`);
    }
    if (info.message === "account_banned") {
      return res.redirect(`${frontendUrl}/login?error=account_banned`);
    }
    return res.redirect(`${frontendUrl}/login?error=auth_failed`);
  }

  // Enforce Maintenance Mode Check
  try {
    const GlobalSettings = (await import("../models/globalSettings.js")).default;
    const Settings = (await import("../models/settings.js")).default;

    const [globalSettings, settings] = await Promise.all([
      GlobalSettings.getInstance(),
      Settings.getSettings()
    ]);

    const isMaintenance = globalSettings?.platform?.maintenanceMode || settings?.maintenanceMode;
    if (isMaintenance && req.user.role !== "admin") {
      return res.redirect(`${frontendUrl}/login?error=maintenance`);
    }
  } catch (err) {
    console.error("Maintenance check error in googleCallback:", err);
  }

  const sessionId = crypto.randomBytes(16).toString("hex");
  try {
    const session = {
      sessionId,
      ip: req.ip || req.headers["x-forwarded-for"] || "Unknown",
      userAgent: req.headers["user-agent"] || "Unknown",
      location: "Bengaluru, IN",
      lastActive: new Date()
    };
    req.user.sessions.push(session);
    await req.user.save();
  } catch (sessErr) {
    console.error("Failed to save google oauth session:", sessErr);
  }

  const token = generateAccessToken(req.user._id, sessionId);
  const refreshToken = generateRefreshToken(req.user._id, sessionId);

  // Set Secure Cookie
  res.cookie("token", token, {
    httpOnly: true,
    secure: false, // Compatibility for localhost
    sameSite: "lax",
    maxAge: 15 * 60 * 1000 // 15 mins
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: false, 
    sameSite: "lax",
    path: "/api/auth/refresh",
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  const userData = {
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    token: token,
    sessionId: sessionId
  };


  const userString = encodeURIComponent(JSON.stringify(userData));
  // Redirect WITHOUT token in URL
  res.redirect(`${frontendUrl}/login?auth_success=true&user=${userString}`);
};




const COOLDOWN_SECONDS = 20;

const MAX_OTP_ATTEMPTS = 6;

export const sendOTP = async (req, res, next) => {
  try {
    if (req.body.email) req.body.email = req.body.email.trim().toLowerCase();
    const { email, type = "Verification" } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Cooldown check
    if (user.lastOTPSentAt && (Date.now() - user.lastOTPSentAt < COOLDOWN_SECONDS * 1000)) {
      return res.status(429).json({ message: `Please wait ${COOLDOWN_SECONDS}s before requesting a new code` });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOTP = await bcrypt.hash(otp, 10);

    // Save based on type
    if (type === "Verification") {
      user.emailVerificationOTP = hashedOTP;
      user.emailVerificationOTPExpire = Date.now() + 24 * 60 * 60 * 1000;
    } else {
      user.resetPasswordOTP = hashedOTP;
      user.resetPasswordOTPExpire = Date.now() + 5 * 60 * 1000;
    }

    user.otpAttempts = 0;
    user.lastOTPSentAt = Date.now();
    await user.save();

    await sendOTPEmail(user.email, user.name, otp, type);
    res.json({ message: `Security code sent to ${email}` });
  } catch (err) { next(err); }
};

export const register = async (req, res, next) => {

  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "User already exists" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOTP = await bcrypt.hash(otp, 10);

    const user = await User.create({
      name,
      email,
      password,
      role: "student",
      emailVerificationOTP: hashedOTP,
      emailVerificationOTPExpire: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      lastOTPSentAt: Date.now(),
      otpAttempts: 0,
      isVerified: process.env.SKIP_EMAIL_VERIFY === "true" // Auto-verify if emails are skipped
    });

    // Automatically add to the Members collection so they show up in the Admin Dashboard
    await Member.create({
      name: user.name,
      email: user.email,
    });

    // Send Verification Email with OTP if not skipping
    if (process.env.SKIP_EMAIL_VERIFY !== "true") {
      await sendOTPEmail(user.email, user.name, otp, "Verification");
      res.status(201).json({
        message: "Registration successful. Please enter the OTP sent to your email."
      });
    } else {
      res.status(201).json({
        message: "Registration successful. You can now log in."
      });
    }

  } catch (err) {
    next(err);
  }
};
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid email/password" });

    // CHECK ACCOUNT STATUS
    if (user.accountStatus === "banned") {
      return res.status(403).json({ message: "This account has been suspended" });
    }


    if (!user.isVerified && user.role !== "admin" && process.env.SKIP_EMAIL_VERIFY !== "true") {
      return res.status(401).json({ message: "Please verify your email to access the infrastructure." });
    }



    const ok = await user.matchPassword(password);
    if (!ok) return res.status(401).json({ message: "Invalid email/password" });

    const sessionId = crypto.randomBytes(16).toString("hex");
    const session = {
      sessionId,
      ip: req.ip || req.headers["x-forwarded-for"] || "Unknown",
      userAgent: req.headers["user-agent"] || "Unknown",
      location: "Bengaluru, IN", // Demo location
      lastActive: new Date()
    };

    user.sessions.push(session);
    await user.save();

    // Check for 2FA
    if (user.securitySettings?.twoFactor) {
      // Cooldown check
      if (user.lastOTPSentAt && (Date.now() - user.lastOTPSentAt < COOLDOWN_SECONDS * 1000)) {
        return res.status(429).json({ message: `Please wait ${COOLDOWN_SECONDS}s before requesting a new code` });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedOTP = await bcrypt.hash(otp, 10);

      user.resetPasswordOTP = hashedOTP;
      user.resetPasswordOTPExpire = Date.now() + 5 * 60 * 1000; // 5 mins
      user.otpAttempts = 0;
      user.lastOTPSentAt = Date.now();
      await user.save();

      // Send 2FA OTP Email
      await sendOTPEmail(user.email, user.name, otp, "Login");

      return res.json({
        requires2FA: true,
        email: user.email,
        message: "2FA Required. OTP sent to your email."
      });
    }



    const token = generateAccessToken(user._id, sessionId);
    const refreshToken = generateRefreshToken(user._id, sessionId);

    // Set Secure Cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // Compatibility for localhost
      sameSite: "lax",
      maxAge: 15 * 60 * 1000 // 15 mins
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false, 
      sameSite: "lax",
      path: "/api/auth/refresh",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    const { membershipLimits } = await import("../config/membershipLimits.js");
    let limits;
    if (user.role === "admin") {
      limits = { maxBooks: 999, digitalAccess: true, aiAnalysisAccess: true, label: "System Administrator" };
    } else {
      limits = membershipLimits[user.membership || "Basic"];
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      membership: user.membership,
      limits,
      profilePhoto: user.profilePhoto,
      points: user.points || 0,
      level: user.level || "Novice Reader",
      createdAt: user.createdAt,
      preferences: user.preferences,
      securitySettings: user.securitySettings,
      readingGoal: user.readingGoal || 0,
      aiQueriesCount: user.aiQueriesCount || 0,
      token: token,
      sessionId
    });



  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const updateOps = { $set: {} };
    if (req.body.name) updateOps.$set.name = req.body.name;
    if (req.body.email) updateOps.$set.email = req.body.email;
    if (req.body.readingGoal !== undefined) updateOps.$set.readingGoal = req.body.readingGoal;

    if (req.body.preferences) {
      const currentPrefs = user.preferences && typeof user.preferences.toObject === 'function' ? user.preferences.toObject() : (user.preferences || {});
      updateOps.$set.preferences = { ...currentPrefs, ...req.body.preferences };
    }
    if (req.body.securitySettings) {
      const currentSec = user.securitySettings && typeof user.securitySettings.toObject === 'function' ? user.securitySettings.toObject() : (user.securitySettings || {});
      updateOps.$set.securitySettings = { ...currentSec, ...req.body.securitySettings };
    }

    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      updateOps.$set.password = await bcrypt.hash(req.body.password, salt);
    }

    if (req.file) {
      const backendUrl = process.env.BACKEND_URL || "http://localhost:5001";
      const filename = `profile-${user._id}-${Date.now()}${path.extname(req.file.originalname || '')}`;
      const gridFsId = await uploadToGridFS(req.file.buffer, filename, req.file.mimetype);
      updateOps.$set.profilePhoto = `${backendUrl}/api/books/media/${gridFsId}`;
    }

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updateOps, { new: true });

    const { membershipLimits } = await import("../config/membershipLimits.js");
    let limits;
    if (updatedUser.role === "admin") {
      limits = { maxBooks: 999, digitalAccess: true, aiAnalysisAccess: true, label: "System Administrator" };
    } else {
      limits = membershipLimits[updatedUser.membership || "Basic"];
    }

    res.json({
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      membership: updatedUser.membership,
      limits,
      profilePhoto: updatedUser.profilePhoto,
      points: updatedUser.points || 0,
      level: updatedUser.level || "Novice Reader",
      createdAt: updatedUser.createdAt,
      preferences: updatedUser.preferences,
      securitySettings: updatedUser.securitySettings,
      readingGoal: updatedUser.readingGoal || 0,
      aiQueriesCount: updatedUser.aiQueriesCount || 0,
      token: generateAccessToken(updatedUser._id)
    });

  } catch (err) {
    next(err);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const updateOps = { $set: {} };
    if (req.body.preferences) {
      const currentPrefs = user.preferences && typeof user.preferences.toObject === 'function' ? user.preferences.toObject() : (user.preferences || {});
      updateOps.$set.preferences = { ...currentPrefs, ...req.body.preferences };
    }
    if (req.body.securitySettings) {
      const currentSec = user.securitySettings && typeof user.securitySettings.toObject === 'function' ? user.securitySettings.toObject() : (user.securitySettings || {});
      updateOps.$set.securitySettings = { ...currentSec, ...req.body.securitySettings };
    }

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updateOps, { new: true });
    res.json({ preferences: updatedUser?.preferences, securitySettings: updatedUser?.securitySettings });
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    if (req.body.email) req.body.email = req.body.email.trim().toLowerCase();
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate 6-digit OTP
    // Cooldown check
    if (user.lastOTPSentAt && (Date.now() - user.lastOTPSentAt < COOLDOWN_SECONDS * 1000)) {
      return res.status(429).json({ message: `Please wait ${COOLDOWN_SECONDS}s before requesting a new code` });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOTP = await bcrypt.hash(otp, 10);

    user.resetPasswordOTP = hashedOTP;
    user.resetPasswordOTPExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    user.otpAttempts = 0;
    user.lastOTPSentAt = Date.now();
    await user.save();

    await sendOTPEmail(user.email, user.name, otp, "Recovery");

    res.status(200).json({ message: "OTP sent to your email" });


  } catch (err) {
    next(err);
  }
};

export const verifyOTP = async (req, res, next) => {
  try {
    if (req.body.email) req.body.email = req.body.email.trim().toLowerCase();
    const { email, otp } = req.body;
    const user = await User.findOne({
      email,
      resetPasswordOTPExpire: { $gt: Date.now() }
    });

    if (!user || !user.resetPasswordOTP) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Attempt Limit Check
    if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
      return res.status(403).json({ message: "Too many failed attempts. Request a new code." });
    }

    const isMatch = await bcrypt.compare(otp, user.resetPasswordOTP);
    if (!isMatch) {
      user.otpAttempts += 1;
      await user.save();

      return res.status(400).json({ message: `Invalid security code. ${MAX_OTP_ATTEMPTS - user.otpAttempts} attempts remaining.` });
    }

    res.status(200).json({ message: "OTP verified successfully" });
  } catch (err) {
    next(err);
  }
};



export const verifyEmail = async (req, res, next) => {
  try {
    if (req.body.email) req.body.email = req.body.email.trim().toLowerCase();
    const { email, otp } = req.body;
    const user = await User.findOne({
      email,
      emailVerificationOTPExpire: { $gt: Date.now() }
    });

    if (!user || !user.emailVerificationOTP) {
      return res.status(400).json({ message: "Invalid or expired verification OTP" });
    }

    if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
      return res.status(403).json({ message: "Too many failed attempts. Request a new code." });
    }

    const isMatch = await bcrypt.compare(otp, user.emailVerificationOTP);
    if (!isMatch) {
      user.otpAttempts += 1;
      await user.save();
      return res.status(400).json({ message: `Invalid verification code. ${MAX_OTP_ATTEMPTS - user.otpAttempts} attempts remaining.` });
    }

    user.isVerified = true;
    user.emailVerificationOTP = undefined;
    user.emailVerificationOTPExpire = undefined;
    user.otpAttempts = 0;
    await user.save();

    // Create a corresponding Member upon successful verification
    const existingMember = await Member.findOne({ email: user.email });
    if (!existingMember) {
      await Member.create({ name: user.name, email: user.email });
    }

    res.status(200).json({ message: "Email verified successfully" });
  } catch (err) {
    next(err);
  }
};




export const resetPassword = async (req, res, next) => {
  try {
    if (req.body.email) req.body.email = req.body.email.trim().toLowerCase();
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({
      email,
      resetPasswordOTPExpire: { $gt: Date.now() }
    });

    if (!user || !user.resetPasswordOTP) {
      return res.status(400).json({ message: "Invalid or expired session" });
    }

    const isMatch = await bcrypt.compare(otp, user.resetPasswordOTP);
    if (!isMatch) {
      return res.status(400).json({ message: "Verification failed" });
    }

    user.password = newPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpire = undefined;
    await user.save();


    res.status(200).json({ message: "Password reset successfully" });
  } catch (err) {
    next(err);
  }
};


export const getLeaderboard = async (req, res, next) => {
  try {
    const users = await User.find({ role: "student" })
      .select("name email points level profilePhoto")
      .sort({ points: -1 })
      .limit(10);
    res.json(users);
  } catch (err) {
    next(err);
  }
};

export const toggleFavorite = async (req, res, next) => {
  try {
    const { bookId } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isFavorite = user.favorites.includes(bookId);
    if (isFavorite) {
      user.favorites = user.favorites.filter(id => id.toString() !== bookId);
    } else {
      user.favorites.push(bookId);
    }

    await user.save();
    res.json({ favorites: user.favorites });
  } catch (err) {
    next(err);
  }
};

export const getFavorites = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate("favorites");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user.favorites);
  } catch (err) {
    next(err);
  }
};

export const getSessions = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("sessions");
    res.json(user.sessions || []);
  } catch (err) {
    next(err);
  }
};

export const logoutSession = async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    const user = await User.findById(req.user._id);
    user.sessions = user.sessions.filter(s => s.sessionId !== sessionId);
    await user.save();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

export const logoutAllSessions = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.sessions = [];
    await user.save();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

export const exportUserData = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select("-password -resetPasswordToken -resetPasswordExpire");
    const member = await Member.findOne({ email: user.email });
    let transactions = [];
    if (member) transactions = await Transaction.find({ memberId: member._id }).populate("bookId", "title author category");
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
    const auditLogs = await AuditLog.find({ adminId: userId }).sort({ timestamp: -1 });

    const format = req.query.format || "json";

    if (format === "csv") {
      const rows = [
        ["type", "name/title", "email/author", "role/category", "date"],
        ["profile", user.name, user.email, user.role, user.createdAt],
        ...transactions.map(tx => ["transaction", tx.bookId?.title || "", tx.bookId?.author || "", tx.bookId?.category || "", tx.issueDate])
      ];
      const csv = rows.map(r => r.map(v => JSON.stringify(v ?? "")).join(",")).join("\n");
      res.setHeader("Content-Disposition", "attachment; filename=library-export.csv");
      res.setHeader("Content-Type", "text/csv");
      return res.send(csv);
    }

    res.setHeader("Content-Disposition", "attachment; filename=library-export.json");
    res.setHeader("Content-Type", "application/json");
    res.json({
      profile: { id: user._id, name: user.name, email: user.email, role: user.role, membership: user.membership, points: user.points, level: user.level, registered_at: user.createdAt },
      preferences: user.preferences,
      sessions: user.sessions,
      transactions: transactions.map(tx => ({ resource: tx.bookId?.title, author: tx.bookId?.author, category: tx.bookId?.category, issue_date: tx.issueDate, due_date: tx.dueDate, returned: tx.returned, penalty: tx.penalty })),
      notifications: notifications.map(n => ({ title: n.title, message: n.message, type: n.type, is_read: n.isRead, date: n.createdAt })),
      audit_logs: auditLogs.map(log => ({ action: log.action, target: log.target, details: log.details, timestamp: log.timestamp })),
      export_meta: { timestamp: new Date().toISOString(), version: "2.0.0" }
    });
  } catch (err) {
    next(err);
  }
};

// --- API KEY MANAGEMENT ---

export const generateApiKey = async (req, res, next) => {
  try {
    if (req.user?.role !== "admin" && req.user?.membership !== "Elite") {
      return res.status(403).json({ message: "API key generation is exclusive to Elite members." });
    }
    const user = await User.findById(req.user._id);
    const key = "sk_live_" + crypto.randomBytes(24).toString("hex");
    user.apiKeys.push({ key, label: req.body.label || "Default", createdAt: new Date() });
    await user.save();
    const created = user.apiKeys[user.apiKeys.length - 1];
    res.json({ key, id: created._id, label: created.label, createdAt: created.createdAt });
  } catch (err) { next(err); }
};

export const listApiKeys = async (req, res, next) => {
  try {
    if (req.user?.role !== "admin" && req.user?.membership !== "Elite") {
      return res.status(403).json({ message: "API key actions are exclusive to Elite members." });
    }
    const user = await User.findById(req.user._id).select("apiKeys");
    const keys = (user.apiKeys || []).filter(k => !k.revoked).map(k => ({
      id: k._id,
      label: k.label,
      preview: k.key.substring(0, 12) + "••••••••",
      createdAt: k.createdAt,
      lastUsed: k.lastUsed
    }));
    res.json(keys);
  } catch (err) { next(err); }
};

export const revokeApiKey = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const k = user.apiKeys.id(req.params.id);
    if (!k) return res.status(404).json({ message: "Key not found" });
    k.revoked = true;
    await user.save();
    res.json({ message: "API key revoked" });
  } catch (err) { next(err); }
};

export const verify2FA = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({
      email,
      resetPasswordOTPExpire: { $gt: Date.now() }
    });

    if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
      return res.status(403).json({ message: "Account locked due to too many failed attempts. Request a new code." });
    }

    const isMatch = await bcrypt.compare(otp, user.resetPasswordOTP);
    if (!isMatch) {
      user.otpAttempts += 1;
      await user.save();
      return res.status(400).json({ message: `Verification failed. ${MAX_OTP_ATTEMPTS - user.otpAttempts} attempts remaining.` });
    }


    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpire = undefined;
    user.otpAttempts = 0;


    const sessionId = crypto.randomBytes(16).toString("hex");
    const session = {
      sessionId,
      ip: req.ip || req.headers["x-forwarded-for"] || "Unknown",
      userAgent: req.headers["user-agent"] || "Unknown",
      location: "Bengaluru, IN",
      lastActive: new Date()
    };
    user.sessions.push(session);
    const token = generateAccessToken(user._id, sessionId);
    const refreshToken = generateRefreshToken(user._id, sessionId);

    // Set Secure Cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // Compatibility for localhost
      sameSite: "lax",
      maxAge: 15 * 60 * 1000 // 15 mins
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false, 
      sameSite: "lax",
      path: "/api/auth/refresh",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePhoto: user.profilePhoto,
      points: user.points || 0,
      level: user.level || "Novice Reader",
      createdAt: user.createdAt,
      token: token,
      sessionId
    });

  } catch (err) {
    next(err);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) { next(err); }
};

export const promoteToAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.role = "admin";
    await user.save();

    await AuditLog.create({
      adminId: req.user._id,
      adminName: req.user.name,
      action: "ADMIN_PROMOTION",
      target: "USER",
      details: `Promoted ${user.email} to admin`
    });

    res.json({ message: `${user.name} is now an administrator.` });
  } catch (err) { next(err); }
};

export const demoteFromAdmin = async (req, res, next) => {
  try {
    // Prevent self-demotion to avoid losing system access
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ message: "You cannot demote yourself. Safety Protocol Active." });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.role = "student";
    await user.save();

    await AuditLog.create({
      adminId: req.user._id,
      adminName: req.user.name,
      action: "ADMIN_DEMOTION",
      target: "USER",
      details: `Demoted ${user.email} from admin`
    });

    res.json({ message: `${user.name} has been reverted to a standard user account.` });
  } catch (err) { next(err); }
};

export const refreshToken = async (req, res, next) => {
  try {
    const rfToken = req.cookies.refreshToken;
    if (!rfToken) return res.status(401).json({ message: "No refresh token provided" });

    const decoded = jwt.verify(rfToken, process.env.JWT_REFRESH_SECRET || "default_refresh_secret");
    
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "User not found" });

    if (decoded.sessionId) {
      const session = user.sessions.find(s => s.sessionId === decoded.sessionId);
      if (!session) return res.status(401).json({ message: "Session expired or invalid" });
    }

    const newAccessToken = generateAccessToken(user._id, decoded.sessionId);
    
    // Optional: Also rotate refresh token here
    
    res.json({ token: newAccessToken });
  } catch (err) {
    if (err.name === "TokenExpiredError") return res.status(401).json({ message: "Refresh token expired" });
    return res.status(401).json({ message: "Invalid refresh token" });
  }
};

