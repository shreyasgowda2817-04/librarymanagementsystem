import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/libraryDB");
    
    const User = (await import('../src/models/user.js')).default;
    const Member = (await import('../src/models/member.js')).default;
    const Transaction = (await import('../src/models/transaction.js')).default;

    // 1. Get all students
    const students = await User.find({ role: 'student' });
    console.log(`Found ${students.length} students.`);
    if (students.length === 0) {
      console.log("No students found to test.");
      process.exit(0);
    }
    
    for (let u of students) {
      console.log(`\nTesting Student User: ${u.email}`);
      const member = await Member.findOne({ email: u.email });
      if (!member) {
        console.log("  -> No Member found for this student. (This explains why transactions are empty!)");
        continue;
      }
      
      console.log(`  -> Member Found: ${member._id}`);
      const txs = await Transaction.find({ memberId: member._id });
      console.log(`  -> Transactions Found: ${txs.length}`);
      
      if (txs.length === 0) {
        console.log("  -> Zero transactions linked to this member.");
      } else {
        txs.forEach(t => {
          console.log(`     Book: ${t.bookId} | Returned: ${t.returned} | Penalty: ${t.penalty} | Due: ${t.dueDate}`);
        });
      }
    }

    console.log("\n=== Checking all Transactions in DB to see who they belong to ===");
    const allTxs = await Transaction.find({}).populate('memberId');
    if (allTxs.length === 0) {
      console.log("NO TRANSACTIONS EXIST IN DB AT ALL.");
    } else {
      for (let t of allTxs) {
        console.log(`Tx: Book ${t.bookId} -> Member: ${t.memberId ? t.memberId.email : 'NULL'} (FinePaid: ${t.finePaid}, Penalty: ${t.penalty})`);
      }
    }

  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
