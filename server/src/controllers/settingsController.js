import Settings from "../models/settings.js";

// @desc    Get global system settings
// @route   GET /api/settings
// @access  Private
export const getSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Update global system settings
// @route   PUT /api/settings
// @access  Private/Admin
export const updateSettings = async (req, res) => {
  try {
    let settings = await Settings.getSettings();
    
    // Update fields dynamically
    const fields = [
      "libraryName", "contactEmail", "timezone", "maxBorrowLimit", 
      "finePerDay", "currency", "sessionTimeout", "require2FA", 
      "enableAI", "openAIApiKey", "maintenanceMode", "autoFineCheck", "autoCleanup"
    ];

    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        settings[field] = req.body[field];
      }
    });

    await settings.save();
    res.json(settings);
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
