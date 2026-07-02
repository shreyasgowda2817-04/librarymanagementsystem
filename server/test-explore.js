import mongoose from 'mongoose';
import User from './src/models/member.js';
import { generateToken } from './src/utils/generateToken.js';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne({ role: 'admin' });
  const token = generateToken(user._id);
  
  const res = await fetch('http://localhost:5001/api/ai/explore', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: 'space' })
  });
  
  const text = await res.text();
  console.log("Status:", res.status);
  console.log("Response:", text);
  process.exit(0);
}
test();
