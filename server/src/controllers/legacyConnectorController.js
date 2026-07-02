import Book from "../models/book.js";
import User from "../models/user.js";
import Notification from "../models/notification.js";

/**
 * 🛰️ Legacy Connector Controller
 * Logic for bridging modern LMS PRO with physical institutional hardware and legacy ILS systems.
 */

// 1. Synchronize Physical Asset from Legacy System (e.g., Alma, SirsiDynix)
export const syncLegacyAsset = async (req, res) => {
  try {
    const { legacyId, title, author, isbn, status, location, rfidTag } = req.body;

    // Normalizing Legacy Data into LMS PRO Neural Format
    let book = await Book.findOne({ $or: [{ isbn }, { legacyId }] });

    if (book) {
      book.status = status || book.status;
      book.physicalLocation = location;
      book.rfidTag = rfidTag;
      book.isPhysical = true;
      await book.save();
    } else {
      book = await Book.create({
        legacyId,
        title,
        author,
        isbn,
        status: status || "Available",
        physicalLocation: location,
        rfidTag,
        isPhysical: true,
        category: "Institutional Collection",
        description: "Imported via Legacy Connector Protocol."
      });
    }

    res.status(200).json({ 
      message: "Neural Index Synchronized", 
      nodeId: book._id,
      protocol: "IIL-ALPHA-SYNC"
    });
  } catch (error) {
    console.error("Legacy Sync Error:", error);
    res.status(500).json({ error: "Failed to sync legacy asset." });
  }
};

// 2. Handle Real-time Hardware Events (RFID Kiosks, Smart Shelving)
export const handleHardwareEvent = async (req, res) => {
  try {
    const { eventType, rfidTag, deviceId, timestamp } = req.body;

    // Find asset by RFID
    const book = await Book.findOne({ rfidTag });
    if (!book) {
      return res.status(404).json({ error: "Unidentified Object Detected" });
    }

    console.log(`📡 Hardware Event [${eventType}] on Node ${book._id} via Device ${deviceId}`);

    // Update state based on hardware event
    if (eventType === "CHECK_OUT") book.status = "Issued";
    if (eventType === "CHECK_IN") book.status = "Available";
    if (eventType === "MISPLACED") {
        book.status = "Misplaced";
        // Notify the Admin currently operating the console
        if (req.user && req.user._id) {
          await Notification.create({
              userId: req.user._id,
              title: "Physical Discrepancy Detected",
              message: `Asset "${book.title}" detected on incorrect shelf/node. Logic corrective action required.`,
              type: "warning"
          });
        }
    }

    await book.save();

    res.status(200).json({ 
      status: "Telemetry Acknowledged", 
      impact: "Node State Updated" 
    });
  } catch (error) {
    res.status(500).json({ error: "Telemetry ingestion failed." });
  }
};

// 3. Occupancy Telemetry (Smart Room Bookings)
export const logOccupancyData = async (req, res) => {
  try {
    const { roomId, currentOccupancy, maxCapacity } = req.body;
    
    // In a real scenario, this would update a 'Rooms' model
    console.log(`📊 Occupancy Update [Room: ${roomId}]: ${currentOccupancy}/${maxCapacity}`);
    
    res.status(200).json({ status: "Occupancy Telemetry Logged" });
  } catch (error) {
    res.status(500).json({ error: "Occupancy logging failed." });
  }
};

// 4. Verify Identity against Legacy Database (Side-car Handshake)
export const verifyLegacyMember = async (req, res) => {
  try {
    const { libraryCardId } = req.body;
    
    // Simulated handshake with external SIP2/NCIP service
    const isLegacyValid = true; // Mock verification
    
    if (isLegacyValid) {
        res.status(200).json({ 
            valid: true, 
            clearance: "Verified",
            protocol: "NCIP-PROXY-HANDSHAKE" 
        });
    } else {
        res.status(403).json({ valid: false, error: "Legacy verification failed." });
    }
  } catch (error) {
    res.status(500).json({ error: "Legacy handshake error." });
  }
};
