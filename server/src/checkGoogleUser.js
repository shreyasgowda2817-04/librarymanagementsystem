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

  // Find the last modified user with a googleId
  const GlobalSettings = (await import('./models/globalSettings.js')).default;
  const globalSettings = await GlobalSettings.getInstance();
  console.log("GlobalSettings security configuration:", globalSettings.security);

  const user = await User.findOne({ googleId: { $exists: true, $ne: null } }).sort({ updatedAt: -1 });
  if (user) {
    console.log(`Last modified user: ${user.email}`);
    console.log(`Role: ${user.role}`);
    console.log(`GoogleID: ${user.googleId || "None"}`);
    console.log(`Sessions count: ${user.sessions?.length}`);
    console.log(`Sessions details:`, user.sessions);
  } else {
    console.log("No users found");
  }

  process.exit(0);
}

run();
