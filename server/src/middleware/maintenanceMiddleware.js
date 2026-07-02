// server/src/middleware/maintenanceMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import GlobalSettings from "../models/globalSettings.js";
import Settings from "../models/settings.js";

/**
 * Middleware to enforce maintenance mode.
 * Checks both GlobalSettings and Settings singleton models.
 * If maintenanceMode is enabled, all non‑admin API routes receive a 503 response.
 * Authenticated admins are allowed to pass through, and admin login requests are allowed
 * so they can authenticate and toggle maintenance mode off.
 */
export const maintenanceMode = async (req, res, next) => {
  try {
    // Allow CORS preflight requests
    if (req.method === "OPTIONS") {
      return next();
    }

    const [globalSettings, settings] = await Promise.all([
      GlobalSettings.getInstance(),
      Settings.getSettings()
    ]);

    const isMaintenance = globalSettings?.platform?.maintenanceMode || settings?.maintenanceMode;
    if (!isMaintenance) {
      return next();
    }

    const url = req.originalUrl || req.url;

    // 1. Allow admin backend routes (prefixed with /api/admin) so they can fetch/change settings
    if (url.startsWith("/api/admin")) {
      return next();
    }

    // 2. Intercept login and 2FA verification requests: only allow admins
    if (url.startsWith("/api/auth/login") || url.startsWith("/api/auth/verify-2fa")) {
      const { email } = req.body;
      if (email) {
        const user = await User.findOne({ email: new RegExp("^" + email + "$", "i") });
        if (user && user.role === "admin") {
          return next();
        }
      }
      return res.status(503).json({
        message: "The platform is currently under maintenance. Student login is temporarily disabled."
      });
    }

    // 3. Block student registration completely under maintenance
    if (url.startsWith("/api/auth/register")) {
      return res.status(503).json({
        message: "The platform is currently under maintenance. Student registration is temporarily disabled."
      });
    }

    // 4. Check if request contains a valid JWT admin token or API key
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    console.log(`[Maintenance Middleware] Request URL: ${url}, Token Found: ${!!token}`);

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret");
        console.log(`[Maintenance Middleware] Decoded token:`, decoded);
        const user = await User.findById(decoded.id).select("role");
        console.log(`[Maintenance Middleware] User found:`, user ? { id: user._id, role: user.role } : null);
        if (user && user.role === "admin") {
          console.log(`[Maintenance Middleware] Allowing Admin request to: ${url}`);
          return next();
        }
      } catch (jwtErr) {
        console.error(`[Maintenance Middleware] JWT verify failed for ${url}:`, jwtErr.message);
      }
    }

    // Allow Google auth initialization or callbacks to progress (role check is done at callback redirect)
    if (url.startsWith("/api/auth/google")) {
      return next();
    }

    // Block all other requests
    return res.status(503).json({
      message: "The platform is currently undergoing scheduled maintenance. Please try again later."
    });
  } catch (err) {
    console.error("Maintenance middleware error:", err);
    next();
  }
};
