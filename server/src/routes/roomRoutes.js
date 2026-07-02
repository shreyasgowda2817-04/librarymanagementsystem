import express from "express";
import { getAllRooms, getRoomBookings, bookRoom, getMyBookings, cancelBooking } from "../controllers/roomController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getAllRooms);
router.get("/bookings/:roomId/:date", protect, getRoomBookings);
router.post("/book", protect, bookRoom);
router.get("/my-bookings", protect, getMyBookings);
router.patch("/cancel/:id", protect, cancelBooking);

export default router;
