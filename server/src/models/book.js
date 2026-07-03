// server/src/models/Book.js
import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    author: { type: String, required: true },
    status: {
      type: String,
      enum: ["Available", "Issued", "Lost"],
      default: "Available"
    },
    pdfUrl: { type: String },
    coverUrl: { type: String },
    category: { type: String, default: "Uncategorized" },
    stock: { type: Number, default: 1 }, // Legacy: use totalCopies/availableCopies instead
    totalCopies: { type: Number, default: 1 },
    availableCopies: { type: Number, default: 1 },
    isbn: { type: String, sparse: true, unique: true },
    shelfLocation: { type: String },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
    barcode: { type: String },
    replacementCost: { type: Number, default: 500 },
    isRare: { type: Boolean, default: false },
    reorderThreshold: { type: Number, default: 2 },
    reorderQuantity: { type: Number, default: 5 },
    defaultVendor: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" }
  },
  { timestamps: true }
);

bookSchema.index({ title: "text", author: "text" }); // Text index for faster search
bookSchema.index({ category: 1 });

// return id instead of _id
bookSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export default mongoose.model("Book", bookSchema);
