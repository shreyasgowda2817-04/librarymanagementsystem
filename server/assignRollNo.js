import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/library");

const Member = mongoose.model('Member', new mongoose.Schema({ email: String, rollNo: String, name: String }, { strict: false }));

async function run() {
  try {
    const members = await Member.find({});
    for (const m of members) {
      if (!m.rollNo) {
        m.rollNo = `STU-${Math.floor(1000 + Math.random() * 9000)}`;
        await m.save();
        console.log(`Assigned ${m.rollNo} to ${m.email}`);
      }
    }
    console.log("Done updating members.");
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}
run();
