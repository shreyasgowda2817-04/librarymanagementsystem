import mongoose from "mongoose";
import User from "./src/models/user.js";
import dotenv from "dotenv";
dotenv.config();

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne({ role: "admin" });
  console.log(user ? user.email : "No admin found");
  process.exit(0);
}
test();
