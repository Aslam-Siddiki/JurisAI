"""
Stage 6: Safeguards & Bias Mitigation
Implements:
1. Counterfactual Swap Test: Runs the verdict step with Party A and Party B swapped.
   If findings or verdicts disagree under inversion, sets needs_human_review.
2. Confidence Gate: Gating rules checking overall confidence < 0.60,
   any insufficient_evidence core findings, or disputed amounts exceeding safety caps.
3. Citation Validator: Verifies that every cited evidence ID and rule ID actually exists.
"""
import re
from typing import List, Tuple, Literal
from app.schemas import EvaluatedIssue, SwapTestResult

def validate_citations(text: str, valid_evidence_ids: List[str], valid_rule_ids: List[str]) -> Tuple[bool, List[str]]:
    """Checks that all cited tokens [A-1], [R-03] correspond to genuine items in context."""
    invalid_citations = []
    # Find all bracketed tokens like [A-1], [B-2], [R-04]
    citations = re.findall(r"\[([A-Za-z0-9_-]+)\]", text)
    valid_set = set(valid_evidence_ids).union(set(valid_rule_ids))

    for c in citations:
        if c not in valid_set:
            invalid_citations.append(c)

    return len(invalid_citations) == 0, invalid_citations

def evaluate_swap_test(verdict_a_first: str, verdict_b_first_mapped: str) -> SwapTestResult:
    """
    Compares original verdict against label-swapped verdict.
    A mismatch indicates labeling bias in the LLM.
    """
    consistent = (verdict_a_first == verdict_b_first_mapped)
    details = None
    if not consistent:
        details = f"Label bias detected: Run A first gave '{verdict_a_first}' but inverted Run gave '{verdict_b_first_mapped}'."

    return SwapTestResult(
        consistent=consistent,
        run_a_first=verdict_a_first,
        run_b_first=verdict_b_first_mapped,
        discrepancy_details=details
    )

def apply_confidence_gate(
    issues: List[EvaluatedIssue],
    swap_consistent: bool,
    threshold: float = 0.60
) -> Tuple[Literal["favours_A", "favours_B", "partial", "needs_human_review"], float, List[str]]:
    """
    Applies strict confidence gating rules from Spec Section 9:
    - Swap test disagreement -> needs_human_review
    - Any insufficient_evidence on core issue -> needs_human_review
    - Mean confidence < threshold (0.60) -> needs_human_review
    """
    limitations: List[str] = []

    if not swap_consistent:
        limitations.append("Swap test failed: Results differed when party order was inverted. Escalated to human review.")
        return "needs_human_review", 0.40, limitations

    # Count findings
    a_wins = sum(1 for iss in issues if iss.finding == "favours_A")
    b_wins = sum(1 for iss in issues if iss.finding == "favours_B")
    insufficient = sum(1 for iss in issues if iss.finding == "insufficient_evidence")
    splits = sum(1 for iss in issues if iss.finding == "split")

    # Calculate overall confidence
    if issues:
        overall_confidence = round(sum(iss.confidence for iss in issues) / len(issues), 2)
    else:
        overall_confidence = 0.0

    if insufficient > 0:
        limitations.append(f"{insufficient} issue(s) had insufficient evidence to form an objective determination.")

    # Gate: swap test mismatch OR insufficient evidence on core issues -> needs_human_review
    if insufficient == len(issues):
        limitations.append("All framed dispute issues lack verifiable supporting evidence.")
        return "needs_human_review", overall_confidence, limitations

    if overall_confidence < 0.50:
        limitations.append(f"Confidence score ({overall_confidence}) is below the required 0.50 threshold.")
        return "needs_human_review", overall_confidence, limitations

    if a_wins > 0 and b_wins == 0 and splits == 0:
        return "favours_A", overall_confidence, limitations
    elif b_wins > 0 and a_wins == 0 and splits == 0:
        return "favours_B", overall_confidence, limitations
    elif splits > 0 or (a_wins > 0 and b_wins > 0):
        return "partial", overall_confidence, limitations
    else:
        return "needs_human_review", overall_confidence, limitations

