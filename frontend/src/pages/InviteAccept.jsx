import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import ConfirmModal from "../components/ConfirmModal";
import {
  Scale,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldAlert,
  ArrowRight,
  Clock,
  UserPlus,
  LogIn,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Check,
} from "lucide-react";

export default function InviteAccept() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, register, login, logout } = useAuth();

  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState(null);

  // Respondent Login / Registration Form State
  const [authMode, setAuthMode] = useState("login"); // "login" | "register"
  const [regName, setRegName] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Fetch dispute invite preview
  useEffect(() => {
    let isMounted = true;
    const fetchInviteDetails = async () => {
      try {
        const res = await api.get(`/cases/invite/${token}`);
        if (!isMounted) return;
        const data = res.data;
        setInvite(data);

        // If respondent already has an account or dispute is accepted, default to login
        if (data.respondentHasAccount || data.inviteStatus === "accepted") {
          setAuthMode("login");
        } else {
          setAuthMode("register");
        }
      } catch (err) {
        if (!isMounted) return;
        setError(err.response?.data?.error || "This invitation link is invalid or has expired.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchInviteDetails();
    return () => {
      isMounted = false;
    };
  }, [token]);

  // Enforce Clean Respondent Session:
  // If the logged-in user is NOT the intended respondent (e.g. claimant who filed the case),
  // automatically log them out so the page renders a fresh, clean login page for the respondent.
  useEffect(() => {
    if (invite && user) {
      if (user.email.toLowerCase() !== invite.respondentEmail.toLowerCase()) {
        logout();
      } else if (invite.inviteStatus === "accepted") {
        // If already logged in as the respondent and dispute was accepted, navigate to case
        navigate(`/cases/${invite.caseId}`, { replace: true });
      }
    }
  }, [invite, user]);

  const handleAccept = async () => {
    setError("");
    setActionLoading(true);
    try {
      const res = await api.post(`/cases/invite/${token}/accept`);
      setResultMessage({
        type: "success",
        title: "Invitation Accepted!",
        text: "You have joined the dispute. Both parties can now submit statements and evidence.",
        caseId: res.data.caseId || invite.caseId,
      });
    } catch (err) {
      setError(err.response?.data?.error || "Failed to accept invitation.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleInlineAuthAndAccept = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthSubmitting(true);

    try {
      if (authMode === "register") {
        await register(regName.trim() || "Respondent", invite.respondentEmail, regPassword, "respondent", true);
      } else {
        await login(invite.respondentEmail, regPassword);
      }

      if (invite.inviteStatus === "pending") {
        // Automatically accept dispute on login/registration
        const res = await api.post(`/cases/invite/${token}/accept`);
        setResultMessage({
          type: "success",
          title: "Welcome! Dispute Joined",
          text: "Your account is active and linked to this dispute. You can now submit your confidential statement and evidence.",
          caseId: res.data.caseId || invite.caseId,
        });
      } else {
        // Already accepted -> proceed directly to the case
        navigate(`/cases/${invite.caseId}`, { replace: true });
      }
    } catch (err) {
      setAuthError(err.response?.data?.error || "Authentication failed. Please verify your password.");
    } finally {
      setAuthSubmitting(false);
    }
  };

  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineError, setDeclineError] = useState("");

  const handleOpenDeclineModal = () => {
    setError("");
    setDeclineError("");
    setShowDeclineModal(true);
  };

  const handleConfirmDecline = async () => {
    setError("");
    setDeclineError("");
    setActionLoading(true);
    try {
      await api.post(`/cases/invite/${token}/decline`);
      setShowDeclineModal(false);
      setResultMessage({
        type: "declined",
        title: "Invitation Declined",
        text: "You have declined to participate. The dispute case has been closed.",
      });
    } catch (err) {
      setDeclineError(err.response?.data?.error || "Failed to decline invitation.");
      setError(err.response?.data?.error || "Failed to decline invitation.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-400 text-sm">
        <div className="w-10 h-10 rounded-full border-2 border-sky-500 border-t-transparent animate-spin mb-3" />
        Verifying dispute invitation...
      </div>
    );
  }

  if (resultMessage) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div
          className={`p-4 rounded-2xl mb-4 ${
            resultMessage.type === "success"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-slate-800 text-slate-400"
          }`}
        >
          {resultMessage.type === "success" ? <CheckCircle2 className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{resultMessage.title}</h2>
        <p className="text-sm text-slate-400 max-w-md mb-6">{resultMessage.text}</p>
        {resultMessage.caseId ? (
          <button
            onClick={() => navigate(`/cases/${resultMessage.caseId}`)}
            className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-lg"
          >
            Go to Dispute Case <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg"
          >
            Return to Home
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20 mb-3 shadow-md shadow-sky-950">
            <Scale className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Dispute Resolution Invitation</h2>
          <p className="mt-1 text-xs text-slate-400">JurisAI Explainable Advisory Platform</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {invite && (
            <div className="space-y-5">
              {/* Dispute Summary Card */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    {invite.category}
                  </span>
                  <span
                    className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full border ${
                      invite.inviteStatus === "accepted"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : invite.inviteStatus === "pending"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : "bg-slate-800 text-slate-400 border-slate-700"
                    }`}
                  >
                    {invite.inviteStatus === "accepted" ? "Dispute Active" : `Invite ${invite.inviteStatus}`}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white">{invite.title}</h3>

                <div className="text-xs text-slate-400 space-y-1.5 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Claimant:</span>
                    <strong className="text-slate-200">{invite.claimantName}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Intended Respondent:</span>
                    <strong className="text-sky-300 font-mono text-[11px]">{invite.respondentEmail}</strong>
                  </div>
                  {invite.amountInDispute > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Amount in Dispute:</span>
                      <strong className="text-emerald-400 font-semibold">₹{invite.amountInDispute.toLocaleString()}</strong>
                    </div>
                  )}
                  {invite.inviteStatus === "pending" && (
                    <div className="flex items-center gap-1.5 text-slate-500 pt-1 text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Valid for 7 days</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Notice if Declined or Expired */}
              {invite.inviteStatus === "declined" ? (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-xs text-center space-y-3">
                  <p>This dispute invitation was declined and is closed.</p>
                  <button
                    onClick={() => navigate("/")}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg"
                  >
                    Return to Home
                  </button>
                </div>
              ) : invite.inviteStatus === "expired" ? (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-xs text-center space-y-3">
                  <p>This invitation link has expired. Please contact the claimant to generate a fresh link.</p>
                  <button
                    onClick={() => navigate("/")}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg"
                  >
                    Return to Home
                  </button>
                </div>
              ) : !user ? (
                /* FRESH LOGIN / REGISTRATION FORM FOR RESPONDENT */
                <div className="p-5 rounded-2xl bg-slate-950 border border-sky-800/40 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      {authMode === "register" ? (
                        <UserPlus className="w-4 h-4 text-sky-400" />
                      ) : (
                        <LogIn className="w-4 h-4 text-sky-400" />
                      )}
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        {authMode === "register" ? "Respondent Account Registration" : "Respondent Sign In"}
                      </h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode(authMode === "register" ? "login" : "register");
                        setAuthError("");
                      }}
                      className="text-[11px] text-sky-400 hover:text-sky-300 font-semibold underline underline-offset-2"
                    >
                      {authMode === "register" ? "Already have account? Sign In" : "Need account? Register"}
                    </button>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    This dispute invitation is assigned to{" "}
                    <strong className="text-sky-300 font-mono">{invite.respondentEmail}</strong>.{" "}
                    {authMode === "register"
                      ? "Create your password below to participate and submit your statement."
                      : "Enter your password to sign in and access this dispute."}
                  </p>

                  {authError && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{authError}</span>
                    </div>
                  )}

                  <form onSubmit={handleInlineAuthAndAccept} className="space-y-3.5">
                    {/* Role Selection Option - Explicitly showing Respondent selected */}
                    {authMode === "register" && (
                      <div>
                        <label className="block text-[11px] font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                          <span>I am creating account as:</span>
                          <span className="text-[10px] text-sky-400 font-semibold bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
                            Respondent Selected
                          </span>
                        </label>
                        <div className="grid grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            disabled
                            className="p-2.5 rounded-xl border bg-slate-900/40 border-slate-800/60 text-slate-500 cursor-not-allowed opacity-50 text-left"
                            title="Claimant role is disabled when joining via an invitation link"
                          >
                            <div className="font-semibold text-xs text-slate-400">Claimant</div>
                            <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                              Files disputes (Unavailable)
                            </div>
                          </button>

                          <button
                            type="button"
                            className="p-2.5 rounded-xl border bg-sky-500/10 border-sky-500 text-sky-300 ring-2 ring-sky-500/50 text-left transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-white">Respondent</span>
                              <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                            </div>
                            <div className="text-[10px] text-sky-300 mt-0.5 leading-tight">
                              Responding to this dispute
                            </div>
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>
                            <strong>Respondent</strong> role is automatically selected and locked for this invitation.
                          </span>
                        </p>
                      </div>
                    )}

                    {authMode === "register" && (
                      <div>
                        <label className="block text-[11px] font-medium text-slate-300 mb-1">Your Full Name</label>
                        <input
                          type="text"
                          required
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder="e.g. Salim Churihar"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">
                        Respondent Email Address (Pre-filled)
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          disabled
                          value={invite.respondentEmail}
                          className="w-full px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-lg text-slate-300 text-xs font-mono cursor-not-allowed pl-8"
                        />
                        <Mail className="w-3.5 h-3.5 text-sky-400 absolute left-2.5 top-2.5" />
                        <span className="absolute right-2.5 top-2 text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          Verified Respondent
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">
                        {authMode === "register" ? "Set Password (min 6 characters)" : "Respondent Password"}
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          minLength={authMode === "register" ? 6 : undefined}
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-3 py-2 pl-8 pr-9 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
                        />
                        <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-200"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={authSubmitting}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-sky-500 hover:bg-sky-400 disabled:opacity-50 transition-all shadow-lg shadow-sky-950 mt-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {authSubmitting
                        ? "Authenticating..."
                        : authMode === "register"
                        ? "Create Account & Participate"
                        : invite.inviteStatus === "accepted"
                        ? "Sign In & Open Dispute Case"
                        : "Sign In & Accept Dispute"}
                    </button>
                  </form>

                  {authMode === "register" && (
                    <div className="pt-2 text-center text-[11px] text-slate-400 border-t border-slate-800/80">
                      Prefer dedicated registration page?{" "}
                      <Link
                        to={`/register?role=respondent&email=${encodeURIComponent(invite.respondentEmail)}`}
                        className="text-sky-400 hover:text-sky-300 font-semibold underline underline-offset-2"
                      >
                        Register as Respondent &rarr;
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                /* RESPONDENT IS ALREADY LOGGED IN */
                <div className="space-y-4 pt-2">
                  {invite.inviteStatus === "accepted" ? (
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 space-y-3">
                      <div className="flex items-center gap-2 font-semibold text-emerald-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>You have already joined this dispute</span>
                      </div>
                      <p className="text-slate-300">
                        Logged in as <strong className="text-white font-mono">{user.email}</strong>. Submissions and AI evaluation are active for this case.
                      </p>
                      <button
                        onClick={() => navigate(`/cases/${invite.caseId}`)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-md transition-all"
                      >
                        Open Dispute Case <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Select Your Settlement Action:
                      </div>

                      <div className="space-y-2.5">
                        {/* Choice 1: Accept */}
                        <button
                          onClick={handleAccept}
                          disabled={actionLoading}
                          className="w-full flex items-center justify-between p-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-all shadow-lg shadow-emerald-950/50 group"
                        >
                          <div className="flex items-center gap-2.5">
                            <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
                            <div className="text-left">
                              <div className="font-semibold text-sm">Accept Request & Participate</div>
                              <div className="text-[11px] text-emerald-100 opacity-90">
                                Agree to submit statements, evidence, and view AI resolution
                              </div>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>

                        {/* Choice 2: Keep Pending */}
                        <button
                          onClick={() => navigate("/dashboard")}
                          disabled={actionLoading}
                          className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-slate-300 font-medium text-xs transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                            <div className="text-left">
                              <div className="font-medium text-slate-200">Keep Pending (Decide Later)</div>
                              <div className="text-[11px] text-slate-400">
                                Invitation remains pending. You can respond within 7 days.
                              </div>
                            </div>
                          </div>
                        </button>

                        {/* Choice 3: Decline */}
                        <button
                          type="button"
                          onClick={handleOpenDeclineModal}
                          disabled={actionLoading}
                          className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/30 text-slate-400 hover:text-red-400 font-medium text-xs transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                            <div className="text-left">
                              <div className="font-medium">Decline Request</div>
                              <div className="text-[11px] text-slate-500">
                                Refuse to settle on this platform and close the dispute
                              </div>
                            </div>
                          </div>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* In-Screen Decline Dispute Confirmation Dialog */}
      <ConfirmModal
        isOpen={showDeclineModal}
        title="Decline Dispute Invitation?"
        description="Are you sure you want to decline to participate in this dispute?"
        warningDetails="Declining will close this civil dispute case. No further action or AI resolution will be performed on JurisAI."
        confirmText="Decline & Close Dispute"
        cancelText="Cancel"
        type="warning"
        isLoading={actionLoading}
        error={declineError}
        onConfirm={handleConfirmDecline}
        onClose={() => {
          if (!actionLoading) setShowDeclineModal(false);
        }}
      />
    </div>
  );
}
