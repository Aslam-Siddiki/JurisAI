import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import path from "path";
import fs from "fs";
import { User } from "../models/User.js";
import { Case } from "../models/Case.js";
import { Submission } from "../models/Submission.js";
import { Decision } from "../models/Decision.js";
import { getJwtSecret } from "../middleware/auth.js";
import { UPLOAD_DIR } from "../middleware/upload.js";

const generateToken = (id) => {
  const secret = getJwtSecret();
  return jwt.sign({ id }, secret, { expiresIn: "7d" });
};

export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required." });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    const cleanEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(409).json({ error: "Email is already registered." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Auto-detect role: If this email has already been invited to a dispute as a respondent, assign respondent role
    const isInvitedRespondent = await Case.exists({ respondentEmail: cleanEmail });
    const finalRole = isInvitedRespondent
      ? "respondent"
      : (["claimant", "respondent"].includes(role) ? role : "claimant");

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: finalRole,
    });

    // Auto-link any existing disputes where this email is specified as respondent
    await Case.updateMany(
      { respondentEmail: cleanEmail },
      { $set: { respondent: user._id } }
    );

    const token = generateToken(user._id);

    res.status(201).json({
      message: "Registration successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Server error during registration: " + error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    // Ensure any disputes for this email are linked to this user
    await Case.updateMany(
      { respondentEmail: user.email.toLowerCase().trim(), respondent: null },
      { $set: { respondent: user._id } }
    );

    const token = generateToken(user._id);

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Server error during login: " + error.message });
  }
};

export const getMe = async (req, res) => {
  res.status(200).json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      createdAt: req.user.createdAt,
    },
  });
};

export const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    if (name && name.trim()) {
      user.name = name.trim();
    }

    if (email && email.toLowerCase().trim() !== user.email) {
      const emailExists = await User.findOne({ email: email.toLowerCase().trim(), _id: { $ne: user._id } });
      if (emailExists) {
        return res.status(409).json({ error: "Email already in use by another account." });
      }
      user.email = email.toLowerCase().trim();
    }

    await user.save();

    res.status(200).json({
      message: "Profile updated successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to update profile: " + error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password are required." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters." });
    }

    const user = await User.findById(req.user._id).select("+password");
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Current password does not match." });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    res.status(500).json({ error: "Failed to change password: " + error.message });
  }
};

/**
 * Cascade deletes a user and ALL associated dispute cases where they are
 * either Claimant OR Respondent. Also removes all associated Submissions,
 * Decisions, and physical evidence files from disk.
 *
 * @param {string|mongoose.Types.ObjectId} userId
 * @param {string|null} userEmail
 * @returns {Promise<{ deletedCasesCount: number, deletedSubmissionsCount: number }>}
 */
export const cascadeDeleteUser = async (userId, userEmail = null) => {
  let email = userEmail;
  if (!email) {
    const user = await User.findById(userId);
    if (user && user.email) {
      email = user.email.toLowerCase().trim();
    }
  } else {
    email = email.toLowerCase().trim();
  }

  // 1. Find all cases where this user is Claimant OR Respondent (by ID or by email)
  const caseQuery = {
    $or: [
      { claimant: userId },
      { respondent: userId },
      ...(email ? [{ respondentEmail: email }] : []),
    ],
  };

  const associatedCases = await Case.find(caseQuery);
  const caseIds = associatedCases.map((c) => c._id);

  // 2. Find all submissions for these cases, or authored by this user
  const submissionQuery = {
    $or: [
      { case: { $in: caseIds } },
      { author: userId },
    ],
  };

  const submissions = await Submission.find(submissionQuery);

  // 3. Clean up all physical evidence files on disk
  for (const sub of submissions) {
    for (const item of sub.evidence || []) {
      if (item.fileUrl) {
        try {
          const fileName = path.basename(item.fileUrl);
          const filePath = path.join(UPLOAD_DIR, fileName);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (fileErr) {
          console.warn("[File Cleanup Warning on User Delete]:", fileErr.message);
        }
      }
    }
  }

  // 4. Cascade delete Submissions, Decisions, and Cases
  if (submissions.length > 0 || caseIds.length > 0) {
    await Submission.deleteMany(submissionQuery);
  }

  if (caseIds.length > 0) {
    await Decision.deleteMany({ case: { $in: caseIds } });
    await Case.deleteMany({ _id: { $in: caseIds } });
  }

  // 5. Permanently delete the user record
  const deletedUser = await User.findByIdAndDelete(userId);

  return {
    deletedUser,
    deletedCasesCount: caseIds.length,
    deletedSubmissionsCount: submissions.length,
  };
};

export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    const userEmail = req.user.email;

    const result = await cascadeDeleteUser(userId, userEmail);

    res.status(200).json({
      message: "Account and all associated dispute cases, submissions, evidence files, and decisions deleted successfully.",
      deletedCasesCount: result.deletedCasesCount,
      deletedSubmissionsCount: result.deletedSubmissionsCount,
    });
  } catch (error) {
    console.error("[deleteAccount Error]:", error);
    res.status(500).json({ error: "Failed to delete account: " + error.message });
  }
};

