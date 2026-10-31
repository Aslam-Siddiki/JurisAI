# JurisAI — Resolve. Explain. Move on. - An AI-Assisted Resolution of Small Civil Disputes

> **Instructions for the AI agent:** Read this entire file first. Build from scratch, one phase at a time (see "Build Phases"). Before each phase, give a short plan (files to create or change), then implement. After each phase, run the code, fix errors, and summarize: what was built, how to run it, what to test manually. Stop and wait for me to say "next". Do not add dependencies outside this spec without asking. I must be able to explain every file in a viva, so prefer simple, readable code.

---

## 1. Overview

JurisAI is a web system where two parties in a small civil dispute (e.g. unpaid money, defective goods, deposit refunds) submit their statements and evidence, and an AI pipeline evaluates both sides and produces an **explainable, advisory decision**.

**Important framing:** JurisAI is *decision support*, not a binding judgment. Every result shows this disclaimer, and low-confidence cases are routed to "needs human review".

**Course context:** Fundamentals of AI project. The grade depends mostly on the AI pipeline, its explainability, and its evaluation, so the AI service gets the most effort.

### User flow
1. Party A registers and creates a case.
2. Party A invites Party B by email (tokenized link).
3. Party B accepts (or declines).
4. Both parties submit their issue statement and evidence.
5. When both have submitted, either party (or the system) triggers evaluation.
6. JurisAI returns a decision report: issues, evidence scores, applicable rules, verdict, confidence, suggested settlement.
7. Both parties can view the report; they can mark "accept outcome" or "reject outcome".

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React (Vite), React Router, Tailwind CSS, Axios |
| Backend | Node.js, Express, Mongoose, JWT auth, bcrypt, Multer (uploads), Nodemailer (invites) |
| Database | MongoDB (Atlas) |
| AI service | Python 3.11, FastAPI, Pydantic, sentence-transformers, FAISS (faiss-cpu), pdfplumber, pytesseract (OCR) |
| LLM | Hosted LLM API with a free tier, called only from the Python service. Key in `.env`, never exposed to the client |
| Deployment | Client on Vercel, Node API and Python service on Render, DB on MongoDB Atlas |

---

## 3. Repository Structure

```
jurisai/
├── client/
│   └── src/
│       ├── api/  components/  context/  pages/
├── server/
│   ├── config/  controllers/  middleware/  models/  routes/  services/
│   └── server.js
├── ai-service/
│   ├── app/
│   │   ├── main.py
│   │   ├── schemas.py          # Pydantic models (Section 6)
│   │   ├── pipeline/
│   │   │   ├── evidence.py     # extraction + fact parsing
│   │   │   ├── issues.py       # issue framing
│   │   │   ├── retrieval.py    # FAISS legal retrieval
│   │   │   ├── scoring.py      # explicit evidence weighing
│   │   │   ├── verdict.py      # reasoned decision
│   │   │   └── safeguards.py   # swap test, confidence gate
│   │   └── llm.py              # single wrapper around the LLM API
│   ├── legal_corpus/           # .md/.txt rule passages, one topic per file
│   ├── eval/                   # test cases + evaluation script
│   └── requirements.txt
├── .env.example
└── README.md
```

---

## 4. Data Models (MongoDB)

### User
`name`, `email` (unique), `password` (hashed, never returned), `createdAt`

### Case
- `title`, `category` (enum: Payment, Goods/Service, Rental/Deposit, Contract, Other)
- `claimant` (User), `respondent` (User, set after acceptance), `respondentEmail`
- `inviteToken`, `inviteStatus` (enum: pending, accepted, declined, expired)
- `amountInDispute` (Number, optional)
- `status` (enum: `draft`, `invited`, `awaiting_submissions`, `ready_for_evaluation`, `evaluating`, `decided`, `needs_review`, `closed`)
- `submissions`: `{ claimantSubmitted: Boolean, respondentSubmitted: Boolean }`
- `decision` (ObjectId → Decision, optional)
- timestamps

### Submission
- `case`, `party` (enum: `A` | `B`), `author` (User)
- `statement` (String, required, max 3000 chars)
- `desiredOutcome` (String)
- `evidence`: [Evidence]
- `submittedAt`

### Evidence (embedded in Submission)
- `id` (e.g. `A-1`, `B-2`), `type` (enum: document, image, chat, receipt, other)
- `description` (String, written by the uploader)
- `fileUrl`, `fileName`, `extractedText` (filled by AI service)

### Decision
- `case`, `report` (full JSON from AI service, see Section 6), `verdict`, `confidence`, `needsHumanReview` (Boolean)
- `modelVersion`, `createdAt`
- `partyResponses`: `{ A: accepted|rejected|pending, B: ... }`

---

## 5. Backend API (Node) — base `/api`

### Auth
`POST /auth/register`, `POST /auth/login`, `GET /auth/me`

### Cases
| Method | Route | Description |
|---|---|---|
| POST | `/cases` | Create case (claimant) |
| GET | `/cases` | My cases |
| GET | `/cases/:id` | Case detail (participants only) |
| POST | `/cases/:id/invite` | Send invite email to respondent |
| POST | `/cases/invite/:token/accept` | Respondent accepts (must be logged in) |
| POST | `/cases/invite/:token/decline` | Respondent declines |

### Submissions
| Method | Route | Description |
|---|---|---|
| POST | `/cases/:id/submission` | Submit statement + evidence files (multipart). One per party, locked after submit |
| GET | `/cases/:id/submission` | Own submission only. A party **cannot** read the other's before the decision |

### Evaluation
| Method | Route | Description |
|---|---|---|
| POST | `/cases/:id/evaluate` | Allowed only when both submitted. Calls AI service, stores Decision |
| GET | `/cases/:id/decision` | Decision report (participants only) |
| POST | `/cases/:id/decision/respond` | Party accepts or rejects the outcome |

**Rules:**
- Only the two participants can access a case. Return 403 otherwise.
- Statements are hidden from the other party until a decision exists.
- Invite tokens expire in 7 days and are single-use.
- Evaluation runs once per case unless a human-review reset is triggered.

---

## 6. AI Service (FastAPI) — contracts

Base URL from `AI_SERVICE_URL`. All endpoints validated with Pydantic. Node authenticates with a shared secret header `X-Service-Key`.

### `POST /analyze-evidence`
Input: `{ "evidence": [{ "id": "A-1", "type": "receipt", "description": "...", "file_path": "..." }] }`
Output per item:
```json
{
  "id": "A-1",
  "extracted_text": "...",
  "facts": {
    "dates": ["2026-03-04"],
    "amounts": [{"value": 12000, "currency": "INR"}],
    "parties_mentioned": ["..."],
    "key_claims": ["Payment of 12000 made on 4 March"]
  },
  "quality": { "is_legible": true, "has_date": true, "has_amount": true, "is_third_party_record": true }
}
```

### `POST /frame-issues`
Input: both statements (as Party A and Party B) + analyzed evidence.
Output:
```json
{
  "issues": [
    {
      "issue_id": "I1",
      "question": "Was the agreed payment made in full?",
      "party_a_claim": "...",
      "party_b_claim": "...",
      "undisputed_facts": ["..."],
      "relevant_evidence_ids": ["A-1", "B-2"]
    }
  ]
}
```

### `POST /retrieve-law`
Input: issue question + category. Output: top-k passages `{ "passage_id", "source", "text", "score" }`.

### `POST /score-evidence`
Deterministic scoring (Section 7). Output per issue: score for A, score for B, per-item breakdown.

### `POST /decide`
Runs the full pipeline (analyze → frame → retrieve → score → verdict → safeguards). Output:
```json
{
  "case_summary": "...",
  "issues": [
    {
      "issue_id": "I1",
      "question": "...",
      "evidence_scores": { "A": 0.78, "B": 0.31, "breakdown": [ ... ] },
      "applicable_rules": [ { "passage_id": "R-12", "source": "...", "text": "..." } ],
      "finding": "favours_A | favours_B | split | insufficient_evidence",
      "reasoning": "Step-by-step reasoning citing evidence IDs and rule IDs",
      "confidence": 0.72
    }
  ],
  "overall_verdict": "favours_A | favours_B | partial | needs_human_review",
  "overall_confidence": 0.68,
  "suggested_settlement": "A neutral compromise proposal, with amounts if relevant",
  "swap_test": { "consistent": true, "run_a_first": "favours_A", "run_b_first": "favours_A" },
  "limitations": ["..."],
  "disclaimer": "This is AI decision support, not a binding legal judgment."
}
```

---

## 7. Evidence Scoring (explainable core)

For each evidence item *e* supporting a party on an issue:

```
item_score = relevance × reliability × corroboration
```

- **relevance** (0–1): how directly it addresses the issue. LLM rates, constrained to a rubric (0 = unrelated, 0.5 = context, 1 = directly proves/disproves). Cross-check with embedding similarity between issue and evidence text.
- **reliability** (0–1), rule-based from `quality` fields:
  - third-party record with date and amount (bank/UPI record, invoice): 1.0
  - dated document with partial detail: 0.7
  - chat or message screenshot with visible date: 0.6
  - undated or illegible material: 0.3
  - uploader's own description with no file: 0.2
- **corroboration** (0.5–1.0): 1.0 if another independent item or the *other party's* statement agrees; 0.75 if consistent but uncorroborated; 0.5 if contradicted by other evidence.

Side score for an issue = `1 − Π(1 − item_score)` across that side's items (probabilistic-OR, so several modest items accumulate but never exceed 1).

**Finding rule:**
- If both side scores < 0.25 → `insufficient_evidence`
- If |A − B| < 0.15 → `split`
- Else the higher side is favoured.

The LLM may **not** override the score-based finding. It explains it, citing evidence IDs and rule IDs. If its explanation contradicts the score, flag the issue for review.

---

## 8. Legal Knowledge Base (RAG)

- Folder `ai-service/legal_corpus/` with short, plain-language passages grouped by topic: contract formation and breach, payment and refund obligations, sale of goods and defects, consumer rights, rental deposits, limitation periods, burden of proof basics.
- Each passage has an ID (`R-01`...), a source name, and 100–250 words of text.
- **I will verify and fill the legal text myself** from official sources. The agent should create the structure plus clearly marked placeholder passages, not invent legal claims.
- Chunk by passage, embed with a sentence-transformers model, store in FAISS, persist index to disk, rebuild with a script `python -m app.build_index`.
- Retrieval returns top 3 per issue with similarity scores. If the best score is below a threshold, return "no applicable rule found" rather than forcing a weak match.

---

## 9. Safeguards and Ethics

1. **Anonymize and swap:** the LLM sees "Party A" and "Party B". Run the verdict twice with order swapped. If results disagree, set `needs_human_review`.
2. **Confidence gate:** overall confidence below 0.6, any `insufficient_evidence` on a core issue, or amount in dispute above a configurable cap → `needs_human_review`.
3. **No fabrication:** the LLM prompt must forbid inventing facts, evidence or law. Every conclusion must cite an evidence ID or rule ID from the provided context; strip or flag any that don't resolve.
4. **Strict JSON output** from the LLM, validated with Pydantic; one retry on failure, then return an error, never a guess.
5. **Privacy:** evidence files are accessible only to participants; delete files on case closure request; do not log statement text in plain server logs.
6. **Disclaimer** on every result page and PDF/print view.
7. **Human in the loop:** a rejected outcome or `needs_human_review` shows next steps (mediation, Lok Adalat or consumer forum information, to be verified by me) instead of a verdict.

---

## 10. Frontend Pages

1. Landing: what JurisAI is and is not
2. Register / Login
3. Dashboard: my cases with status badges
4. New Case: title, category, amount, respondent email
5. Case Detail: timeline of status, invite state, submit button
6. Submission form: statement, desired outcome, multi-file upload with a description per file
7. Waiting state: shows that the other party hasn't submitted (without revealing their content)
8. **Decision Report:** summary, overall verdict with confidence meter, per-issue cards with expandable "why" (evidence scores, cited rules, reasoning), suggested settlement, swap-test result, limitations, disclaimer, accept/reject buttons
9. Invite acceptance page
10. 404

Requirements: responsive, loading/empty/error states, toasts, protected routes.

---

## 11. Environment Variables

**server/.env**
```
PORT=5000
MONGO_URI=
JWT_SECRET=
CLIENT_URL=http://localhost:5173
AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_KEY=
SMTP_HOST=
SMTP_USER=
SMTP_PASS=
```

**ai-service/.env**
```
SERVICE_KEY=
LLM_API_KEY=
LLM_MODEL=
CONFIDENCE_THRESHOLD=0.6
```

**client/.env**
```
VITE_API_URL=http://localhost:5000/api
```

---

## 12. Build Phases

### Phase 1 — Scaffold
Create `client`, `server`, `ai-service`. Health routes (`/api/health`, `/health`). MongoDB connection. `.env.example`, `.gitignore`, README stub. Confirm all three run locally.

### Phase 2 — Auth and Cases
User model, auth endpoints and middleware. Case model, create/list/detail with participant-only access. Frontend: auth, dashboard, new case.

### Phase 3 — Invite Flow
Invite token generation, email sending (log the link to console if SMTP isn't configured), accept/decline, status transitions, invite page.

### Phase 4 — Submissions
Submission model, multipart upload with file type and size limits, one submission per party, lock after submit, hide the other party's content. Case status moves to `ready_for_evaluation` when both are in.

### Phase 5 — AI Service Part 1
Pydantic schemas, `llm.py` wrapper, `/analyze-evidence` (PDF text, OCR for images, fact extraction), `/frame-issues`. Test each with sample JSON files in `ai-service/eval/samples/`.

### Phase 6 — AI Service Part 2
Legal corpus structure with placeholders, FAISS build script, `/retrieve-law`, deterministic `scoring.py` exactly as in Section 7 with unit tests for the formula and finding rules.

### Phase 7 — Verdict and Safeguards
`/decide` end to end: verdict prompt with citation rules, JSON validation, citation checking, swap test, confidence gate. Unit tests for the gate logic.

### Phase 8 — Integration
Node `POST /cases/:id/evaluate` calls the AI service, stores the Decision, updates status. Build the Decision Report page with the expandable reasoning view and accept/reject.

### Phase 9 — Evaluation
Write 15–20 test disputes in `ai-service/eval/cases/` (statements, evidence descriptions, expected finding per issue, written by me). Script `python -m eval.run` that outputs a table: accuracy of findings, swap-test consistency rate, rate of needs-human-review, and failure cases. Save results as `eval/results.md`.

### Phase 10 — Polish and Deployment
Loading/empty/error states, seed data and a demo case, responsive fixes. Deploy client to Vercel, Node API and Python service to Render, update CORS and env vars, test the live flow, finalize README.

---

## 13. Acceptance Checklist

- [ ] Register, create case, invite by email, accept, both submit
- [ ] A party can never read the other's statement or evidence before the decision
- [ ] Evaluation blocked until both parties submit
- [ ] Decision report shows per-issue evidence scores, cited rules, reasoning, confidence
- [ ] Every cited evidence/rule ID resolves to a real item
- [ ] Swap test runs and disagreement triggers `needs_human_review`
- [ ] Scoring unit tests pass
- [ ] Evaluation script produces a results table on 15+ test cases
- [ ] Disclaimer visible on every result
- [ ] Live deployed link works end to end

---

## 14. Report Outline (for the course)

1. Problem statement and motivation
2. Scope and limitations (what it will not do)
3. System architecture diagram
4. AI methodology: evidence extraction, issue framing, retrieval, explicit scoring, constrained LLM reasoning, safeguards
5. Why a hybrid design (explainability, reduced hallucination)
6. Evaluation setup and results table
7. Failure analysis
8. Ethics: bias, fairness, privacy, advisory status, human in the loop
9. Future work
