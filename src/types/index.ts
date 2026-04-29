export type SessionStatus =
  | "initiated"
  | "in_progress"
  | "completed"
  | "fraud_blocked"
  | "abandoned";

export type ConsentType =
  | "verbal_kyc"
  | "data_sharing"
  | "aa_consent"
  | "offer_acceptance";

export type FraudEventType =
  | "photo_spoof"
  | "deepfake"
  | "geo_mismatch"
  | "age_mismatch"
  | "coercion";

export type FraudAction =
  | "challenged"
  | "blocked"
  | "elevated_monitoring";

export type VerificationProvider =
  | "uidai"
  | "digilocker"
  | "cersai_ckyc"
  | "cibil"
  | "account_aggregator";

export type VerificationStatus = "success" | "failed" | "pending";

export type RiskTier = 1 | 2 | 3;

export type OfferStatus =
  | "generated"
  | "presented"
  | "accepted"
  | "rejected"
  | "negotiated";

export interface Session {
  id: string;
  phone: string;
  status: SessionStatus;
  current_step: number;
  device_info: Record<string, unknown> | null;
  geo_location: GeoLocation | null;
  started_at: string;
  completed_at: string | null;
  is_immutable: boolean;
}

export interface GeoLocation {
  lat: number;
  lng: number;
  ip: string;
  city: string;
  state: string;
}

export interface CustomerData {
  id: string;
  session_id: string;
  full_name: string | null;
  aadhaar_last4: string | null;
  pan: string | null;
  dob: string | null;
  age_estimated: number | null;
  age_declared: number | null;
  gender: string | null;
  address: string | null;
  employer: string | null;
  income_declared: number | null;
  loan_purpose: string | null;
  loan_amount_requested: number | null;
  email: string | null;
  extracted_via: "speech" | "document" | "manual";
}

export interface Consent {
  id: string;
  session_id: string;
  consent_type: ConsentType;
  consent_text: string;
  audio_hash: string;
  captured_at: string;
  language: string;
}

export interface FraudEvent {
  id: string;
  session_id: string;
  event_type: FraudEventType;
  confidence: number;
  details: Record<string, unknown>;
  action_taken: FraudAction;
  detected_at: string;
  frame_hash: string;
}

export interface LivenessCheck {
  id: string;
  session_id: string;
  blink_count: number;
  micro_movement_count: number;
  head_yaw: number;
  head_pitch: number;
  face_confidence: number;
  is_live: boolean;
  checked_at: string;
}

export interface Verification {
  id: string;
  session_id: string;
  provider: VerificationProvider;
  status: VerificationStatus;
  match_score: number | null;
  response_data: Record<string, unknown>;
  verified_at: string;
}

export interface FinancialData {
  id: string;
  session_id: string;
  cibil_score: number;
  cibil_band: string;
  existing_loans: number;
  delinquency_count: number;
  monthly_income: number;
  monthly_expenses: number;
  avg_balance: number;
  transaction_count_6m: number;
  unique_merchants: number;
  income_regularity_score: number;
  digital_trust_score: number;
  shadow_nlp_score: number;
  composite_score: number;
}

export interface LLMDecision {
  id: string;
  session_id: string;
  risk_tier: RiskTier;
  confidence: number;
  reasoning: string;
  rbi_citations: RBICitation[];
  persona_classification: string;
  policy_rules_evaluated: number;
  policy_rules_passed: number;
  raw_llm_response: Record<string, unknown>;
  decided_at: string;
}

export interface RBICitation {
  clause: string;
  relevance: string;
}

export interface LoanOffer {
  id: string;
  session_id: string;
  product_name: string;
  eligible_amount: number;
  interest_rate: number;
  tenure_months: number;
  emi: number;
  processing_fee: number;
  is_selected: boolean;
  offer_status: OfferStatus;
  created_at: string;
}

export interface TranscriptEntry {
  id: string;
  session_id: string;
  speaker: "customer" | "agent";
  text: string;
  language: string;
  confidence: number;
  entities_extracted: ExtractedEntity[];
  timestamp_ms: number;
  created_at: string;
}

export interface ExtractedEntity {
  type: string;
  value: string;
}

export interface AuditLogEntry {
  id: string;
  session_id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  hash: string;
  previous_hash: string;
  created_at: string;
}

export interface PolicyRule {
  id: string;
  check: (data: PolicyCheckData) => boolean;
  message: string;
}

export interface PolicyCheckData {
  age: number;
  cibilScore: number;
  income: number;
  existingEMI: number;
  hasUnresolvedFraud: boolean;
  livenessVerified: boolean;
  identityVerified: boolean;
  consentRecorded: boolean;
  loanAmount: number;
  delinquencyCount: number;
}

export interface LoanProduct {
  name: string;
  minAmount: number;
  maxAmount: number;
  rateByTier: Record<RiskTier, number>;
  tenureOptions: number[];
  processingFee: number;
}

export interface SessionStep {
  id: number;
  name: string;
  label: string;
  xpReward: number;
  description: string;
}
