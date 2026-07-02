import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import User from './models/user.js';

async function run() {
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/libraryDB";
  await mongoose.connect(mongoUri);

  const users = await User.find({ email: /shreyasgowda2817/i });
  console.log("Users matching 'shreyasgowda2817':");
  users.forEach(u => {
    console.log({
      id: u._id,
      email: u.email,
      role: u.role,
      googleId: u.googleId,
      createdAt: u.createdAt
    });
  });

  process.exit(0);
}

run();
