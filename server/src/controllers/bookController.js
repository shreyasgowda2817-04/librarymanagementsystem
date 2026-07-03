// server/src/controllers/bookController.js
import Book from "../models/book.js";
import Transaction from "../models/transaction.js";
import mongoose from "mongoose";

const uploadToGridFS = async (buffer, filename, mimetype) => {
  return new Promise((resolve, reject) => {
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: "media"
    });
    
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: mimetype
    });
    
    uploadStream.end(buffer);
    
    uploadStream.on('finish', () => resolve(uploadStream.id));
    uploadStream.on('error', reject);
  });
};

export const getBooks = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.user && ["librarian", "accountant"].includes(req.user.role) && req.user.branchId) {
      query.branchId = req.user.branchId;
    }

    const books = await Book.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    const total = await Book.countDocuments(query);

    res.json({
      books,
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

export const createBook = async (req, res, next) => {
  try {
    const { title, author, status, category, stock, barcode } = req.body;
    let pdfUrl = "";
    let coverUrl = "";
    const backendUrl = process.env.BACKEND_URL || "http://localhost:5001";
    
    if (req.files?.pdf) {
      const fileId = await uploadToGridFS(req.files.pdf[0].buffer, req.files.pdf[0].originalname, req.files.pdf[0].mimetype);
      pdfUrl = `${backendUrl}/api/books/media/${fileId}`;
    }
    if (req.files?.cover) {
      const fileId = await uploadToGridFS(req.files.cover[0].buffer, req.files.cover[0].originalname, req.files.cover[0].mimetype);
      coverUrl = `${backendUrl}/api/books/media/${fileId}`;
    }

    const book = await Book.create({
      title,
      author,
      status: status || "Available",
      category: category || "Uncategorized",
      stock: stock ? Number(stock) : 1,
      totalCopies: stock ? Number(stock) : 1,
      availableCopies: stock ? Number(stock) : 1,
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
      const fileId = await uploadToGridFS(req.files.pdf[0].buffer, req.files.pdf[0].originalname, req.files.pdf[0].mimetype);
      updateData.pdfUrl = `${backendUrl}/api/books/media/${fileId}`;
    }
    if (req.files?.cover) {
      const fileId = await uploadToGridFS(req.files.cover[0].buffer, req.files.cover[0].originalname, req.files.cover[0].mimetype);
      updateData.coverUrl = `${backendUrl}/api/books/media/${fileId}`;
    }

    if (updateData.stock !== undefined) {
      // Sync totalCopies and availableCopies if admin updates stock
      updateData.totalCopies = Number(updateData.stock);
      updateData.availableCopies = Number(updateData.stock);
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
    const book = await Book.findById(req.params.id);
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

    const fileIdStr = book.pdfUrl.split('/').pop();
    const fileId = new mongoose.mongo.ObjectId(fileIdStr);
    
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: "media" });
    const downloadStream = bucket.openDownloadStream(fileId);
    res.set('Content-Type', 'application/pdf');
    downloadStream.pipe(res);
  } catch (err) {
    next(err);
  }
};

export const getMedia = async (req, res, next) => {
  try {
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: "media" });
    const fileId = new mongoose.mongo.ObjectId(req.params.id);
    const files = await bucket.find({ _id: fileId }).toArray();
    
    if (!files || files.length === 0) {
      return res.status(404).json({ message: "Media not found" });
    }
    
    res.set('Content-Type', files[0].contentType);
    const downloadStream = bucket.openDownloadStream(fileId);
    downloadStream.pipe(res);
  } catch (err) {
    next(err);
  }
};
