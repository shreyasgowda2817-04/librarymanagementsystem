import express from "express";
import { createOrder, verifyPayment, getAllPayments, getFinancialStats, createFineOrder, verifyFinePayment } from "../controllers/paymentController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create-order", protect, createOrder);
router.post("/verify", protect, verifyPayment);
router.get("/all", protect, admin, getAllPayments);
router.get("/stats", protect, admin, getFinancialStats);
router.post("/create-fine-order", protect, createFineOrder);
router.post("/verify-fine", protect, verifyFinePayment);

export default router;
