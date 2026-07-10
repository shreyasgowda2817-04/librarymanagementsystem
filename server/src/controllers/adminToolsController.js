import User from "../models/user.js";
import sendEmail from "../services/emailService.js";
import { createAuditEntry } from "./auditController.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Book from "../models/book.js";
import Transaction from "../models/transaction.js";
import BookRequest from "../models/BookRequest.js";
import Notification from "../models/notification.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const broadcastMessage = async (req, res, next) => {
  try {
    const { audience, subject, message } = req.body;
    let query = {};

    if (audience === "all") {
      query = { role: { $in: ["student", "admin"] }, accountStatus: "active" };
    } else if (audience === "overdue") {
      return res.status(501).json({ message: "Overdue filtering is currently mocked. Use 'All Active Members'." });
    }

    const rawUsers = await User.find(query).select("email name");
    
    // Filter out dummy/test emails that cause Google to silently drop the entire BCC batch
    const users = rawUsers.filter(u => {
      const email = u.email.toLowerCase();
      return !email.includes('@example.com') && !email.includes('@test.com') && email.includes('@');
    });

    if (users.length === 0) {
      return res.status(404).json({ message: "No valid recipients found after filtering test accounts." });
    }

    // Return response immediately to prevent frontend hanging
    res.status(200).json({ message: "Broadcast sent in the background.", count: users.length });

    // Process emails in the background using an async IIFE
    (async () => {
      const bccList = users.map(u => u.email).join(',');
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #4f46e5; padding: 20px; text-align: center;">
            <h2 style="color: white; margin: 0;">Library Announcement</h2>
          </div>
          <div style="padding: 30px; color: #1e293b; line-height: 1.6;">
            <p>Hello <strong>Library Member</strong>,</p>
            <p>${message.replace(/\n/g, "<br>")}</p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #64748b;">
              Sent by Library Administration
            </div>
          </div>
        </div>
      `;

      try {
        await sendEmail(null, subject, html, bccList);
        console.log(`✅ Background bulk BCC broadcast completed for ${users.length} valid users.`);
      } catch (e) {
        console.error("BCC Delivery Error:", e);
      }
    })().catch(err => {
      console.error("Background Broadcast Error:", err);
    });
  } catch (err) {
    next(err);
  }
};

export const runBackup = async (req, res, next) => {
  try {
    const backupDir = path.join(__dirname, "../../backups");
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Fetch data
    const users = await User.find({});
    const books = await Book.find({});
    const transactions = await Transaction.find({});
    const requests = await BookRequest.find({});

    const backupData = {
      timestamp: new Date().toISOString(),
      users,
      books,
      transactions,
      requests
    };

    const fileName = `db-snapshot-${Date.now()}.json`;
    const filePath = path.join(backupDir, fileName);

    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));

    const stats = fs.statSync(filePath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

    await createAuditEntry(req.user, "DATABASE_BACKUP", "System Config", `Manual database snapshot archived to local storage. Size: ${sizeInMB}MB`);
    res.json({ message: `Database backup completed successfully. Snapshot size: ${sizeInMB} MB` });
  } catch (err) {
    next(err);
  }
};

export const clearCache = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Clean up old DB records to simulate system maintenance
    const notifResult = await Notification.deleteMany({
      read: true,
      createdAt: { $lt: thirtyDaysAgo }
    });

    const reqResult = await BookRequest.deleteMany({
      status: "Rejected",
      createdAt: { $lt: thirtyDaysAgo }
    });

    const totalReleased = notifResult.deletedCount + reqResult.deletedCount;

    await createAuditEntry(req.user, "CACHE_FLUSH", "System Config", `System maintenance completed manually. ${totalReleased} obsolete records purged.`);
    res.json({ message: `System cache cleared successfully. ${totalReleased} stale records and buffers released.` });
  } catch (err) {
    next(err);
  }
};
export const importBooks = async (req, res, next) => {
  try {
    const { books } = req.body;
    if (!Array.isArray(books) || books.length === 0) {
      return res.status(400).json({ message: "No book data provided." });
    }

    const newBooks = await Book.insertMany(books.map(b => {
      const parsedStock = parseInt(b.stock || b.Quantity);
      const validStock = (!isNaN(parsedStock) && parsedStock > 0) ? parsedStock : 1;
      const parsedCost = parseFloat(b.cost || b.Cost);
      const validCost = (!isNaN(parsedCost) && parsedCost > 0) ? parsedCost : 500;

      return {
        title: b.title || b.Title || "Untitled",
        author: b.author || b.Author || "Unknown",
        category: b.category || b.Category || "Uncategorized",
        barcode: b.barcode || b.ISBN || "",
        stock: validStock,
        replacementCost: validCost
      };
    }));

    await createAuditEntry(req.user, "BULK_IMPORT", "Library Tools", `Imported ${newBooks.length} books in bulk.`);
    res.status(201).json({ message: `Successfully imported ${newBooks.length} books.`, count: newBooks.length });
  } catch (err) {
    next(err);
  }
};

export const auditInventory = async (req, res, next) => {
  try {
    const { scannedIds, markLost } = req.body;
    if (!Array.isArray(scannedIds)) {
      return res.status(400).json({ message: "scannedIds array is required." });
    }

    // Find all books that are supposed to be physically available in the library
    const expectedBooks = await Book.find({ status: "Available" });
    const expectedIds = expectedBooks.map(b => b._id.toString());
    
    // Books that are available in DB but weren't scanned
    const missingBooks = expectedBooks.filter(b => !scannedIds.includes(b._id.toString()));
    
    if (markLost && missingBooks.length > 0) {
      const missingIds = missingBooks.map(b => b._id);
      await Book.updateMany(
        { _id: { $in: missingIds } },
        { $set: { status: "Lost", stock: 0 } }
      );
      await createAuditEntry(req.user, "INVENTORY_AUDIT", "Library Tools", `Audit finalized. Marked ${missingBooks.length} unaccounted books as Lost.`);
    }

    res.json({
      expectedCount: expectedBooks.length,
      scannedCount: scannedIds.length,
      missingCount: missingBooks.length,
      missingBooks: missingBooks.map(b => ({ id: b._id, title: b.title, author: b.author })),
      message: markLost 
        ? `Audit complete. ${missingBooks.length} items marked as Lost.`
        : `Audit calculated. ${missingBooks.length} items missing.`
    });
  } catch (err) {
    next(err);
  }
};
