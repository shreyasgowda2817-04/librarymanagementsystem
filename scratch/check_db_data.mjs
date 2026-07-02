import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../server/.env') });

import Transaction from '../server/src/models/transaction.js';
import Member from '../server/src/models/member.js';

async function checkData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const memberCount = await Member.countDocuments();
        const transactionCount = await Transaction.countDocuments();

        console.log(`Members: ${memberCount}`);
        console.log(`Transactions: ${transactionCount}`);

        if (memberCount > 0) {
            const sampleMembers = await Member.find().limit(2);
            console.log("Sample Members:", JSON.stringify(sampleMembers, null, 2));
        }

        if (transactionCount > 0) {
            const sampleTxs = await Transaction.find().limit(2);
            console.log("Sample Transactions:", JSON.stringify(sampleTxs, null, 2));
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
    }
}

checkData();
