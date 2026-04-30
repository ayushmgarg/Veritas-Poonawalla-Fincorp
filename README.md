# VERITAS

AI-powered video KYC and loan onboarding platform. Customers complete a full loan application via a 7-minute AI-guided video call — identity verified, documents pulled, credit assessed, offer generated. Zero paperwork.

## How It Works

**8-step pipeline running in a single video session:**

1. **Session Init** — Secure V-CIP session established, device/geo fingerprinted
2. **Consent Capture** — Verbal consent recorded, SHA-256 hashed for audit trail
3. **Liveness Check** — MediaPipe face mesh + blink detection + micro-movement analysis blocks photo/video spoofs
4. **UIDAI Face Auth** — Aadhaar-based face authentication, match score returned
5. **DigiLocker** — PAN and Driving License pulled via OAuth 2.0, application auto-filled
6. **Account Aggregator + CIBIL** — 6-month transaction data + bureau score fetched in parallel
7. **AI Risk Assessment** — LLM classifies risk tier (1/2/3) with RBI citations; deterministic policy engine has final override
8. **Loan Offer** — Personalized offers generated, negotiable via AI chat, accepted with tamper-sealed audit record

## Features

- **Real video call** — WebRTC camera/mic, browser-native, no plugins
- **Live fraud detection** — Eye Aspect Ratio blink detection, nose-tip micro-movement variance, GAN spoof confidence score
- **Speech-to-text** — Web Speech API, continuous recognition, NER extracts loan amount / income / employer mid-conversation
- **Agent TTS** — Web Speech Synthesis responds in Indian English
- **India Stack mocks** — UIDAI, DigiLocker, CKYC, CIBIL, Account Aggregator all simulated with realistic persona data
- **LLM pipeline** — Groq (llama-3.3-70b) primary, Gemini (gemini-1.5-flash) fallback, auto-switches on 429
- **Policy engine** — 13 deterministic rules the LLM cannot override (age floor, CIBIL floor, FOIR cap, etc.)
- **Digital Trust Score** — 5-dimension composite from AA transaction behavior
- **Shadow NLP Score** — LLM scores conversation quality as a soft credit signal
- **Hash chain audit trail** — Every event SHA-256 chained, PMLA §12 compliant, 10-year WORM retention
- **Agent dashboard** — Live session monitoring, fraud gauges, India Stack checklist, LLM reasoning panel
- **Gamification** — XP rewards at each step, progress bar, celebration animations
- **AI offer negotiation** — Chat interface uses LLM to interpret tenure/amount requests and recalculate EMI

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16, App Router, TypeScript |
| Styling | Tailwind CSS v4, Framer Motion |
| Video | WebRTC (`getUserMedia`) |
| Face Detection | MediaPipe Face Landmarker (WASM, CDN) |
| Speech | Web Speech API (STT + TTS, browser-native) |
| LLM | Groq → Gemini (fallback) |
| Database | Supabase (PostgreSQL + RLS + Realtime) |
| State | Zustand |
| Crypto | CryptoJS (SHA-256 hash chain) |
| Deploy | Vercel |

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
- **Supabase** — [supabase.com](https://supabase.com) → create project → Settings → API
- **Groq** — [console.groq.com](https://console.groq.com) → API Keys (free, no credit card)
- **Gemini** — [aistudio.google.com/apikey](https://aistudio.google.com/apikey) (free, no credit card)

### 3. Set up the database

Supabase project → SQL Editor → paste `supabase-schema.sql` → Run.

### 4. Run locally

```bash
npm run dev
```

Open `http://localhost:3000` in **Chrome** — required for Web Speech API.

## Project Structure

```
src/
  app/
    api/              20+ API routes (session, verify, fraud, credit, offer, audit)
    session/[id]/     Customer video call + offer page
    dashboard/        Agent monitoring dashboard
    audit/[sessionId] Audit trail viewer
  components/
    session/          Video call UI (AgentPanel, ConsentModal, FraudAlertOverlay, etc.)
    dashboard/        Dashboard panels (FraudGauges, IndiaStackChecklist, etc.)
    ui/               Modal, Badge
  hooks/              useWebRTC, useFaceDetection, useLiveness, useSpeechRecognition
  lib/                LLM client, Supabase client, policy engine, offer calculator, hash chain
  constants/          Steps, policy rules, agent prompts
  types/              TypeScript interfaces
```

## Demo Flow

1. Enter any 10-digit mobile number → Start Application
2. Allow camera and microphone
3. Consent modal → click I Consent
4. Blink twice when prompted (liveness check)
5. Speak your loan details naturally — agent extracts entities from speech
6. DigiLocker modal → Authorize
7. AI risk assessment runs → loan offers generated
8. Accept an offer → confetti → session sealed

**Fraud demo:** hold a printed photo in front of the camera during liveness — the spoof overlay triggers.

**Agent view:** `/dashboard` — live session monitoring with fraud gauges and LLM reasoning.

**Audit trail:** `/audit/<session-id>` — full hash chain with integrity verification and JSON export.

## Deployment

```bash
npx vercel --prod
```

Set the same env vars in Vercel → Project Settings → Environment Variables.

## Compliance References

| Regulation | Coverage |
|---|---|
| RBI V-CIP Master Direction 2024 | §3.1 session recording, §5.1 verbal consent, §7.2 liveness, §9 offer generation |
| PMLA §12 | Tamper-evident audit log, 10-year immutable retention |
| DPDP Act 2023 §8 | Data minimisation, consent before any processing |
| UIDAI KUA §4(e) | Face authentication via Aadhaar |
| CERT-In | AES-256-GCM session encryption |
