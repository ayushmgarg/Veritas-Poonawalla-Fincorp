-- VERITAS Database Schema
-- Run this in Supabase SQL Editor (supabase.com → project → SQL Editor)

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(15) NOT NULL,
  status VARCHAR(20) DEFAULT 'initiated',
  current_step INT DEFAULT 0,
  jwt_token TEXT,
  device_info JSONB DEFAULT '{}',
  geo_location JSONB,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  is_immutable BOOLEAN DEFAULT FALSE,
  -- Live risk tracking (updated in real-time throughout session)
  live_risk_score INT DEFAULT 35,
  risk_events JSONB DEFAULT '[]',
  -- Speech assessment (updated every 3rd transcript)
  speech_assessment JSONB
);

CREATE TABLE customer_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  full_name VARCHAR(255),
  aadhaar_last4 VARCHAR(4),
  pan VARCHAR(10),
  dob DATE,
  age_estimated INT,
  age_declared INT,
  gender VARCHAR(10),
  address TEXT,
  employer VARCHAR(255),
  income_declared DECIMAL,
  loan_purpose VARCHAR(255),
  loan_amount_requested DECIMAL,
  email VARCHAR(255),
  extracted_via VARCHAR(20) DEFAULT 'speech'
);

CREATE TABLE consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  consent_type VARCHAR(50),
  consent_text TEXT,
  audio_hash VARCHAR(64),
  captured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  language VARCHAR(10) DEFAULT 'en'
);

CREATE TABLE fraud_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  event_type VARCHAR(50),
  confidence DECIMAL,
  details JSONB DEFAULT '{}',
  action_taken VARCHAR(50),
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  frame_hash VARCHAR(64)
);

CREATE TABLE liveness_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  blink_count INT DEFAULT 0,
  micro_movement_count INT DEFAULT 0,
  head_yaw DECIMAL DEFAULT 0,
  head_pitch DECIMAL DEFAULT 0,
  face_confidence DECIMAL DEFAULT 0,
  is_live BOOLEAN DEFAULT FALSE,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  provider VARCHAR(30),
  status VARCHAR(20) DEFAULT 'pending',
  match_score DECIMAL,
  response_data JSONB DEFAULT '{}',
  verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE financial_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  cibil_score INT DEFAULT 0,
  cibil_band VARCHAR(20) DEFAULT '',
  existing_loans INT DEFAULT 0,
  delinquency_count INT DEFAULT 0,
  monthly_income DECIMAL DEFAULT 0,
  monthly_expenses DECIMAL DEFAULT 0,
  avg_balance DECIMAL DEFAULT 0,
  transaction_count_6m INT DEFAULT 0,
  unique_merchants INT DEFAULT 0,
  income_regularity_score DECIMAL DEFAULT 0,
  digital_trust_score DECIMAL DEFAULT 0,
  shadow_nlp_score DECIMAL DEFAULT 0,
  composite_score DECIMAL DEFAULT 0,
  -- Speech quality affects interest rate
  speech_assessment_score INT DEFAULT 70
);

CREATE TABLE llm_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  risk_tier INT,
  confidence DECIMAL,
  reasoning TEXT,
  rbi_citations JSONB DEFAULT '[]',
  persona_classification VARCHAR(50),
  policy_rules_evaluated INT DEFAULT 0,
  policy_rules_passed INT DEFAULT 0,
  raw_llm_response JSONB DEFAULT '{}',
  decided_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE loan_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  product_name VARCHAR(100),
  eligible_amount DECIMAL,
  interest_rate DECIMAL,
  tenure_months INT,
  emi DECIMAL,
  processing_fee DECIMAL,
  is_selected BOOLEAN DEFAULT FALSE,
  offer_status VARCHAR(20) DEFAULT 'generated',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  speaker VARCHAR(20),
  text TEXT,
  language VARCHAR(10) DEFAULT 'en',
  confidence DECIMAL DEFAULT 0,
  entities_extracted JSONB DEFAULT '[]',
  timestamp_ms BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  event_type VARCHAR(50),
  event_data JSONB DEFAULT '{}',
  hash VARCHAR(64),
  previous_hash VARCHAR(64),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trust graph tables (fraud network analysis)
CREATE TABLE trust_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id),
  node_type TEXT NOT NULL,   -- 'phone', 'pan', 'aadhaar', 'email'
  node_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(node_type, node_value)
);

CREATE TABLE trust_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id),
  from_node_id UUID REFERENCES trust_nodes(id),
  to_node_id UUID REFERENCES trust_nodes(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_phone ON sessions(phone);
CREATE INDEX idx_customer_data_session ON customer_data(session_id);
CREATE INDEX idx_fraud_events_session ON fraud_events(session_id);
CREATE INDEX idx_verifications_session ON verifications(session_id);
CREATE INDEX idx_financial_data_session ON financial_data(session_id);
CREATE INDEX idx_transcripts_session ON transcripts(session_id);
CREATE INDEX idx_audit_log_session ON audit_log(session_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);
CREATE INDEX idx_loan_offers_session ON loan_offers(session_id);
CREATE INDEX idx_llm_decisions_session ON llm_decisions(session_id);
CREATE INDEX idx_trust_nodes_value ON trust_nodes(node_type, node_value);
CREATE INDEX idx_trust_edges_session ON trust_edges(session_id);

-- Enable Row Level Security (required by Supabase)
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE liveness_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_edges ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (API routes use service role key)
CREATE POLICY "Service role full access" ON sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON customer_data FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON consents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON fraud_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON liveness_checks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON verifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON financial_data FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON llm_decisions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON loan_offers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON transcripts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON audit_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON trust_nodes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON trust_edges FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime for dashboard live updates
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE fraud_events;
ALTER PUBLICATION supabase_realtime ADD TABLE verifications;
ALTER PUBLICATION supabase_realtime ADD TABLE liveness_checks;
ALTER PUBLICATION supabase_realtime ADD TABLE transcripts;
ALTER PUBLICATION supabase_realtime ADD TABLE loan_offers;

-- ─────────────────────────────────────────────────────────────────────────────
-- MIGRATION: run this block if you already have an existing database
-- (skip if running the schema fresh)
-- ─────────────────────────────────────────────────────────────────────────────
-- ALTER TABLE sessions
--   ADD COLUMN IF NOT EXISTS live_risk_score INT DEFAULT 35,
--   ADD COLUMN IF NOT EXISTS risk_events JSONB DEFAULT '[]',
--   ADD COLUMN IF NOT EXISTS speech_assessment JSONB;
--
-- ALTER TABLE financial_data
--   ADD COLUMN IF NOT EXISTS speech_assessment_score INT DEFAULT 70;
