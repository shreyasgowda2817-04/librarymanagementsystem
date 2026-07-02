import express from "express";
import { scanAttendance } from "../controllers/attendanceController.js";

const router = express.Router();

// Public kiosk route (doesn't require auth token so an unattended iPad can run it safely)
router.post("/scan", scanAttendance);

export default router;
