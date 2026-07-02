import dotenv from 'dotenv';
dotenv.config();

import { sendSMS } from './src/services/emailService.js';

async function run() {
  console.log("Testing SMS Dispatch...");
  
  // Send a test message to a dummy phone number
  await sendSMS("+1234567890", "Hello! This is a test SMS from your Library Project.");
  
  console.log("Test complete!");
  process.exit(0);
}

run();
