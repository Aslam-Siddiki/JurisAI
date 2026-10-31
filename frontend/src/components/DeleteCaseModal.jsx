import React from "react";
import { AlertTriangle, Trash2, X, Loader2, ShieldAlert } from "lucide-react";

/**
 * DeleteCaseModal — In-screen UI confirmation modal for deleting disputes
 * Replaces ugly browser window.confirm alerts with a modern, responsive, centered dialog.
 */
export default function DeleteCaseModal({
  isOpen,
  caseInfo,
  onClose,
  onConfirm,
  isDeleting = false,
  error = "",
}) {
  if (!isOpen || !caseInfo) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 text-slate-100 animate-scale-in">
        {/* Top glowing ambient highlight */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-rose-500 to-amber-600" />

        {/* Close Button (X) */}
        <button
          type="button"
          onClick={onClose}
          disabled={isDeleting}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header with Warning Icon */}
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20 shrink-0">
            <Trash2 className="w-6 h-6" />
          </div>

          <div className="flex-1 pr-6">
            <h3 id="delete-modal-title" className="text-lg font-bold text-white leading-snug">
              Delete Dispute Case?
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              This action is permanent and cannot be undone.
            </p>
          </div>
        </div>

        {/* Target Case Details Pill */}
        {caseInfo.title && (
          <div className="mt-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs space-y-1">
            <div className="text-slate-400">Case Title:</div>
            <div className="font-semibold text-slate-200 truncate">{caseInfo.title}</div>
            {caseInfo.amount > 0 && (
              <div className="text-[11px] text-emerald-400 font-medium">
                Disputed Amount: ₹{Number(caseInfo.amount).toLocaleString()}
              </div>
            )}
          </div>
        )}

        {/* Explicit Warning Callout */}
        <div className="mt-4 p-3.5 rounded-xl bg-red-950/30 border border-red-500/30 text-xs text-slate-300 space-y-2">
          <div className="flex items-center gap-2 text-red-400 font-semibold">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>Permanent Irreversible Action</span>
          </div>
          <ul className="list-disc pl-5 space-y-1 text-slate-300 text-[11px] leading-relaxed">
            <li>
              Case will be completely deleted for <strong className="text-white">both Claimant and Respondent</strong>.
            </li>
            <li>All confidential statements, evidence documents, and AI resolution reports will be destroyed.</li>
            <li>Neither party will be able to access or restore this dispute.</li>
          </ul>
        </div>

        {/* In-Modal Error Message (if any) */}
        {error && (
          <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 rounded-xl border border-slate-700/80 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-xl shadow-lg shadow-red-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting Case...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Permanently Delete</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

