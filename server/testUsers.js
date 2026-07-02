import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/library");

const User = mongoose.model('User', new mongoose.Schema({ email: String, role: String, name: String }));
const Member = mongoose.model('Member', new mongoose.Schema({ email: String, rollNo: String, name: String }));

async function run() {
  const users = await User.find({ role: 'student' });
  for (const u of users) {
    const m = await Member.findOne({ email: u.email });
    console.log(`User: ${u.email} | Member Found: ${!!m} | RollNo: ${m?.rollNo}`);
  }
  process.exit(0);
}
run();
