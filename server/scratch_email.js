import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import sendEmail from './src/services/emailService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

async function testEmail() {
  console.log("Testing email...");
  console.log("EMAIL_USER:", process.env.EMAIL_USER);
  console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "****" : "missing");
  
  const result = await sendEmail('shreyasgowda2817@gmail.com', 'Test Subject', '<h1>Test HTML</h1>');
  console.log("Result:", result);
  process.exit(0);
}

testEmail();
