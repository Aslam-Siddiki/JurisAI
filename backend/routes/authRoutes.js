import express from "express";
import {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  deleteAccount,
} from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";
import { authRateLimiter } from "../middleware/security.js";

const router = express.Router();

router.post("/register", authRateLimiter, register);
router.post("/login", authRateLimiter, login);

// Authenticated user routes
router.use(requireAuth);
router.get("/me", getMe);
router.put("/profile", updateProfile);
router.put("/password", changePassword);
router.delete("/account", deleteAccount);

export default router;
