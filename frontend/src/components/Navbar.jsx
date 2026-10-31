import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Scale,
  Plus,
  LogOut,
  LayoutDashboard,
  Shield,
  User,
  Settings,
  Menu,
  X,
  FileText,
  Home,
} from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="p-2 bg-gradient-to-tr from-sky-600 to-indigo-600 text-white rounded-xl shadow-md shadow-sky-950 group-hover:scale-105 transition-transform">
                <Scale className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-bold text-white tracking-tight">JurisAI</span>
                  <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    ADR
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 -mt-0.5 hidden sm:block">Resolve. Explain. Move on.</span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-1 ml-6 pl-6 border-l border-slate-800 text-xs">
              <Link
                to="/"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors font-medium ${
                  isActive("/")
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
                }`}
              >
                <Home className="w-4 h-4" />
                Home
              </Link>

              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors font-medium ${
                      isActive("/dashboard")
                        ? "bg-slate-800 text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <Link
                    to="/cases/new"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors font-medium ${
                      isActive("/cases/new")
                        ? "bg-slate-800 text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    New Dispute
                  </Link>
                </>
              ) : (
                <a
                  href="/#how-it-works"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-850"
                >
                  How It Works
                </a>
              )}
            </div>
          </div>

          {/* Desktop Right Side Controls */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link
                  to="/cases/new"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white rounded-lg transition-all shadow-md shadow-sky-950 hover:shadow-sky-900/50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  File Dispute
                </Link>

                {/* User Profile Pill / Menu */}
                <div className="relative">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all text-xs"
                  >
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-white font-bold text-xs uppercase shadow-inner">
                      {user.name ? user.name[0] : "U"}
                    </div>
                    <div className="text-left hidden lg:block">
                      <div className="font-semibold text-slate-200 leading-none">{user.name}</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[120px] leading-tight mt-0.5">{user.email}</div>
                    </div>
                  </button>

                  {/* Profile Dropdown */}
                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-1 text-xs text-slate-300 z-50 divide-y divide-slate-800 animate-in fade-in zoom-in-95">
                      <div className="p-3">
                        <div className="font-semibold text-white">{user.name}</div>
                        <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
                        <span className="inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Active Participant
                        </span>
                      </div>
                      <div className="p-1">
                        <Link
                          to="/dashboard"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-sky-400" />
                          My Dispute Cases
                        </Link>
                        <Link
                          to="/cases/new"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 transition-colors"
                        >
                          <Plus className="w-4 h-4 text-emerald-400" />
                          File New Claim
                        </Link>
                        <Link
                          to="/profile"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 transition-colors"
                        >
                          <Settings className="w-4 h-4 text-indigo-400" />
                          Account Settings
                        </Link>
                      </div>
                      <div className="p-1">
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-rose-500/10 text-rose-400 transition-colors text-left font-medium"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 text-xs">
                <Link
                  to="/login"
                  className={`px-3.5 py-1.5 rounded-lg transition-colors font-medium ${
                    isActive("/login")
                      ? "bg-slate-800 text-white"
                      : "text-slate-300 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 rounded-lg font-semibold text-white bg-sky-600 hover:bg-sky-500 transition-colors shadow-sm shadow-sky-950"
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            {user && (
              <Link
                to="/cases/new"
                className="p-2 text-white bg-sky-600 rounded-lg"
                title="New Dispute"
              >
                <Plus className="w-4 h-4" />
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900/95 px-4 pt-3 pb-5 space-y-3 text-xs">
          {user ? (
            <>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center font-bold text-white text-xs">
                  {user.name ? user.name[0] : "U"}
                </div>
                <div>
                  <div className="font-semibold text-white">{user.name}</div>
                  <div className="text-[11px] text-slate-400 truncate max-w-[200px]">{user.email}</div>
                </div>
              </div>

              <div className="space-y-1">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 p-2.5 rounded-lg font-medium transition-colors ${
                    isActive("/") ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <Home className="w-4 h-4 text-sky-400" />
                  Home
                </Link>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 p-2.5 rounded-lg font-medium transition-colors ${
                    isActive("/dashboard") ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-sky-400" />
                  My Dispute Dashboard
                </Link>
                <Link
                  to="/cases/new"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 p-2.5 rounded-lg font-medium transition-colors ${
                    isActive("/cases/new") ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <Plus className="w-4 h-4 text-emerald-400" />
                  File New Dispute
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 p-2.5 rounded-lg font-medium transition-colors ${
                    isActive("/profile") ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <Settings className="w-4 h-4 text-indigo-400" />
                  Account Settings
                </Link>
              </div>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center justify-center gap-2 p-2.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </>
          ) : (
            <div className="space-y-2 pt-1">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 p-2.5 bg-slate-800 text-slate-200 rounded-lg font-medium transition-colors"
              >
                <Home className="w-4 h-4 text-sky-400" />
                Home
              </Link>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center p-2.5 bg-slate-800 text-slate-200 rounded-lg font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center p-2.5 bg-sky-600 text-white rounded-lg font-semibold transition-colors shadow-md shadow-sky-950"
              >
                Create Account (Sign Up)
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
