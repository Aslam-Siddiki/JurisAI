import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === "super_secret_jwt_key_jurisai_2026" || secret.includes("change_in_production")) {
    if (process.env.NODE_ENV === "production") {
      console.warn("⚠️  [SECURITY WARNING] Using default or insecure JWT_SECRET in production! Please set a strong, random JWT_SECRET in environment variables.");
    }
  }
  return secret || "super_secret_jwt_key_jurisai_2026";
};

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required. Bearer token missing." });
    }

    const token = authHeader.split(" ")[1];
    const secret = getJwtSecret();

    const decoded = jwt.verify(token, secret);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ error: "User no longer exists." });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired authentication session. Please log in again." });
  }
};
