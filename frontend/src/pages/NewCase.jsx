import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import {
  Scale,
  ArrowLeft,
  Send,
  AlertCircle,
  FileUp,
  CheckCircle2,
  Lock,
  Mail,
  Copy,
  Check,
  ArrowRight,
} from "lucide-react";
import { openGmailComposer } from "../utils/inviteEmail";

export default function NewCase() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Payment");
  const [amountInDispute, setAmountInDispute] = useState("");
  const [respondentEmail, setRespondentEmail] = useState("");
  
  // Optional statement & supporting documents on creation
  const [statement, setStatement] = useState("");
  const [desiredOutcome, setDesiredOutcome] = useState("");
  const [files, setFiles] = useState([]);
  const [fileDescriptions, setFileDescriptions] = useState(["", "", ""]);
  const [fileTypes, setFileTypes] = useState(["receipt", "chat", "document"]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState(null);
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCopyLink = () => {
    if (!successData?.inviteLink) return;
    navigator.clipboard.writeText(successData.inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Create the dispute case and dispatch invite
      const res = await api.post("/cases", {
        title: title.trim(),
        category,
        amountInDispute: Number(amountInDispute) || 0,
        respondentEmail: respondentEmail.trim(),
      });

      const caseId = res.data.case._id;
      const inviteLink = res.data.inviteLink;

      // 2. If claimant also provided an initial statement or optional supporting documents, submit it
      if (statement.trim() || files.length > 0) {
        const formData = new FormData();
        formData.append("statement", statement.trim() || "Initial dispute statement filed upon case creation.");
        formData.append("desiredOutcome", desiredOutcome.trim());

        files.forEach((file, index) => {
          formData.append("files", file);
          formData.append("evidenceDescriptions", fileDescriptions[index] || file.name);
          formData.append("evidenceTypes", fileTypes[index] || "document");
        });

        await api.post(`/cases/${caseId}/submission`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      setSuccessData({
        caseId,
        inviteLink,
        title: title.trim(),
        category,
        amountInDispute: Number(amountInDispute) || 0,
        respondentEmail: res.data.case.respondentEmail,
        claimantName: user?.name || "Claimant",
      });
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create dispute case.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 flex flex-col items-center">
      <div className="max-w-2xl w-full">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Create Dispute Case</h1>
              <p className="text-xs text-slate-400">Initiate a dispute and generate an invite link for the counterparty</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successData ? (
            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-4">
              <div className="flex items-center gap-2.5 text-emerald-200">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                <h3 className="text-base font-bold">Dispute Created Successfully!</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Your dispute <strong>"{successData.title}"</strong> has been registered. An invitation link has been generated for{" "}
                <strong className="text-sky-300 font-mono">{successData.respondentEmail}</strong>.
              </p>

              <div className="p-3 bg-slate-950 rounded-xl text-xs font-mono text-emerald-400 break-all select-all border border-emerald-500/20">
                {successData.inviteLink}
              </div>

              {/* Action Buttons: Send via Gmail, Copy Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    openGmailComposer({
                      respondentEmail: successData.respondentEmail,
                      claimantName: successData.claimantName,
                      caseTitle: successData.title,
                      category: successData.category,
                      amountInDispute: successData.amountInDispute,
                      inviteLink: successData.inviteLink,
                    })
                  }
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-950 hover:scale-[1.02]"
                  title="Forward pre-filled dispute invitation directly via Gmail"
                >
                  <Mail className="w-4 h-4" />
                  Send Invite via Gmail
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      Copied Link!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Invite Link
                    </>
                  )}
                </button>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-emerald-500/20 text-xs">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Return to Dashboard
                </button>
                <button
                  onClick={() => navigate(`/cases/${successData.caseId}`)}
                  className="flex items-center gap-1.5 text-sky-400 hover:text-sky-300 font-semibold transition-colors"
                >
                  View Dispute Case <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Dispute Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Unreturned Security Deposit for Flat 402"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Dispute Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Payment">Payment</option>
                    <option value="Goods/Service">Goods/Service</option>
                    <option value="Rental/Deposit">Rental/Deposit</option>
                    <option value="Contract">Contract</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Amount in Dispute (INR, optional)</label>
                  <input
                    type="number"
                    min="0"
                    value={amountInDispute}
                    onChange={(e) => setAmountInDispute(e.target.value)}
                    placeholder="e.g. 25000"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Respondent Email Address</label>
                <input
                  type="email"
                  required
                  value={respondentEmail}
                  onChange={(e) => setRespondentEmail(e.target.value)}
                  placeholder="counterparty@example.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">An invitation link will be created and emailed to this counterparty.</p>
              </div>

              {/* Optional Initial Statement & Supporting Documents */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <FileUp className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-semibold text-slate-200">Supporting Evidence & Statement</span>
                  </div>
                  <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold">Optional</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Your Statement <span className="text-slate-600">(You can also submit this later)</span>
                  </label>
                  <textarea
                    rows={4}
                    maxLength={3000}
                    value={statement}
                    onChange={(e) => setStatement(e.target.value)}
                    placeholder="Briefly describe what happened, dates, agreed terms, and the issue..."
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Desired Settlement Remedy</label>
                  <input
                    type="text"
                    value={desiredOutcome}
                    onChange={(e) => setDesiredOutcome(e.target.value)}
                    placeholder="e.g. Full refund of 15,000 INR"
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                {/* File Attachment */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-medium">Attach Supporting Documents (Receipts, Chats, Agreements)</span>
                    <span className="text-[10px] text-slate-500">PDF, JPG, PNG, TXT</span>
                  </div>

                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.txt"
                    onChange={handleFileChange}
                    className="block w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-sky-500/10 file:text-sky-400 hover:file:bg-sky-500/20 cursor-pointer"
                  />

                  {files.length > 0 && (
                    <div className="space-y-2 pt-2">
                      {files.map((file, i) => (
                        <div key={i} className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex flex-col md:flex-row gap-2 items-center text-xs">
                          <span className="text-slate-300 truncate max-w-[150px] font-mono text-[11px]">{file.name}</span>
                          <select
                            value={fileTypes[i] || "document"}
                            onChange={(e) => handleTypeChange(i, e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300 text-[11px]"
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
                            placeholder="Brief description of document"
                            className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs placeholder-slate-600 focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-sky-500 hover:bg-sky-400 disabled:opacity-50 transition-all shadow-lg shadow-sky-950"
              >
                <Send className="w-4 h-4" />
                {loading ? "Filing Case & Sending Invite..." : "Create Dispute & Send Invite"}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
