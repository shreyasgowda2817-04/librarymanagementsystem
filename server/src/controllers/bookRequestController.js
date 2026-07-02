import BookRequest from "../models/BookRequest.js";
import Notification from "../models/notification.js";

export const createRequest = async (req, res) => {
  try {
    const { title, author, category, reason } = req.body;
    const bookRequest = await BookRequest.create({
      userId: req.user._id,
      title,
      author,
      category,
      reason
    });
    res.status(201).json(bookRequest);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getMyRequests = async (req, res) => {
  try {
    const requests = await BookRequest.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAllRequests = async (req, res) => {
  try {
    const requests = await BookRequest.find().populate("userId", "name email").sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const bookRequest = await BookRequest.findById(req.params.id);
    if (!bookRequest) return res.status(404).json({ message: "Not found" });

    bookRequest.status = status;
    await bookRequest.save();

    // Notify user
    await Notification.create({
      userId: bookRequest.userId,
      title: `Book Request ${status}`,
      message: `Your request for "${bookRequest.title}" has been ${status.toLowerCase()}.`,
      type: status === "Approved" ? "success" : "warning"
    });

    res.json(bookRequest);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteRequest = async (req, res) => {
  try {
    const bookRequest = await BookRequest.findById(req.params.id);
    if (!bookRequest) return res.status(404).json({ message: "Not found" });

    // Check if user is owner or admin
    if (bookRequest.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(401).json({ message: "Not authorized" });
    }

    await bookRequest.deleteOne();
    res.json({ message: "Request removed" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
