import mongoose from "mongoose";
import User from "./src/models/user.js";

mongoose.connect("mongodb://127.0.0.1:27017/libraryDB")
  .then(async () => {
    console.log("Connected to DB");
    const exists = await User.findOne({ email: "admin@library.com" });
    if (!exists) {
      await User.create({
        name: "Admin User",
        email: "admin@library.com",
        password: "admin",
        role: "admin"
      });
      console.log("Admin seeded successfully.");
    } else {
      console.log("Admin already exists.");
    }
    process.exit();
  })
  .catch(err => {
    console.log(err);
    process.exit(1);
  });
