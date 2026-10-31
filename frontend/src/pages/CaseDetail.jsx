import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/client";
import {
  Scale,
  ArrowLeft,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  FileUp,
  Lock,
  EyeOff,
  Sparkles,
  Play,
  RotateCw,
  Edit3,
  Trash2,
  X,
  Save,
  Copy,
  Check,
  Mail,
  Share2,
  Eye,
  ExternalLink,
} from "lucide-react";
import DecisionReportView from "../components/DecisionReportView";
import { openGmailComposer, generateInviteEmailContent } from "../utils/inviteEmail";
import DeleteCaseModal from "../components/DeleteCaseModal";
import ConfirmModal from "../components/ConfirmModal";

export default function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [submissionData, setSubmissionData] = useState(null);
  const [decisionData, setDecisionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [resendingInvite, setResendingInvite] = useState(false);
  const [resendSuccess, setResendSuccess] = useState("");
  const [resendError, setResendError] = useState("");
  const [showEmailPreviewModal, setShowEmailPreviewModal] = useState(false);
  const [copiedEmailText, setCopiedEmailText] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [actionFeedbackModal, setActionFeedbackModal] = useState(null);

  // Edit Dispute State
  const [isEditingCase, setIsEditingCase] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("Payment");
  const [editAmount, setEditAmount] = useState("");
  const [editCaseLoading, setEditCaseLoading] = useState(false);
  const [editCaseError, setEditCaseError] = useState("");

  // Evaluation trigger state
  const [evaluating, setEvaluating] = useState(false);
  const [evalError, setEvalError] = useState("");
  const [responding, setResponding] = useState(false);

  // Submission Form State
  const [statement, setStatement] = useState("");
  const [desiredOutcome, setDesiredOutcome] = useState("");
  const [files, setFiles] = useState([]);
  const [fileDescriptions, setFileDescriptions] = useState(["", "", ""]);
  const [fileTypes, setFileTypes] = useState(["receipt", "chat", "document"]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const fetchDecision = async () => {
    try {
      const res = await api.get(`/cases/${id}/decision`);
      setDecisionData(res.data.decision);
    } catch (err) {
      // 404 is expected if decision does not exist yet
      setDecisionData(null);
    }
  };

  const fetchCase = async () => {
    try {
      const res = await api.get(`/cases/${id}`);
      setCaseData(res.data.case);
      setUserRole(res.data.userRole);

      if (res.data.inviteLink) {
        setInviteLink(res.data.inviteLink);
      } else if (res.data.case?.inviteToken) {
        setInviteLink(`${window.location.origin}/invite/${res.data.case.inviteToken}`);
      }

      // Fetch own submission state
      const subRes = await api.get(`/cases/${id}/submission`);
      setSubmissionData(subRes.data);

      // Fetch decision if status indicates decided or review
      if (res.data.case.status === "decided" || res.data.case.status === "needs_review" || res.data.case.status === "closed" || res.data.case.decision) {
        await fetchDecision();
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setError("403 Forbidden: You are not authorized to view this dispute case.");
      } else {
        setError(err.response?.data?.error || "Failed to load case details.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCase();
  }, [id]);

  const handleCopyInviteLink = () => {
    const linkToCopy = inviteLink || (caseData?.inviteToken ? `${window.location.origin}/invite/${caseData.inviteToken}` : "");
    if (!linkToCopy) return;
    navigator.clipboard.writeText(linkToCopy);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const getInviteLinkStr = () => {
    return inviteLink || (caseData?.inviteToken ? `${window.location.origin}/invite/${caseData.inviteToken}` : "");
  };

  const getEmailContent = () => {
    return generateInviteEmailContent({
      respondentName: caseData?.respondent?.name || caseData?.respondentEmail?.split("@")[0],
      respondentEmail: caseData?.respondentEmail,
      claimantName: caseData?.claimant?.name || "Claimant",
      caseTitle: caseData?.title,
      category: caseData?.category,
      amountInDispute: caseData?.amountInDispute,
      inviteLink: getInviteLinkStr(),
    });
  };

  const handleSendGmailInvite = () => {
    openGmailComposer({
      respondentName: caseData?.respondent?.name || caseData?.respondentEmail?.split("@")[0],
      respondentEmail: caseData?.respondentEmail,
      claimantName: caseData?.claimant?.name || "Claimant",
      caseTitle: caseData?.title,
      category: caseData?.category,
      amountInDispute: caseData?.amountInDispute,
      inviteLink: getInviteLinkStr(),
    });
  };

  const handleCopyEmailText = () => {
    const { subject, body } = getEmailContent();
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopiedEmailText(true);
    setTimeout(() => setCopiedEmailText(false), 2500);
  };

  const handleResendInvite = async () => {
    setResendingInvite(true);
    setResendSuccess("");
    setResendError("");
    try {
      const res = await api.post(`/cases/${id}/invite`);
      if (res.data.inviteLink) {
        setInviteLink(res.data.inviteLink);
      }
      setResendSuccess("Invite link refreshed! You can copy the link below.");
      await fetchCase();
    } catch (err) {
      setResendError(err.response?.data?.error || "Failed to refresh invite.");
    } finally {
      setResendingInvite(false);
    }
  };

  const [respondentActionLoading, setRespondentActionLoading] = useState(false);
  const [respondentActionError, setRespondentActionError] = useState("");

  const handleAcceptDispute = async () => {
    setRespondentActionError("");
    setRespondentActionLoading(true);
    try {
      await api.post(`/cases/${id}/accept`);
      await fetchCase();
    } catch (err) {
      setRespondentActionError(err.response?.data?.error || "Failed to accept dispute.");
    } finally {
      setRespondentActionLoading(false);
    }
  };

  const handleOpenDeclineModal = () => {
    setRespondentActionError("");
    setShowDeclineModal(true);
  };

  const handleConfirmDeclineDispute = async () => {
    setRespondentActionError("");
    setRespondentActionLoading(true);
    try {
      await api.post(`/cases/${id}/decline`);
      navigate("/dashboard");
    } catch (err) {
      setRespondentActionError(err.response?.data?.error || "Failed to decline dispute.");
      setRespondentActionLoading(false);
    }
  };

  const handleTriggerEvaluation = async () => {
    setEvalError("");
    setEvaluating(true);
    try {
      const res = await api.post(`/cases/${id}/evaluate`);
      if (res.data.decision) {
        setDecisionData(res.data.decision);
      }
      await fetchCase();
    } catch (err) {
      setEvalError(err.response?.data?.error || "AI evaluation failed. Please verify that the AI service is running.");
    } finally {
      setEvaluating(false);
    }
  };

  const handleRespondToDecision = async (response) => {
    setResponding(true);
    try {
      await api.post(`/cases/${id}/decision/respond`, { response });
      await fetchCase();
      await fetchDecision();
    } catch (err) {
      setActionFeedbackModal({
        title: "Action Could Not Be Completed",
        message: err.response?.data?.error || "Failed to submit decision response.",
        type: "danger",
      });
    } finally {
      setResponding(false);
    }
  };


  const openEditModal = () => {
    setEditTitle(caseData.title || "");
    setEditCategory(caseData.category || "Payment");
    setEditAmount(caseData.amountInDispute?.toString() || "0");
    setEditCaseError("");
    setIsEditingCase(true);
  };

  const handleUpdateCaseDetails = async (e) => {
    e.preventDefault();
    setEditCaseError("");
    setEditCaseLoading(true);
    try {
      await api.put(`/cases/${id}`, {
        title: editTitle.trim(),
        category: editCategory,
        amountInDispute: Number(editAmount) || 0,
      });
      setIsEditingCase(false);
      await fetchCase();
    } catch (err) {
      setEditCaseError(err.response?.data?.error || "Failed to update dispute details.");
    } finally {
      setEditCaseLoading(false);
    }
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletingCase, setIsDeletingCase] = useState(false);
  const [deleteCaseError, setDeleteCaseError] = useState("");

  const handleConfirmDeleteCase = async () => {
    setIsDeletingCase(true);
    setDeleteCaseError("");
    try {
      await api.delete(`/cases/${id}`);
      navigate("/dashboard");
    } catch (err) {
      setDeleteCaseError(err.response?.data?.error || "Failed to delete dispute.");
    } finally {
      setIsDeletingCase(false);
    }
  };

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleDescriptionChange = (index, val) => {
    const updated = [...fileDescriptions];
    updated[index] = val;
    setFileDescriptions(updated);
  };

  const handleTypeChange = (index, val) => {
    const updated = [...fileTypes];
    updated[index] = val;
    setFileTypes(updated);
  };

  const handleSubmitStatement = async (e) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("statement", statement);
      formData.append("desiredOutcome", desiredOutcome);

      files.forEach((file, index) => {
        formData.append("files", file);
        formData.append("evidenceDescriptions", fileDescriptions[index] || file.name);
        formData.append("evidenceTypes", fileTypes[index] || "document");
      });

      await api.post(`/cases/${id}/submission`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await fetchCase();
    } catch (err) {
      setSubmitError(err.response?.data?.error || "Failed to submit statement and evidence.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">Loading case details...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="p-3 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20 mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-sm text-slate-400 max-w-md mb-6">{error}</p>
        <button
          onClick={() => navigate("/dashboard")}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors border border-slate-700"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 flex flex-col items-center">
      <div className="max-w-4xl w-full space-y-6">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        {/* Case Info Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 font-mono border border-sky-500/20">
                  {caseData.category}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  You are: <strong className="text-slate-200 capitalize">{userRole} (Party {userRole === "claimant" ? "A" : "B"})</strong>
                </span>
              </div>
              <h1 className="text-2xl font-bold text-white">{caseData.title}</h1>
            </div>

            <div className="flex items-center gap-3">
              {caseData.amountInDispute > 0 && (
                <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-right">
                  <span className="text-xs text-slate-400 block">Amount in Dispute</span>
                  <span className="text-lg font-bold text-emerald-400">₹{caseData.amountInDispute.toLocaleString()}</span>
                </div>
              )}

              {/* Edit Dispute controls for Claimant (if not finalized) */}
              {userRole === "claimant" && !["decided", "closed"].includes(caseData.status) && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={openEditModal}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors"
                    title="Edit Dispute Details"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  {caseData.status !== "evaluating" && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowDeleteModal(true);
                        setDeleteCaseError("");
                      }}
                      className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/30 transition-colors cursor-pointer"
                      title="Delete Dispute"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800/80 text-xs text-slate-300">
            <div>
              <span className="text-slate-500 block mb-0.5">Claimant (Party A)</span>
              <strong>{caseData.claimant?.name}</strong> ({caseData.claimant?.email})
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">Respondent (Party B)</span>
              <strong>{caseData.respondent?.name || "Pending Acceptance"}</strong> ({caseData.respondentEmail})
            </div>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Dispute Status Tracker</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-slate-200">1. Case Created</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Filed by Claimant</p>
              </div>
            </div>

            <div className={`p-3.5 rounded-xl bg-slate-950 border ${caseData.inviteStatus === "accepted" ? "border-emerald-500/30 text-emerald-300" : "border-slate-800 text-slate-400"} flex items-start gap-3`}>
              {caseData.inviteStatus === "accepted" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="text-xs font-semibold text-slate-200">2. Invite Accepted</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 capitalize">{caseData.inviteStatus}</p>
              </div>
            </div>

            <div className={`p-3.5 rounded-xl bg-slate-950 border ${["ready_for_evaluation", "evaluating", "decided", "needs_review", "closed"].includes(caseData.status) ? "border-emerald-500/30 text-emerald-300" : "border-slate-800 text-slate-400"} flex items-start gap-3`}>
              {caseData.submissions?.claimantSubmitted && caseData.submissions?.respondentSubmitted ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <Clock className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="text-xs font-semibold text-slate-200">3. Both Submissions</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  A: {caseData.submissions?.claimantSubmitted ? "Done" : "Pending"} | B: {caseData.submissions?.respondentSubmitted ? "Done" : "Pending"}
                </p>
              </div>
            </div>

            {(() => {
              const hasDecision = Boolean(decisionData || caseData.decision || ["decided", "needs_review", "closed"].includes(caseData.status));
              return (
                <div className={`p-3.5 rounded-xl bg-slate-950 border ${hasDecision ? "border-emerald-500/30 text-emerald-300" : "border-slate-800 text-slate-400"} flex items-start gap-3`}>
                  {hasDecision ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">4. AI Decision</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {hasDecision
                        ? (caseData.status === "closed" ? "Accepted & Closed" : "Decision Declared")
                        : (evaluating ? "Evaluating..." : "Awaiting")}
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Confidentiality Gate Notice */}
        <div className="p-4 rounded-xl bg-sky-950/20 border border-sky-800/30 text-xs text-sky-300 flex items-start gap-3">
          <EyeOff className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <span>
            <strong>Confidentiality Rule Enforced:</strong> As required by the JurisAI spec, each party's evidence and statement are strictly locked from the opposing side until the final evaluation report is generated.
          </span>
        </div>

        {/* Evaluation Action Banner (When both parties submitted) */}
        {(caseData.status === "ready_for_evaluation" || caseData.status === "evaluating") && !decisionData && (
          <div className="p-6 rounded-2xl bg-gradient-to-r from-sky-950/40 via-indigo-950/40 to-slate-900 border border-sky-800/40 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-sky-400 font-semibold text-xs uppercase tracking-wider mb-1">
                  <Sparkles className="w-4 h-4" />
                  Ready for Advisory Resolution
                </div>
                <h3 className="text-base font-bold text-white">Both Statements & Evidence Submitted</h3>
                <p className="text-xs text-slate-300 mt-1 max-w-xl">
                  Both parties have completed their confidential submissions. Either party may now trigger the JurisAI pipeline to weigh evidentiary proofs and synthesize an explainable verdict.
                </p>
              </div>

              <button
                type="button"
                disabled={evaluating}
                onClick={handleTriggerEvaluation}
                className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-xs font-bold text-white bg-sky-500 hover:bg-sky-400 disabled:opacity-50 transition-all shadow-lg shadow-sky-950 hover:scale-[1.02]"
              >
                {evaluating ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    Running 6-Stage AI Evaluation...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    Trigger AI Evaluation
                  </>
                )}
              </button>
            </div>

            {evalError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{evalError}</span>
              </div>
            )}
          </div>
        )}

        {/* Loading state during active evaluation */}
        {evaluating && (
          <div className="p-10 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-sky-500 border-t-transparent animate-spin mx-auto" />
            <h4 className="text-sm font-semibold text-white">JurisAI Pipeline in Progress</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Extracting facts, executing FAISS legal retrieval, computing tripartite evidence scores, checking swap-test order invariance, and generating advisory verdict.
            </p>
          </div>
        )}

        {/* Render Decision Report View (When decision exists) */}
        {decisionData && (
          <DecisionReportView
            decision={decisionData}
            caseData={caseData}
            userRole={userRole}
            onRespond={handleRespondToDecision}
            responding={responding}
            onReevaluate={handleTriggerEvaluation}
            evaluating={evaluating}
          />
        )}

        {/* Section: Submissions Area */}
        {submissionData?.submitted ? (

          /* User has already submitted: Show locked summary */
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Your Submission (Locked)</h3>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Submitted on {new Date(submissionData.submission.submittedAt).toLocaleDateString()}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-xs text-slate-400 block font-medium mb-1">Your Issue Statement:</span>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {submissionData.submission.statement}
                </div>
              </div>

              {submissionData.submission.desiredOutcome && (
                <div>
                  <span className="text-xs text-slate-400 block font-medium mb-1">Your Desired Outcome:</span>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300">
                    {submissionData.submission.desiredOutcome}
                  </div>
                </div>
              )}

              {submissionData.submission.evidence?.length > 0 && (
                <div>
                  <span className="text-xs text-slate-400 block font-medium mb-2">Uploaded Evidence ({submissionData.submission.evidence.length} items):</span>
                  <div className="grid gap-2">
                    {submissionData.submission.evidence.map((ev) => (
                      <div key={ev.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sky-400 px-1.5 py-0.5 bg-sky-500/10 rounded">{ev.id}</span>
                          <span className="text-slate-200">{ev.description}</span>
                          <span className="text-slate-500 capitalize">({ev.type})</span>
                        </div>
                        {ev.fileName && <span className="text-slate-400 font-mono text-[11px]">{ev.fileName}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Counterparty status card */}
            <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
              <span className="text-slate-400">Counterparty Submission Status:</span>
              {submissionData.counterpartySubmitted ? (
                <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Received (Confidential)
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                  <Clock className="w-3.5 h-3.5" /> Waiting for submission...
                </span>
              )}
            </div>
          </div>
        ) : caseData.status === "awaiting_submissions" ? (
          /* Submission Form */
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileUp className="w-5 h-5 text-sky-400" />
                Submit Your Statement & Supporting Documents
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                A dispute statement is <span className="text-amber-400 font-semibold">mandatory</span>. Supporting evidence (receipts, agreements, screenshots) is <span className="text-sky-400 font-semibold">optional</span>. Submissions lock immediately once saved.
              </p>
            </div>

            {submitError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitStatement} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
                  <span>
                    Dispute Statement <span className="text-rose-400 font-semibold">* (Mandatory)</span>
                  </span>
                  <span className="text-slate-500 text-[11px]">(max 3000 chars)</span>
                </label>
                <textarea
                  required
                  rows={6}
                  maxLength={3000}
                  value={statement}
                  onChange={(e) => setStatement(e.target.value)}
                  placeholder="Detail your full version of events, transaction history, agreed dates, terms, and what went wrong..."
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <span className="text-[11px] text-slate-500 text-right block">{statement.length} / 3000 characters</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Desired Outcome <span className="text-slate-500 font-normal text-[11px]">(Recommended)</span>
                </label>
                <input
                  type="text"
                  value={desiredOutcome}
                  onChange={(e) => setDesiredOutcome(e.target.value)}
                  placeholder="e.g. Full refund of 50000 INR plus cancellation fee waiver"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Multi-file Evidence Upload - OPTIONAL */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-300">Supporting Evidence & Files</span>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-800 text-sky-400 border border-sky-500/20">Optional</span>
                  </div>
                  <span className="text-[11px] text-slate-500">PDF, JPG, PNG, TXT (Max 5 files)</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  You can proceed without uploading files; the AI engine will evaluate the case based on both parties' statements and statutory law.
                </p>

                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.txt"
                  onChange={handleFileChange}
                  className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-sky-500/10 file:text-sky-400 hover:file:bg-sky-500/20 cursor-pointer"
                />

                {files.length > 0 && (
                  <div className="space-y-2 pt-2">
                    {files.map((file, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex flex-col md:flex-row gap-2 items-center text-xs">
                        <span className="text-slate-300 truncate max-w-[180px] font-mono text-[11px]">{file.name}</span>
                        <select
                          value={fileTypes[i] || "document"}
                          onChange={(e) => handleTypeChange(i, e.target.value)}
                          className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300 text-xs"
                        >
                          <option value="receipt">Receipt / Payment Record</option>
                          <option value="chat">Chat / Message Screenshot</option>
                          <option value="document">Agreement / Document</option>
                          <option value="image">Image / Photo</option>
                          <option value="other">Other</option>
                        </select>
                        <input
                          type="text"
                          value={fileDescriptions[i] || ""}
                          onChange={(e) => handleDescriptionChange(i, e.target.value)}
                          placeholder="Brief description of this evidence"
                          className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs placeholder-slate-600 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting || !statement.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-50 transition-colors shadow-lg shadow-sky-950"
              >
                <Lock className="w-4 h-4" />
                {submitting ? "Submitting & Locking..." : "Submit Confidential Statement" + (files.length > 0 ? " & Evidence" : "")}
              </button>
            </form>
          </div>
        ) : userRole === "respondent" && caseData.inviteStatus === "pending" ? (
          /* Respondent Choice Card: Accept or Decline */
          <div className="bg-slate-900 border border-sky-500/30 rounded-2xl p-6 sm:p-8 shadow-xl space-y-5">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Dispute Settlement Action Required</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  You have been invited by <strong className="text-white">{caseData.claimant?.name}</strong> to resolve this civil dispute. Please choose your course of action:
                </p>
              </div>
            </div>

            {respondentActionError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{respondentActionError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <button
                type="button"
                onClick={handleAcceptDispute}
                disabled={respondentActionLoading}
                className="flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-lg shadow-emerald-950 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                {respondentActionLoading ? "Processing..." : "Accept Dispute & Submit Statement"}
              </button>

              <button
                type="button"
                onClick={handleOpenDeclineModal}
                disabled={respondentActionLoading}
                className="flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-slate-950 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/30 text-slate-300 hover:text-red-400 font-medium text-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                <X className="w-4 h-4" />
                Decline Dispute
              </button>
            </div>
            
            <p className="text-[11px] text-slate-500 text-center">
              Accepting unlocks the confidential evidence submission form for you to state your version of events and upload supporting documents.
            </p>
          </div>
        ) : (
          /* Waiting for respondent to accept (Claimant view) */
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <div>
                  <h4 className="text-sm font-semibold text-white">Awaiting Respondent Acceptance</h4>
                  <p className="text-[11px] text-slate-400">
                    Dispute invitation was created for <strong className="text-sky-300">{caseData.respondentEmail}</strong>
                  </p>
                </div>
              </div>
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                Pending Acceptance
              </span>
            </div>

            {resendSuccess && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{resendSuccess}</span>
              </div>
            )}

            {resendError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{resendError}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-300">
                Single-Use Invitation Link (7-Day Validity):
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex-1 p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-sky-400 select-all truncate">
                  {getInviteLinkStr() || "Generating link..."}
                </div>
                <button
                  type="button"
                  onClick={handleCopyInviteLink}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-medium transition-all shrink-0"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Link
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleSendGmailInvite}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-950 shrink-0 hover:scale-[1.02]"
                  title="Forward pre-filled dispute invitation directly via Gmail"
                >
                  <Mail className="w-4 h-4" />
                  Send Invite via Gmail
                </button>
                <button
                  type="button"
                  onClick={() => setShowEmailPreviewModal(true)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-sky-400 hover:text-sky-300 rounded-xl text-xs font-medium transition-colors shrink-0"
                  title="Preview pre-constructed email text with Claimant and Respondent names"
                >
                  <Eye className="w-4 h-4" />
                  Preview Email
                </button>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-400 border-t border-slate-800/60">
              <p className="text-[11px] leading-relaxed max-w-lg">
                💡 <strong>Tip:</strong> You can copy and send this link directly to the respondent via WhatsApp, message, or email. Additionally, as soon as the respondent registers or logs in with <strong className="text-slate-300">{caseData.respondentEmail}</strong>, this dispute will automatically appear on their dashboard.
              </p>
              <button
                type="button"
                onClick={handleResendInvite}
                disabled={resendingInvite}
                className="shrink-0 text-xs text-slate-400 hover:text-sky-400 flex items-center gap-1.5 transition-colors"
              >
                <RotateCw className={`w-3.5 h-3.5 ${resendingInvite ? "animate-spin" : ""}`} />
                {resendingInvite ? "Refreshing..." : "Refresh / Re-issue Link"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Dispute Modal */}
      {isEditingCase && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-bold text-white">Edit Dispute Information</h3>
              </div>
              <button
                onClick={() => setIsEditingCase(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editCaseError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editCaseError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateCaseDetails} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Dispute Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="Payment">Payment</option>
                  <option value="Goods/Service">Goods/Service</option>
                  <option value="Rental/Deposit">Rental/Deposit</option>
                  <option value="Contract">Contract</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Amount in Dispute (₹ INR)</label>
                <input
                  type="number"
                  min="0"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditingCase(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editCaseLoading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg font-semibold transition-all disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {editCaseLoading ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Pre-Constructed Email Preview Modal */}
      {showEmailPreviewModal && caseData && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Pre-Constructed Dispute Invitation Email</h3>
                  <p className="text-[11px] text-slate-400">Ready to forward directly to Respondent via Gmail</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEmailPreviewModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 font-medium">To:</span>
                <span className="font-mono text-sky-300 font-semibold">{caseData.respondentEmail}</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 font-medium">Subject:</span>
                <span className="text-slate-200 font-medium">{getEmailContent().subject}</span>
              </div>
              <div>
                <span className="block text-[11px] text-slate-400 font-medium mb-1">Email Body:</span>
                <textarea
                  readOnly
                  rows={10}
                  value={getEmailContent().body}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-sans text-xs leading-relaxed focus:outline-none select-all"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleCopyEmailText}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-colors"
              >
                {copiedEmailText ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Copied Email Text!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Email Text
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowEmailPreviewModal(false)}
                  className="px-3.5 py-2 bg-slate-950 hover:bg-slate-800 text-slate-400 text-xs font-medium rounded-xl border border-slate-800 transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleSendGmailInvite();
                    setShowEmailPreviewModal(false);
                  }}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-md transition-all hover:scale-[1.02]"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Forward via Gmail
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* In-Screen Delete Confirmation Modal */}
      {caseData && (
        <DeleteCaseModal
          isOpen={showDeleteModal}
          caseInfo={{
            id,
            title: caseData.title,
            amount: caseData.amountInDispute || 0,
            category: caseData.category,
          }}
          onClose={() => {
            if (!isDeletingCase) setShowDeleteModal(false);
          }}
          onConfirm={handleConfirmDeleteCase}
          isDeleting={isDeletingCase}
          error={deleteCaseError}
        />
      )}

      {/* In-Screen Decline Dispute Confirmation Dialog */}
      <ConfirmModal
        isOpen={showDeclineModal}
        title="Decline Dispute Request?"
        description="Are you sure you want to decline to participate in this dispute?"
        warningDetails={[
          "Declining will close this civil dispute case permanently.",
          "Neither party will be able to submit statements or proceed with AI evaluation on JurisAI.",
        ]}
        confirmText="Decline & Close Dispute"
        cancelText="Cancel"
        type="warning"
        isLoading={respondentActionLoading}
        error={respondentActionError}
        onConfirm={handleConfirmDeclineDispute}
        onClose={() => {
          if (!respondentActionLoading) setShowDeclineModal(false);
        }}
      />

      {/* In-Screen Action Feedback Dialog */}
      {actionFeedbackModal && (
        <ConfirmModal
          isOpen={true}
          title={actionFeedbackModal.title}
          description={actionFeedbackModal.message}
          confirmText="Dismiss"
          cancelText="Close"
          type={actionFeedbackModal.type || "danger"}
          onConfirm={() => setActionFeedbackModal(null)}
          onClose={() => setActionFeedbackModal(null)}
        />
      )}
    </div>
  );
}
