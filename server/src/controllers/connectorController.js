import Book from "../models/book.js";
import Transaction from "../models/transaction.js";
import Room from "../models/room.js";

export const syncAsset = async (req, res, next) => {
  try {
    const { legacyId, title, author, isbn, status, location, rfidTag } = req.body;
    
    await new Promise(resolve => setTimeout(resolve, 800));

    // Sync to Mongoose Book collection
    let book = await Book.findOne({ $or: [{ title }, { barcode: rfidTag || legacyId }] });
    if (!book) {
      book = await Book.create({
        title,
        author: author || "Unknown Author",
        status: status || "Available",
        barcode: rfidTag || legacyId,
        stock: 1,
        category: location || "General"
      });
    } else {
      book.status = status || book.status;
      book.barcode = rfidTag || book.barcode;
      await book.save();
    }

    res.status(200).json({
      message: `Asset "${title}" synced successfully. Verified on catalog database.`,
      asset: book
    });
  } catch (err) {
    next(err);
  }
};

export const hardwareEvent = async (req, res, next) => {
  try {
    const { eventType, rfidTag, deviceId, timestamp } = req.body;
    
    await new Promise(resolve => setTimeout(resolve, 500));

    // Query real Book by RFID tag
    const book = await Book.findOne({ barcode: rfidTag });
    if (!book) {
      return res.status(404).json({ message: `RFID tag ${rfidTag} not registered in catalog.` });
    }

    let msg = "Hardware event processed.";
    if (eventType === "CHECK_OUT") {
      book.status = "Issued";
      await book.save();
      msg = `RFID Checkout Event: "${book.title}" marked as Issued on catalog via gate ${deviceId}.`;
    }
    if (eventType === "CHECK_IN") {
      book.status = "Available";
      await book.save();

      // Locate corresponding active loan to close
      const activeTx = await Transaction.findOne({ bookId: book._id, returned: false });
      if (activeTx) {
        activeTx.returned = true;
        activeTx.returnedOn = new Date();
        await activeTx.save();
        msg = `RFID Return Event: "${book.title}" returned. Borrowing ledger updated.`;
      } else {
        msg = `RFID Return Event: "${book.title}" returned. Catalog status set to Available.`;
      }
    }
    if (eventType === "MISPLACED") {
      msg = `SECURITY ALARM at gate ${deviceId}: Book "${book.title}" (RFID: ${rfidTag}) passed gate without checkout authorisation!`;
    }

    res.status(200).json({
      message: msg,
      event: { eventType, rfidTag, title: book.title }
    });
  } catch (err) {
    next(err);
  }
};

export const occupancyTelemetry = async (req, res, next) => {
  try {
    const { zoneId, occupancyCount, sensorId } = req.body;
    
    await new Promise(resolve => setTimeout(resolve, 400));

    // Query Room collection
    const room = await Room.findOne({ name: new RegExp(zoneId, 'i') });
    let msg = `Telemetry received: ${occupancyCount} occupants detected in ${zoneId}.`;
    
    if (room) {
      if (occupancyCount >= room.capacity) {
        room.status = "Maintenance";
        await room.save();
        msg = `Telemetry: Room "${room.name}" occupancy (${occupancyCount}) reached capacity (${room.capacity}). Set status to Maintenance.`;
      } else {
        if (room.status === "Maintenance") {
          room.status = "Available";
          await room.save();
        }
        msg = `Telemetry: Room "${room.name}" occupancy is at ${occupancyCount}/${room.capacity}. Status set to Available.`;
      }
    }

    res.status(200).json({
      message: msg,
      data: { zoneId, occupancyCount, roomStatus: room ? room.status : "N/A" }
    });
  } catch (err) {
    next(err);
  }
};
