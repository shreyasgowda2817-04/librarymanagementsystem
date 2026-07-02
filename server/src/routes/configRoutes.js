import express from "express";
import { getFeatureFlags, updateFeatureFlags } from "../controllers/configController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/features", getFeatureFlags);
router.put("/features", protect, updateFeatureFlags);

export default router;
