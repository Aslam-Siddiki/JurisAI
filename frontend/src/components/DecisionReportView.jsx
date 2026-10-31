import React, { useState } from "react";
import {
  Scale,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  BookOpen,
  Split,
  AlertTriangle,
  Send,
  Sparkles,
} from "lucide-react";

export default function DecisionReportView({ decision, caseData, userRole, onRespond, responding, onReevaluate, evaluating }) {
  const [expandedIssues, setExpandedIssues] = useState({ 0: true });
  const [showAuditDetails, setShowAuditDetails] = useState(false);

  const report = decision.report;
  const userParty = userRole === "claimant" ? "A" : "B";
  const myResponse = decision.partyResponses?.[userParty] || "pending";
  const counterparty = userParty === "A" ? "B" : "A";
  const counterResponse = decision.partyResponses?.[counterparty] || "pending";

  const toggleIssue = (idx) => {
    setExpandedIssues((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const getVerdictBadge = (verdict) => {
    switch (verdict) {
      case "favours_A":
        return {
          label: "Favours Party A (Claimant)",
          bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
          desc: "The factual and legal evidence predominantly substantiates the claimant's position.",
        };
      case "favours_B":
        return {
          label: "Favours Party B (Respondent)",
          bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
          desc: "The evidence predominantly substantiates the respondent's defense or counterclaim.",
        };
      case "partial":
        return {
          label: "Partial / Split Determination",
          bg: "bg-amber-500/10 text-amber-400 border-amber-500/30",
          desc: "Findings are divided across different issues; mutual compromises are strongly suggested.",
        };
      case "needs_human_review":
      default:
        return {
          label: "Needs Human Review",
          bg: "bg-rose-500/10 text-rose-400 border-rose-500/30",
          desc: "Safeguards detected either an asymmetric swap-test variance or insufficient evidence. Routing to human review.",
        };
    }
  };

  const verdictMeta = getVerdictBadge(decision.verdict);

  return (
    <div className="space-y-6">
      {/* Amicable Civil Dispute Guidance Banner */}
      <div className="p-4 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-start gap-3 text-xs text-sky-300">
        <Scale className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold block text-sky-200">Independent Civil Dispute Resolution</span>
          JurisAI provides objective, unbiased settlement decisions for small civil disputes, enabling both parties to reach a fair, adoptable resolution without referring to courts, police, or lengthy adversarial litigation.
        </div>
      </div>

      {/* Main Verdict Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">JurisAI Advisory Outcome</span>
            </div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white tracking-tight">{verdictMeta.label}</h2>
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${verdictMeta.bg}`}>
                {decision.verdict}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">{verdictMeta.desc}</p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end gap-3">
            {/* Confidence Score Pill */}
            <div className="flex md:flex-col items-center md:items-end justify-between bg-slate-950 md:bg-transparent p-3 md:p-0 rounded-xl border md:border-0 border-slate-800 w-full md:w-auto">
              <span className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">Confidence Score</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-sky-400">
                  {Math.round((report.overall_confidence || decision.confidence) * 100)}%
                </span>
                <span className="text-xs text-slate-500">/ 100</span>
              </div>
              <div className="w-24 bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                <div
                  className="bg-sky-500 h-1.5 rounded-full"
                  style={{ width: `${Math.round((report.overall_confidence || decision.confidence) * 100)}%` }}
                />
              </div>
            </div>

            {/* Re-evaluate / Refresh Decision button */}
            {onReevaluate && (
              <button
                type="button"
                onClick={onReevaluate}
                disabled={evaluating}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-colors"
                title="Re-run AI evaluation pipeline with current statutes"
              >
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                {evaluating ? "Evaluating..." : "Refresh Legal Analysis"}
              </button>
            )}
          </div>
        </div>

        {/* Case Summary */}
        <div className="py-4 border-b border-slate-800">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Evaluated Case Summary</h3>
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            {report.case_summary}
          </p>
        </div>

        {/* Suggested Settlement */}
        {report.suggested_settlement && (
          <div className="py-4 border-b border-slate-800">
            <h3 className="text-xs font-semibold text-sky-400 uppercase tracking-wider mb-2">Recommended Settlement / Remedy</h3>
            <div className="p-3.5 rounded-xl bg-sky-950/20 border border-sky-800/30 text-xs text-slate-200 leading-relaxed">
              {report.suggested_settlement}
            </div>
          </div>
        )}

        {/* Neutrality & Impartiality Verification */}
        <div className="pt-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Split className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-slate-400">Impartiality Safeguard:</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-medium">
              Verified Balanced & Unbiased
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            Independent Civil Dispute Support
          </span>
        </div>
      </div>

      {/* Framed Dispute Issues & Plain-Language Findings */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <Scale className="w-4 h-4 text-sky-400" />
            Key Dispute Issues & Settlement Analysis
          </h3>
          <button
            type="button"
            onClick={() => setShowAuditDetails(!showAuditDetails)}
            className="text-[11px] font-medium text-slate-400 hover:text-sky-300 transition-colors flex items-center gap-1.5"
          >
            <span>{showAuditDetails ? "Hide Technical Audit Data" : "View Technical Audit Data"}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAuditDetails ? "rotate-180" : ""}`} />
          </button>
        </div>

        {(report.issues || []).map((issue, idx) => {
          const isOpen = expandedIssues[idx];
          const findingFormatted = (issue.finding || "").toLowerCase();

          return (
            <div
              key={issue.issue_id || idx}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition-all shadow-md"
            >
              {/* Accordion Header */}
              <button
                type="button"
                onClick={() => toggleIssue(idx)}
                className="w-full p-4 text-left flex items-center justify-between gap-4 bg-slate-900 hover:bg-slate-850 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 font-bold text-xs flex items-center justify-center shrink-0">
                    {issue.issue_id || `I${idx + 1}`}
                  </span>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-100">{issue.question}</h4>
                    <span className="text-[11px] text-slate-400">
                      Determination:{" "}
                      <strong className={`font-semibold capitalize ${
                        findingFormatted.includes("a") ? "text-emerald-400" :
                        findingFormatted.includes("b") ? "text-indigo-400" :
                        findingFormatted.includes("split") || findingFormatted.includes("partial") ? "text-amber-400" : "text-rose-400"
                      }`}>
                        {findingFormatted === "favours_a" ? "Substantiates Claimant (Party A)" :
                         findingFormatted === "favours_b" ? "Substantiates Respondent (Party B)" :
                         findingFormatted === "split" ? "Balanced Compromise Applicable" :
                         (issue.finding || "").replace("_", " ")}
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium hidden sm:inline-block">
                    {findingFormatted === "favours_a" ? "Claimant Substantiated" :
                     findingFormatted === "favours_b" ? "Respondent Substantiated" :
                     "Mutual Compromise"}
                  </span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </button>

              {/* Accordion Body */}
              {isOpen && (
                <div className="p-5 border-t border-slate-800 bg-slate-950/50 space-y-4">
                  {/* Party Claims Comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                      <span className="text-[11px] font-semibold text-sky-400 uppercase block mb-1">Claimant Version (Party A)</span>
                      <p className="text-slate-300 leading-relaxed">{issue.party_a_claim || "No claim recorded."}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                      <span className="text-[11px] font-semibold text-indigo-400 uppercase block mb-1">Respondent Version (Party B)</span>
                      <p className="text-slate-300 leading-relaxed">{issue.party_b_claim || "No defense recorded."}</p>
                    </div>
                  </div>

                  {/* Plain Language Settlement Reasoning */}
                  <div>
                    <h5 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-sky-400" />
                      Fair Settlement Reasoning & Legal Basis
                    </h5>
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-line">
                      {issue.reasoning}
                    </div>
                  </div>

                  {/* Governing Statutory Principles (Abstracted & Plainly Formatted) */}
                  {issue.applicable_rules?.length > 0 && (
                    <div>
                      <h5 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                        Governing Civil Principles Applied
                      </h5>
                      <div className="grid grid-cols-1 gap-2">
                        {issue.applicable_rules.map((rule, rIdx) => (
                          <div key={rIdx} className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                            <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-400 mb-1">
                              <span>{rule.source}</span>
                              <span className="text-slate-500 font-mono text-[10px]">{rule.title || rule.passage_id}</span>
                            </div>
                            <p className="text-slate-300 italic leading-relaxed">"{rule.text}"</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Technical Breakdown & Scoring - Hidden Behind Abstraction Toggle */}
                  {showAuditDetails && (
                    <div className="pt-2 border-t border-slate-800/80 space-y-3">
                      <h5 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                        Verification Audit Record
                      </h5>
                      {issue.evidence_scores?.breakdown?.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border border-slate-800 rounded-xl overflow-hidden">
                            <thead className="bg-slate-900 text-slate-400 text-[11px]">
                              <tr>
                                <th className="p-2.5">Item</th>
                                <th className="p-2.5">Party</th>
                                <th className="p-2.5">Evaluation</th>
                                <th className="p-2.5">Summary Note</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800 text-slate-300">
                              {issue.evidence_scores.breakdown.map((item, i) => (
                                <tr key={i} className="hover:bg-slate-900/40">
                                  <td className="p-2.5 font-mono text-sky-400 font-semibold">{item.evidence_id}</td>
                                  <td className="p-2.5">Party {item.party}</td>
                                  <td className="p-2.5">
                                    <span className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-200">
                                      {item.item_score >= 0.5 ? "Substantiated" : "Partial Support"}
                                    </span>
                                  </td>
                                  <td className="p-2.5 text-slate-400 text-[11px]">{item.reason}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="p-2.5 bg-slate-900/60 rounded-lg text-slate-500 text-xs italic">
                          Evaluated based on corroborated party statements and statutory provisions.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Outcome Acceptance / Rejection Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
          <Scale className="w-4 h-4 text-sky-400" />
          Dispute Resolution Agreement Status
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-300">Party A (Claimant) Decision:</span>
            <span
              className={`px-2 py-0.5 rounded-full font-medium text-[11px] capitalize ${
                decision.partyResponses?.A === "accepted"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : decision.partyResponses?.A === "rejected"
                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {decision.partyResponses?.A || "Pending"}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-300">Party B (Respondent) Decision:</span>
            <span
              className={`px-2 py-0.5 rounded-full font-medium text-[11px] capitalize ${
                decision.partyResponses?.B === "accepted"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : decision.partyResponses?.B === "rejected"
                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {decision.partyResponses?.B || "Pending"}
            </span>
          </div>
        </div>

        {caseData.status === "closed" ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>
              <strong>Dispute Resolved:</strong> Both parties have formally accepted the recommended outcome. The case is now closed.
            </span>
          </div>
        ) : (
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-400">
              Your status: <strong className="text-slate-200 capitalize">{myResponse}</strong>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                disabled={responding || myResponse === "rejected" || myResponse === "accepted"}
                onClick={() => onRespond("accepted")}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-md ${
                  myResponse === "accepted"
                    ? "bg-emerald-600 text-white ring-2 ring-emerald-400/60 shadow-emerald-950"
                    : myResponse === "rejected"
                    ? "bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed opacity-40"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950 hover:scale-[1.02]"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                {myResponse === "accepted" ? "Outcome Accepted" : "Accept Outcome"}
              </button>

              <button
                type="button"
                disabled={responding || myResponse === "accepted" || myResponse === "rejected"}
                onClick={() => onRespond("rejected")}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-md ${
                  myResponse === "rejected"
                    ? "bg-rose-600 text-white ring-2 ring-rose-400/60 shadow-rose-950"
                    : myResponse === "accepted"
                    ? "bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed opacity-40"
                    : "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950 hover:scale-[1.02]"
                }`}
              >
                <XCircle className="w-4 h-4" />
                {myResponse === "rejected" ? "Outcome Rejected" : "Reject Outcome"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
