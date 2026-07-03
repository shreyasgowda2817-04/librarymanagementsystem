import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema(
  {
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: "Member", required: true },
    status: {
      type: String,
      enum: ["Pending", "Fulfilled", "Expired", "Cancelled"],
      default: "Pending"
    },
    queuePosition: { type: Number, default: 0 },
    notifiedAt: { type: Date },
    expireAt: { type: Date } // Date when reservation expires if not picked up
  },
  { timestamps: true }
);

export default mongoose.model("Reservation", reservationSchema);
