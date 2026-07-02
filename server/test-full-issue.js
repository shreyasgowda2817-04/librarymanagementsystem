import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from './src/models/user.js';
import Book from './src/models/book.js';
import Member from './src/models/member.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/libraryDB');
  
  const user = await User.findOne({ role: "admin" }) || await User.findOne();
  if (!user) {
     console.log("No user found.");
     process.exit(1);
  }
  
  // Make user an admin for the test
  user.role = "admin";
  await user.save();
  
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "default_secret", { expiresIn: "1h" });
  
  const book = await Book.findOne();
  const member = await Member.findOne();
  
  if (!book || !member) {
     console.log("No book or member found.");
     process.exit(1);
  }
  
  const payload = {
    bookId: book._id.toString(),
    memberId: member._id.toString(),
    issueDate: "2023-10-01",
    dueDate: "2023-10-15"
  };
  
  console.log("Sending payload:", payload);
  
  const res = await fetch("http://localhost:5001/api/transactions/issue", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  
  const text = await res.text();
  console.log("STATUS:", res.status);
  console.log("RESPONSE:", text);
  process.exit(0);
}
run();
