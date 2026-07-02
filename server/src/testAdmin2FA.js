import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import mongoose from 'mongoose';
import User from './models/user.js';

async function run() {
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/libraryDB";
  await mongoose.connect(mongoUri);

  const admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    console.error("No admin found in DB");
    process.exit(1);
  }

  console.log(`Testing verify-2fa for admin: ${admin.email}`);

  try {
    const res = await fetch("http://localhost:5001/api/auth/verify-2fa", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: admin.email,
        otp: "123456" // mock OTP (should return 401/400 invalid code, NOT 503 maintenance block!)
      })
    });
    const status = res.status;
    const body = await res.json().catch(() => ({}));
    console.log(`Response Status: ${status}`);
    console.log(`Response Body:`, body);
  } catch (err) {
    console.error("Request failed:", err);
  }

  process.exit(0);
}

run();
