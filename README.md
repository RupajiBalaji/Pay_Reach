# PayReach — AI Decision-Layer Payment Collection Agent for Card-less Bank Users

> **Submission for Razorpay Buildathon — Open Track**

Crores of Jan Dhan, rural, and first-time bank users in India have an account number and IFSC but **no physical debit card** — so they cannot generate a UPI QR code the normal way. Existing "account+IFSC → QR" tools quietly fail because banks increasingly reject that method under NPCI error **U16** ("Risk threshold exceeded").

**PayReach** is an AI decision-layer that, given just account number + IFSC + phone number, evaluates every legitimate collection path (Aadhaar-OTP UPI activation, UPI collect request, Razorpay payment link, account+IFSC QR as last resort), predicts which will actually work for that user's bank using a learned per-bank risk model, executes with automatic fallback, and shows a fully explainable audit trail of every decision — not just a QR code that may or may not scan.

---

## 1. Why This Matters: The Card-less Bank Gap in India

Under the Pradhan Mantri Jan Dhan Yojana (PMJDY) and widespread financial inclusion initiatives, over 50 crore Indians have opened bank accounts. However:
- A significant proportion never received, lost, or never activated a physical RuPay/debit card.
- Without a debit card, NPCI's standard UPI onboarding flow cannot be initiated on consumer apps like Google Pay, PhonePe, or Paytm.
- Unofficial or legacy tools attempt to construct static UPI payment strings with the virtual VPA format `account@ifsc.ifsc.npci`.
- **The Silent Failure:** Indian banking switches (especially major Public Sector Undertaking banks) actively block or rate-limit these direct switch transfers with NPCI Error Code `U16`. The merchant or customer sees a generated QR code, but when the payer scans it, the payment fails without a clear explanation.

PayReach eliminates this failure mode through proactive intelligence: ranking viable rails beforehand, attempting the safest path first, automatically cascading to fallbacks upon failure, and learning continuously from bank response patterns.

---

## 2. Architecture Overview

```
User Input (Account No, IFSC, Phone, Amount)
       │
       ▼
┌─────────────────────────────────┐
│ 1. Validation Layer             │  → Regex IFSC validation, local bank lookup,
└─────────────────────────────────┘     account length sanity check per bank
       │
       ▼
┌─────────────────────────────────┐
│ 2. AI Decision Engine           │  → Computes confidence scores (0-100%) and
│    (Per-Bank Risk Model)        │     ranks methods using historical success log
└─────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ 3. Automated Rail Execution     │
│    • Aadhaar-OTP UPI            │  (SIMULATED — weighted by bank Aadhaar readiness)
│    • UPI Collect Request        │  (SIMULATED — weighted by PSP acceptance rate)
│    • Razorpay Payment Link      │  (REAL INTEGRATION — Razorpay Test Mode API)
│    • Account+IFSC QR            │  (SIMULATED — flagged high-risk U16 failure)
└─────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ 4. Explainable Audit Logger     │  → Step-by-step diagnostic audit trail with
└─────────────────────────────────┘     failure codes & latency for every attempt
       │
       ▼
┌─────────────────────────────────┐
│ 5. Adaptive Model Update        │  → Bayesian update: new_conf = old * 0.8 + outcome * 0.2
└─────────────────────────────────┘
```

---

## 3. Real vs. Simulated Components (Transparency Matrix)

All simulated rails are cleanly isolated behind a common `RailAdapter` interface in `/lib/rails/*.ts`, ensuring complete architectural separation from the real payment gateway integration:

| Component | Status | Location | Implementation Details |
| :--- | :--- | :--- | :--- |
| **Razorpay Payment Links** | **REAL INTEGRATION** | `/lib/rails/razorpay.ts` | Dispatches live HTTP requests to `https://api.razorpay.com/v1/payment_links` via Basic Auth. Generates actual workable payment links. |
| **AI Decision Engine** | **REAL INTEGRATION** | `/lib/ai-reasoner.ts` | Calls Google Gemini API (`gemini-2.5-flash` / `gemini-3.6-flash`) with rotational key management and model failover for per-bank rail ranking and reasoning, with deterministic fallback if the API is unavailable. |
| **Aadhaar-OTP UPI Activation** | **SIMULATED** | `/lib/rails/aadhaar-otp.ts` | Simulates UIDAI Aadhaar-bank link verification and OTP challenge dispatch, weighted by bank's stored profile. |
| **UPI Collect Request** | **SIMULATED** | `/lib/rails/upi-collect.ts` | Simulates pushing collect notifications to the user's mobile VPA with realistic PSP response and timeout rates. |
| **Account+IFSC QR Code** | **SIMULATED** | `/lib/rails/account-ifsc-qr.ts` | Generates standard NPCI UPI URI strings and simulates realistic bank switch rejections under NPCI Error `U16`. |
| **Adaptive Learning** | **LIVE LOGIC** | `/lib/orchestrator.ts` | Updates stored bank confidence scores after every transaction using a Bayesian-weighted moving average. |

> **Storage Architecture & Serverless (Vercel) Deployment Note:**
> - Baseline bank risk profiles are stored in `data/seed.json` (tracked in git) ensuring 100% reproducible benchmarks.
> - In serverless environments (e.g., Vercel), runtime state and transaction logs write to `/tmp/payreach.json` (or memory cache) to respect read-only container filesystems.
> - **Honest Caveat:** Container `/tmp` storage in Vercel is per-instance and ephemeral across cold starts. The Bayesian model updates live for the duration of that instance, while local development maintains full persistent disk storage.

---

## 4. Multi-Bank Batch Benchmark

PayReach includes a built-in empirical testing engine (`/api/batch-test` and the **Batch Benchmark** dashboard) that runs 50+ synthetic requests across 18+ Indian banks (State Bank of India, Punjab National Bank, Bank of Baroda, HDFC, ICICI, Axis, Canara, etc.):
- **Recharts Data Visualization:** Visualizes success rates across diverse PSU vs Private banks.
- **U16 Avoidance Metric:** Demonstrates the exact count of silent switch rejections avoided and rescued by automated fallback.
- **Winning Rail Distribution:** Details which collection method sealed the transaction.
- **In-Memory Batch Caching:** Repeated synthetic requests for the same bank within a batch run reuse the initial Gemini AI decision ranking, conserving rate limits while showcasing full multi-bank diversity.

---

## 5. 90-Second Demo Script

1. **The Hook:** *"Here's the problem — I hit this myself: I have an account number and IFSC but no debit card, so I can't generate a payment QR the normal way."*
2. **The Hidden Failure:** *"Tools that do 'account+IFSC to QR' already exist, but they silently fail — banks reject them under NPCI error U16 more and more often. That's the gap."*
3. **The AI Decision Layer:** *"Instead of guessing, PayReach ranks every legitimate collection method for this specific bank, and recommends the safest one first."*
4. **Live Fallback:** *"Watch this: I trigger a live request. When high-risk rails or timeouts hit, PayReach catches the error and automatically fails over in real time until funds can be collected — here generating a real Razorpay payment link."*
5. **Explainable Trail:** *"Every decision is explainable — this isn't a black box. Look at the audit trail: we know exactly why each rail was ranked, how long it took, and why the fallback kicked in."*
6. **Empirical Benchmark:** *"Across 50 synthetic accounts spanning 15+ banks, here's our real success rate, broken down by bank — and this risk model updates itself as more attempts come in."*
7. **The Close:** *"This started as a personal pain point, but it maps directly onto Jan Dhan and rural account holders who are the most likely to be card-less and least served by existing tools."*

---

## 6. Getting Started Locally

### Prerequisites
- Node.js 18+ or 20+ (Node 24 supported)
- npm or pnpm

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/payreach.git
cd payreach

# Install dependencies
npm install

# (Optional) Add your API credentials in .env.local
# Get a free Google Gemini key at: https://aistudio.google.com/apikey
# If omitted, PayReach will gracefully use deterministic rule-based ranking and authentic test link previews
echo "GEMINI_API_KEY=your_gemini_api_key" > .env.local
echo "RAZORPAY_KEY_ID=rzp_test_your_key_id" >> .env.local
echo "RAZORPAY_KEY_SECRET=your_key_secret" >> .env.local

# Run the database test
npm run seed

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 7. What We'd Build Next With More Time

1. **Direct NPCI Aadhaar-OTP Integration:** Partner with a sponsor bank or NPCI Bharat Interface to directly trigger UIDAI-based Aadhaar UPI PIN setup natively inside the flow.
2. **Dynamic Bank Switch Health Polling:** Integrate NPCI's live bank switch uptime API to factor real-time downtime into the decision engine's confidence scores.
3. **Soundbox & Hardware POS Bridging:** Broadcast the winning collection method (e.g. dynamic QR or payment link SMS) directly to merchant soundbox devices for rural kirana stores.
4. **Offline USSD (*99#) Fallback:** For feature-phone users without smartphone internet, provide automatic USSD session triggering.

---

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + Lucide Icons
- **Data Persistence:** File-backed SQLite/JSON persistence store with atomic writes
- **Real Rail:** Razorpay Test-Mode Payment Links API
- **Analytics:** Recharts
