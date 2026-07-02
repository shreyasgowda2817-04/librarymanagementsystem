import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../server/.env") });

async function testKey() {
  const key = process.env.GEMINI_API_KEY;
  console.log("Testing Key:", key ? (key.substring(0, 10) + "...") : "MISSING");
  
  if (!key) return;

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    const result = await model.generateContent("Hello, say 'Key Works' if you can read this.");
    console.log("Response:", result.response.text());
  } catch (err) {
    console.error("Error:", err.message);
  }
}

testKey();
