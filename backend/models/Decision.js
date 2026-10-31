import mongoose from "mongoose";

const decisionSchema = new mongoose.Schema(
  {
    case: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Case",
      required: true,
      unique: true,
    },
    report: {
      type: Object,
      required: true,
    },
    verdict: {
      type: String,
      enum: ["favours_A", "favours_B", "partial", "needs_human_review"],
      required: true,
    },
    confidence: {
      type: Number,
      required: true,
    },
    needsHumanReview: {
      type: Boolean,
      default: false,
    },
    modelVersion: {
      type: String,
      default: "jurisai-pipeline-v1",
    },
    partyResponses: {
      A: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending",
      },
      B: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending",
      },
    },
  },
  { timestamps: true }
);

export const Decision = mongoose.model("Decision", decisionSchema);
