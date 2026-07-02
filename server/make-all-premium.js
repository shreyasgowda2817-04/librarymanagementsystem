import mongoose from 'mongoose';
import User from './src/models/user.js';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/libraryDB');
  const result = await User.updateMany({}, { $set: { membership: "Premium" } });
  console.log(`Successfully upgraded ${result.modifiedCount} users to Premium!`);
  process.exit(0);
}

run();
