import mongoose from "mongoose";

const bookRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  author: { type: String, required: true },
  category: { type: String },
  reason: { type: String },
  status: { type: String, default: "Pending", enum: ["Pending", "Approved", "Denied"] },
}, { timestamps: true });

bookRequestSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const BookRequest = mongoose.model("BookRequest", bookRequestSchema);
export default BookRequest;
