// server/src/models/Invoice.js
import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    purchaseOrder: { type: mongoose.Schema.Types.ObjectId, ref: "PurchaseOrder", required: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true },
    vendorName: { type: String }, // denormalized
    totalAmount: { type: Number, required: true, default: 0 },
    taxAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["pending", "matched", "paid"],
      default: "pending"
    },
    dueDate: { type: Date },
    paidAt: { type: Date },
    matchedAt: { type: Date },
    notes: { type: String, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

invoiceSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export default mongoose.model("Invoice", invoiceSchema);
