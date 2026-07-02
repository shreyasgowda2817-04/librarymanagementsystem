import express from "express";
import { getCronStatus, toggleCronJob, runCronManually, getTemplates, saveTemplate, deleteTemplate } from "../controllers/automationController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/status", protect, admin, getCronStatus);
router.post("/toggle", protect, admin, toggleCronJob);
router.post("/run", protect, admin, runCronManually);

// Template Routes
router.get("/templates", protect, admin, getTemplates);
router.post("/templates", protect, admin, saveTemplate);
router.delete("/templates/:id", protect, admin, deleteTemplate);

export default router;
