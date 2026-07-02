// server/src/controllers/bookController.js
import Book from "../models/book.js";
import Transaction from "../models/transaction.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getBooks = async (req, res, next) => {
  try {
    const books = await Book.find({}).sort({ createdAt: -1 });
    res.json(books);
  } catch (err) {
    next(err);
  }
};

export const createBook = async (req, res, next) => {
  try {
    const { title, author, status, category, stock, barcode } = req.body;
    let pdfUrl = "";
    let coverUrl = "";
    const backendUrl = process.env.BACKEND_URL || "http://localhost:5001";
    if (req.files?.pdf) {
      pdfUrl = `${backendUrl}/uploads/${req.files.pdf[0].filename}`;
    }
    if (req.files?.cover) {
      coverUrl = `${backendUrl}/uploads/${req.files.cover[0].filename}`;
    }

    const book = await Book.create({
      title,
      author,
      status: status || "Available",
      category: category || "Uncategorized",
      stock: stock ? Number(stock) : 1,
      barcode: barcode || "",
      pdfUrl,
      coverUrl
    });

    // Emit real-time dashboard update for new book
    try {
      import("../utils/socket.js").then(({ getIO }) => {
        getIO().emit("dashboard:update", { type: "new_book", book });
      });
    } catch (e) { console.log(e); }

    res.status(201).json(book);
  } catch (err) {
    next(err);
  }
};

export const updateBook = async (req, res, next) => {
  try {
    const { id } = req.params;

    const updateData = { ...req.body };
    const backendUrl = process.env.BACKEND_URL || "http://localhost:5001";
    if (req.files?.pdf) {
      updateData.pdfUrl = `${backendUrl}/uploads/${req.files.pdf[0].filename}`;
    }
    if (req.files?.cover) {
      updateData.coverUrl = `${backendUrl}/uploads/${req.files.cover[0].filename}`;
    }

    const updated = await Book.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) return res.status(404).json({ message: "Book not found" });

    // Recalculate status in case stock was changed
    const activeTxsCount = await Transaction.countDocuments({ bookId: id, returned: false });
    if (activeTxsCount < (updated.stock || 1)) {
      if (updated.status === "Issued") {
        updated.status = "Available";
        await updated.save();
      }
    } else {
      if (updated.status === "Available") {
        updated.status = "Issued";
        await updated.save();
      }
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

export const deleteBook = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deleted = await Book.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Book not found" });

    res.json({ message: "Book deleted" });
  } catch (err) {
    next(err);
  }
};

export const readPdf = async (req, res, next) => {
  try {
    const { id } = req.params;
    const book = await Book.findById(id);
    
    if (!book || !book.pdfUrl) {
      return res.status(404).json({ message: "PDF not found" });
    }

    // Check subscription limits
    if (!req.user.limits.digitalAccess) {
      return res.status(403).json({ 
        message: "Digital access is restricted to Premium and Elite members. Please upgrade your subscription.",
        currentMembership: req.user.membership
      });
    }


    const filename = book.pdfUrl.split("/uploads/")[1];
    if (!filename) {
      return res.status(404).json({ message: "Invalid PDF path" });
    }

    const filePath = path.join(__dirname, "../../uploads", filename);
    res.sendFile(filePath);
  } catch (err) {
    next(err);
  }
};
