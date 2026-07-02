import Config from "../models/config.js";
import { createAuditEntry } from "./auditController.js";

export const getFeatureFlags = async (req, res, next) => {
  try {
    let config = await Config.findOne({ key: "feature_flags" });
    if (!config) {
      config = await Config.create({ key: "feature_flags" });
    }
    res.json(config.features);
  } catch (err) {
    next(err);
  }
};

export const updateFeatureFlags = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Administrative privileges required" });
    }
    
    let config = await Config.findOne({ key: "feature_flags" });
    if (!config) {
      config = new Config({ key: "feature_flags" });
    }
    
    config.features = { ...config.features, ...req.body };
    await config.save();
    
    // 📝 Audit Entry
    await createAuditEntry(
      req.user,
      "Feature Toggle Updated",
      "System Config",
      `Modules updated: ${Object.keys(req.body).join(", ")}`
    );

    res.json(config.features);
  } catch (err) {
    next(err);
  }
};
