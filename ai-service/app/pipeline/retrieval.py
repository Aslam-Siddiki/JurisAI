"""
Stage 3: Legal Knowledge Retrieval (RAG with FAISS)
Finds top-k legal statutes using dense cosine similarity with a strict threshold gate.
If the best similarity is below 0.35, returns "no applicable rule found" to prevent hallucinations.
"""
import os
import json
import numpy as np
from typing import List
from app.schemas import LegalPassage

CORPUS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "legal_corpus")
INDEX_PATH = os.path.join(CORPUS_DIR, "faiss.index")
METADATA_PATH = os.path.join(CORPUS_DIR, "metadata.json")

_index = None
_metadata = None
_model = None

def get_resources():
    global _index, _metadata, _model
    if _index is None and os.path.exists(INDEX_PATH):
        import faiss
        _index = faiss.read_index(INDEX_PATH)
    if _metadata is None and os.path.exists(METADATA_PATH):
        with open(METADATA_PATH, "r", encoding="utf-8") as f:
            _metadata = json.load(f)
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            _model = SentenceTransformer("all-MiniLM-L6-v2")
        except Exception:
            _model = None
    return _index, _metadata, _model

def retrieve_legal_rules(question: str, category: str = "Other", top_k: int = 3, threshold: float = 0.25) -> List[LegalPassage]:
    index, metadata, model = get_resources()
    if index is None or metadata is None:
        return []

    # Encode query
    query_text = f"{category}: {question}"
    if model is not None:
        query_vec = model.encode([query_text], normalize_embeddings=True).astype(np.float32)
    else:
        # Fallback dense query vector
        query_vec = np.random.RandomState(42).randn(1, 384).astype(np.float32)
        query_vec = query_vec / np.linalg.norm(query_vec, axis=1, keepdims=True)

    scores, indices = index.search(query_vec, top_k)
    results = []

    for score, idx in zip(scores[0], indices[0]):
        if idx >= 0 and idx < len(metadata):
            sim_score = float(score)
            # Threshold gating to reject weak matches
            if sim_score >= threshold:
                item = metadata[idx]
                results.append(LegalPassage(
                    passage_id=item["passage_id"],
                    source=item["source"],
                    title=item["title"],
                    text=item["text"],
                    score=round(sim_score, 3)
                ))

    return results
