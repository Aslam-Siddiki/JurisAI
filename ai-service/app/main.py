"""
JurisAI - AI Service Entry Point
Provides health checks and API endpoints for the 6-stage AI evaluation pipeline.
"""
from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
import time
import os
from typing import Optional, List

from app.schemas import (
    AnalyzeEvidenceRequest,
    AnalyzeEvidenceResponse,
    FrameIssuesRequest,
    FrameIssuesResponse,
    RetrieveLawRequest,
    RetrieveLawResponse,
    ScoreEvidenceRequest,
    ScoredIssue,
    DecideRequest,
    DecisionReport,
)
from app.pipeline.evidence import analyze_evidence_pipeline
from app.pipeline.issues import frame_issues_pipeline
from app.pipeline.retrieval import retrieve_legal_rules
from app.pipeline.scoring import score_issue_evidence, determine_finding
from app.pipeline.verdict import execute_pipeline

app = FastAPI(
    title="JurisAI Service",
    description="Explainable Decision-Support AI Pipeline for Small Civil Disputes",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

START_TIME = time.time()
SERVICE_KEY = os.getenv("SERVICE_KEY", "secret_internal_service_key")
ENVIRONMENT = os.getenv("ENVIRONMENT", os.getenv("NODE_ENV", "development"))

def verify_service_key(x_service_key: Optional[str] = Header(None)):
    if SERVICE_KEY and SERVICE_KEY != "secret_internal_service_key":
        if not x_service_key or x_service_key != SERVICE_KEY:
            raise HTTPException(status_code=401, detail="Unauthorized: Invalid or missing service key.")
    elif x_service_key and x_service_key != SERVICE_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized service key.")
    return True

@app.get("/")
def root():
    return {"service": "JurisAI AI Service", "status": "operational", "version": "1.0.0"}

@app.get("/health")
def health():
    return {
        "status": "ok",
        "uptime_seconds": round(time.time() - START_TIME, 2),
        "pipeline_stages": [
            "1. Evidence Extraction & Quality Check (/analyze-evidence)",
            "2. Issue Framing (/frame-issues)",
            "3. Legal Retrieval (FAISS) (/retrieve-law)",
            "4. Tripartite Evidence Scoring (/score-evidence)",
            "5. Constrained Verdict Generation",
            "6. Swap-Test & Confidence Safeguards (/decide)"
        ]
    }

@app.post("/analyze-evidence", response_model=AnalyzeEvidenceResponse)
def analyze_evidence(req: AnalyzeEvidenceRequest, authorized: bool = Depends(verify_service_key)):
    analyzed = analyze_evidence_pipeline(req.evidence)
    return AnalyzeEvidenceResponse(analyzed_evidence=analyzed)

@app.post("/frame-issues", response_model=FrameIssuesResponse)
def frame_issues(req: FrameIssuesRequest, authorized: bool = Depends(verify_service_key)):
    return frame_issues_pipeline(req)

@app.post("/retrieve-law", response_model=RetrieveLawResponse)
def retrieve_law(req: RetrieveLawRequest, authorized: bool = Depends(verify_service_key)):
    passages = retrieve_legal_rules(req.question, req.category, req.top_k)
    return RetrieveLawResponse(passages=passages)

@app.post("/score-evidence", response_model=List[ScoredIssue])
def score_evidence(req: ScoreEvidenceRequest, authorized: bool = Depends(verify_service_key)):
    scored = []
    for issue in req.issues:
        breakdown = score_issue_evidence(issue, req.analyzed_evidence)
        finding, confidence = determine_finding(breakdown.A, breakdown.B)
        scored.append(ScoredIssue(
            issue_id=issue.issue_id,
            question=issue.question,
            evidence_scores=breakdown,
            finding=finding,
            confidence=confidence
        ))
    return scored

@app.post("/decide", response_model=DecisionReport)
def decide(req: DecideRequest, authorized: bool = Depends(verify_service_key)):
    """Stage 6: Runs complete end-to-end pipeline with Swap Test & Confidence Gate."""
    return execute_pipeline(req)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)

