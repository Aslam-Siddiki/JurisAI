"""
JurisAI — Pydantic Schemas
Strict types and JSON validation schemas for the 6-stage AI evaluation pipeline.
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Dict, Any

# ================= 1. Evidence Extraction & Quality =================
class EvidenceItemInput(BaseModel):
    id: str = Field(..., description="Evidence ID, e.g. A-1, B-2")
    type: Literal["document", "image", "chat", "receipt", "other"] = "other"
    description: str
    file_path: Optional[str] = None
    text: Optional[str] = None

class EvidenceFactExtraction(BaseModel):
    dates: List[str] = Field(default_factory=list)
    amounts: List[Dict[str, Any]] = Field(default_factory=list)
    parties_mentioned: List[str] = Field(default_factory=list)
    key_claims: List[str] = Field(default_factory=list)

class EvidenceQuality(BaseModel):
    is_legible: bool = True
    has_date: bool = False
    has_amount: bool = False
    is_third_party_record: bool = False

class AnalyzedEvidence(BaseModel):
    id: str
    type: str
    description: str
    extracted_text: str = ""
    facts: EvidenceFactExtraction = Field(default_factory=EvidenceFactExtraction)
    quality: EvidenceQuality = Field(default_factory=EvidenceQuality)

class AnalyzeEvidenceRequest(BaseModel):
    evidence: List[EvidenceItemInput]

class AnalyzeEvidenceResponse(BaseModel):
    analyzed_evidence: List[AnalyzedEvidence]

# ================= 2. Issue Framing =================
class Issue(BaseModel):
    issue_id: str
    question: str
    party_a_claim: str
    party_b_claim: str
    undisputed_facts: List[str] = Field(default_factory=list)
    relevant_evidence_ids: List[str] = Field(default_factory=list)

class FrameIssuesRequest(BaseModel):
    category: str = "Other"
    party_a_statement: str
    party_b_statement: str
    analyzed_evidence: List[AnalyzedEvidence] = Field(default_factory=list)

class FrameIssuesResponse(BaseModel):
    issues: List[Issue]

# ================= 3. Legal Retrieval =================
class LegalPassage(BaseModel):
    passage_id: str
    source: str
    title: str
    text: str
    score: float = 0.0

class RetrieveLawRequest(BaseModel):
    question: str
    category: str = "Other"
    top_k: int = 3

class RetrieveLawResponse(BaseModel):
    passages: List[LegalPassage]

# ================= 4. Evidence Scoring (Deterministic) =================
class ScoredEvidenceItem(BaseModel):
    evidence_id: str
    supports: Literal["A", "B", "neither"]
    relevance: float  # [0.0, 0.25, 0.5, 0.75, 1.0]
    reliability: float # [0.2, 0.3, 0.6, 0.7, 1.0]
    corroboration: float # [0.5, 0.75, 1.0]
    item_score: float # rel * rel * corr
    reason: str

class IssueScoreBreakdown(BaseModel):
    A: float # Probabilistic-OR side score for Party A
    B: float # Probabilistic-OR side score for Party B
    breakdown: List[ScoredEvidenceItem]

class ScoreEvidenceRequest(BaseModel):
    issues: List[Issue]
    analyzed_evidence: List[AnalyzedEvidence]

class ScoredIssue(BaseModel):
    issue_id: str
    question: str
    evidence_scores: IssueScoreBreakdown
    finding: Literal["favours_A", "favours_B", "split", "insufficient_evidence"]
    confidence: float

# ================= 5. Verdict & Safeguards =================
class DecideRequest(BaseModel):
    case_id: str
    category: str
    party_a_statement: str
    party_b_statement: str
    evidence: List[EvidenceItemInput] = Field(default_factory=list)

class EvaluatedIssue(BaseModel):
    issue_id: str
    question: str
    party_a_claim: str
    party_b_claim: str
    evidence_scores: IssueScoreBreakdown
    applicable_rules: List[LegalPassage] = Field(default_factory=list)
    finding: Literal["favours_A", "favours_B", "split", "insufficient_evidence"]
    reasoning: str
    confidence: float

class SwapTestResult(BaseModel):
    consistent: bool
    run_a_first: str
    run_b_first: str
    discrepancy_details: Optional[str] = None

class DecisionReport(BaseModel):
    case_id: str
    case_summary: str
    issues: List[EvaluatedIssue]
    overall_verdict: Literal["favours_A", "favours_B", "partial", "needs_human_review"]
    overall_confidence: float
    suggested_settlement: str
    swap_test: SwapTestResult
    limitations: List[str] = Field(default_factory=list)
    disclaimer: str = "This is AI decision support, not a binding legal judgment."
