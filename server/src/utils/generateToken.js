import jwt from "jsonwebtoken";

export const generateAccessToken = (id, sessionId) => {
  const payload = sessionId ? { id, sessionId } : { id };
  return jwt.sign(payload, process.env.JWT_SECRET || "default_secret", {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m" // 15 minutes
  });
};

export const generateRefreshToken = (id, sessionId) => {
  const payload = sessionId ? { id, sessionId } : { id };
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || "default_refresh_secret", {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" // 7 days
  });
};

// Kept for backward compatibility while migrating
const generateToken = (id, sessionId) => {
  return generateAccessToken(id, sessionId);
};

export default generateToken;
