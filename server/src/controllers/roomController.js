import Room from "../models/room.js";
import RoomBooking from "../models/roomBooking.js";
import Payment from "../models/payment.js";
import Member from "../models/member.js";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

// GET /api/rooms
export const getAllRooms = async (req, res, next) => {
  try {
    const rooms = await Room.find({ status: "Available" });
    res.json(rooms);
  } catch (err) {
    next(err);
  }
};

// GET /api/rooms/bookings/:roomId/:date
export const getRoomBookings = async (req, res, next) => {
  try {
    const { roomId, date } = req.params;
    const bookings = await RoomBooking.find({ roomId, date, status: "Active" });
    // Return a count of how many students booked each slot
    const slotCounts = {};
    bookings.forEach(b => {
      slotCounts[b.timeSlot] = (slotCounts[b.timeSlot] || 0) + 1;
    });
    res.json(slotCounts);
  } catch (err) {
    next(err);
  }
};

// POST /api/rooms/book
export const bookRoom = async (req, res, next) => {
  try {
    const { roomId, date, timeSlot, razorpay_order_id, razorpay_payment_id, razorpay_signature, isMock, amount } = req.body;
    
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: "Room not found." });

    // Check if slot has reached room capacity (minimum 10)
    const maxCapacity = Math.max(room.capacity || 10, 10);
    const existingCount = await RoomBooking.countDocuments({ roomId, date, timeSlot, status: "Active" });
    if (existingCount >= maxCapacity) {
      return res.status(400).json({ message: "This time slot is fully booked." });
    }

    // Verify Payment Signature
    if (isMock || razorpay_order_id?.startsWith("order_mock_") || razorpay_order_id?.startsWith("err_mock_")) {
      console.log("✅ Mock Room Booking Payment Verified");
    } else {
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ message: "Payment details missing." });
      }
      const sign = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSign = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "placeholder_secret")
        .update(sign.toString())
        .digest("hex");

      if (razorpay_signature !== expectedSign) {
        return res.status(400).json({ message: "Invalid payment signature." });
      }
    }

    const booking = await RoomBooking.create({
      userId: req.user._id,
      roomId,
      date,
      timeSlot,
      status: "Active"
    });

    // Log Payment to Accounting Ledger
    const member = await Member.findOne({ email: req.user.email });
    if (member) {
      await Payment.create({
        memberId: member._id,
        amount: amount || room.pricePerSlot || 0,
        reason: `Study Room: ${room.name}`,
        date: new Date()
      });
    }

    res.status(201).json(booking);
  } catch (err) {
    next(err);
  }
};

// GET /api/rooms/my-bookings
export const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await RoomBooking.find({ userId: req.user._id })
      .populate("roomId", "name imageUrl")
      .sort({ date: 1 });
    res.json(bookings);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/rooms/cancel/:id
export const cancelBooking = async (req, res, next) => {
  try {
    const booking = await RoomBooking.findOne({ _id: req.params.id, userId: req.user._id });
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    
    booking.status = "Cancelled";
    await booking.save();
    
    res.json({ message: "Booking cancelled successfully" });
  } catch (err) {
    next(err);
  }
};
