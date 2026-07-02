// server/src/models/Transaction.js
import mongoose from "mongoose";

const txSchema = new mongoose.Schema(
  {
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: "Member", required: true },

    issueDate: { type: String, required: true }, // YYYY-MM-DD
    dueDate: { type: String, required: true },

    returned: { type: Boolean, default: false },
    returnedOn: { type: String, default: null },

    penalty: { type: Number, default: 0 },
    finePaid: { type: Boolean, default: false },
    isLost: { type: Boolean, default: false }
  },
  { timestamps: true }
);

txSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export default mongoose.model("Transaction", txSchema);
