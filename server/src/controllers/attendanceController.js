import Member from "../models/member.js";
import Attendance from "../models/Attendance.js";

// Handle Kiosk Scan
export const scanAttendance = async (req, res) => {
  const { memberId } = req.body;
  
  if (!memberId || !memberId.trim()) {
      return res.status(400).json({ message: "No ID provided" });
  }
  
  try {
    let member;
    
    // Check if it's a valid MongoDB ObjectId
    if (memberId.length === 24) { 
       member = await Member.findById(memberId);
    }
    
    // Fallback: Check phone number or case-insensitive exact name match (for demo purposes)
    if (!member) {
       member = await Member.findOne({ rollNo: memberId });
    }
    
    if (!member) {
       member = await Member.findOne({ phone: memberId });
    }
    
    if (!member) {
        member = await Member.findOne({ name: { $regex: new RegExp(`^${memberId}$`, 'i') } });
    }

    if (!member) {
      return res.status(404).json({ message: "Access Denied: Invalid ID" });
    }

    // Determine if checking in or out
    const lastRecord = await Attendance.findOne({ member: member._id }).sort({ timestamp: -1 });
    let action = "Checked In";
    if (lastRecord && lastRecord.action === "Checked In") {
      action = "Checked Out";
    }

    // Create record
    await Attendance.create({
      member: member._id,
      action
    });

    res.json({
      member: {
        name: member.name,
        action: action
      },
      message: `${member.name} ${action} successfully`
    });

  } catch (err) {
    console.error("Attendance scan error:", err);
    res.status(500).json({ message: "Server Error: Failed to process scan" });
  }
};
