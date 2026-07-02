// server/src/models/PurchaseOrder.js
import mongoose from "mongoose";

const purchaseOrderSchema = new mongoose.Schema(
  {
    orderId: { type: String, unique: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true },
    vendorName: { type: String }, // denormalized for speed
    items: [
      {
        title: { type: String, required: true },
        quantity: { type: Number, default: 1 },
        receivedQuantity: { type: Number, default: 0 },
        unitPrice: { type: Number, default: 0 },
        category: { type: String, default: "General" }
      }
    ],
    totalAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["draft", "pending_approval", "approved", "processing", "shipped", "partially_received", "delivered", "invoiced", "closed", "cancelled"],
      default: "pending_approval"
    },
    notes: { type: String, default: "" },
    expectedDelivery: { type: Date },
    deliveredAt: { type: Date },
    approvedAt: { type: Date },
    approvals: [
      {
        approver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        status: { type: String, enum: ["approved", "rejected"] },
        date: { type: Date, default: Date.now }
      }
    ],
    receivingHistory: [
      {
        date: { type: Date, default: Date.now },
        receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        items: [
          {
            title: { type: String },
            quantity: { type: Number }
          }
        ]
      }
    ],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

// Auto-generate orderId before save
purchaseOrderSchema.pre("save", async function (next) {
  if (!this.orderId) {
    const count = await mongoose.model("PurchaseOrder").countDocuments();
    const year = new Date().getFullYear();
    this.orderId = `PO-${year}-${String(count + 1).padStart(3, "0")}`;
  }
  // Auto-compute totalAmount
  this.totalAmount = this.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  next();
});

purchaseOrderSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export default mongoose.model("PurchaseOrder", purchaseOrderSchema);
