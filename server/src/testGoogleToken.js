import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import mongoose from 'mongoose';
import User from './models/user.js';
import generateToken from './utils/generateToken.js';

async function run() {
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/libraryDB";
  await mongoose.connect(mongoUri);

  const user = await User.findOne({ email: 'shreyasgowda2817@gmail.com' });
  if (!user) {
    console.error("User not found");
    process.exit(1);
  }

  const sessionId = 'test-session-id';
  // Create a test session
  user.sessions.push({
    sessionId,
    ip: '127.0.0.1',
    userAgent: 'test-agent',
    location: 'Bengaluru, IN',
    lastActive: new Date()
  });
  await user.save();

  const token = generateToken(user._id, sessionId);
  console.log("Generated Token:", token);

  // Decode and verify
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret");
    console.log("Decoded:", decoded);

    const foundUser = await User.findById(decoded.id).select("-password");
    console.log("Found User ID:", foundUser?._id);

    const session = foundUser.sessions.find(s => s.sessionId === decoded.sessionId);
    console.log("Found Session:", session);

    if (session) {
      const timeSinceActive = (Date.now() - new Date(session.lastActive).getTime()) / (1000 * 60);
      console.log("Time Since Active (minutes):", timeSinceActive);
    }
  } catch (err) {
    console.error("Verification failed:", err);
  }

  // Clean up
  user.sessions = user.sessions.filter(s => s.sessionId !== sessionId);
  await user.save();

  process.exit(0);
}

run();
