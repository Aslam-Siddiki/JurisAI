import React from "react";
import { AlertTriangle, Trash2, X, Loader2, ShieldAlert, AlertCircle } from "lucide-react";

/**
 * ConfirmModal — Universal In-Screen Confirmation Dialog
 * Replaces all native browser window.confirm() and window.alert() popups
 * with an elegant, responsive, accessible on-screen UI modal.
 */
export default function ConfirmModal({
  isOpen,
  title = "Are you sure?",
  description,
  warningDetails,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger", // "danger" | "warning" | "info"
  icon: CustomIcon,
  onConfirm,
  onClose,
  isLoading = false,
  error = "",
}) {
  if (!isOpen) return null;

  // Determine color scheme based on dialog type
  const isDanger = type === "danger";
  const isWarning = type === "warning";

  const topGlowColor = isDanger
    ? "from-red-600 via-rose-500 to-amber-600"
    : isWarning
    ? "from-amber-500 via-orange-500 to-yellow-500"
    : "from-sky-500 via-blue-500 to-indigo-500";

  const iconBg = isDanger
    ? "bg-red-500/10 text-red-400 border-red-500/20"
    : isWarning
    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
    : "bg-sky-500/10 text-sky-400 border-sky-500/20";

  const confirmBtnBg = isDanger
    ? "bg-red-600 hover:bg-red-500 text-white shadow-red-600/30"
    : isWarning
    ? "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30"
    : "bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/30";

  const IconComponent =
    CustomIcon ||
    (isDanger ? Trash2 : isWarning ? ShieldAlert : AlertCircle);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 text-slate-100 animate-scale-in">
        {/* Top ambient color glow */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${topGlowColor}`} />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl border shrink-0 ${iconBg}`}>
            <IconComponent className="w-6 h-6" />
          </div>

          <div className="flex-1 pr-6">
            <h3 id="confirm-modal-title" className="text-lg font-bold text-white leading-snug">
              {title}
            </h3>
            {description && (
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Warning details callout (optional list or highlighted text) */}
        {warningDetails && (
          <div
            className={`mt-4 p-3.5 rounded-xl border text-xs text-slate-300 space-y-1.5 ${
              isDanger
                ? "bg-red-950/30 border-red-500/30"
                : isWarning
                ? "bg-amber-950/30 border-amber-500/30"
                : "bg-slate-950/60 border-slate-800"
            }`}
          >
            {Array.isArray(warningDetails) ? (
              <ul className="list-disc pl-5 space-y-1 text-[11px] leading-relaxed">
                {warningDetails.map((detail, idx) => (
                  <li key={idx}>{detail}</li>
                ))}
              </ul>
            ) : (
              <p className="text-[11px] leading-relaxed">{warningDetails}</p>
            )}
          </div>
        )}

        {/* In-Modal Error Display */}
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
            disabled={isLoading}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 rounded-xl border border-slate-700/80 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${confirmBtnBg}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

