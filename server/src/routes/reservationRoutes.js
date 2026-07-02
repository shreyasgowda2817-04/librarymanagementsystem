import express from "express";
import { reserveBook, getUserReservations, cancelReservation, getAllReservations, fulfillReservation, bumpReservation } from "../controllers/reservationController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, reserveBook);
router.get("/all", protect, getAllReservations);
router.get("/my", protect, getUserReservations);
router.patch("/:id/cancel", protect, cancelReservation);
router.patch("/:id/fulfill", protect, admin, fulfillReservation);
router.patch("/:id/bump", protect, admin, bumpReservation);

export default router;
