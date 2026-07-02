import express from "express";
import { getAdminSettings, updateAdminSettings } from "../controllers/adminSettingsController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, admin, getAdminSettings);
router.put("/", protect, admin, updateAdminSettings);

export default router;
