import GlobalSettings from "../models/globalSettings.js";

export const getAdminSettings = async (req, res, next) => {
  try {
    const settings = await GlobalSettings.getInstance();
    res.json(settings);
  } catch (err) {
    next(err);
  }
};

export const updateAdminSettings = async (req, res, next) => {
  try {
    const settings = await GlobalSettings.getInstance();
    
    // Update fields dynamically based on nested structure
    if (req.body.platform) settings.platform = { ...settings.platform, ...req.body.platform };
    if (req.body.email) settings.email = { ...settings.email, ...req.body.email };
    if (req.body.features) settings.features = { ...settings.features, ...req.body.features };
    if (req.body.userSystem) settings.userSystem = { ...settings.userSystem, ...req.body.userSystem };
    if (req.body.security) settings.security = { ...settings.security, ...req.body.security };

    await settings.save();
    
    // Notify all connected clients about system update
    import("../utils/socket.js").then(({ getIO }) => {
      try {
        getIO().emit("system:update", settings);
      } catch (e) {
        console.log("Socket emit failed", e);
      }
    });

    res.json(settings);
  } catch (err) {
    next(err);
  }
};
