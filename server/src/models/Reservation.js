import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema(
  {
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["Pending", "Fulfilled", "Cancelled"],
      default: "Pending"
    },
    priority: { type: Number, default: 0 }
  },
  { timestamps: true }
);

reservationSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export default mongoose.model("Reservation", reservationSchema);
