import mongoose from "mongoose";
import dotenv from "dotenv";
import Room from "./models/room.js";

dotenv.config({ path: "../.env" });

mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/libraryDB")
  .then(async () => {
    const rooms = await Room.find();
    console.log(rooms.map(r => `${r.name}: ${r.capacity} seats`));
    process.exit(0);
  });
