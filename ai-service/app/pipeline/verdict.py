"""
Stage 5 & Full Pipeline Orchestrator (/decide)
Coordinates Stages 1 through 6:
1. Analyze Evidence (Stage 1)
2. Frame Issues (Stage 2)
3. Retrieve Law for each issue (Stage 3)
4. Score Evidence deterministically (Stage 4)
5. Generate Reasoning & Settlement (Stage 5)
6. Run Swap-Test and Confidence Gating (Stage 6)
"""
import os
from typing import List
from app.schemas import (
    DecideRequest,
    DecisionReport,
    EvaluatedIssue,
    Issue,
    AnalyzedEvidence,
    EvidenceItemInput,
)
from app.pipeline.evidence import analyze_evidence_pipeline
from app.pipeline.issues import frame_issues_pipeline
from app.pipeline.retrieval import retrieve_legal_rules
from app.pipeline.scoring import score_issue_evidence, determine_finding
from app.pipeline.safeguards import apply_confidence_gate, evaluate_swap_test, validate_citations

def execute_pipeline(req: DecideRequest, invert_parties: bool = False) -> DecisionReport:
    """Executes the full pipeline. If invert_parties is True, runs the swap test counterfactual."""
    statement_a = req.party_b_statement if invert_parties else req.party_a_statement
    statement_b = req.party_a_statement if invert_parties else req.party_b_statement

    # Invert evidence prefixes if swapping (A-* <-> B-*)
    evidence_inputs: List[EvidenceItemInput] = []
    for ev in req.evidence:
        new_id = ev.id
        if invert_parties:
            if ev.id.startswith("A-"):
                new_id = "B-" + ev.id[2:]
            elif ev.id.startswith("B-"):
                new_id = "A-" + ev.id[2:]
        evidence_inputs.append(EvidenceItemInput(
            id=new_id,
            type=ev.type,
            description=ev.description,
            file_path=ev.file_path,
            text=ev.text
        ))

    # Stage 1: Analyze Evidence
    analyzed_evidence: List[AnalyzedEvidence] = analyze_evidence_pipeline(evidence_inputs)

    # Stage 2: Frame Issues
    framed_response = frame_issues_pipeline(type("Obj", (), {
        "category": req.category,
        "party_a_statement": statement_a,
        "party_b_statement": statement_b,
        "analyzed_evidence": analyzed_evidence
    }))

    evaluated_issues: List[EvaluatedIssue] = []
    all_rule_ids = []

    for issue in framed_response.issues:
        # Stage 3: Retrieve Law
        passages = retrieve_legal_rules(issue.question, req.category, top_k=2)
        for p in passages:
            all_rule_ids.append(p.passage_id)

        # Stage 4: Deterministic Evidence Scoring
        score_breakdown = score_issue_evidence(issue, analyzed_evidence)
        finding, confidence = determine_finding(score_breakdown.A, score_breakdown.B)

        # Stage 5: Constrained Reasoning Synthesis
        rule_citations = " ".join([f"[{p.passage_id}]" for p in passages])
        rule_names = ", ".join([f"{p.source} ({p.title})" for p in passages]) if passages else "General Principles of Civil Contract Law"
        ev_citations_a = " ".join([f"[{item.evidence_id}]" for item in score_breakdown.breakdown if item.supports == "A"])
        ev_citations_b = " ".join([f"[{item.evidence_id}]" for item in score_breakdown.breakdown if item.supports == "B"])

        # Extract amounts from evidence or statements
        amounts_mentioned = []
        for ev in analyzed_evidence:
            for amt in ev.facts.amounts:
                amounts_mentioned.append(amt.get("value", 0))

        # Check party statements for amounts if none in evidence items
        if not amounts_mentioned:
            import re
            currency_amounts = []
            general_amounts = []
            for st in [req.party_a_statement, req.party_b_statement]:
                if not st:
                    continue
                # Match currency explicitly e.g. 50000 INR, Rs 50000, ₹50,000
                for m in re.finditer(r"(?:Rs\.?|INR|₹)\s*(\d+(?:,\d+)*(?:\.\d+)?)|\b(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:Rs\.?|INR|₹)", st, re.I):
                    val = (m.group(1) or m.group(2)).replace(",", "")
                    try:
                        currency_amounts.append(float(val))
                    except ValueError:
                        pass

                # Match general numbers excluding calendar years (1950 - 2035)
                for m in re.finditer(r"\b(\d+(?:,\d+)*)\b", st):
                    val = m.group(1).replace(",", "")
                    if val.isdigit():
                        num = float(val)
                        if num >= 100 and not (1950 <= num <= 2035):
                            general_amounts.append(num)

            if currency_amounts:
                primary_amount = max(currency_amounts)
            elif general_amounts:
                primary_amount = max(general_amounts)
            else:
                primary_amount = 0
        else:
            primary_amount = max(amounts_mentioned)

        if finding == "favours_A":
            reasoning = (
                f"Party A (Claimant) has substantiated their claim on the balance of probabilities with credible records. "
                f"Under governing civil contract principles ({rule_names}), when consideration has been paid and the underlying service cannot be performed with timely notice given, "
                f"the service provider cannot retain the full consideration without proving equivalent unmitigated losses. "
                f"Party A has satisfied the civil standard of proof for a refund."
            )
        elif finding == "favours_B":
            reasoning = (
                f"Party B (Respondent) has established legitimate contractual and operational justification. "
                f"Under governing civil principles ({rule_names}), documented preparatory expenditure, date reservation, and adherence to agreed terms protect Party B from unmerited liability."
            )
        elif finding == "split":
            reasoning = (
                f"Both parties have established valid civil grounds with balanced merit. "
                f"Under governing civil contract law ({rule_names}), where cancellation is unavoidable with notice given, total forfeiture of advance consideration is disproportionate. "
                f"However, the service provider is reasonably entitled to compensation for reserving the date and administrative overhead. "
                f"A balanced compromise achieves a fair, equitable resolution for both sides."
            )
        else:
            reasoning = (
                f"Both parties provided differing recollections without contemporaneous written proof. "
                f"Under principles of civil dispute resolution ({rule_names}), an equitable division of the disputed consideration provides a fair, peaceful, and final closure."
            )

        evaluated_issues.append(EvaluatedIssue(
            issue_id=issue.issue_id,
            question=issue.question,
            party_a_claim=issue.party_a_claim,
            party_b_claim=issue.party_b_claim,
            evidence_scores=score_breakdown,
            applicable_rules=passages,
            finding=finding,
            reasoning=reasoning,
            confidence=confidence
        ))

    # Stage 6: Swap test evaluation
    # Determine first run verdict
    verdict, overall_confidence, limitations = apply_confidence_gate(evaluated_issues, swap_consistent=True)

    # Invert mapping if this was an inverted run
    if invert_parties:
        mapped_verdict = "favours_B" if verdict == "favours_A" else ("favours_A" if verdict == "favours_B" else verdict)
        return type("Obj", (), {"overall_verdict": mapped_verdict, "overall_confidence": overall_confidence})

    # Execute second counterfactual run (Party B first)
    second_run = execute_pipeline(req, invert_parties=True)
    swap_res = evaluate_swap_test(verdict, second_run.overall_verdict)

    # Re-apply gate with real swap test outcome
    final_verdict, final_conf, final_limits = apply_confidence_gate(evaluated_issues, swap_res.consistent)
    final_limits.extend(limitations)

    # Synthesize highly actionable, concrete settlement orders based on amounts and findings
    if primary_amount > 0:
        amt_str = f"₹{int(primary_amount):,}"
        if final_verdict == "favours_A":
            suggested_settlement = (
                f"Full Financial Restitution: Respondent shall refund the full advance amount of {amt_str} to Claimant within 14 calendar days. "
                f"Claimant shall execute a full waiver and release of all subsequent claims upon receipt of funds."
            )
        elif final_verdict == "favours_B":
            suggested_settlement = (
                f"Discharge of Liability: Respondent is entitled to retain the advance sum of {amt_str} to compensate for documented administrative preparations and booking slot reservation. "
                f"Both parties stand released from further performance obligations."
            )
        elif final_verdict in ["split", "partial"]:
            # Balanced compromise: refund 80% with 20% retention or respondent's documented offer
            retain_amt = int(primary_amount * 0.20)
            refund_amt = int(primary_amount - retain_amt)
            suggested_settlement = (
                f"Equitable Proportionate Settlement: Respondent shall retain ₹{retain_amt:,} (20%) as reasonable cancellation and administrative overhead compensation, "
                f"and refund the balance of ₹{refund_amt:,} (80%) to Claimant within 14 business days. "
                f"Both parties agree this constitutes full and final resolution of all claims."
            )
        else:
            split_amt = int(primary_amount * 0.50)
            suggested_settlement = (
                f"Balanced Mutual Settlement: Respondent shall retain ₹{split_amt:,} (50%) to cover preparations and slot reservation, "
                f"and refund ₹{split_amt:,} (50%) to Claimant within 14 business days. "
                f"Both parties agree this constitutes full, final, and amicable resolution of the dispute."
            )
    else:
        if final_verdict == "favours_A":
            suggested_settlement = "Full refund and formal closure in favor of Party A as verified by contemporary records within 14 days."
        elif final_verdict == "favours_B":
            suggested_settlement = "Retention of funds and discharge of liability in favor of Party B as documented."
        elif final_verdict in ["split", "partial"]:
            suggested_settlement = "Mutual compromise: 80% refund of disputed consideration to Claimant with 20% retention by Respondent for administrative mitigation."
        else:
            suggested_settlement = "Balanced Mutual Settlement: Equal 50/50 division of disputed consideration within 14 business days as full, final, and amicable resolution."

    return DecisionReport(
        case_id=req.case_id,
        case_summary=f"Dispute involving {req.category} evaluated across {len(evaluated_issues)} distinct issue(s) under statutory standards of contract and evidence law.",
        issues=evaluated_issues,
        overall_verdict=final_verdict,
        overall_confidence=final_conf,
        suggested_settlement=suggested_settlement,
        swap_test=swap_res,
        limitations=final_limits,
        disclaimer="This is AI decision support, not a binding legal judgment."
    )
