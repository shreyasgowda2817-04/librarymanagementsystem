import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import mongoose from 'mongoose';
import User from './models/user.js';
import { googleCallback } from './controllers/authController.js';

async function run() {
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/libraryDB";
  await mongoose.connect(mongoUri);

  const admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    console.error("Admin not found");
    process.exit(1);
  }

  // Clear previous sessions to start fresh
  admin.sessions = [];
  await admin.save();

  // Create a mock req and res
  const req = {
    user: admin,
    ip: '127.0.0.1',
    headers: {
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36'
    }
  };

  const res = {
    cookie: (name, value, options) => {
      console.log(`[Cookie Set] ${name} = ${value.substring(0, 15)}...`);
    },
    redirect: (url) => {
      console.log(`[Redirected to] ${url}`);
    }
  };

  console.log("Calling googleCallback...");
  await googleCallback(req, res);

  // Reload user to verify sessions
  const updatedAdmin = await User.findById(admin._id);
  console.log("Updated Admin sessions:", updatedAdmin.sessions);

  process.exit(0);
}

run();
