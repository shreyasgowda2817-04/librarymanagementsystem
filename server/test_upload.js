import fs from "fs";
import mongoose from "mongoose";
import User from "./src/models/user.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne({ email: "SHREYASGOWDA2817@GMAIL.COM" });
  
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "default_secret", { expiresIn: "30d" });

  const form = new FormData();
  form.append("title", "GridFS Book");
  form.append("author", "Test Author");
  form.append("category", "Test Category");
  form.append("stock", "5");
  
  const pdfBlob = new Blob([fs.readFileSync("dummy.pdf")], { type: 'application/pdf' });
  const pngBlob = new Blob([fs.readFileSync("dummy.png")], { type: 'image/png' });
  
  form.append("pdf", pdfBlob, "dummy.pdf");
  form.append("cover", pngBlob, "dummy.png");
  
  const res = await fetch("http://localhost:5001/api/books", {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}` },
    body: form
  });
  
  console.log(res.status);
  const data = await res.json();
  console.log(data);
  process.exit(0);
}

test();
