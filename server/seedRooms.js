import mongoose from 'mongoose';

const uri = "mongodb+srv://shreyasgowda2817_db_user:MaRMjqdyRsRfL7Hx@cluster0.5n1mlyl.mongodb.net/libraryDB?appName=Cluster0";

// Minimal Room Schema for Seeding
const roomSchema = new mongoose.Schema({
  name: String,
  capacity: Number,
  amenities: [String],
  imageUrl: String,
  status: { type: String, default: "Available" }
});

const Room = mongoose.models.Room || mongoose.model("Room", roomSchema);

async function seedRooms() {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log("Connected to MongoDB.");

    const count = await Room.countDocuments();
    if (count > 0) {
      console.log("Rooms already exist in DB. Deleting them...");
      await Room.deleteMany({});
    }

    const dummyRooms = [
      {
        name: "Collaborative Pod A",
        capacity: 4,
        amenities: ["Whiteboard", "Power Outlets", "WiFi"],
        imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
        status: "Available"
      },
      {
        name: "Silent Study Room 1",
        capacity: 1,
        amenities: ["Desk", "Lamp", "Soundproof"],
        imageUrl: "https://images.unsplash.com/photo-1596443686812-2f45229eebc3?auto=format&fit=crop&w=800&q=80",
        status: "Available"
      },
      {
        name: "Conference Room B",
        capacity: 10,
        amenities: ["Projector", "Whiteboard", "Video Conference", "WiFi"],
        imageUrl: "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&q=80",
        status: "Available"
      }
    ];

    await Room.insertMany(dummyRooms);
    console.log(`Successfully seeded ${dummyRooms.length} rooms!`);

    process.exit(0);
  } catch (error) {
    console.error("Failed:", error.message);
    process.exit(1);
  }
}

seedRooms();
