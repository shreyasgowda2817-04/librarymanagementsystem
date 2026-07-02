import mongoose from "mongoose";
import Book from "./models/book.js";
import Member from "./models/member.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/libraryDB";

const books = [
  { title: "The Great Gatsby", author: "F. Scott Fitzgerald", status: "Available" },
  { title: "To Kill a Mockingbird", author: "Harper Lee", status: "Available" },
  { title: "1984", author: "George Orwell", status: "Issued" },
  { title: "Pride and Prejudice", author: "Jane Austen", status: "Available" },
  { title: "The Catcher in the Rye", author: "J.D. Salinger", status: "Available" },
  { title: "The Alchemist", author: "Paulo Coelho", status: "Available" },
  { title: "Sapiens: A Brief History of Humankind", author: "Yuval Noah Harari", status: "Available" }
];

const members = [
  { name: "Shreyas Gowda", email: "shreyas@example.com", phone: "123-456-7890" },
  { name: "John Doe", email: "john@example.com", phone: "987-654-3210" },
  { name: "Jane Smith", email: "jane@example.com", phone: "555-123-4567" },
  { name: "Alice Johnson", email: "alice@example.com", phone: "444-987-6543" },
  { name: "Bob Brown", email: "bob@example.com", phone: "333-555-7777" }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB...");

    // Clear existing data
    await Book.deleteMany();
    await Member.deleteMany();
    console.log("Cleared existing books and members.");

    // Insert new data
    await Book.insertMany(books);
    await Member.insertMany(members);
    console.log("Successfully seeded database with books and members.");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();
