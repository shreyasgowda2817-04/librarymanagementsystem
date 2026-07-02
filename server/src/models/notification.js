import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, default: "info", enum: ["info", "success", "warning", "overdue"] },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

notificationSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
