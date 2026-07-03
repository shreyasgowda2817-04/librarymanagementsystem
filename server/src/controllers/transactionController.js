// server/src/controllers/transactionController.js
import Transaction from "../models/transaction.js";
import Book from "../models/book.js";
import Member from "../models/member.js";
import Reservation from "../models/Reservation.js";
import Notification from "../models/notification.js";
import User from "../models/user.js";
import Payment from "../models/payment.js";
import AuditLog from "../models/auditLog.js";
import { awardPoints } from "../utils/gamification.js";
import sendEmail, { emailTemplates, sendSMS } from "../services/emailService.js";
import { membershipLimits } from "../config/membershipLimits.js";
import { getIO } from "../utils/socket.js";

export const getMyTransactions = async (req, res, next) => {
  try {
    const userEmail = req.user.email;
    const member = await Member.findOne({ email: userEmail });
    if (!member) return res.json([]);

    const txs = await Transaction.find({ memberId: member._id })
      .populate("bookId", "title author coverUrl")
      .sort({ createdAt: -1 });

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const penaltyPerDay = Number(process.env.PENALTY_PER_DAY || 5);
    
    const processedTxs = txs.map(tx => {
      let currentPenalty = tx.penalty || 0;
      if (!tx.returned) {
        const due = new Date(tx.dueDate);
        due.setUTCHours(0, 0, 0, 0);
        if (today > due) {
          const diffMs = today - due;
          const lateDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
          if (lateDays > 0) currentPenalty = lateDays * penaltyPerDay;
        }
      }
      return { ...tx.toJSON(), currentPenalty };
    });

    res.json(processedTxs);
  } catch (err) {
    next(err);
  }
};

const penaltyPerDay = Number(process.env.PENALTY_PER_DAY || 5);

// GET /api/transactions
export const getTransactions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.user && ["librarian", "accountant"].includes(req.user.role) && req.user.branchId) {
      query.branchId = req.user.branchId;
    }

    const txs = await Transaction.find(query)
      .populate("bookId", "title author status")
      .populate("memberId", "name email phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Transaction.countDocuments(query);

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    
    const processedTxs = txs.map(tx => {
      let currentPenalty = tx.penalty || 0;
      if (!tx.returned) {
        const due = new Date(tx.dueDate);
        due.setUTCHours(0, 0, 0, 0);
        if (today > due) {
          const diffMs = today - due;
          const lateDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
          if (lateDays > 0) currentPenalty = lateDays * penaltyPerDay;
        }
      }
      return { ...tx.toJSON(), currentPenalty };
    });

    res.json({
      transactions: processedTxs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/transactions/issue
export const issueBook = async (req, res, next) => {
  try {
    const { bookId, memberId, issueDate, dueDate } = req.body;

    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: "Book not found" });

    const member = await Member.findById(memberId);
    if (!member) return res.status(404).json({ message: "Member not found" });

    // Check membership limits
    const memberUser = await User.findOne({ email: member.email });
    if (memberUser && memberUser.role !== "admin") {
      if (book.isRare && memberUser.membership !== "Elite") {
        return res.status(403).json({ 
          message: `Access denied. "${book.title}" is classified as a Rare Book and is exclusive to Elite members.` 
        });
      }

      const activeMemberTxs = await Transaction.countDocuments({ memberId, returned: false });
      const limits = membershipLimits[memberUser.membership] || membershipLimits["Basic"];
      
      if (activeMemberTxs >= limits.maxBooks) {
        return res.status(403).json({ 
          message: `Borrowing limit reached for ${memberUser.membership} membership (${limits.maxBooks} books max).`,
          currentLoans: activeMemberTxs,
          limit: limits.maxBooks
        });
      }

      const issueDt = new Date(issueDate);
      const dueDt = new Date(dueDate);
      const diffTime = dueDt - issueDt;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const maxDays = memberUser.membership === "Elite" ? 365 : memberUser.membership === "Premium" ? 30 : 14;

      if (diffDays > maxDays) {
        return res.status(400).json({ 
          message: `Issue duration of ${diffDays} days exceeds the limit of ${maxDays} days allowed for ${memberUser.membership} membership.` 
        });
      }
    }

    const updatedBook = await Book.findOneAndUpdate(
      { _id: bookId, availableCopies: { $gt: 0 } },
      { $inc: { availableCopies: -1 } },
      { new: true }
    );

    if (!updatedBook) {
      return res.status(400).json({ message: "All copies of this book are currently issued" });
    }


    const tx = await Transaction.create({
      bookId,
      memberId,
      issueDate,
      dueDate,
      returned: false,
      returnedOn: null,
      penalty: 0
    });

    // mark book issued only if all copies are now taken
    if (updatedBook.availableCopies === 0 && updatedBook.status !== "Issued") {
      updatedBook.status = "Issued";
      await updatedBook.save();
    }

    if (req.user && req.user.role === "admin") {
      await AuditLog.create({
        adminId: req.user._id,
        adminName: req.user.name,
        action: "ISSUE_BOOK",
        target: `Transaction ID: ${tx._id}`,
        details: `Issued "${book.title}" to member ${member.email}`
      });
    }

    // Award points and notify user for borrowing
    try {
      const member = await Member.findById(memberId);
      if (member && member.email) {
        const user = await User.findOne({ email: member.email });
        if (user) {
          await awardPoints(user._id, 10);
          await Notification.create({
            userId: user._id,
            title: "New Book Issued",
            message: `The book "${book.title}" has been issued to you. Please return it by ${dueDate}.`,
            type: "info"
          });

          // NEW: Send confirmation email
          await sendEmail(
            user.email,
            `Book Issued: ${book.title}`,
            emailTemplates.bookIssued(user.name, book.title, dueDate)
          );

          if (user.phone) {
            await sendSMS(
              user.phone,
              `Hi ${user.name || "Member"}, you have successfully borrowed "${book.title}". Please return it by ${dueDate}.`
            );
          }
        }
      }
    } catch (err) {
      console.error("Failed to process post-issue actions:", err);
    }

    try {
      getIO().emit("dashboard:update", { type: "issue", tx });
    } catch (e) { console.log("Socket emit error:", e); }

    res.status(201).json(tx);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/transactions/return/:id
export const returnBook = async (req, res, next) => {
  try {
    const { id } = req.params;

    const tx = await Transaction.findById(id);
    if (!tx) return res.status(404).json({ message: "Transaction not found" });

    if (tx.returned) {
      return res.status(400).json({ message: "Already returned" });
    }

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    today.setUTCHours(0, 0, 0, 0);

    // penalty calculation
    const due = new Date(tx.dueDate);
    due.setUTCHours(0, 0, 0, 0);
    let penalty = 0;

    if (today > due) {
      const diffMs = today - due;
      const lateDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      penalty = lateDays * penaltyPerDay;
    }

    tx.returned = true;
    tx.returnedOn = todayStr;
    tx.penalty = penalty;
    if (penalty === 0) {
      tx.finePaid = true;
    }
    await tx.save();

    // mark book available again atomically
    const book = await Book.findByIdAndUpdate(
      tx.bookId,
      { 
        $inc: { availableCopies: 1 },
        $set: { status: "Available" }
      },
      { new: true }
    );

    if (req.user && req.user.role === "admin") {
      await AuditLog.create({
        adminId: req.user._id,
        adminName: req.user.name,
        action: "RETURN_BOOK",
        target: `Transaction ID: ${tx._id}`,
        details: `Returned book "${book?.title}". Penalty applied: ₹${penalty}`
      });
    }

    // NEW: Notify the FIRST user in the waitlist
    try {
      const pendingReservations = await Reservation.find({ bookId: tx.bookId, status: "Pending" })
        .sort({ priority: -1, createdAt: 1 })
        .limit(1);
        
      if (pendingReservations.length > 0) {
        const firstInLine = pendingReservations[0];
        await Notification.create({
          userId: firstInLine.userId,
          title: "Book Available!",
          message: `The book "${book.title}" you waitlisted is now available. You are first in line!`,
          type: "success"
        });
      }
    } catch (notifErr) {
      console.error("Failed to create notifications for reservations:", notifErr);
    }

    // Award points for on-time return
    if (penalty === 0) {
      try {
        const member = await Member.findById(tx.memberId);
        if (member && member.email) {
          const user = await User.findOne({ email: member.email });
          if (user) await awardPoints(user._id, 20);
        }
      } catch (ptsErr) {
        console.error("Failed to award points:", ptsErr);
      }
    }

    try {
      getIO().emit("dashboard:update", { type: "return", tx });
    } catch (e) { console.log("Socket emit error:", e); }

    res.json(tx);
  } catch (err) {
    next(err);
  }
};

export const markAsLost = async (req, res, next) => {
  try {
    const { id } = req.params;

    const tx = await Transaction.findById(id);
    if (!tx) return res.status(404).json({ message: "Transaction not found" });

    if (tx.returned || tx.isLost) {
      return res.status(400).json({ message: "Book already returned or marked lost" });
    }

    const book = await Book.findById(tx.bookId);
    if (!book) return res.status(404).json({ message: "Book not found" });

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    today.setUTCHours(0, 0, 0, 0);

    const due = new Date(tx.dueDate);
    due.setUTCHours(0, 0, 0, 0);
    let penalty = 0;

    if (today > due) {
      const diffMs = today - due;
      const lateDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      penalty = lateDays * penaltyPerDay;
    }

    penalty += (book.replacementCost || 500);

    tx.returned = true; 
    tx.isLost = true;
    tx.returnedOn = todayStr;
    tx.penalty = penalty;
    tx.fineAmount = penalty; // NEW: keep fineAmount in sync
    tx.finePaid = false; 

    if (!tx.statusHistory) tx.statusHistory = [];
    tx.statusHistory.push({
      status: "Lost",
      date: new Date(),
      note: `Book marked as lost. Replacement cost added. Total fine: ₹${penalty}`
    });

    await tx.save();

    book.status = "Lost";
    // Also decrement available copies if not already done, but status="Lost" takes precedence
    book.availableCopies = Math.max(0, book.availableCopies - 1);
    book.totalCopies = Math.max(0, book.totalCopies - 1);
    await book.save();

    if (req.user && req.user.role === "admin") {
      await AuditLog.create({
        adminId: req.user._id,
        adminName: req.user.name,
        action: "MARK_LOST",
        target: `Transaction ID: ${tx._id}`,
        details: `Marked "${book?.title}" as Lost. Replacement fee charged: ₹${penalty}`
      });
    }

    res.json(tx);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/transactions/pay-fine/:id
export const payFine = async (req, res, next) => {
  try {
    const { id } = req.params;

    const tx = await Transaction.findById(id).populate("bookId");
    if (!tx) return res.status(404).json({ message: "Transaction not found" });

    if (tx.finePaid) {
      return res.status(400).json({ message: "Fine is already paid" });
    }

    tx.finePaid = true;
    await tx.save();

    const fineAmount = tx.returned ? tx.penalty : tx.currentPenalty || tx.penalty || 0;
    
    // Create Payment record
    await Payment.create({
      memberId: tx.memberId,
      amount: fineAmount,
      reason: tx.isLost ? "Lost Book Fee" : "Late Fine",
      transactionId: tx._id
    });

    // NEW: Notify user that fine is paid
    try {
      const member = await Member.findById(tx.memberId);
      if (member && member.email) {
        const user = await User.findOne({ email: member.email });
        if (user) {
          await Notification.create({
            userId: user._id,
            title: "Fine Payment Received",
            message: `Your payment for the late fine on "${tx.bookId.title}" has been successfully processed.`,
            type: "info"
          });
          
          // Send Email Receipt
          const fineAmount = tx.returned ? tx.penalty : tx.currentPenalty || 0;
          await sendEmail(
            user.email,
            `Receipt: Fine Payment for ${tx.bookId.title}`,
            emailTemplates.finePaidReceipt(user.name, tx.bookId.title, fineAmount)
          );
        }
      }
    } catch (notifErr) {
      console.error("Failed to create notification for fine payment:", notifErr);
    }

    try {
      getIO().emit("dashboard:update", { type: "payment", tx });
    } catch (e) { console.log("Socket emit error:", e); }

    res.json({ message: "Fine paid successfully", tx });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/transactions/pay-all-fines/:memberId
export const payAllFines = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const txs = await Transaction.find({ memberId }).populate("bookId");
    
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const penaltyPerDay = Number(process.env.PENALTY_PER_DAY || 5);
    
    let updatedCount = 0;
    for (const tx of txs) {
      if (tx.finePaid) continue;

      let penalty = 0;
      if (tx.returned) {
        penalty = tx.penalty || 0;
      } else {
        const due = new Date(tx.dueDate);
        due.setUTCHours(0, 0, 0, 0);
        if (today > due) {
          const diffMs = today - due;
          const lateDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
          penalty = lateDays * penaltyPerDay;
        }
      }

      if (penalty > 0) {
        tx.finePaid = true;
        await tx.save();
        updatedCount++;
        
        // Create Payment record
        await Payment.create({
          memberId,
          amount: penalty,
          reason: tx.isLost ? "Lost Book Fee" : "Late Fine",
          transactionId: tx._id
        });
      }
    }

    try {
      const member = await Member.findById(memberId);
      if (member && member.email) {
        const user = await User.findOne({ email: member.email });
        if (user) {
          await Notification.create({
            userId: user._id,
            title: "All Fines Cleared",
            message: `All your outstanding fines have been cleared successfully.`,
            type: "success"
          });
        }
      }
    } catch (notifErr) {
      console.error("Failed to create notification for mass fine payment:", notifErr);
    }

    try {
      getIO().emit("dashboard:update", { type: "payment_all", memberId });
    } catch (e) { console.log("Socket emit error:", e); }

    res.json({ message: `Cleared fines for ${updatedCount} transactions` });
  } catch (err) {
    next(err);
  }
};

// GET /api/transactions/telemetry
export const getTelemetry = async (req, res, next) => {
  try {
    const today = new Date();
    const last7Days = [];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      last7Days.push({
        date: d.toISOString().slice(0, 10),
        day: d.toLocaleDateString("en-US", { weekday: "short" }),
        count: 0
      });
    }

    const startDate = last7Days[0].date;

    // Use MongoDB Aggregation pipeline for performance
    const aggregationResult = await Transaction.aggregate([
      {
        $match: { issueDate: { $gte: startDate } }
      },
      {
        $group: {
          _id: "$issueDate",
          count: { $sum: 1 }
        }
      }
    ]);

    // Merge aggregation results with the zero-filled last7Days array
    aggregationResult.forEach(item => {
      const dayData = last7Days.find(d => d.date === item._id);
      if (dayData) {
        dayData.count = item.count;
      }
    });

    const formattedData = last7Days.map(d => ({
      name: d.day,
      value: d.count
    }));

    res.json(formattedData);
  } catch (err) {
    next(err);
  }
};

// GET /api/transactions/analytics/monthly-reads
export const getMonthlyReads = async (req, res, next) => {
  try {
    const aggregationResult = await Transaction.aggregate([
      {
        $group: {
          _id: { $substr: ["$issueDate", 0, 7] }, // Extract YYYY-MM
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const formattedData = aggregationResult.map(item => ({
      month: item._id,
      booksRead: item.count
    }));

    res.json(formattedData);
  } catch (err) {
    next(err);
  }
};
