import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
  // Platform Configuration
  siteName: { type: String, default: "Library PRO" },
  contactEmail: { type: String, default: "admin@library.edu" },
  defaultLang: { type: String, default: "English" },
  maintenanceMode: { type: Boolean, default: false },
  logoUrl: { type: String, default: "" },
  faviconUrl: { type: String, default: "" },

  // Course & Content Settings
  autoApprove: { type: Boolean, default: false },
  enableReviews: { type: Boolean, default: true },
  defaultVisibility: { type: String, default: "Public" },
  maxUploadSize: { type: Number, default: 50 }, // in MB

  // Global Policies
  timezone: { type: String, default: "UTC" },
  maxBorrowLimit: { type: Number, default: 5 },
  finePerDay: { type: Number, default: 2 },
  currency: { type: String, default: "USD" },

  // Security & Integrations
  sessionTimeout: { type: String, default: "60" },
  require2FA: { type: Boolean, default: false },
  enableAI: { type: Boolean, default: true },
  openAIApiKey: { type: String, default: "" },
  
  // Automations
  autoFineCheck: { type: Boolean, default: true },
  autoCleanup: { type: Boolean, default: true },

  // Payments
  instructorCommission: { type: Number, default: 70 },
  stripePublicKey: { type: String, default: "" },
  stripeSecretKey: { type: String, default: "" },

}, { timestamps: true });

// Ensure we only ever have ONE settings document (Singleton)
settingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

export default mongoose.model("Settings", settingsSchema);
