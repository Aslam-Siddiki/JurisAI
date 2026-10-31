import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/client";
import { Scale, Plus, LogOut, FileText, Clock, CheckCircle2, AlertTriangle, ArrowRight, Trash2 } from "lucide-react";
import DeleteCaseModal from "../components/DeleteCaseModal";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [caseToDelete, setCaseToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const res = await api.get("/cases");
        setCases(res.data.cases);
      } catch (err) {
        console.error("Failed to load cases:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, []);

  const handleOpenDeleteModal = (c) => {
    setCaseToDelete({
      id: c._id,
      title: c.title,
      amount: c.amountInDispute || 0,
      category: c.category,
    });
    setDeleteError("");
  };

  const handleConfirmDelete = async () => {
    if (!caseToDelete) return;
    setIsDeleting(true);
    setDeleteError("");
    try {
      await api.delete(`/cases/${caseToDelete.id}`);
      setCases((prev) => prev.filter((c) => c._id !== caseToDelete.id));
      setCaseToDelete(null);
    } catch (err) {
      setDeleteError(err.response?.data?.error || "Failed to delete dispute case.");
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "invited":
        return <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">Invited</span>;
      case "awaiting_submissions":
        return <span className="px-2 py-0.5 text-xs rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">Awaiting Evidence</span>;
      case "ready_for_evaluation":
        return <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Ready for AI</span>;
      case "decided":
        return <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Decision Ready</span>;
      default:
        return <span className="px-2 py-0.5 text-xs rounded-full bg-slate-800 text-slate-300">{status}</span>;
    }
  };

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 flex flex-col">
      {/* Sub-header Banner */}
      <div className="border-b border-slate-800 bg-slate-900/40 px-4 sm:px-6 py-6">
        <div className="max-w-5xl w-full mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">Civil ADR Portal</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Live System</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Welcome, {user?.name}</h1>
            <p className="text-xs text-slate-400 mt-1">Manage active dispute proceedings, submit confidential claims, or review AI advisory decisions.</p>
          </div>

          <Link
            to="/cases/new"
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white rounded-xl transition-all shadow-lg shadow-sky-950 hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            Initiate New Dispute
          </Link>
        </div>
      </div>


      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Your Dispute Cases</h2>
            <p className="text-xs text-slate-400">All disputes you are participating in as claimant or respondent</p>
          </div>
          <span className="text-xs text-slate-500 font-mono">{cases.length} Total</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm animate-pulse">Loading disputes...</div>
        ) : cases.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/40">
            <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-300">No active disputes</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Start by filing a new small civil dispute to invite the opposing party and run an explainable AI evaluation.
            </p>
            <Link
              to="/cases/new"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 text-xs font-medium bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              File First Case
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {cases.map((c) => (
              <div
                key={c._id}
                className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 rounded-xl p-5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base font-semibold text-slate-100">{c.title}</h3>
                    {getStatusBadge(c.status)}
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      {c.category}
                    </span>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                        c.claimant?._id === user?.id || c.claimant === user?.id
                          ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                          : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                      }`}
                    >
                      {c.claimant?._id === user?.id || c.claimant === user?.id ? "Claimant" : "Respondent"}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                    <span>Claimant: <strong className="text-slate-300">{c.claimant?.name || "You"}</strong></span>
                    <span>•</span>
                    <span>Respondent: <strong className="text-slate-300">{c.respondentEmail}</strong></span>
                    {c.amountInDispute > 0 && (
                      <>
                        <span>•</span>
                        <span>Amount: <strong className="text-emerald-400">₹{c.amountInDispute.toLocaleString()}</strong></span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/cases/${c._id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700"
                  >
                    View Case
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  {(c.claimant?._id === user?.id || c.claimant === user?.id) && c.status !== "evaluating" && (
                    <button
                      type="button"
                      onClick={() => handleOpenDeleteModal(c)}
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 transition-colors"
                      title="Delete Dispute"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* In-Screen Delete Confirmation Modal */}
        <DeleteCaseModal
          isOpen={!!caseToDelete}
          caseInfo={caseToDelete}
          onClose={() => { if (!isDeleting) setCaseToDelete(null); }}
          onConfirm={handleConfirmDelete}
          isDeleting={isDeleting}
          error={deleteError}
        />
      </main>
    </div>
  );
}
