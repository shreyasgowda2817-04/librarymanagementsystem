import Notification from "../models/notification.js";

// @route   POST /api/notifications/create
export const createNotification = async (req, res) => {
  try {
    const { userId, title, message, type } = req.body;
    const notification = await Notification.create({ userId, title, message, type });

    import("../utils/socket.js").then(({ getIO }) => {
      try {
        getIO().to(userId.toString()).emit("notification:new", notification);
      } catch (e) {
        console.log("Socket emit failed", e);
      }
    });

    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @route   GET /api/notifications
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    console.error("Error in getNotifications:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @route   POST /api/notifications/read/:id
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ message: "Not found" });
    
    notification.isRead = true;
    await notification.save();
    res.json({ success: true, id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @route   POST /api/notifications/read-all
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @route   DELETE /api/notifications/:id
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ message: "Not found" });

    // Ensure user only deletes their own notification (unless admin)
    if (notification.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(401).json({ message: "Not authorized" });
    }

    await Notification.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @route   DELETE /api/notifications/clear-all
export const clearNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.user._id });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

