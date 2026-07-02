import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";
import { broadcastMessage, runBackup, clearCache, importBooks, auditInventory } from "../controllers/adminToolsController.js";

const router = express.Router();

router.post("/broadcast", protect, admin, broadcastMessage);
router.post("/backup", protect, admin, runBackup);
router.post("/clear-cache", protect, admin, clearCache);
router.post("/import-books", protect, admin, importBooks);
router.post("/audit-inventory", protect, admin, auditInventory);

export default router;
