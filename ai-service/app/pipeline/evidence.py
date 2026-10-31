"""
Stage 1: Evidence Extraction & Fact Parsing
Extracts text from files, performs rule-based and regex NER extraction for amounts/dates,
and assigns evidence quality metrics.
"""
import re
import os
from typing import List
from app.schemas import EvidenceItemInput, AnalyzedEvidence, EvidenceFactExtraction, EvidenceQuality

def extract_text_from_item(item: EvidenceItemInput) -> str:
    """Extract plain text from file or user description."""
    if item.text and len(item.text.strip()) > 0:
        return item.text.strip()

    if item.file_path and os.path.exists(item.file_path):
        ext = os.path.splitext(item.file_path)[1].lower()
        if ext == ".txt":
            try:
                with open(item.file_path, "r", encoding="utf-8") as f:
                    return f.read().strip()
            except Exception:
                pass
        # Note: PDF and OCR handlers extend here with pdfplumber / pytesseract
    
    return item.description

def parse_facts_and_quality(text: str, item_type: str) -> tuple[EvidenceFactExtraction, EvidenceQuality]:
    """Parse dates, currency amounts, and evaluate evidence reliability quality fields."""
    # Date extraction regex (e.g. 2026-03-04, 31 January, 1 Feb, 04/03/2026)
    date_pattern = r"\b(?:\d{4}-\d{2}-\d{2}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*(?:\d{4})?)\b"
    dates_found = re.findall(date_pattern, text, flags=re.IGNORECASE)

    # Amount extraction regex (e.g. 12000 INR, Rs. 30000, 30,000 rupees, 12000)
    amount_pattern = r"(?:Rs\.?|INR|rupees|₹)?\s*(\b\d{1,3}(?:,\d{3})*|\b\d+)\s*(?:INR|rupees|Rs)?"
    amounts = []
    for match in re.finditer(amount_pattern, text, flags=re.IGNORECASE):
        val_str = match.group(1).replace(",", "")
        if val_str and val_str.isdigit() and int(val_str) >= 100: # filter small digits
            amounts.append({"value": float(val_str), "currency": "INR"})

    has_date = len(dates_found) > 0
    has_amount = len(amounts) > 0
    
    # Enhanced check for third-party official records (bank/UPI, distributor, carrier, engineer report, voucher, lease agreement)
    text_lower = text.lower()
    third_party_keywords = [
        "bank", "upi", "neft", "invoice", "transfer", "report", "diagnostic", "telecom", "voucher", "agreement", "receipt", "contract", "carrier", "gpay", "inspection", "asian paints", "distributor"
    ]
    is_third_party = any(k in text_lower for k in third_party_keywords)

    facts = EvidenceFactExtraction(
        dates=dates_found[:3],
        amounts=amounts[:3],
        parties_mentioned=["Party A", "Party B"] if ("party a" in text.lower() or "party b" in text.lower()) else [],
        key_claims=[text[:150] + "..." if len(text) > 150 else text]
    )

    quality = EvidenceQuality(
        is_legible=len(text.strip()) > 5,
        has_date=has_date,
        has_amount=has_amount,
        is_third_party_record=is_third_party
    )

    return facts, quality


def analyze_evidence_pipeline(evidence_items: List[EvidenceItemInput]) -> List[AnalyzedEvidence]:
    """Runs Stage 1 on a list of raw evidence items."""
    results = []
    for item in evidence_items:
        extracted = extract_text_from_item(item)
        facts, quality = parse_facts_and_quality(extracted, item.type)
        results.append(AnalyzedEvidence(
            id=item.id,
            type=item.type,
            description=item.description,
            extracted_text=extracted,
            facts=facts,
            quality=quality
        ))
    return results
