// server/src/models/User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, default: "Admin" },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "superadmin", "librarian", "accountant", "student"], default: "student" },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", default: null },
    googleId: { type: String, unique: true, sparse: true },
    accountStatus: { type: String, enum: ["active", "banned", "pending"], default: "active" },
    profilePhoto: { type: String, default: "" },
    points: { type: Number, default: 0 },
    aiQueriesCount: { type: Number, default: 0 },
    level: { type: String, default: "Novice Reader" },
    membership: { type: String, enum: ["Basic", "Premium", "Elite"], default: "Basic" },
    paymentHistory: [
      {
        orderId: String,
        paymentId: String,
        amount: Number,
        planName: String,
        date: { type: Date, default: Date.now }
      }
    ],
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Book" }],
    readingGoal: { type: Number, default: 0 },
    preferences: {
      theme: { type: String, enum: ["light", "dark", "system"], default: "dark" },
      language: { type: String, default: "English" },
      notifFrequency: { type: String, enum: ["instant", "daily", "weekly"], default: "instant" },
      timezone: { type: String, default: "UTC" },
      dateFormat: { type: String, default: "MM/DD/YYYY" },
      accentColor: { type: String, default: "#4f46e5" },
      fontSize: { type: String, default: "medium" },
      profileVisible: { type: Boolean, default: true },
      activityVisible: { type: Boolean, default: true },
      emailCategories: {
        reminders: { type: Boolean, default: true },
        payments: { type: Boolean, default: true },
        updates: { type: Boolean, default: true }
      },
      emailNotifications: {
        courseUpdates: { type: Boolean, default: true },
        deadlines: { type: Boolean, default: true },
        announcements: { type: Boolean, default: false }
      },
      appNotifications: {
        courseUpdates: { type: Boolean, default: true },
        deadlines: { type: Boolean, default: true },
        announcements: { type: Boolean, default: true }
      },
      reducedMotion: { type: Boolean, default: false },
      highContrast: { type: Boolean, default: false },
      dyslexicFont: { type: Boolean, default: false },
      defaultBookFormat: { type: String, enum: ["EPUB", "PDF", "Web Reader"], default: "Web Reader" },
      aiSummaryDepth: { type: String, enum: ["Brief", "Standard", "Comprehensive"], default: "Standard" },
      autoReturnBooks: { type: Boolean, default: false },
      readingReminders: { type: Boolean, default: true },
      shareReadingActivity: { type: Boolean, default: true },
      allowAiAnalysis: { type: Boolean, default: true }
    },
    securitySettings: {
      twoFactor: { type: Boolean, default: false },
      biometric: { type: Boolean, default: false },
      shieldProtocol: { type: Boolean, default: true }
    },
    apiKeys: [
      {
        key: String,
        label: { type: String, default: "Default" },
        createdAt: { type: Date, default: Date.now },
        lastUsed: { type: Date, default: null },
        revoked: { type: Boolean, default: false }
      }
    ],
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    resetPasswordOTP: String,
    resetPasswordOTPExpire: Date,
    otpAttempts: { type: Number, default: 0 },
    lastOTPSentAt: Date,

    isVerified: { type: Boolean, default: false },
    emailVerificationToken: String,
    emailVerificationOTP: String,
    emailVerificationOTPExpire: Date,

    sessions: [
      {
        sessionId: String,
        ip: String,
        userAgent: String,
        device: String,
        location: String,
        lastActive: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model("User", userSchema);
export default User;
