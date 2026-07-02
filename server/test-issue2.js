import mongoose from 'mongoose';
import { issueBook } from './src/controllers/transactionController.js';
import Book from './src/models/book.js';
import Member from './src/models/member.js';
import User from './src/models/user.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/library');
    console.log("Connected");
    
    // Create dummy data
    const book = await Book.create({ title: "Test Book 2", author: "Test Author", stock: 5 });
    
    // Test case 2: member with email and user
    const member = await Member.create({ name: "Email Member", email: "test@example.com" });
    const user = await User.create({ name: "Email Member", email: "test@example.com", password: "password", role: "student", membership: "Basic" });
    
    const req = {
      body: {
        bookId: book._id.toString(),
        memberId: member._id.toString(),
        issueDate: "2023-10-01",
        dueDate: "2023-10-15"
      }
    };
    const res = {
      status: (code) => {
        console.log("RES STATUS:", code);
        return { json: (data) => console.log("RES JSON:", data) };
      },
      json: (data) => console.log("RES JSON:", data)
    };
    const next = (err) => {
      console.error("NEXT ERR:", err);
    };
    
    console.log("Calling issueBook...");
    await issueBook(req, res, next);
    console.log("Done");
  } catch (err) {
    console.error("TRY CATCH ERR:", err);
  } finally {
    process.exit(0);
  }
}
run();
