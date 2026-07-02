// server/src/models/Budget.js
import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema(
  {
    year: { type: Number, required: true, unique: true },
    totalBudget: { type: Number, default: 120000 },
    encumbered: { type: Number, default: 0 },
    expended: { type: Number, default: 0 },
    allocations: [
      {
        category: { type: String, required: true },
        amount: { type: Number, default: 0 }, // Total allocation for this category
        encumbered: { type: Number, default: 0 },
        expended: { type: Number, default: 0 },
        color: { type: String, default: "#4f46e5" }
      }
    ],
    notes: { type: String, default: "" }
  },
  { timestamps: true }
);

budgetSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export default mongoose.model("Budget", budgetSchema);
