import crypto from "crypto";
import path from "path";
import fs from "fs";
import axios from "axios";
import { Case } from "../models/Case.js";
import { User } from "../models/User.js";
import { Submission } from "../models/Submission.js";
import { Decision } from "../models/Decision.js";
import {
  sendInviteEmail,
  sendRespondentActionEmail,
  sendDecisionReadyEmail,
  sendDisputeResolvedEmail,
} from "../services/emailService.js";
import { evaluateDisputeLocally } from "../services/evaluationFallback.js";
import { UPLOAD_DIR } from "../middleware/upload.js";

const getEvidenceFilePath = (fileUrl) => {
  if (!fileUrl) return null;
  const fileName = path.basename(fileUrl);
  const fullPath = path.join(UPLOAD_DIR, fileName);
  return fs.existsSync(fullPath) ? fullPath : null;
};

const getClientBaseUrl = (req) => {
  return req.headers?.origin || process.env.CLIENT_URL || "http://localhost:5173";
};


export const createCase = async (req, res) => {
  try {
    const { title, category, respondentEmail, amountInDispute } = req.body;

    if (!title || !respondentEmail) {
      return res.status(400).json({ error: "Title and respondent email are required." });
    }

    if (respondentEmail.toLowerCase().trim() === req.user.email.toLowerCase().trim()) {
      return res.status(400).json({ error: "You cannot initiate a dispute against yourself." });
    }

    // Check if respondent already has an account registered
    const existingRespondentUser = await User.findOne({ email: respondentEmail.toLowerCase().trim() });

    // Generate single-use invite token with 7-day expiry
    const inviteToken = crypto.randomBytes(24).toString("hex");
    const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const newCase = await Case.create({
      title: title.trim(),
      category: category || "Other",
      claimant: req.user._id,
      respondent: existingRespondentUser ? existingRespondentUser._id : null,
      respondentEmail: respondentEmail.toLowerCase().trim(),
      amountInDispute: amountInDispute || 0,
      inviteToken,
      inviteExpiresAt,
      inviteStatus: "pending",
      status: "invited",
    });

    const inviteLink = `${getClientBaseUrl(req)}/invite/${inviteToken}`;

    // Send email or log to console
    await sendInviteEmail({
      respondentEmail: newCase.respondentEmail,
      respondentName: existingRespondentUser?.name || null,
      claimantName: req.user.name,
      claimantEmail: req.user.email,
      caseTitle: newCase.title,
      category: newCase.category,
      amountInDispute: newCase.amountInDispute,
      inviteLink,
    });

    res.status(201).json({
      message: "Case created and respondent invited successfully.",
      case: newCase,
      inviteLink,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to create case: " + error.message });
  }
};

export const getMyCases = async (req, res) => {
  try {
    const userId = req.user._id;
    const userEmail = req.user.email.toLowerCase().trim();

    // Ensure any disputes for this email are linked to this user's account
    await Case.updateMany(
      { respondentEmail: userEmail, respondent: null },
      { $set: { respondent: userId } }
    );

    const cases = await Case.find({
      $or: [
        { claimant: userId },
        { respondent: userId },
        { respondentEmail: userEmail },
      ],
    })
      .populate("claimant", "name email")
      .populate("respondent", "name email")
      .sort({ updatedAt: -1 });

    res.status(200).json({ cases });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch cases: " + error.message });
  }
};

export const getCaseById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id.toString();
    const userEmail = req.user.email.toLowerCase().trim();

    const caseDoc = await Case.findById(id)
      .populate("claimant", "name email")
      .populate("respondent", "name email");

    if (!caseDoc) {
      return res.status(404).json({ error: "Case not found." });
    }

    const isClaimant = caseDoc.claimant._id.toString() === userId;
    const isRespondent =
      (caseDoc.respondent && caseDoc.respondent._id.toString() === userId) ||
      caseDoc.respondentEmail.toLowerCase().trim() === userEmail;

    if (!isClaimant && !isRespondent) {
      return res.status(403).json({
        error: "Forbidden: You are not an authorized participant in this dispute.",
      });
    }

    // Auto-link respondent if they are viewing and not yet linked
    if (isRespondent && !caseDoc.respondent) {
      caseDoc.respondent = req.user._id;
      await caseDoc.save();
    }

    const inviteLink = caseDoc.inviteToken ? `${getClientBaseUrl(req)}/invite/${caseDoc.inviteToken}` : null;

    res.status(200).json({
      case: caseDoc,
      userRole: isClaimant ? "claimant" : "respondent",
      inviteLink,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch case: " + error.message });
  }
};

export const resendInvite = async (req, res) => {
  try {
    const { id } = req.params;
    const caseDoc = await Case.findById(id).populate("claimant", "name email");

    if (!caseDoc) {
      return res.status(404).json({ error: "Case not found." });
    }

    if (caseDoc.claimant._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Only the claimant can resend invitations." });
    }

    if (caseDoc.inviteStatus === "accepted") {
      return res.status(400).json({ error: "Respondent has already accepted the invitation." });
    }

    // Refresh token with new 7-day validity
    caseDoc.inviteToken = crypto.randomBytes(24).toString("hex");
    caseDoc.inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    caseDoc.inviteStatus = "pending";
    caseDoc.status = "invited";
    await caseDoc.save();

    const inviteLink = `${getClientBaseUrl(req)}/invite/${caseDoc.inviteToken}`;

    const existingRespondentUser = await User.findOne({ email: caseDoc.respondentEmail.toLowerCase().trim() });
    await sendInviteEmail({
      respondentEmail: caseDoc.respondentEmail,
      respondentName: existingRespondentUser?.name || null,
      claimantName: req.user.name,
      claimantEmail: req.user.email,
      caseTitle: caseDoc.title,
      category: caseDoc.category,
      amountInDispute: caseDoc.amountInDispute,
      inviteLink,
    });

    res.status(200).json({
      message: "Invitation resent successfully.",
      inviteLink,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to resend invite: " + error.message });
  }
};

/**
 * Public preview endpoint to view dispute summary before accepting
 */
export const getInviteDetails = async (req, res) => {
  try {
    const { token } = req.params;
    const caseDoc = await Case.findOne({ inviteToken: token }).populate("claimant", "name email");

    if (!caseDoc) {
      return res.status(404).json({ error: "Invalid or expired invitation token." });
    }

    // Check expiration
    if (caseDoc.inviteExpiresAt && new Date() > new Date(caseDoc.inviteExpiresAt) && caseDoc.inviteStatus === "pending") {
      caseDoc.inviteStatus = "expired";
      await caseDoc.save();
    }

    // Check if respondent already has a registered account
    const respondentUser = await User.findOne({ email: caseDoc.respondentEmail.toLowerCase().trim() });

    res.status(200).json({
      caseId: caseDoc._id,
      title: caseDoc.title,
      category: caseDoc.category,
      amountInDispute: caseDoc.amountInDispute,
      claimantName: caseDoc.claimant?.name || "Claimant",
      claimantEmail: caseDoc.claimant?.email || "",
      respondentEmail: caseDoc.respondentEmail,
      inviteStatus: caseDoc.inviteStatus,
      status: caseDoc.status,
      expiresAt: caseDoc.inviteExpiresAt,
      respondentHasAccount: Boolean(respondentUser),
      respondentName: respondentUser?.name || null,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to inspect invite: " + error.message });
  }
};

/**
 * Accept invite: must be authenticated. Checks for email match or links respondent.
 */
export const acceptInvite = async (req, res) => {
  try {
    const { token } = req.params;
    const caseDoc = await Case.findOne({ inviteToken: token });

    if (!caseDoc) {
      return res.status(404).json({ error: "Invalid invitation token." });
    }

    // If already accepted and current user is the respondent, allow smooth passthrough to the case
    if (caseDoc.inviteStatus === "accepted") {
      if (
        (caseDoc.respondent && caseDoc.respondent.toString() === req.user._id.toString()) ||
        caseDoc.respondentEmail.toLowerCase() === req.user.email.toLowerCase()
      ) {
        return res.status(200).json({
          message: "Invitation has already been accepted. Proceeding to case.",
          caseId: caseDoc._id,
          status: caseDoc.status,
        });
      }
      return res.status(409).json({ error: "This invitation has already been accepted by another user." });
    }

    if (caseDoc.inviteExpiresAt && new Date() > new Date(caseDoc.inviteExpiresAt)) {
      caseDoc.inviteStatus = "expired";
      await caseDoc.save();
      return res.status(410).json({ error: "Invitation has expired." });
    }

    // Claimant cannot accept their own case as respondent
    if (caseDoc.claimant.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: "Claimant cannot accept an invite to their own dispute." });
    }

    // Enforce email matching rule
    if (req.user.email.toLowerCase() !== caseDoc.respondentEmail.toLowerCase()) {
      return res.status(403).json({
        error: `Email mismatch: This invite was issued specifically for ${caseDoc.respondentEmail}. You are logged in as ${req.user.email}.`,
      });
    }

    // Transition state: mark accepted, attach respondent, advance status to awaiting_submissions
    caseDoc.respondent = req.user._id;
    caseDoc.inviteStatus = "accepted";
    if (caseDoc.status === "invited") {
      caseDoc.status = "awaiting_submissions";
    }
    // Retain inviteToken so the link continues to resolve for the respondent
    await caseDoc.save();

    // Notify claimant that respondent has accepted the dispute
    try {
      const claimantUser = await User.findById(caseDoc.claimant);
      if (claimantUser && claimantUser.email) {
        await sendRespondentActionEmail({
          claimantEmail: claimantUser.email,
          claimantName: claimantUser.name,
          respondentName: req.user.name || "Respondent",
          respondentEmail: req.user.email,
          caseTitle: caseDoc.title,
          action: "accepted",
          caseLink: `${getClientBaseUrl(req)}/cases/${caseDoc._id}`,
        });
      }
    } catch (emailErr) {
      console.error("[Email Notification Warning] Failed to send accept notification to claimant:", emailErr.message);
    }

    res.status(200).json({
      message: "Invitation accepted. The case is now awaiting submissions.",
      caseId: caseDoc._id,
      status: caseDoc.status,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to accept invite: " + error.message });
  }
};

/**
 * Direct accept dispute by case ID (when logged in as respondent):
 */
export const acceptCaseById = async (req, res) => {
  try {
    const { id } = req.params;
    const caseDoc = await Case.findById(id);

    if (!caseDoc) {
      return res.status(404).json({ error: "Dispute case not found." });
    }

    const userEmail = req.user.email.toLowerCase().trim();
    const isRespondent =
      (caseDoc.respondent && caseDoc.respondent.toString() === req.user._id.toString()) ||
      caseDoc.respondentEmail.toLowerCase().trim() === userEmail;

    if (!isRespondent) {
      return res.status(403).json({ error: "Only the invited respondent can accept this dispute." });
    }

    if (caseDoc.inviteStatus === "accepted") {
      return res.status(400).json({ error: "Dispute has already been accepted." });
    }

    caseDoc.respondent = req.user._id;
    caseDoc.inviteStatus = "accepted";
    if (caseDoc.status === "invited") {
      caseDoc.status = "awaiting_submissions";
    }
    await caseDoc.save();

    // Notify claimant that respondent has accepted the dispute
    try {
      const claimantUser = await User.findById(caseDoc.claimant);
      if (claimantUser && claimantUser.email) {
        await sendRespondentActionEmail({
          claimantEmail: claimantUser.email,
          claimantName: claimantUser.name,
          respondentName: req.user.name || "Respondent",
          respondentEmail: req.user.email,
          caseTitle: caseDoc.title,
          action: "accepted",
          caseLink: `${getClientBaseUrl(req)}/cases/${caseDoc._id}`,
        });
      }
    } catch (emailErr) {
      console.error("[Email Notification Warning] Failed to send accept notification to claimant:", emailErr.message);
    }

    res.status(200).json({
      message: "Dispute invitation accepted successfully.",
      case: caseDoc,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to accept dispute: " + error.message });
  }
};

/**
 * Direct decline dispute by case ID (when logged in as respondent):
 */
export const declineCaseById = async (req, res) => {
  try {
    const { id } = req.params;
    const caseDoc = await Case.findById(id);

    if (!caseDoc) {
      return res.status(404).json({ error: "Dispute case not found." });
    }

    const userEmail = req.user.email.toLowerCase().trim();
    const isRespondent =
      (caseDoc.respondent && caseDoc.respondent.toString() === req.user._id.toString()) ||
      caseDoc.respondentEmail.toLowerCase().trim() === userEmail;

    if (!isRespondent) {
      return res.status(403).json({ error: "Only the invited respondent can decline this dispute." });
    }

    caseDoc.inviteStatus = "declined";
    caseDoc.status = "closed";
    await caseDoc.save();

    // Notify claimant that respondent declined the dispute
    try {
      const claimantUser = await User.findById(caseDoc.claimant);
      if (claimantUser && claimantUser.email) {
        await sendRespondentActionEmail({
          claimantEmail: claimantUser.email,
          claimantName: claimantUser.name,
          respondentName: req.user.name || "Respondent",
          respondentEmail: req.user.email,
          caseTitle: caseDoc.title,
          action: "declined",
          caseLink: `${getClientBaseUrl(req)}/cases/${caseDoc._id}`,
        });
      }
    } catch (emailErr) {
      console.error("[Email Notification Warning] Failed to send decline notification to claimant:", emailErr.message);
    }

    res.status(200).json({
      message: "Dispute declined and closed.",
      case: caseDoc,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to decline dispute: " + error.message });
  }
};

/**
 * Decline invite: marks case declined, closes dispute
 */
export const declineInvite = async (req, res) => {
  try {
    const { token } = req.params;
    const caseDoc = await Case.findOne({ inviteToken: token });

    if (!caseDoc) {
      return res.status(404).json({ error: "Invalid invitation token." });
    }

    if (caseDoc.inviteStatus !== "pending") {
      return res.status(409).json({ error: `Invitation already ${caseDoc.inviteStatus}.` });
    }

    caseDoc.inviteStatus = "declined";
    caseDoc.status = "closed";
    caseDoc.inviteToken = null; // Burn token
    await caseDoc.save();

    // Notify claimant that respondent declined the dispute
    try {
      const claimantUser = await User.findById(caseDoc.claimant);
      if (claimantUser && claimantUser.email) {
        await sendRespondentActionEmail({
          claimantEmail: claimantUser.email,
          claimantName: claimantUser.name,
          respondentName: req.user?.name || "Respondent",
          respondentEmail: req.user?.email || caseDoc.respondentEmail,
          caseTitle: caseDoc.title,
          action: "declined",
          caseLink: `${getClientBaseUrl(req)}/cases/${caseDoc._id}`,
        });
      }
    } catch (emailErr) {
      console.error("[Email Notification Warning] Failed to send decline notification to claimant:", emailErr.message);
    }

    res.status(200).json({
      message: "Invitation declined. Case has been closed.",
      caseId: caseDoc._id,
      status: caseDoc.status,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to decline invite: " + error.message });
  }
};

/**
 * Trigger AI Evaluation for case:
 * - Participants only
 * - Requires both parties to have submitted (case in ready_for_evaluation status)
 * - Evaluates statements & evidence via FastAPI AI Service (/decide)
 * - Persists Decision and updates Case status
 */
export const evaluateCase = async (req, res) => {
  try {
    const { id: caseId } = req.params;
    const userId = req.user._id.toString();

    const caseDoc = await Case.findById(caseId);
    if (!caseDoc) {
      return res.status(404).json({ error: "Case not found." });
    }

    const isClaimant = caseDoc.claimant.toString() === userId;
    const isRespondent = caseDoc.respondent && caseDoc.respondent.toString() === userId;

    if (!isClaimant && !isRespondent) {
      return res.status(403).json({ error: "Forbidden: You are not a participant in this case." });
    }

    // Both parties must have submitted
    if (!["ready_for_evaluation", "evaluating", "needs_review", "decided"].includes(caseDoc.status)) {
      return res.status(400).json({
        error: `Cannot trigger evaluation. Case must be ready for evaluation (Current: ${caseDoc.status}). Both parties must submit their statement and evidence first.`,
      });
    }

    // Fetch both submissions
    const submissionA = await Submission.findOne({ case: caseId, party: "A" });
    const submissionB = await Submission.findOne({ case: caseId, party: "B" });

    if (!submissionA || !submissionB) {
      return res.status(400).json({
        error: "Submissions for both parties are required before evaluation can start.",
      });
    }

    // Set status to evaluating
    caseDoc.status = "evaluating";
    await caseDoc.save();

    // Map evidence items to AI service schema
    const allEvidence = [];

    // Party A evidence
    (submissionA.evidence || []).forEach((item) => {
      const absPath = getEvidenceFilePath(item.fileUrl);
      allEvidence.push({
        id: item.id || "A-1",
        type: item.type || "other",
        description: item.description,
        file_path: absPath,
        text: item.extractedText || null,
      });
    });

    // Party B evidence
    (submissionB.evidence || []).forEach((item) => {
      const absPath = getEvidenceFilePath(item.fileUrl);
      allEvidence.push({
        id: item.id || "B-1",
        type: item.type || "other",
        description: item.description,
        file_path: absPath,
        text: item.extractedText || null,
      });
    });

    const aiPayload = {
      case_id: caseDoc._id.toString(),
      category: caseDoc.category || "Other",
      party_a_statement: submissionA.statement,
      party_b_statement: submissionB.statement,
      evidence: allEvidence,
    };

    const aiServiceUrl = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";
    const serviceKey = process.env.AI_SERVICE_KEY || process.env.SERVICE_KEY || "secret_internal_service_key";

    let report;
    try {
      const aiResponse = await axios.post(`${aiServiceUrl}/decide`, aiPayload, {
        headers: {
          "Content-Type": "application/json",
          "X-Service-Key": serviceKey,
        },
        timeout: 25000, // 25s timeout for AI service call
      });
      report = aiResponse.data;
    } catch (aiErr) {
      console.warn(`[AI Service Notice] External AI service at ${aiServiceUrl} unavailable (${aiErr.message}). Engaging resilient built-in ADR evaluation engine...`);
      try {
        report = evaluateDisputeLocally({
          caseId: caseDoc._id.toString(),
          category: caseDoc.category || "Other",
          partyAStatement: submissionA.statement,
          partyBStatement: submissionB.statement,
          evidence: allEvidence,
        });
      } catch (fallbackErr) {
        console.error("[evaluateCase Local Fallback Error]:", fallbackErr);
        // Rollback status to ready_for_evaluation
        caseDoc.status = "ready_for_evaluation";
        await caseDoc.save().catch(() => {});
        const errDetail = aiErr.response?.data?.detail || aiErr.message;
        return res.status(502).json({
          error: `AI Evaluation Service Error: ${errDetail}`,
        });
      }
    }

    const isNeedsReview = report.overall_verdict === "needs_human_review";

    // Save or update Decision document
    let decisionDoc = await Decision.findOne({ case: caseId });
    if (!decisionDoc) {
      decisionDoc = await Decision.create({
        case: caseId,
        report,
        verdict: report.overall_verdict,
        confidence: report.overall_confidence,
        needsHumanReview: isNeedsReview,
        modelVersion: "jurisai-pipeline-v1",
      });
    } else {
      decisionDoc.report = report;
      decisionDoc.verdict = report.overall_verdict;
      decisionDoc.confidence = report.overall_confidence;
      decisionDoc.needsHumanReview = isNeedsReview;
      await decisionDoc.save();
    }

    // Update case with decision reference and new status
    caseDoc.decision = decisionDoc._id;
    caseDoc.status = isNeedsReview ? "needs_review" : "decided";
    await caseDoc.save();

    // Notify both claimant and respondent that resolution decision is ready
    try {
      const claimantUser = await User.findById(caseDoc.claimant);
      const respondentUser = caseDoc.respondent ? await User.findById(caseDoc.respondent) : null;
      const caseLink = `${getClientBaseUrl(req)}/cases/${caseDoc._id}`;
      const remedy = report.suggested_settlement;

      if (claimantUser && claimantUser.email) {
        await sendDecisionReadyEmail({
          recipientEmail: claimantUser.email,
          recipientName: claimantUser.name,
          caseTitle: caseDoc.title,
          suggestedSettlement: remedy,
          caseLink,
        });
      }

      const respEmail = respondentUser?.email || caseDoc.respondentEmail;
      if (respEmail) {
        await sendDecisionReadyEmail({
          recipientEmail: respEmail,
          recipientName: respondentUser?.name || "Respondent",
          caseTitle: caseDoc.title,
          suggestedSettlement: remedy,
          caseLink,
        });
      }
    } catch (notifErr) {
      console.error("[Email Notification Warning] Failed to notify parties of decision:", notifErr.message);
    }

    res.status(200).json({
      message: "Case evaluated successfully.",
      status: caseDoc.status,
      decision: decisionDoc,
    });
  } catch (error) {
    console.error("[evaluateCase Error]:", error);
    try {
      if (req.params?.id) {
        await Case.findByIdAndUpdate(req.params.id, { status: "ready_for_evaluation" });
      }
    } catch (rollbackErr) {
      console.error("[evaluateCase Rollback Error]:", rollbackErr.message);
    }
    res.status(500).json({ error: "Failed to evaluate dispute: " + error.message });
  }
};

/**
 * Get decision report for a case (Participants only)
 */
export const getCaseDecision = async (req, res) => {
  try {
    const { id: caseId } = req.params;
    const userId = req.user._id.toString();

    const caseDoc = await Case.findById(caseId);
    if (!caseDoc) {
      return res.status(404).json({ error: "Case not found." });
    }

    const isClaimant = caseDoc.claimant.toString() === userId;
    const isRespondent = caseDoc.respondent && caseDoc.respondent.toString() === userId;

    if (!isClaimant && !isRespondent) {
      return res.status(403).json({ error: "Forbidden: You are not an authorized participant in this case." });
    }

    const decision = await Decision.findOne({ case: caseId });
    if (!decision) {
      return res.status(404).json({ error: "No decision has been generated for this case yet." });
    }

    res.status(200).json({
      decision,
      userParty: isClaimant ? "A" : "B",
      caseStatus: caseDoc.status,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch decision: " + error.message });
  }
};

/**
 * Accept or reject decision outcome:
 * Participant submits { response: "accepted" | "rejected" }
 */
export const respondToDecision = async (req, res) => {
  try {
    const { id: caseId } = req.params;
    const userId = req.user._id.toString();
    const { response } = req.body;

    if (!["accepted", "rejected"].includes(response)) {
      return res.status(400).json({ error: "Response must be either 'accepted' or 'rejected'." });
    }

    const caseDoc = await Case.findById(caseId);
    if (!caseDoc) {
      return res.status(404).json({ error: "Case not found." });
    }

    const isClaimant = caseDoc.claimant.toString() === userId;
    const isRespondent = caseDoc.respondent && caseDoc.respondent.toString() === userId;

    if (!isClaimant && !isRespondent) {
      return res.status(403).json({ error: "Forbidden: You are not an authorized participant." });
    }

    const decision = await Decision.findOne({ case: caseId });
    if (!decision) {
      return res.status(404).json({ error: "No decision found to respond to." });
    }

    const partyKey = isClaimant ? "A" : "B";
    decision.partyResponses[partyKey] = response;
    await decision.save();

    // If both have accepted, we can consider dispute resolved
    if (decision.partyResponses.A === "accepted" && decision.partyResponses.B === "accepted") {
      caseDoc.status = "closed";
      await caseDoc.save();

      // Notify both parties that dispute is settled
      try {
        const claimantUser = await User.findById(caseDoc.claimant);
        const respondentUser = caseDoc.respondent ? await User.findById(caseDoc.respondent) : null;
        const caseLink = `${getClientBaseUrl(req)}/cases/${caseDoc._id}`;

        if (claimantUser && claimantUser.email) {
          await sendDisputeResolvedEmail({
            recipientEmail: claimantUser.email,
            recipientName: claimantUser.name,
            caseTitle: caseDoc.title,
            caseLink,
          });
        }
        const respEmail = respondentUser?.email || caseDoc.respondentEmail;
        if (respEmail) {
          await sendDisputeResolvedEmail({
            recipientEmail: respEmail,
            recipientName: respondentUser?.name || "Respondent",
            caseTitle: caseDoc.title,
            caseLink,
          });
        }
      } catch (resolvedErr) {
        console.error("[Email Notification Warning] Failed to notify of dispute settlement:", resolvedErr.message);
      }
    }

    res.status(200).json({
      message: `Your response ('${response}') has been recorded.`,
      partyResponses: decision.partyResponses,
      caseStatus: caseDoc.status,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to record response: " + error.message });
  }
};

/**
 * Edit Dispute Details:
 * Claimant can edit title, category, and amountInDispute before case has reached final decided/closed states.
 */
export const updateCase = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, amountInDispute } = req.body;
    const userId = req.user._id.toString();

    const caseDoc = await Case.findById(id);
    if (!caseDoc) {
      return res.status(404).json({ error: "Case not found." });
    }

    if (caseDoc.claimant.toString() !== userId) {
      return res.status(403).json({ error: "Only the claimant who initiated the dispute can edit its details." });
    }

    if (["decided", "closed"].includes(caseDoc.status)) {
      return res.status(400).json({ error: "Cannot modify a dispute that is already decided or closed." });
    }

    if (title && title.trim()) {
      caseDoc.title = title.trim();
    }
    if (category) {
      caseDoc.category = category;
    }
    if (amountInDispute !== undefined) {
      caseDoc.amountInDispute = Number(amountInDispute) || 0;
    }

    await caseDoc.save();

    res.status(200).json({
      message: "Dispute details updated successfully.",
      case: caseDoc,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to update case: " + error.message });
  }
};

/**
 * Delete Dispute Case:
 * Claimant can delete a case at any stage (e.g. before start, or once decision is ready, accepted, or closed).
 * Deletion is only blocked while the AI evaluation pipeline is actively running ("evaluating").
 */
export const deleteCase = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id.toString();

    const caseDoc = await Case.findById(id);
    if (!caseDoc) {
      return res.status(404).json({ error: "Case not found." });
    }

    if (caseDoc.claimant.toString() !== userId) {
      return res.status(403).json({ error: "Only the claimant who initiated the dispute can delete it." });
    }

    if (caseDoc.status === "evaluating") {
      return res.status(400).json({ error: "Cannot delete dispute while AI evaluation is actively running." });
    }

    // Clean up physical uploaded evidence files on disk
    try {
      const submissions = await Submission.find({ case: id });
      for (const sub of submissions) {
        for (const item of sub.evidence || []) {
          if (item.fileUrl) {
            const filePath = getEvidenceFilePath(item.fileUrl);
            if (filePath && fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          }
        }
      }
    } catch (fileErr) {
      console.warn("[File Cleanup Warning]:", fileErr.message);
    }

    // Clean up associated submissions, decisions, and the case document
    await Submission.deleteMany({ case: id });
    await Decision.deleteMany({ case: id });
    await Case.findByIdAndDelete(id);

    res.status(200).json({ message: "Dispute and all associated records deleted successfully." });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete case: " + error.message });
  }
};


