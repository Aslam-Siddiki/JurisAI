import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import ConfirmModal from "../components/ConfirmModal";
import {
  User,
  Mail,
  Lock,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Eye,
  EyeOff,
  ArrowLeft,
  KeyRound,
  Save,
} from "lucide-react";

export default function Profile() {
  const { user, updateProfile, changePassword, deleteAccount } = useAuth();
  const navigate = useNavigate();

  // Profile Form
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [profileMsg, setProfileMsg] = useState("");
  const [profileErr, setProfileErr] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  // Password Form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwdMsg, setPwdMsg] = useState("");
  const [pwdErr, setPwdErr] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);

  // Delete Account Form
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteErr, setDeleteErr] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState("");

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMsg("");
    setProfileErr("");
    setProfileLoading(true);

    try {
      await updateProfile({ name, email });
      setProfileMsg("Personal details updated successfully.");
    } catch (err) {
      setProfileErr(err.response?.data?.error || "Failed to update profile.");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdMsg("");
    setPwdErr("");

    if (newPassword !== confirmPassword) {
      setPwdErr("New passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setPwdErr("Password must be at least 6 characters.");
      return;
    }

    setPwdLoading(true);
    const userEmail = user?.email || "";
    try {
      await changePassword(currentPassword, newPassword);
      navigate("/login", {
        replace: true,
        state: {
          registeredEmail: userEmail,
          message: "Password updated successfully! Please sign in with your new password.",
        },
      });
    } catch (err) {
      setPwdErr(err.response?.data?.error || "Failed to change password.");
      setPwdLoading(false);
    }
  };

  const handleOpenDeleteModal = () => {
    if (deleteConfirm !== "DELETE") {
      setDeleteErr("Please type DELETE to confirm account removal.");
      return;
    }
    setDeleteErr("");
    setDeleteAccountError("");
    setShowDeleteModal(true);
  };

  const handleConfirmDeleteAccount = async () => {
    setDeleteLoading(true);
    setDeleteAccountError("");
    try {
      await deleteAccount();
      navigate("/");
    } catch (err) {
      setDeleteAccountError(err.response?.data?.error || "Failed to delete account.");
      setDeleteLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 p-6 md:p-10 flex flex-col items-center">
      <div className="max-w-3xl w-full space-y-8">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Account & Security Settings</h1>
            <p className="text-xs text-slate-400 mt-1">Manage your personal credentials, profile identity, and security access.</p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 capitalize font-medium">
            Role: {user?.role || "Claimant"}
          </span>
        </div>

        {/* 1. Edit Personal Details */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Personal Information</h2>
              <p className="text-xs text-slate-400">Update your name and primary email address.</p>
            </div>
          </div>

          {profileMsg && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{profileMsg}</span>
            </div>
          )}

          {profileErr && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{profileErr}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-sky-950"
            >
              <Save className="w-4 h-4" />
              {profileLoading ? "Saving Changes..." : "Save Details"}
            </button>
          </form>
        </div>

        {/* 2. Change Password */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Change Password</h2>
              <p className="text-xs text-slate-400">Ensure your account is using a secure, long password.</p>
            </div>
          </div>

          {pwdMsg && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{pwdMsg}</span>
            </div>
          )}

          {pwdErr && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{pwdErr}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 pr-10 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">New Password (min 6 chars)</label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-10 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Confirm New Password</label>
                <input
                  type={showNew ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={pwdLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-indigo-950"
            >
              <Lock className="w-4 h-4" />
              {pwdLoading ? "Updating Password..." : "Update Password"}
            </button>
          </form>
        </div>

        {/* 3. Delete Account (Danger Zone) */}
        <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-6 sm:p-8 shadow-xl space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-red-500/20">
            <div className="p-2.5 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-red-300">Danger Zone: Delete Account</h2>
              <p className="text-xs text-slate-400">Permanently delete your profile and all associated dispute records.</p>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Deleting your account is permanent. All dispute cases where you are <strong className="text-sky-300">Claimant</strong> or <strong className="text-indigo-300">Respondent</strong> will be permanently deleted for both parties, including all statements, uploaded evidence documents, and AI resolution decisions. To confirm this action, please type <strong className="text-red-400 font-mono">DELETE</strong> in the box below.
          </p>

          {deleteErr && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{deleteErr}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="px-3.5 py-2.5 bg-slate-950 border border-red-900/50 rounded-xl text-slate-100 placeholder-slate-600 text-xs focus:outline-none focus:ring-1 focus:ring-red-500 font-mono sm:w-64"
            />
            <button
              type="button"
              onClick={handleOpenDeleteModal}
              disabled={deleteConfirm !== "DELETE"}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-40 shadow-lg shadow-red-950 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Permanently Delete My Account</span>
            </button>
          </div>
        </div>

        {/* In-Screen Account Deletion Confirmation Dialog */}
        <ConfirmModal
          isOpen={showDeleteModal}
          title="Permanently Delete Account?"
          description="Are you entirely sure? This action is permanent and cannot be undone."
          warningDetails={[
            "Your user login credentials and profile will be permanently deleted.",
            "ALL dispute cases where you are Claimant or Respondent will be permanently erased for both parties.",
            "All statements, uploaded evidence documents, and AI resolution reports will be irreversibly destroyed.",
          ]}
          confirmText="Permanently Delete Account"
          cancelText="Cancel"
          type="danger"
          isLoading={deleteLoading}
          error={deleteAccountError}
          onConfirm={handleConfirmDeleteAccount}
          onClose={() => {
            if (!deleteLoading) setShowDeleteModal(false);
          }}
        />
      </div>
    </div>
  );
}
