import express from "express";
import {
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearNotifications,
} from "../controllers/notificationController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create", protect, admin, createNotification);
router.get("/", protect, getNotifications);
router.post("/read/:id", protect, markAsRead);
router.post("/read-all", protect, markAllAsRead);
router.delete("/clear-all", protect, clearNotifications);
router.delete("/:id", protect, deleteNotification);


export default router;
