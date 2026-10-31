"""
Stage 2: Issue Framing
Frames 1 to 5 neutral, answerable questions from Party A and Party B statements
and links each issue to the relevant evidence IDs.
"""
import os
from app.schemas import FrameIssuesRequest, FrameIssuesResponse
from app.llm import llm_client

def load_prompt(filename: str) -> str:
    path = os.path.join(os.path.dirname(__file__), "..", "prompts", filename)
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

def frame_issues_pipeline(req: FrameIssuesRequest) -> FrameIssuesResponse:
    system_prompt = load_prompt("frame_issues.txt")
    
    evidence_summary = "\n".join([
        f"- ID: {e.id} ({e.type}): {e.extracted_text[:120]}"
        for e in req.analyzed_evidence
    ])

    user_prompt = f"""
Dispute Category: {req.category}
Party A Statement: {req.party_a_statement}
Party B Statement: {req.party_b_statement}

Analyzed Evidence:
{evidence_summary if evidence_summary else "No file evidence uploaded."}
"""

    return llm_client.generate_structured(system_prompt, user_prompt, FrameIssuesResponse)
