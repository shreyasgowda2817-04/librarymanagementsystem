import express from "express";
import { createOrder, verifyPayment, getAllPayments, getFinancialStats } from "../controllers/paymentController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create-order", protect, createOrder);
router.post("/verify", protect, verifyPayment);
router.get("/all", protect, admin, getAllPayments);
router.get("/stats", protect, admin, getFinancialStats);

export default router;
