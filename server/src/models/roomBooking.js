import mongoose from "mongoose";

const roomBookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    timeSlot: { type: String, required: true }, // e.g., "10:00 AM - 12:00 PM"
    status: { type: String, enum: ["Active", "Completed", "Cancelled"], default: "Active" }
  },
  { timestamps: true }
);

// Users are allowed to book multiple seats for the same time slot, so no unique index is used.

roomBookingSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export default mongoose.model("RoomBooking", roomBookingSchema);
