import mongoose from 'mongoose';

const uri = "mongodb+srv://shreyasgowda2817_db_user:MaRMjqdyRsRfL7Hx@cluster0.5n1mlyl.mongodb.net/libraryDB?appName=Cluster0";

async function verifyUsers() {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    const db = mongoose.connection.useDb('libraryDB');
    const usersCollection = db.collection('users');
    
    const result = await usersCollection.updateMany(
      {}, 
      { $set: { role: "admin", isVerified: true, emailVerified: true } }
    );
    console.log(`Successfully verified and upgraded ${result.modifiedCount} user(s) to Admin!`);
    
    process.exit(0);
  } catch (error) {
    console.error("Failed:", error.message);
    process.exit(1);
  }
}

verifyUsers();
