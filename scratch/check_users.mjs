import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../server/.env') });

import User from '../server/src/models/user.js';

async function checkUsers() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const users = await User.find({}, 'name email role');
        console.log("Users:", JSON.stringify(users, null, 2));

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
    }
}

checkUsers();
