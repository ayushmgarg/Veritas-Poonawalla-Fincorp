# VERITAS — Agentic V-CIP Platform

> AI-powered video KYC and instant loan onboarding. Identity verified, documents pulled, credit assessed, offer generated — in a single 8-minute live video call. Zero paperwork.

Built for Poonawalla Fincorp · TenzorX 2026

---

## How It Works

An 8-step pipeline runs entirely within a single video session:

| Step | What happens |
|---|---|
| 1. Session Init | Secure V-CIP session, device/geo fingerprinted, duplicate phone check |
| 2. Consent Capture | Verbal consent recorded, SHA-256 hashed for PMLA audit trail |
| 3. Liveness Check | MediaPipe face mesh — blink + micro-movement analysis blocks photo/video spoofs |
| 4. Aadhaar Face Auth | UIDAI face match, match score returned, live risk score updated |
| 5. DigiLocker | PAN + Driving License pulled via OAuth, application auto-filled |
| 6. Account Aggregator + CIBIL | 6-month transaction data + bureau score fetched in parallel |
| 7. AI Risk Assessment | LLM classifies risk tier (1/2/3) with RBI citations; deterministic policy engine has final override |
| 8. Loan Offer | Personalised offers generated (speech-adjusted rate), negotiable via AI chat, sealed with tamper-proof audit record |

---

## Features

### Core KYC Flow
- **Real video call** — WebRTC (`getUserMedia`), browser-native, no plugins
- **Continuous speech recognition** — Web Speech API, NER extracts loan amount / income / employer mid-conversation
- **Agent TTS** — responds in Indian English via Web Speech Synthesis
- **Question prompts** — contextual questions overlaid on video at each step, feed into transcript analysis
- **India Stack mocks** — UIDAI, DigiLocker, CKYC, CIBIL, Account Aggregator simulated with realistic persona data (2 personas: Priya/Rahul, routed by phone last digit parity)

### Fraud & Risk
- **Live Risk Meter** — real-time 0–100 risk score, event-driven deltas from 15 signal types, circular gauge in UI
- **Live fraud detection** — Eye Aspect Ratio blink detection, nose-tip micro-movement variance, GAN spoof confidence
- **Intent Drift Detection** — rule-based + LLM detects contradictions in income / employer / name across transcripts
- **Trust Graph** — cross-session PAN/phone/Aadhaar reuse detection (fraud ring analysis)
- **Speech Analysis** — hesitation markers, evasion patterns, confidence scoring → adjusts interest rate by 0–300 bps

### AI Pipeline
- **LLM** — Groq (llama-3.3-70b) primary, Gemini (gemini-1.5-flash) fallback, auto-switches on rate limit
- **Policy engine** — 13 deterministic rules the LLM cannot override (age floor, CIBIL floor, FOIR cap, etc.)
- **Digital Trust Score** — 5-dimension composite from AA transaction behaviour
- **Shadow NLP Score** — LLM scores conversation quality as soft credit signal
- **AI offer negotiation** — chat interface interprets tenure/amount requests, recalculates EMI

### UX & Auth
- **Google Sign-In** — Supabase OAuth, `/auth/callback` route
- **QR code handoff** — scan to continue session on mobile
- **Light / dark mode** — CSS variable theming, persisted in localStorage
- **Gamification** — XP rewards at each step, particle burst celebration
- **Hash chain audit trail** — every event SHA-256 chained, PMLA §12, 10-year WORM retention

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16, App Router, TypeScript |
| Styling | Tailwind CSS v4, Framer Motion |
| Video | WebRTC (`getUserMedia`) |
| Face Detection | MediaPipe Face Landmarker (WASM, CPU delegate) |
| Speech | Web Speech API (STT + TTS, browser-native) |
| LLM | Groq (llama-3.3-70b) → Gemini 1.5 Flash (fallback) |
| Database | Supabase (PostgreSQL + RLS + Realtime) |
| Auth | Supabase OAuth (Google) |
| State | Zustand |
| Crypto | CryptoJS (SHA-256 hash chain) |
| Deploy | Vercel |

---

## Setup

### 1. Clone and install

```bash
git clone <repo>
cd veritas
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | [supabase.com](https://supabase.com) → project → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same page |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page (keep secret — server only) |
| `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) → API Keys (free) |
| `GEMINI_API_KEY` | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) (free) |

### 3. Set up the database

Supabase project → SQL Editor → paste entire `supabase-schema.sql` → Run.

> **Existing database?** Uncomment the migration block at the bottom of `supabase-schema.sql` and run only that.

### 4. Enable Google Sign-In (optional)

1. [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → Create OAuth 2.0 Client ID (Web)
2. Authorized redirect URI: `https://<your-supabase-ref>.supabase.co/auth/v1/callback`
3. Supabase → Authentication → Providers → Google → paste Client ID + Secret

### 5. Run locally

```bash
npm run dev
```

Open `http://localhost:3000` in **Chrome** — required for Web Speech API.

---

## Project Structure

```
src/
  app/
    api/
      session/          Session CRUD, step advance, consent, risk endpoint
      verify/           Aadhaar, DigiLocker, CKYC, CIBIL, AA (India Stack mocks)
      fraud/            Liveness, spoof-check, trust-graph, intent-drift
      credit/           Shadow score, risk classification, digital trust
      offer/            Generate, negotiate, accept
      speech/           Transcript processing + entity extraction
      audit/            Audit log retrieval
    session/[id]/       Customer video call UI + offer page
    dashboard/          Agent monitoring dashboard (PIN gated)
    audit/[sessionId]/  Audit trail viewer
    auth/callback/      Supabase OAuth callback
  components/
    session/            AgentPanel, ConsentModal, DigiLockerModal, FraudAlertOverlay,
                        LiveRiskMeter, LivenessIndicator, QuestionPrompt,
                        StepProgress, TranscriptPanel, XPCelebration
    dashboard/          EventTimeline, FinancialSummary, FraudGauges,
                        IndiaStackChecklist, LLMReasoningPanel, SessionCard
    ui/                 ThemeToggle, GoogleSignIn, QRCode, Modal, Badge
  hooks/                useWebRTC, useFaceDetection, useLiveness,
                        useSpeechRecognition, useSession, useSSE
  lib/                  llm, supabase, mock-data, offer-calculator, policy-engine,
                        risk-engine, speech-analysis, intent-drift, trust-graph,
                        digital-trust, hash-chain, audit-logger
  constants/            steps, prompts, policy-rules
  types/                TypeScript interfaces
```

---

## Demo Flow

1. Enter any 10-digit mobile number → **Begin KYC**
2. Scan QR to continue on mobile, or click **Continue here**
3. Allow camera + microphone
4. Consent modal → **I Consent**
5. Blink twice when prompted (liveness check)
6. Speak your details naturally — agent extracts income / employer / loan purpose
7. DigiLocker modal → **Authorize**
8. AI risk assessment + speech analysis → personalised loan offers generated
9. Accept an offer → confetti → session sealed with audit record

**Fraud demo:** hold a printed photo in front of the camera during liveness — spoof overlay triggers.

**Different personas:** even last digit → Rahul (freelancer, CIBIL 680), odd last digit → Priya (TCS, CIBIL 762).

**Agent dashboard:** `/dashboard` (PIN: `VERITAS`) — live session monitoring, fraud gauges, LLM reasoning.

**Audit trail:** `/audit/<session-id>` — full SHA-256 hash chain with integrity verification.

---

## Deployment

```bash
npx vercel --prod
```

Set the same env vars in Vercel → Project Settings → Environment Variables.

---

## Compliance

| Regulation | Coverage |
|---|---|
| RBI V-CIP Master Direction 2024 | §3.1 session recording, §5.1 verbal consent, §7.2 liveness, §9 offer generation |
| PMLA §12 | Tamper-evident SHA-256 hash chain audit log, 10-year immutable retention |
| DPDP Act 2023 §8 | Data minimisation, consent before any processing |
| UIDAI KUA §4(e) | Face authentication via Aadhaar |
| CERT-In | AES-256-GCM session encryption |
