import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../server/.env") });

async function listModels() {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.error("No API key found in .env");
      return;
    }
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // There isn't a direct listModels in the simple SDK, so we'll try the most common stable ones
    const testModels = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro", "gemini-1.0-pro"];
    
    console.log("--- Testing Model Availability ---");
    for (const m of testModels) {
      try {
        const model = genAI.getGenerativeModel({ model: m });
        const result = await model.generateContent("test");
        console.log(`✅ ${m}: AVAILABLE`);
      } catch (err) {
        console.log(`❌ ${m}: FAILED (${err.message.split('\n')[0]})`);
      }
    }
  } catch (err) {
    console.error("Discovery failed:", err);
  }
}

listModels();
