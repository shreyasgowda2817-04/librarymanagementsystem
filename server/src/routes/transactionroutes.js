// server/src/routes/transactionRoutes.js
import express from "express";
import {
  getTransactions,
  getMyTransactions,
  issueBook,
  returnBook,
  payFine,
  payAllFines,
  getTelemetry,
  markAsLost,
  getMonthlyReads
} from "../controllers/transactionController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/my", protect, getMyTransactions);
router.get("/", protect, admin, getTransactions);
router.post("/issue", protect, admin, issueBook);
router.patch("/return/:id", protect, admin, returnBook);
router.patch("/:id/lost", protect, admin, markAsLost);
router.patch("/pay-fine/:id", protect, payFine);
router.patch("/pay-all-fines/:memberId", protect, admin, payAllFines);
router.get("/telemetry", protect, admin, getTelemetry);
router.get("/analytics/monthly-reads", protect, admin, getMonthlyReads);


export default router;
