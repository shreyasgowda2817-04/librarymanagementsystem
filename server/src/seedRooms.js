import mongoose from "mongoose";
import dotenv from "dotenv";
import Room from "./models/room.js";

dotenv.config();

mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/libraryDB")
  .then(async () => {
    console.log("Connected to MongoDB for seeding Rooms");

    const existingRooms = await Room.find();
    if (existingRooms.length > 0) {
      console.log("Rooms already exist, skipping seed.");
      process.exit(0);
    }

    const rooms = [
      {
        name: "Room 1",
        capacity: 10,
        amenities: ["Whiteboard", "High-Speed Wi-Fi"],
        imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop"
      },
      {
        name: "Room 2",
        capacity: 10,
        amenities: ["Whiteboard", "Projector", "Conference Phone"],
        imageUrl: "https://images.unsplash.com/photo-1572025442646-866d16c84a54?q=80&w=2070&auto=format&fit=crop"
      },
      {
        name: "Room 3",
        capacity: 10,
        amenities: ["Soundproof", "Dual Monitors"],
        imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop"
      },
      {
        name: "Room 4",
        capacity: 10,
        amenities: ["Smart Board", "Coffee Machine", "AC Avilable"],
        imageUrl: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=2070&auto=format&fit=crop"
      }
    ];

    await Room.insertMany(rooms);
    console.log("Successfully seeded 4 study rooms!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Failed to seed rooms", err);
    process.exit(1);
  });
