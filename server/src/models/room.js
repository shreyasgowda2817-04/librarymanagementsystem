import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    capacity: { type: Number, required: true },
    pricePerSlot: { type: Number, default: 50 },
    amenities: [{ type: String }],
    imageUrl: { type: String, default: "" },
    status: { type: String, enum: ["Available", "Maintenance"], default: "Available" }
  },
  { timestamps: true }
);

roomSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export default mongoose.model("Room", roomSchema);
