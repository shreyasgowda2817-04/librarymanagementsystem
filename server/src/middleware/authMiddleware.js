import jwt from "jsonwebtoken";
import User from "../models/user.js";
import { membershipLimits } from "../config/membershipLimits.js";

export const protect = async (req, res, next) => {
  try {
    // Check for Developer API Key (Header: x-api-key, or Bearer sk_live_...)
    const authHeader = req.headers.authorization;
    let apiKey = req.headers["x-api-key"];
    
    if (authHeader && authHeader.startsWith("Bearer sk_live_")) {
      apiKey = authHeader.split(" ")[1];
    }

    if (apiKey) {
      const user = await User.findOne({ "apiKeys.key": apiKey });
      if (user) {
        const keyIndex = user.apiKeys.findIndex(k => k.key === apiKey);
        if (keyIndex !== -1) {
          user.apiKeys[keyIndex].lastUsed = new Date();
          await user.save();
          
          if (user.role === "admin") {
            user.limits = { maxBooks: 999, digitalAccess: true, aiAnalysisAccess: true, label: "System Administrator" };
          } else {
            user.limits = membershipLimits[user.membership || "Basic"];
          }
          
          req.user = user;
          return next();
        }
      }
    }

    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      console.log(`[Auth Middleware] Blocked: No token found for URL: ${req.originalUrl}`);
      return res.status(401).json({ message: "Not authorized, no token or valid API key" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret");
    } catch (jwtErr) {
      console.error(`[Auth Middleware] Blocked: JWT verification failed for URL: ${req.originalUrl}:`, jwtErr.message);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      console.log(`[Auth Middleware] Blocked: User not found for ID: ${decoded.id} in URL: ${req.originalUrl}`);
      return res.status(401).json({ message: "User not found" });
    }

    // 1. Session Inactivity Timeout Enforcer
    if (decoded.sessionId) {
      const session = user.sessions.find(s => s.sessionId === decoded.sessionId);
      if (!session) {
        console.log(`[Auth Middleware] Blocked: Session ID: ${decoded.sessionId} not found in user.sessions in URL: ${req.originalUrl}`);
        return res.status(401).json({ message: "Session invalid or expired" });
      }

      const GlobalSettings = (await import("../models/globalSettings.js")).default;
      const globalSettings = await GlobalSettings.getInstance();
      const timeoutMins = globalSettings?.security?.sessionTimeout || 60;

      const timeSinceActive = (Date.now() - new Date(session.lastActive).getTime()) / (1000 * 60);
      console.log(`[Auth Middleware] Session ID: ${decoded.sessionId}, Time since active: ${timeSinceActive} mins, Timeout limit: ${timeoutMins} mins`);
      
      if (timeSinceActive > timeoutMins) {
        console.log(`[Auth Middleware] Blocked: Session ID: ${decoded.sessionId} timed out (${timeSinceActive} mins > ${timeoutMins} mins)`);
        await User.updateOne(
          { _id: user._id },
          { $pull: { sessions: { sessionId: decoded.sessionId } } }
        );
        return res.status(401).json({ message: "Session timed out due to inactivity" });
      }

      // Update lastActive activity timestamp (throttled to once every 10 seconds)
      const now = new Date();
      const timeSinceLastActiveMs = now.getTime() - new Date(session.lastActive).getTime();
      if (timeSinceLastActiveMs > 10000) {
        session.lastActive = now;
        await User.updateOne(
          { _id: user._id, "sessions.sessionId": decoded.sessionId },
          { $set: { "sessions.$.lastActive": now } }
        );
      }
    }

    // 2. Global Security - 2FA Enforcers
    const GlobalSettings = (await import("../models/globalSettings.js")).default;
    const globalSettings = await GlobalSettings.getInstance();
    const { require2FA, force2FAForAdmins } = globalSettings.security || {};

    const url = req.originalUrl || req.url;
    const isEssentialRoute = url.startsWith("/api/auth/me") || 
                             url.startsWith("/api/auth/settings") || 
                             url.startsWith("/api/auth/sessions") || 
                             url.startsWith("/api/auth/logout");

    if (!isEssentialRoute) {
      if (require2FA && !user.securitySettings?.twoFactor) {
        return res.status(403).json({ message: "2FA required. Please enable 2FA in Account Settings." });
      }

      if (force2FAForAdmins && user.role === "admin" && !user.securitySettings?.twoFactor) {
        return res.status(403).json({ message: "Administrator 2FA enforcement active. Please enable 2FA in Account Settings." });
      }
    }

    // Attach limits
    if (["admin", "superadmin", "librarian"].includes(user.role)) {
      user.limits = {
        maxBooks: 999,
        digitalAccess: true,
        aiAnalysisAccess: true,
        label: "Library Staff"
      };
    } else {
      user.limits = membershipLimits[user.membership || "Basic"];
    }

    req.user = user;
    next();
  } catch (err) {
    console.error(`[Auth Middleware] Uncaught exception in protect middleware:`, err);
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};


export const admin = (req, res, next) => {
  if (req.user && ["admin", "superadmin"].includes(req.user.role)) {
    next();
  } else {
    res.status(403).json({ message: "Not authorized as an admin" });
  }
};

export const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Role (${req.user?.role || 'none'}) is not allowed to access this resource` 
      });
    }
    next();
  };
};
