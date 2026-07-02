import mongoose from 'mongoose';
import User from './src/models/user.js';
import Member from './src/models/member.js';
import Transaction from './src/models/transaction.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/libraryDB');
  
  const adminUser = await User.findOne({ role: 'admin' });
  if (adminUser) {
     const adminMember = await Member.findOne({ email: adminUser.email });
     if (adminMember) {
         const txs = await Transaction.find({ memberId: adminMember._id });
         console.log(`Admin ${adminUser.email} has ${txs.length} transactions.`);
     } else {
         console.log(`Admin ${adminUser.email} has NO member profile, so 0 transactions.`);
     }
  }
  
  const studentUser = await User.findOne({ role: { $ne: 'admin' } });
  if (studentUser) {
     const studentMember = await Member.findOne({ email: studentUser.email });
     if (studentMember) {
         const txs = await Transaction.find({ memberId: studentMember._id });
         console.log(`Student ${studentUser.email} has ${txs.length} transactions.`);
     }
  }
  
  process.exit(0);
}
run();
