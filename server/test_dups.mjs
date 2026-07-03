import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const users = await mongoose.connection.db.collection("users").find({ email: /shreyas/i }).toArray();
  for (const u of users) {
    console.log(`Email: '${u.email}', ID: ${u._id}`);
  }
  process.exit(0);
}
check();
