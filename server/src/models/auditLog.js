import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  adminName: { type: String, required: true },
  action: { type: String, required: true },
  target: { type: String, required: true },
  details: { type: String },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);
export default AuditLog;
