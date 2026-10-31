# JurisAI — Resolve. Explain. Move on.

> **AI-Assisted Resolution of Small Civil Disputes**  
> Fundamentals of AI Course Project

---

## 1. Overview
JurisAI is an explainable decision-support web system for small civil disputes (unpaid money, defective goods, security deposit refunds). Disputing parties submit statements and evidence confidentially, and an AI-driven, deterministic hybrid pipeline evaluates both sides to produce an explainable, non-binding advisory decision.

---

## 2. Core AI Algorithms
1. **Dense Semantic Retrieval:** `sentence-transformers` embedding legal statutes into 384-dimensional dense vectors.
2. **FAISS Vector Search:** Cosine similarity nearest-neighbor lookup with a strict threshold gate ($\tau = 0.65$).
3. **Tripartite Evidence Weighing:** $\text{ItemScore} = \text{Relevance} \times \text{Reliability} \times \text{Corroboration}$.
4. **Probabilistic-OR Side Accumulator:** $\text{SideScore} = 1 - \prod (1 - \text{ItemScore}_i)$ to combine multiple independent evidence items.
5. **Counterfactual Swap Test:** Runs verdict with party labels inverted to measure and guard against LLM bias.
6. **Confidence & Evidence Gating:** Automatically flags cases with insufficient evidence or low confidence ($< 0.6$) to human review.

---

## 3. Architecture & Repository Structure
- `frontend/`: React (Vite) + Tailwind CSS interface.
- `backend/`: Node.js (Express + Mongoose) REST API for authentication, case lifecycle, and file uploads.
- `ai-service/`: Python 3 (FastAPI) AI evaluation pipeline.
- `shared/` & `legal_corpus/`: Structured statutes and legal guidelines.
- `AGENT_RULES.md`: Core rules and viva-readiness guidelines for AI agent development.

---

## 4. Quick Start & Local Execution

### Single Command (Start Everything)
You can launch all 3 services (**AI Service**, **Backend**, and **Frontend**) concurrently with a single command from the root directory:

```bash
# 1. Install all dependencies across all 3 folders:
npm run install:all

# 2. Start AI Service, Backend, and Frontend together:
npm start
```

* **Frontend:** `http://localhost:5173`
* **Backend API:** `http://localhost:5000`
* **AI Service (FastAPI docs):** `http://localhost:8000/docs`

---

### Starting Services Individually (Optional)
```bash
cd ai-service
pip install -r requirements.txt
python -m app.build_index          # Builds FAISS legal index from legal_corpus/
uvicorn app.main:app --port 8000   # Starts API on http://localhost:8000
```
To run the automated benchmark evaluation:
```bash
python -m eval.run                 # Runs 16 dispute test suite, produces eval/results.md
```

### 2. Backend (Node.js & Express)
```bash
cd backend
npm install
npm run dev                        # Starts on http://localhost:5000
```

### 3. Frontend (React + Vite + Tailwind CSS)
```bash
cd frontend
npm install
npm run dev                        # Starts on http://localhost:5173
```

---

## 5. End-to-End Workflow Verification

1. **Party A (Claimant)** registers and creates a new dispute with title, category, and counterparty email.
2. **Invite Link**: A single-use 7-day token is generated; Party A copies or emails the link.
3. **Party B (Respondent)** logs in, views the preview, and accepts the dispute.
4. **Confidential Submissions**:
   - Both parties submit their statements and upload supporting evidence (receipts, chats, agreements).
   - Strict confidentiality rule: Neither party can see the other party's statement or evidence before the evaluation.
5. **AI Pipeline Evaluation**:
   - As soon as both have submitted, either party clicks **"Trigger AI Evaluation"**.
   - Node packages evidence and calls FastAPI `/decide`.
   - Pipeline extracts facts, queries statutory index (FAISS), computes deterministic tripartite evidence scores ($\text{Relevance} \times \text{Reliability} \times \text{Corroboration}$ with probabilistic-OR aggregation), runs counterfactual swap-test for bias audit, and generates constrained reasoning.
6. **Decision Report & Outcome**:
   - Displays advisory disclaimer, overall verdict badge, confidence score meter, and suggested settlement.
   - Expandable issue accordion displays party claims, score breakdown table, legal citations, and reasoning.
   - Parties can formally **Accept** or **Reject** the outcome. If both accept, the dispute marks resolved and closes.

---

## 7. Production Deployment & Cloud MongoDB Atlas

JurisAI is configured for production deployment with connection pooling, rate limiting, security headers, and Cloud MongoDB Atlas support.

### Cloud MongoDB Atlas Setup:
1. Set your Atlas connection string in `.env` or `backend/.env`:
   ```env
   MONGO_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/jurisai?retryWrites=true&w=majority
   ```
2. Whitelist `0.0.0.0/0` in Atlas **Network Access** to allow cloud hosting connections.
3. Test the connection at any time:
   ```bash
   npm run test:db
   ```

For detailed deployment instructions (Render, Railway, Docker, Vercel, unified or split setup), refer to [`DEPLOYMENT.md`](file:///c:/Users/aslam/OneDrive/Desktop/JURISAI/DEPLOYMENT.md).


