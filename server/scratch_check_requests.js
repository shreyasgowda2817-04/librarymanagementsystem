import mongoose from "mongoose";
import BookRequest from "./src/models/BookRequest.js";

async function checkRequests() {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/libraryDB");
    console.log("Connected to MongoDB");
    
    const requests = await BookRequest.find().populate("userId", "name email");
    console.log(`Found ${requests.length} book requests:`);
    console.log(JSON.stringify(requests, null, 2));
    
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

checkRequests();
