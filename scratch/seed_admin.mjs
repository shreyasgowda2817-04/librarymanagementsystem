import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../server/.env') });

import User from '../server/src/models/user.js';
import Book from '../server/src/models/book.js';
import Member from '../server/src/models/member.js';
import Transaction from '../server/src/models/transaction.js';

const ADMIN_EMAIL = 'admin@library.com';
const ADMIN_PASS = 'Admin@123';

async function seed() {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/libraryDB';
        console.log(`Connecting to ${mongoUri}...`);
        await mongoose.connect(mongoUri);
        console.log("Connected to MongoDB");

        // 1. Create Admin
        const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
        if (existingAdmin) {
            console.log("Admin user already exists. Updating password...");
            existingAdmin.password = ADMIN_PASS;
            existingAdmin.role = 'admin';
            existingAdmin.isVerified = true;
            await existingAdmin.save();
        } else {
            console.log("Creating new Admin user...");
            await User.create({
                name: 'System Admin',
                email: ADMIN_EMAIL,
                password: ADMIN_PASS,
                role: 'admin',
                isVerified: true,
                accountStatus: 'active'
            });
        }
        console.log(`✅ Admin Account: ${ADMIN_EMAIL} / ${ADMIN_PASS}`);

        // 2. Seed Members
        const members = await Member.find();
        let memberId;
        if (members.length === 0) {
            console.log("Seeding members...");
            const newMember = await Member.create({
                name: 'Test Member',
                email: 'test@example.com',
                phone: '1234567890'
            });
            memberId = newMember._id;
        } else {
            memberId = members[0]._id;
        }

        // 3. Seed Books
        const books = await Book.find();
        let bookId;
        if (books.length === 0) {
            console.log("Seeding books...");
            const newBook = await Book.create({
                title: 'Mastering JavaScript',
                author: 'Jane Doe',
                category: 'Programming',
                status: 'Available',
                stock: 5
            });
            bookId = newBook._id;
        } else {
            bookId = books[0]._id;
        }

        // 4. Seed Transactions
        const txCount = await Transaction.countDocuments();
        if (txCount === 0) {
            console.log("Seeding transactions...");
            await Transaction.create({
                bookId,
                memberId,
                issueDate: new Date().toISOString().split('T')[0],
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                returned: false,
                penalty: 0
            });
        }

        console.log("✅ Database seeded with Admin and sample data.");
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding Error:", error);
        process.exit(1);
    }
}

seed();
