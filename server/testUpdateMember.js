import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/library");

// Load the actual model file
import Member from './src/models/member.js';

async function run() {
  try {
    const member = await Member.findOne({});
    console.log("Before update:", member);
    
    // Simulate updating from req.body
    const reqBody = { name: member.name, email: member.email, rollNo: "TEST-UPDATE-999", department: "Testing" };
    
    const updated = await Member.findByIdAndUpdate(member._id, reqBody, { new: true });
    
    console.log("After update:", updated);
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}
run();
