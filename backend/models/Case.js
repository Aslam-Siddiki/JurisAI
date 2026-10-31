import mongoose from "mongoose";

const caseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: 120,
    },
    category: {
      type: String,
      enum: ["Payment", "Goods/Service", "Rental/Deposit", "Contract", "Other"],
      default: "Other",
      required: true,
    },
    claimant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    respondent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    respondentEmail: {
      type: String,
      required: [true, "Respondent email is required"],
      lowercase: true,
      trim: true,
    },
    inviteToken: {
      type: String,
      default: null,
    },
    inviteExpiresAt: {
      type: Date,
      default: null,
    },
    inviteStatus: {
      type: String,
      enum: ["pending", "accepted", "declined", "expired"],
      default: "pending",
    },
    amountInDispute: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: [
        "draft",
        "invited",
        "awaiting_submissions",
        "ready_for_evaluation",
        "evaluating",
        "decided",
        "needs_review",
        "closed",
      ],
      default: "invited",
    },
    submissions: {
      claimantSubmitted: {
        type: Boolean,
        default: false,
      },
      respondentSubmitted: {
        type: Boolean,
        default: false,
      },
    },
    decision: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Decision",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Production Database Indexes for high-throughput queries
caseSchema.index({ claimant: 1, createdAt: -1 });
caseSchema.index({ respondent: 1, createdAt: -1 });
caseSchema.index({ respondentEmail: 1 });
caseSchema.index({ inviteToken: 1 });
caseSchema.index({ status: 1 });

export const Case = mongoose.model("Case", caseSchema);
