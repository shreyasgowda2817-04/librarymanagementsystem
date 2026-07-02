import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import User from './models/user.js';
import mongoose from 'mongoose';

async function run() {
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/libraryDB";
  await mongoose.connect(mongoUri);

  const admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    console.error("No admin found in DB");
    process.exit(1);
  }

  // Generate token using the actual secret
  const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET || "default_secret", {
    expiresIn: "1h"
  });

  console.log(`Generated Admin Token: ${token}`);
  console.log(`Admin email: ${admin.email}`);

  // Hit the local API /api/books with this token using fetch
  try {
    const res = await fetch("http://localhost:5001/api/books", {
      headers: {
        Authorization: `Bearer ${token}`
      }
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
