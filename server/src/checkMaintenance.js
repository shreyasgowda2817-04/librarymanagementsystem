import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import GlobalSettings from './models/globalSettings.js';
import Settings from './models/settings.js';
import User from './models/user.js';

async function run() {
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/libraryDB";
  await mongoose.connect(mongoUri);

  const globalSettings = await GlobalSettings.getInstance();
  const settings = await Settings.getSettings();

  console.log("GlobalSettings maintenanceMode:", globalSettings.platform.maintenanceMode);
  console.log("Settings maintenanceMode:", settings.maintenanceMode);

  const admins = await User.find({ role: 'admin' });
  console.log("Admins in DB:");
  admins.forEach(admin => {
    console.log(`- Email: ${admin.email}, role: ${admin.role}`);
  });

  process.exit(0);
}

run();
