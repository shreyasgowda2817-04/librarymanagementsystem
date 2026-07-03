import Reservation from "../models/Reservation.js";
import Book from "../models/book.js";
import Transaction from "../models/transaction.js";
import Member from "../models/member.js";

export const reserveBook = async (req, res, next) => {
  try {
    const { bookId } = req.body;
    const userEmail = req.user.email;
    const member = await Member.findOne({ email: userEmail });
    if (!member) return res.status(404).json({ message: "Member profile not found" });
    const memberId = member._id;

    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: "Book not found" });

    if (book.availableCopies > 0) {
      return res.status(400).json({ message: "Book is currently available. You can borrow it directly." });
    }

    const existing = await Reservation.findOne({ bookId, memberId, status: "Pending" });
    if (existing) return res.status(400).json({ message: "You already have a pending reservation for this book" });

    // Calculate queue position
    const activeReservationsCount = await Reservation.countDocuments({ bookId, status: "Pending" });

    const reservation = await Reservation.create({
      bookId,
      memberId,
      status: "Pending",
      queuePosition: activeReservationsCount + 1
    });

    res.status(201).json(reservation);
  } catch (err) {
    next(err);
  }
};

export const getUserReservations = async (req, res, next) => {
  try {
    const member = await Member.findOne({ email: req.user.email });
    if (!member) return res.json([]);
    const memberId = member._id;
    const reservations = await Reservation.find({ memberId }).populate("bookId", "title author coverUrl");
    res.json(reservations);
  } catch (err) {
    next(err);
  }
};

export const cancelReservation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const member = await Member.findOne({ email: req.user.email });
    if (!member) return res.status(404).json({ message: "Member not found" });
    const reservation = await Reservation.findOne({ _id: id, memberId: member._id });
    if (!reservation) return res.status(404).json({ message: "Reservation not found" });

    reservation.status = "Cancelled";
    await reservation.save();
    res.json(reservation);
  } catch (err) {
    next(err);
  }
};

export const getAllReservations = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Admin access required" });
    const reservations = await Reservation.find({})
      .populate("bookId", "title author")
      .populate("memberId", "name email")
      .sort({ queuePosition: 1, createdAt: 1 });
    res.json(reservations);
  } catch (err) {
    next(err);
  }
};

export const fulfillReservation = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Admin access required" });
    const { id } = req.params;

    const reservation = await Reservation.findById(id).populate("bookId");
    if (!reservation) return res.status(404).json({ message: "Reservation not found" });
    if (reservation.status !== "Pending") return res.status(400).json({ message: "Reservation is already fulfilled or cancelled" });

    // Ensure book is available if it was just returned, or we can just issue it anyway if admin overrides
    // Actually, issuing it creates a new transaction
    const issueDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14); // 14 days default

    const transaction = await Transaction.create({
      bookId: reservation.bookId._id,
      memberId: reservation.memberId,
      issueDate,
      dueDate
    });

    reservation.status = "Fulfilled";
    await reservation.save();

    await Book.findByIdAndUpdate(reservation.bookId._id, { 
      $inc: { availableCopies: -1 } 
    });

    res.json({ message: "Reservation fulfilled and book issued successfully", transaction, reservation });
  } catch (err) {
    next(err);
  }
};

export const bumpReservation = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Admin access required" });
    const { id } = req.params;

    const reservation = await Reservation.findById(id);
    if (!reservation) return res.status(404).json({ message: "Reservation not found" });

    // Swap queue positions with the person ahead of them, if any.
    if (reservation.queuePosition > 1) {
      const personAhead = await Reservation.findOne({ 
        bookId: reservation.bookId, 
        status: "Pending", 
        queuePosition: reservation.queuePosition - 1 
      });
      if (personAhead) {
        personAhead.queuePosition += 1;
        await personAhead.save();
      }
      reservation.queuePosition -= 1;
      await reservation.save();
    }

    res.json({ message: "Reservation priority bumped successfully", reservation });
  } catch (err) {
    next(err);
  }
};
