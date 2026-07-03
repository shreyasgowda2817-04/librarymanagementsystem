import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

async function fix() {
  await mongoose.connect(process.env.MONGO_URI);
  const User = (await import("./src/models/user.js")).default;
  const Member = (await import("./src/models/member.js")).default;
  
  // Find all users with uppercase letters in email
  const users = await User.find({});
  let deleted = 0;
  for (const u of users) {
    if (u.email !== u.email.toLowerCase() || u.email !== u.email.trim()) {
      const lowerEmail = u.email.trim().toLowerCase();
      // Check if lower version already exists
      const exists = await User.findOne({ email: lowerEmail });
      if (exists) {
        console.log(`Deleting duplicate uppercase user: ${u.email}`);
        await User.deleteOne({ _id: u._id });
        await Member.deleteOne({ email: u.email });
        deleted++;
      } else {
        console.log(`Lowercasing user: ${u.email}`);
        u.email = lowerEmail;
        await u.save();
        
        const m = await Member.findOne({ email: u.email });
        if (m) {
          m.email = lowerEmail;
          await m.save();
        }
      }
    }
  }
  
  console.log(`Deleted ${deleted} duplicate accounts.`);
  process.exit(0);
}
fix();
