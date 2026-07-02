import mongoose from "mongoose";

const configSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, default: "feature_flags" },
  features: {
    leaderboard: { type: Boolean, default: true },
    reservations: { type: Boolean, default: true },
    aiAssistant: { type: Boolean, default: true },
    recommendations: { type: Boolean, default: true },
    vault: { type: Boolean, default: true },
    auditLedger: { type: Boolean, default: true }
  }
}, { timestamps: true });

const Config = mongoose.model("Config", configSchema);
export default Config;
