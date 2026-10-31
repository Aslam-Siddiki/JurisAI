import mongoose from "mongoose";

const evidenceItemSchema = new mongoose.Schema({
  id: {
    type: String, // e.g. "A-1", "B-2"
    required: true,
  },
  type: {
    type: String,
    enum: ["document", "image", "chat", "receipt", "other"],
    default: "other",
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  fileName: {
    type: String,
    default: null,
  },
  fileUrl: {
    type: String,
    default: null,
  },
  extractedText: {
    type: String,
    default: "",
  },
});

const submissionSchema = new mongoose.Schema(
  {
    case: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Case",
      required: true,
    },
    party: {
      type: String,
      enum: ["A", "B"],
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    statement: {
      type: String,
      required: [true, "Statement is required"],
      maxlength: [3000, "Statement cannot exceed 3000 characters"],
      trim: true,
    },
    desiredOutcome: {
      type: String,
      trim: true,
      default: "",
    },
    evidence: [evidenceItemSchema],
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Guarantee each party can only submit ONCE per case (Strict lock)
submissionSchema.index({ case: 1, party: 1 }, { unique: true });

export const Submission = mongoose.model("Submission", submissionSchema);
