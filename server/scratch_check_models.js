import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("No API key found in .env");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  try {
    // Note: The SDK might not have a direct listModels method on genAI, 
    // but we can try to find the available models by checking the error 
    // or using the fetch API directly if needed.
    // However, usually we can just try a few variations.
    
    console.log("Checking for gemini-1.5-flash...");
    const m1 = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    console.log("Model object created for 1.5-flash");
    
    // Let's try to hit the API with a simple request
    const res = await m1.generateContent("test");
    console.log("Success with gemini-1.5-flash");
  } catch (err) {
    console.error("Error with gemini-1.5-flash:", err.message);
  }
}

listModels();
