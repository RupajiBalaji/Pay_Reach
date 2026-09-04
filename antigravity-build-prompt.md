# Antigravity Build Prompt — "PayReach" (AI Payment-Collection Agent for Card-less Users)

Paste this whole document into Antigravity as your project brief. It's written so an agentic coding tool can execute it phase-by-phase without you needing to fill gaps mid-build.

---

## 0. One-paragraph pitch (put this in your submission too)

Crores of Jan Dhan, rural, and first-time bank users in India have an account number and IFSC but no debit card — so they can't generate a UPI QR the normal way, and existing "account+IFSC QR generator" tools quietly fail because banks increasingly reject that method under NPCI error **U16**. **PayReach** is an AI decision-layer that, given just account number + IFSC + phone number, evaluates every legitimate collection path (Aadhaar-OTP UPI activation, UPI collect request, payment link, account+IFSC QR as last resort), predicts which will actually work for that user's bank using a learned per-bank risk model, executes with automatic fallback, and shows a fully explainable audit trail of every decision — not just a QR code that may or may not scan.

---

## 1. Tech stack (optimized for "must run tonight")

- **Frontend:** Next.js 14 (App Router) + Tailwind + shadcn/ui — fast to scaffold, looks polished with no design effort.
- **Backend:** Same Next.js app, API routes (`/app/api/...`) — no separate server, one repo, one deploy.
- **DB:** SQLite via `better-sqlite3` (zero setup, file-based, persists between runs) — or lowest-friction: a JSON file store if Antigravity struggles with native bindings.
- **Real payment rail:** Razorpay **test mode** Payment Links API (you already have buildathon access) — this is your one *real* integration, everything else around it is the "AI decision layer."
- **Mocked rails (clearly labeled as simulated in the UI):** Aadhaar-OTP UPI activation check, bank-specific UPI collect availability, account+IFSC QR generation/validation. Mock these with realistic logic and random-but-weighted failure rates per bank — judges care that the *decision logic* is real, not that you have live bank API access (you can't get that in a hackathon anyway).
- **Charting:** Recharts, for the success-rate dashboard.
- **Deploy:** Vercel (fastest) or run locally and screen-share/record — either way, make sure `npm run dev` works end-to-end before you sleep.

Tell Antigravity explicitly: *"Mocked services must be isolated behind an interface (e.g. `/lib/rails/*.ts`), so a judge or future contributor can see exactly what's real (Razorpay test API) vs simulated (bank rail responses), and so simulated ones can be swapped for real APIs later without touching the decision engine."* This isolation is itself a talking point in your demo.

---

## 2. Architecture overview

```
User Input (account no, IFSC, phone, amount)
        │
        ▼
 ┌─────────────────────┐
 │ Validation Layer     │  → IFSC format/bank lookup, account no. checksum-ish check
 └─────────────────────┘
        │
        ▼
 ┌─────────────────────┐
 │ Decision Engine       │  → ranks collection methods by predicted success
 │ (bank-risk model)     │     for this bank, using historical success/failure log
 └─────────────────────┘
        │
        ▼
 ┌─────────────────────┐
 │ Rail Attempt Sequence │
 │  1. Aadhaar-OTP UPI   │ (mocked)
 │  2. UPI collect req   │ (mocked)
 │  3. Razorpay pay link │ (REAL - test mode)
 │  4. Acct+IFSC QR      │ (mocked, flagged high-risk / last resort)
 └─────────────────────┘
        │
        ▼
 ┌─────────────────────┐
 │ Audit Trail Logger    │  → every attempt + reasoning + outcome, per transaction
 └─────────────────────┘
        │
        ▼
 ┌─────────────────────┐
 │ Bank Risk Model Update│ → adjusts per-IFSC-prefix confidence score
 └─────────────────────┘
```

---

## 3. Phases (build in this order — each phase should be independently demoable)

### **Phase 1 — Scaffold & Data Model** (30–45 min)
- Init Next.js + Tailwind + shadcn/ui project.
- Define core types: `PaymentRequest`, `RailAttempt`, `BankRiskProfile`, `AuditEvent`.
- SQLite tables: `requests`, `attempts`, `bank_risk_profiles`, `audit_log`.
- Seed `bank_risk_profiles` with ~15–20 real Indian bank IFSC prefixes (SBIN, HDFC, ICIC, UTIB, PUNB, etc.) each with a starting mock "U16 rejection probability" (make these plausible — e.g. larger PSU banks slightly higher rejection rate on account+IFSC QR, cite this as an assumption in the README, not a real claim).
- **Checkpoint:** empty UI shell running locally, DB reads/writes verified via a test script.

### **Phase 2 — Validation Layer** (30 min)
- IFSC format validation (regex: 4 letters + 0 + 6 alphanumeric) and bank-name lookup from IFSC prefix (small local lookup table, no external API needed).
- Basic account number sanity check (length range per bank type).
- Return structured validation result with clear pass/fail reasons (this feeds the audit trail later).
- **Checkpoint:** form that takes account no. + IFSC + phone, shows validation result instantly.

### **Phase 3 — Decision Engine (the core AI/logic differentiator)** (60–90 min)
- Build `rankCollectionMethods(bankProfile, requestContext)` that returns an ordered list of methods with a confidence score and a one-line reason each, e.g.:
  - "Aadhaar-OTP UPI activation — 78% confidence, recommended first: avoids QR risk entirely."
  - "Razorpay payment link — 95% confidence, works regardless of bank."
  - "Account+IFSC QR — 22% confidence for this bank, high U16 rejection history, last resort only."
- This ranking should actually read `bank_risk_profiles` from the DB, not be hardcoded per request — that's what makes it "learn."
- **Checkpoint:** given any account+IFSC, UI shows a ranked list of methods with reasons, before any rail is attempted.

### **Phase 4 — Rail Execution + Fallback** (60–90 min)
- Implement each rail behind a common interface `attemptRail(method, request): RailResult`.
- Aadhaar-OTP, UPI-collect, Acct+IFSC-QR: simulated with weighted-random outcomes based on the bank's stored risk profile (so it's not literally random — a "risky" bank should visibly fail more often across your batch test in Phase 6).
- Razorpay payment link: **real** call to Razorpay Test API `/v1/payment_links` — this is your one genuine external integration, make sure it actually returns a working test payment link.
- On failure, automatically move to next-ranked method and log why.
- **Checkpoint:** a single request end-to-end tries methods in order, ends in either success (real Razorpay link shown) or exhausts all methods.

### **Phase 5 — Audit Trail UI** (45 min)
- Timeline component per request: each rail attempt as a step, with status (tried/succeeded/failed), the reason it was tried at that rank, and the reason it failed if it did.
- This should look like a "decision log," not a debug console — clean UI, use shadcn `Accordion` or a vertical stepper.
- **Checkpoint:** after Phase 4's flow runs, this page renders the full explainable trail for that transaction.

### **Phase 6 — Adaptive Learning + Batch Test** (60 min)
- After each real/simulated attempt, update the relevant `bank_risk_profiles` row (simple Bayesian-ish update: `new_confidence = old_confidence * 0.8 + outcome * 0.2` is enough — don't overbuild ML here, judges want to see the concept, not a research paper).
- Build a "Run batch test" button: generates 50+ synthetic requests across your seeded bank list, runs them through the full pipeline, and outputs:
  - Overall success rate
  - Success rate by bank
  - Which method won for each successful case
  - A chart (Recharts bar chart: success rate per bank)
- **Checkpoint:** this is your money screenshot/demo moment — a real, numeric result, not a cherry-picked single success.

### **Phase 7 — Polish, README, Demo Script** (30–45 min)
- Landing page: pitch paragraph (Section 0 above) + "why this matters" (Jan Dhan/underbanked stat, cite generally, don't fabricate a specific number you can't source).
- README: architecture diagram (reuse Section 2), clearly labeled table of "Real vs Simulated" components, how to run locally, what you'd build next with more time (e.g. real bank API partnerships, real NPCI Aadhaar-OTP integration).
- 90-second demo script (see Section 4 below) — rehearse this, don't wing it.
- **Checkpoint:** `npm run dev`, click through the whole flow once, live, with no console errors.

---

## 4. Demo script (say this, in this order)

1. "Here's the problem — I hit this myself: I have an account number and IFSC but no debit card, so I can't generate a payment QR the normal way."
2. "Tools that do 'account+IFSC → QR' already exist, but they silently fail — banks reject them under NPCI error U16 more and more often. That's the gap."
3. Show the ranked decision screen: "Instead of guessing, PayReach ranks every legitimate collection method for this specific bank, and recommends the safest one first."
4. Trigger a live request → show the fallback happening in real time → show the real Razorpay payment link generated.
5. Open the audit trail: "Every decision is explainable — this isn't a black box."
6. Run the batch test live: "Across 50 synthetic accounts spanning 15+ banks, here's our real success rate, broken down by bank — and this risk model updates itself as more attempts come in."
7. Close: "This started as a personal pain point, but it maps directly onto Jan Dhan and rural account holders who are the most likely to be card-less and least served by existing tools."

---

## 5. Guardrails while building tonight

- Tell Antigravity: **do not fabricate real bank API integrations** — mocked rails must be clearly labeled as simulated in code comments and in the UI (e.g. a small "Simulated" badge next to Aadhaar-OTP/UPI-collect/QR results). Judges respect honesty about what's real; getting caught overclaiming is worse than admitting a mock.
- Keep the Razorpay integration as the one real payment action — don't try to also fake being Razorpay-official for the other rails.
- If time runs short, cut Phase 6's live-updating risk model before you cut the batch test numbers — the numeric result matters more than the self-updating mechanic for a first impression.
- Commit early and often; have a working version at every checkpoint above so you always have a fallback demo build if a later phase breaks.

---

## 6. What to hand Antigravity as the literal first instruction

> "Build the project described in this document phase by phase, stopping after each phase for me to review before continuing. Use Next.js 14 App Router, Tailwind, shadcn/ui, and SQLite via better-sqlite3. Isolate all mocked bank-rail logic behind a common interface in /lib/rails/, clearly commented as simulated, separate from the one real integration (Razorpay test-mode Payment Links API). Start with Phase 1."
