import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  const User = (await import("./src/models/user.js")).default;
  
  // Create user
  let user = await User.create({
    name: "Reset Test",
    email: `reset_test_${Date.now()}@example.com`,
    password: "oldpassword",
    isVerified: true
  });
  
  // Simulate forgot password
  user.resetPasswordOTP = await bcrypt.hash("123456", 10);
  user.resetPasswordOTPExpire = Date.now() + 10000;
  await user.save(); // Does this double hash old password? No, isModified is false.
  
  // Simulate reset password
  const newPass = "newpassword123";
  user = await User.findById(user._id);
  user.password = newPass;
  user.resetPasswordOTP = undefined;
  user.resetPasswordOTPExpire = undefined;
  await user.save(); // This hashes the new password
  
  // Test login
  const loginUser = await User.findById(user._id);
  console.log("Password hash:", loginUser.password);
  console.log("Matches old?", await bcrypt.compare("oldpassword", loginUser.password));
  console.log("Matches new?", await bcrypt.compare("newpassword123", loginUser.password));
  
  process.exit(0);
}
test();
