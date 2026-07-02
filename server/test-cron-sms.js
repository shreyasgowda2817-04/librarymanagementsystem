import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { scanOverdueBooks, scanDueTomorrowBooks } from './src/utils/cronJobs.js';
import Transaction from './src/models/transaction.js';
import Book from './src/models/book.js';
import Member from './src/models/member.js';
import User from './src/models/user.js';

dotenv.config();

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/libraryDB');
  console.log("Connected to database...");

  // 1. Setup Dummy Data
  console.log("Setting up dummy data...");
  const book = await Book.create({ title: "Automated Testing Handbook", author: "QA Pro", stock: 10 });
  const member = await Member.create({ name: "Jane Tester", phone: "+1234567890", email: "jane@example.com" });
  await User.create({ name: "Jane Tester", email: "jane@example.com", password: "pwd", phone: "+1234567890" });

  const today = new Date();
  
  // Create an Overdue Transaction (Due 3 days ago)
  const overdueDate = new Date();
  overdueDate.setDate(today.getDate() - 3);
  
  await Transaction.create({
    bookId: book._id,
    memberId: member._id,
    issueDate: "2023-01-01",
    dueDate: overdueDate.toISOString().slice(0, 10),
    returned: false
  });

  // Create a Due Tomorrow Transaction
  const tomorrowDate = new Date();
  tomorrowDate.setDate(today.getDate() + 1);

  await Transaction.create({
    bookId: book._id,
    memberId: member._id,
    issueDate: "2023-01-01",
    dueDate: tomorrowDate.toISOString().slice(0, 10),
    returned: false
  });

  // 2. Trigger the Automated Cron Job Logic
  console.log("\n--- TRIGGERING OVERDUE SCAN ---");
  await scanOverdueBooks();

  console.log("\n--- TRIGGERING DUE TOMORROW SCAN ---");
  await scanDueTomorrowBooks();

  console.log("\nTest complete! Cleaning up...");
  process.exit(0);
}

run();
