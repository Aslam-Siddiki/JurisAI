import { Case } from "../models/Case.js";
import { Submission } from "../models/Submission.js";

/**
 * Submit statement and evidence files
 * Locked after submission: only 1 submission allowed per party.
 */
export const createSubmission = async (req, res) => {
  try {
    const { id: caseId } = req.params;
    const userId = req.user._id.toString();
    const { statement, desiredOutcome, evidenceDescriptions, evidenceTypes } = req.body;

    if (!statement || statement.trim().length === 0) {
      return res.status(400).json({ error: "Statement is required." });
    }

    if (statement.length > 3000) {
      return res.status(400).json({ error: "Statement cannot exceed 3000 characters." });
    }

    const caseDoc = await Case.findById(caseId);
    if (!caseDoc) {
      return res.status(404).json({ error: "Dispute case not found." });
    }

    // Identify party role
    let party = null;
    if (caseDoc.claimant.toString() === userId) {
      party = "A";
    } else if (caseDoc.respondent && caseDoc.respondent.toString() === userId) {
      party = "B";
    } else {
      return res.status(403).json({ error: "Forbidden: You are not a participant in this case." });
    }

    // Check if case is open for submissions
    if (caseDoc.status !== "awaiting_submissions" && caseDoc.status !== "invited") {
      return res.status(400).json({ error: `Submissions are closed for this case (Status: ${caseDoc.status}).` });
    }

    // Check if this party has ALREADY submitted (Lock enforcement)
    const existingSubmission = await Submission.findOne({ case: caseId, party });
    if (existingSubmission) {
      return res.status(409).json({ error: "You have already submitted your statement and evidence. Submissions are locked." });
    }

    // Parse uploaded evidence files
    const parsedDescriptions = evidenceDescriptions ? (Array.isArray(evidenceDescriptions) ? evidenceDescriptions : [evidenceDescriptions]) : [];
    const parsedTypes = evidenceTypes ? (Array.isArray(evidenceTypes) ? evidenceTypes : [evidenceTypes]) : [];

    const evidenceItems = (req.files || []).map((file, index) => ({
      id: `${party}-${index + 1}`,
      type: parsedTypes[index] || "document",
      description: parsedDescriptions[index] || file.originalname,
      fileName: file.originalname,
      fileUrl: `/uploads/${file.filename}`,
      extractedText: "",
    }));

    const submission = await Submission.create({
      case: caseId,
      party,
      author: req.user._id,
      statement: statement.trim(),
      desiredOutcome: desiredOutcome ? desiredOutcome.trim() : "",
      evidence: evidenceItems,
    });

    // Update case submissions tracker
    if (party === "A") {
      caseDoc.submissions.claimantSubmitted = true;
    } else {
      caseDoc.submissions.respondentSubmitted = true;
    }

    // If both have submitted, automatically transition status to ready_for_evaluation
    if (caseDoc.submissions.claimantSubmitted && caseDoc.submissions.respondentSubmitted) {
      caseDoc.status = "ready_for_evaluation";
    }
    await caseDoc.save();

    res.status(201).json({
      message: "Submission received and locked.",
      party,
      submissionId: submission._id,
      caseStatus: caseDoc.status,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to submit statement: " + error.message });
  }
};

/**
 * Get own submission.
 * STRICT CONFIDENTIALITY GATE:
 * A party is FORBIDDEN from reading the other party's submission before a decision exists!
 */
export const getMySubmission = async (req, res) => {
  try {
    const { id: caseId } = req.params;
    const userId = req.user._id.toString();

    const caseDoc = await Case.findById(caseId);
    if (!caseDoc) {
      return res.status(404).json({ error: "Case not found." });
    }

    let party = null;
    if (caseDoc.claimant.toString() === userId) {
      party = "A";
    } else if (caseDoc.respondent && caseDoc.respondent.toString() === userId) {
      party = "B";
    } else {
      return res.status(403).json({ error: "Forbidden: You are not an authorized participant." });
    }

    // Fetch ONLY the requesting user's own submission
    const mySub = await Submission.findOne({ case: caseId, party });

    res.status(200).json({
      party,
      submitted: !!mySub,
      submission: mySub || null,
      counterpartySubmitted: party === "A" ? caseDoc.submissions.respondentSubmitted : caseDoc.submissions.claimantSubmitted,
      caseStatus: caseDoc.status,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve submission: " + error.message });
  }
};
