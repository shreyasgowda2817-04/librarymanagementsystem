import mongoose from "mongoose";

const globalSettingsSchema = new mongoose.Schema({
  platform: {
    siteName: { type: String, default: "Institutional Management Suite" },
    logoUrl: { type: String, default: "" },
    defaultLanguage: { type: String, default: "en" },
    maintenanceMode: { type: Boolean, default: false },
  },
  email: {
    smtpHost: { type: String, default: "" },
    smtpPort: { type: Number, default: 587 },
    senderEmail: { type: String, default: "" },
    smtpUser: { type: String, default: "" },
    smtpPass: { type: String, default: "" },
  },
  features: {
    leaderboard: { type: Boolean, default: true },
    reservations: { type: Boolean, default: true },
    aiAssistant: { type: Boolean, default: true },
    recommendations: { type: Boolean, default: true },
    vault: { type: Boolean, default: true },
    auditLedger: { type: Boolean, default: true }
  },
  userSystem: {
    enableRegistration: { type: Boolean, default: true },
    autoApproveUsers: { type: Boolean, default: false },
    defaultRole: { type: String, default: "student" }
  },
  security: {
    require2FA: { type: Boolean, default: false },
    force2FAForAdmins: { type: Boolean, default: false },
    sessionTimeout: { type: Number, default: 60 }, // minutes
    maxLoginAttempts: { type: Number, default: 5 }
  }
}, { timestamps: true });

// Singleton pattern for Global Settings
globalSettingsSchema.statics.getInstance = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

const GlobalSettings = mongoose.model("GlobalSettings", globalSettingsSchema);
export default GlobalSettings;
