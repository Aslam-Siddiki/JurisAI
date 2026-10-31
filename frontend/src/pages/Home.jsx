import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Scale,
  ShieldCheck,
  FileText,
  ArrowRight,
  Sparkles,
  Lock,
  GitCompare,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Coins,
  Building,
  Briefcase,
  PackageCheck,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 flex flex-col selection:bg-sky-500 selection:text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32 border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.15),rgba(255,255,255,0))]" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-medium mb-8 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>AI-Assisted Resolution for Small Civil Disputes</span>
            <span className="hidden sm:inline text-slate-600">|</span>
            <span className="hidden sm:inline text-slate-400">Explainable ADR System</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.15] max-w-4xl mx-auto">
            Resolve Civil Disputes.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-300 to-emerald-400">
              Explainable. Impartial. Fast.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            JurisAI is an explainable decision-support platform for small civil disputes — rental security deposits, unpaid invoices, defective goods, and service agreements. Both parties submit evidence confidentially to receive an impartial, deterministic advisory outcome.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-sm transition-all shadow-lg shadow-sky-950 hover:scale-[1.02]"
                >
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/cases/new"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm transition-all"
                >
                  File New Dispute
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-sm transition-all shadow-lg shadow-sky-950 hover:scale-[1.02]"
                >
                  Start a Dispute
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm transition-all"
                >
                  Sign in to Account
                </Link>
              </>
            )}
          </div>

          {/* Trust Badges */}
          <div className="mt-12 pt-8 border-t border-slate-850 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Deterministic Tripartite Scoring</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-sky-400" />
              <span>Bilateral Pre-Decision Confidentiality</span>
            </div>
            <div className="flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-indigo-400" />
              <span>Counterfactual Bias Swap-Test</span>
            </div>
          </div>
        </div>
      </section>

      {/* Advisory Framing Callout */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 -mt-6 relative z-20">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl shrink-0 border border-amber-500/20">
            <Scale className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold text-white">Alternative Dispute Resolution (ADR) Framing</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-medium border border-amber-500/20">
                Non-Binding Decision Support
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              JurisAI is an impartial decision-support tool, not a binding judicial court. It produces structured, evidence-weighted recommendations based on Indian civil and contract law principles to help both sides settle amicably without adversarial legal costs.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">Simple 4-Step Resolution</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2">How JurisAI Resolves Disputes</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            A transparent workflow designed to guarantee fair hearing and prevent unilateral advantage.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative flex flex-col hover:border-slate-700 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-sm mb-4">
              01
            </div>
            <h3 className="text-base font-semibold text-white mb-2">File & Invite</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Claimant files dispute details and generates a single-use 7-day cryptographic invite link for the counterparty.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative flex flex-col hover:border-slate-700 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm mb-4">
              02
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Confidential Proof</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Both parties independently upload statements and evidence (bills, chats, agreements). Submissions stay sealed until evaluation.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative flex flex-col hover:border-slate-700 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm mb-4">
              03
            </div>
            <h3 className="text-base font-semibold text-white mb-2">AI Legal Evaluation</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              The 6-stage hybrid pipeline extracts facts, retrieves statutory provisions via FAISS, and deterministically scores evidence items.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative flex flex-col hover:border-slate-700 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm mb-4">
              04
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Outcome & Settlement</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Parties view an explainable report with confidence meters, citations, suggested amounts, and mutually accept or reject the outcome.
            </p>
          </div>
        </div>
      </section>

      {/* Core Methodology Pillars */}
      <section className="py-16 bg-slate-900/50 border-y border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">Explainable AI Architecture</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2">Built for Objectivity, Not Hallucination</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Unlike generic chatbots, JurisAI couples dense retrieval with mathematical evidence scoring and counterfactual bias testing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-xl w-fit mb-4 border border-sky-500/20">
                <Scale className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-semibold text-white mb-2">Deterministic Scoring Formula</h4>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                Evidence weight is mathematically computed as <span className="font-mono text-sky-300">Relevance × Reliability × Corroboration</span>. Multiple items combine via a probabilistic-OR accumulator so evidence weights cannot be hallucinated.
              </p>
              <div className="text-[11px] text-slate-500 font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                SideScore = 1 - ∏(1 - ItemScore)
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl w-fit mb-4 border border-indigo-500/20">
                <GitCompare className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-semibold text-white mb-2">Counterfactual Swap Test</h4>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                To eliminate labeling bias, the pipeline evaluates the dispute twice with Party A and Party B order inverted. If findings diverge under reversal, the case is automatically routed to human review.
              </p>
              <div className="text-[11px] text-slate-500 font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                Verdict(A, B) == Invert(Verdict(B, A))
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl w-fit mb-4 border border-emerald-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-semibold text-white mb-2">Confidence & Evidence Gating</h4>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                If neither party produces sufficient evidence (scores &lt; 0.25) or overall confidence falls below 0.50, JurisAI avoids arbitrary guesses and provides next-step mediation guidance instead.
              </p>
              <div className="text-[11px] text-slate-500 font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                Confidence &lt; 0.50 → Human Review
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dispute Categories Supported */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">Jurisdiction & Scope</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2">Disputes Handled by JurisAI</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Targeted specifically for small civil matters where court litigation is economically impractical.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-sky-500/30 transition-all">
            <Building className="w-7 h-7 text-sky-400 mb-3" />
            <h4 className="text-sm font-semibold text-white mb-1">Rental & Deposits</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Unreturned security deposits, notice period disputes, wear-and-tear deductions, and tenancy agreements.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/30 transition-all">
            <Briefcase className="w-7 h-7 text-indigo-400 mb-3" />
            <h4 className="text-sm font-semibold text-white mb-1">Freelance & Invoices</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Unpaid service fees, milestone deliverables, scope changes, and independent contractor agreements.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/30 transition-all">
            <PackageCheck className="w-7 h-7 text-emerald-400 mb-3" />
            <h4 className="text-sm font-semibold text-white mb-1">Defective Goods</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Non-conforming items, warranty obligations, refund refusals, and consumer transaction breaches.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/30 transition-all">
            <Coins className="w-7 h-7 text-amber-400 mb-3" />
            <h4 className="text-sm font-semibold text-white mb-1">Cancellations & Refunds</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Booking advance forfeiture, event service cancellations, coaching fees, and gym membership closures.
            </p>
          </div>
        </div>
      </section>

      {/* Footer / CTA Banner */}
      <section className="border-t border-slate-850 py-16 bg-slate-900/30">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Ready to resolve your dispute fairly and amicably?
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Create a dispute case, invite the counterparty, and let JurisAI deliver an objective, transparent advisory determination in minutes.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <Link
                to="/cases/new"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-sm transition-all shadow-lg shadow-sky-950"
              >
                File New Dispute
              </Link>
            ) : (
              <Link
                to="/register"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-sm transition-all shadow-lg shadow-sky-950"
              >
                Create Free Account
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Bottom Legal Disclaimer */}
      <footer className="border-t border-slate-800 py-6 px-4 text-center text-xs text-slate-500 bg-slate-950">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-sky-400" />
            <span className="font-semibold text-slate-400">JurisAI</span>
            <span>— Fundamentals of AI Project</span>
          </div>
          <div>
            Advisory decision support system. Not a substitute for legal counsel or formal court decree.
          </div>
        </div>
      </footer>
    </div>
  );
}

