import AuditLog from "../models/auditLog.js";

export const getAuditLogs = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Administrative privileges required for ledger access" });
    }
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100);
    res.json(logs);
  } catch (err) {
    next(err);
  }
};

export const createAuditEntry = async (admin, action, target, details) => {
  try {
    await AuditLog.create({
      adminId: admin._id,
      adminName: admin.name,
      action,
      target,
      details
    });
  } catch (err) {
    console.error("Audit Ledger Entry Failed:", err);
  }
};
