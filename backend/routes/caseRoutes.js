import express from "express";
import {
  createCase,
  getMyCases,
  getCaseById,
  updateCase,
  deleteCase,
  resendInvite,
  acceptCaseById,
  declineCaseById,
  getInviteDetails,
  acceptInvite,
  declineInvite,
  evaluateCase,
  getCaseDecision,
  respondToDecision,
} from "../controllers/caseController.js";
import { requireAuth } from "../middleware/auth.js";
import { evalRateLimiter } from "../middleware/security.js";

const router = express.Router();

// Public route to view dispute preview by token before login/accept
router.get("/invite/:token", getInviteDetails);

// Decline does not require auth, simply marks declined
router.post("/invite/:token/decline", declineInvite);

// Authenticated routes
router.use(requireAuth);

router.post("/", createCase);
router.get("/", getMyCases);
router.get("/:id", getCaseById);
router.put("/:id", updateCase);
router.delete("/:id", deleteCase);
router.post("/:id/accept", acceptCaseById);
router.post("/:id/decline", declineCaseById);
router.post("/:id/invite", resendInvite);
router.post("/invite/:token/accept", acceptInvite);

// Evaluation & Decision routes
router.post("/:id/evaluate", evalRateLimiter, evaluateCase);
router.get("/:id/decision", getCaseDecision);
router.post("/:id/decision/respond", respondToDecision);

export default router;

