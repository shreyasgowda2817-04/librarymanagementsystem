import mongoose from "mongoose";
import dotenv from "dotenv";
import Room from "./models/room.js";

dotenv.config({ path: "../.env" });

mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/libraryDB")
  .then(async () => {
    console.log("Connected to MongoDB");

    await Room.updateMany({ name: "Room q" }, { $set: { pricePerSlot: 100 } });
    await Room.updateMany({ name: "Room 2" }, { $set: { pricePerSlot: 150 } });
    await Room.updateMany({ name: "Room 3" }, { $set: { pricePerSlot: 50 } });
    await Room.updateMany({ name: "Room" }, { $set: { pricePerSlot: 200 } });

    console.log("Successfully updated room prices!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Failed", err);
    process.exit(1);
  });
