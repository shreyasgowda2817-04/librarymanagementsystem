import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: "Member", required: true },
    amount: { type: Number, required: true },
    reason: { type: String, required: true }, // e.g., "Late Fine", "Lost Book Fee"
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" }, // Optional reference
    date: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

paymentSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export default mongoose.model("Payment", paymentSchema);
