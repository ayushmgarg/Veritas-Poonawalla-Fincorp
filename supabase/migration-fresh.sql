-- VERITAS Fresh Schema Migration
-- Run this in Supabase SQL Editor to create all tables from scratch.
-- WARNING: This drops ALL existing tables and data. Back up first if needed.
--
-- Encrypted fields (full_name, aadhaar_last4, pan, dob, address) are TEXT
-- because they store AES-256-GCM base64 payloads, not raw values.

-- ============================================================
-- DROP existing tables (reverse dependency order)
-- ============================================================
DROP TABLE IF EXISTS recordings CASCADE;
DROP TABLE IF EXISTS recording_chunks CASCADE;
DROP TABLE IF EXISTS trust_edges CASCADE;
DROP TABLE IF EXISTS trust_nodes CASCADE;
DROP TABLE IF EXISTS liveness_checks CASCADE;
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS consents CASCADE;
DROP TABLE IF EXISTS llm_decisions CASCADE;
DROP TABLE IF EXISTS loan_offers CASCADE;
DROP TABLE IF EXISTS fraud_events CASCADE;
DROP TABLE IF EXISTS transcripts CASCADE;
DROP TABLE IF EXISTS financial_data CASCADE;
DROP TABLE IF EXISTS verifications CASCADE;
DROP TABLE IF EXISTS customer_data CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;

-- ============================================================
-- 1. sessions — Core V-CIP session tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'initiated'
    CHECK (status IN ('initiated', 'consent', 'in_progress', 'completed', 'abandoned', 'fraud_blocked')),
  current_step INTEGER NOT NULL DEFAULT 0,
  device_info JSONB DEFAULT '{}',
  geo_location JSONB,
  live_risk_score NUMERIC DEFAULT 35,
  risk_events JSONB DEFAULT '[]',
  speech_assessment JSONB,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sessions_phone ON sessions (phone);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions (status);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions (started_at DESC);

-- ============================================================
-- 2. customer_data — PII (encrypted fields are TEXT)
-- ============================================================
CREATE TABLE IF NOT EXISTS customer_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  full_name TEXT,          -- AES-256-GCM encrypted
  aadhaar_last4 TEXT,      -- AES-256-GCM encrypted
  pan TEXT,                -- AES-256-GCM encrypted
  dob TEXT,                -- AES-256-GCM encrypted (NOT date type)
  address TEXT,            -- AES-256-GCM encrypted
  age_estimated INTEGER,
  extracted_via TEXT DEFAULT 'speech',
  employer TEXT,
  income_declared NUMERIC,
  loan_amount_requested NUMERIC,
  loan_purpose TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (session_id)
);

CREATE INDEX IF NOT EXISTS idx_customer_data_session ON customer_data (session_id);

-- ============================================================
-- 3. verifications — Aadhaar, DigiLocker, CIBIL, AA results
-- ============================================================
CREATE TABLE IF NOT EXISTS verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  match_score NUMERIC,
  response_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verifications_session ON verifications (session_id);

-- ============================================================
-- 4. financial_data — AA + CIBIL + computed scores
-- ============================================================
CREATE TABLE IF NOT EXISTS financial_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  cibil_score INTEGER,
  cibil_band TEXT,
  existing_loans INTEGER DEFAULT 0,
  delinquency_count INTEGER DEFAULT 0,
  monthly_income NUMERIC,
  monthly_expenses NUMERIC,
  avg_balance NUMERIC,
  transaction_count_6m INTEGER,
  unique_merchants INTEGER,
  income_regularity_score NUMERIC,
  digital_trust_score NUMERIC DEFAULT 0,
  shadow_nlp_score NUMERIC DEFAULT 0,
  composite_score NUMERIC DEFAULT 0,
  speech_assessment_score NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (session_id)
);

CREATE INDEX IF NOT EXISTS idx_financial_data_session ON financial_data (session_id);

-- ============================================================
-- 5. transcripts — Speech-to-text records
-- ============================================================
CREATE TABLE IF NOT EXISTS transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  speaker TEXT NOT NULL DEFAULT 'customer',
  text TEXT NOT NULL,
  language TEXT DEFAULT 'en',
  confidence NUMERIC DEFAULT 0.9,
  entities_extracted JSONB DEFAULT '[]',
  timestamp_ms BIGINT DEFAULT (EXTRACT(EPOCH FROM now()) * 1000)::BIGINT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transcripts_session ON transcripts (session_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_timestamp ON transcripts (session_id, timestamp_ms);

-- ============================================================
-- 6. fraud_events — Spoof detection, anomaly flags
-- ============================================================
CREATE TABLE IF NOT EXISTS fraud_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  confidence NUMERIC,
  details JSONB,
  action_taken TEXT,
  frame_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fraud_events_session ON fraud_events (session_id);

-- ============================================================
-- 7. loan_offers — Generated & negotiated offers
-- ============================================================
CREATE TABLE IF NOT EXISTS loan_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  eligible_amount NUMERIC NOT NULL,
  interest_rate NUMERIC NOT NULL,
  tenure_months INTEGER NOT NULL,
  emi NUMERIC NOT NULL,
  processing_fee NUMERIC DEFAULT 0,
  is_selected BOOLEAN DEFAULT false,
  offer_status TEXT DEFAULT 'generated'
    CHECK (offer_status IN ('generated', 'negotiated', 'accepted', 'rejected', 'expired')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loan_offers_session ON loan_offers (session_id);

-- ============================================================
-- 8. llm_decisions — Risk classification results
-- ============================================================
CREATE TABLE IF NOT EXISTS llm_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  risk_tier INTEGER NOT NULL CHECK (risk_tier BETWEEN 1 AND 3),
  confidence NUMERIC,
  reasoning TEXT,
  rbi_citations JSONB,
  persona_classification TEXT,
  policy_rules_evaluated INTEGER,
  policy_rules_passed INTEGER,
  raw_llm_response JSONB,
  decided_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_llm_decisions_session ON llm_decisions (session_id);
CREATE INDEX IF NOT EXISTS idx_llm_decisions_decided ON llm_decisions (decided_at DESC);

-- ============================================================
-- 9. consents — Verbal/written consent records
-- ============================================================
CREATE TABLE IF NOT EXISTS consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL,
  consent_text TEXT,
  audio_hash TEXT,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consents_session ON consents (session_id);

-- ============================================================
-- 10. audit_log — Immutable hash-chained audit trail
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  hash TEXT NOT NULL,
  previous_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_session ON audit_log (session_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log (created_at DESC);

-- ============================================================
-- 11. liveness_checks — MediaPipe face liveness results
-- ============================================================
CREATE TABLE IF NOT EXISTS liveness_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  blink_count INTEGER DEFAULT 0,
  micro_movement_count INTEGER DEFAULT 0,
  head_yaw NUMERIC DEFAULT 0,
  head_pitch NUMERIC DEFAULT 0,
  face_confidence NUMERIC DEFAULT 0,
  is_live BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_liveness_checks_session ON liveness_checks (session_id);

-- ============================================================
-- 12. trust_nodes — Trust graph nodes (phone, IP, PAN, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS trust_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  value TEXT NOT NULL,
  session_count INTEGER DEFAULT 1,
  risk_score NUMERIC DEFAULT 0,
  last_seen TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (type, value)
);

CREATE INDEX IF NOT EXISTS idx_trust_nodes_type_value ON trust_nodes (type, value);

-- ============================================================
-- 13. trust_edges — Trust graph edges (relationships)
-- ============================================================
CREATE TABLE IF NOT EXISTS trust_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL,
  source_value TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_value TEXT NOT NULL,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trust_edges_target ON trust_edges (target_type, target_value);
CREATE INDEX IF NOT EXISTS idx_trust_edges_source ON trust_edges (source_value);

-- ============================================================
-- 14. recording_chunks — Individual video chunk metadata
-- ============================================================
CREATE TABLE IF NOT EXISTS recording_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  size_bytes INTEGER,
  sha256_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (session_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_recording_chunks_session ON recording_chunks (session_id);

-- ============================================================
-- 15. recordings — Sealed recording sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  total_chunks INTEGER NOT NULL,
  duration_seconds INTEGER NOT NULL,
  codec TEXT,
  composite_sha256 TEXT NOT NULL,
  total_size_bytes BIGINT DEFAULT 0,
  sealed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (session_id)
);

CREATE INDEX IF NOT EXISTS idx_recordings_session ON recordings (session_id);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
-- Enable RLS on all tables (service role key bypasses RLS)
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE liveness_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE recording_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;

-- Service role has full access (API routes use service role key)
-- No anon policies — all access goes through server-side API routes
