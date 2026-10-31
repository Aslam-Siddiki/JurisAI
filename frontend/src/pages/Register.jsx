import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Scale, ArrowRight, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function Register() {
  const [searchParams] = useSearchParams();
  const queryRole = searchParams.get("role");
  const queryEmail = searchParams.get("email");

  const [name, setName] = useState("");
  const [email, setEmail] = useState(queryEmail || "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(queryRole === "respondent" ? "respondent" : "claimant");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, register } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(name, email, password, role, false);
      navigate("/login", {
        state: {
          registeredEmail: email.trim(),
          message: "Account created successfully! Please sign in with your credentials to continue.",
        },
      });
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex p-3 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20 mb-4">
          <Scale className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Create your JurisAI account</h2>
        <p className="mt-2 text-sm text-slate-400">Join the AI-assisted dispute resolution platform</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 border border-slate-800 py-8 px-6 shadow-xl rounded-2xl sm:px-10">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-slate-300">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                placeholder="Alice Sharma"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                placeholder="alice@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300">Password (min 6 chars)</label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-3 py-2 pr-10 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">I am registering as</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("claimant")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    role === "claimant"
                      ? "bg-sky-500/10 border-sky-500 text-sky-400 ring-1 ring-sky-500"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="font-semibold text-xs text-white">Claimant</div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-tight">Filing a dispute or claim</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("respondent")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    role === "respondent"
                      ? "bg-sky-500/10 border-sky-500 text-sky-400 ring-1 ring-sky-500"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="font-semibold text-xs text-white">Respondent</div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-tight">Responding to an existing claim</div>
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                Note: If someone has invited you to a dispute, your account automatically links to that case and assigns you the Respondent role upon registration.
              </p>
            </div>


            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 transition-colors"
            >
              {loading ? "Creating Account..." : "Create Account"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            Already have an account?{" "}
            <Link to="/login" className="text-sky-400 hover:text-sky-300 font-medium">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
