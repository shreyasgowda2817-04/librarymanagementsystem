import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";
import { syncAsset, hardwareEvent, occupancyTelemetry } from "../controllers/connectorController.js";

const router = express.Router();

router.post("/sync-asset", protect, admin, syncAsset);
router.post("/hardware-event", protect, admin, hardwareEvent);
router.post("/telemetry/occupancy", protect, admin, occupancyTelemetry);

export default router;
