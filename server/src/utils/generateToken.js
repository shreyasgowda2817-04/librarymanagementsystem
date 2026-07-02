// server/src/utils/generateToken.js
import jwt from "jsonwebtoken";

const generateToken = (id, sessionId) => {
  const payload = sessionId ? { id, sessionId } : { id };
  return jwt.sign(payload, process.env.JWT_SECRET || "default_secret", {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  });
};

export default generateToken;
