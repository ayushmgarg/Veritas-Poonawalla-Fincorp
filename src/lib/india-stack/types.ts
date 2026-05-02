/**
 * India Stack Provider Interfaces
 *
 * Each interface maps to a real India Stack service.
 * Implementations are swapped via INDIA_STACK_MODE env var.
 */

// ─── Aadhaar e-KYC ───────────────────────────────────────────────

export interface AadhaarVerifyResult {
  match_score: number;
  age_estimated: number;
  uidai_reference: string;
  face_quality: "HIGH" | "MEDIUM" | "LOW";
  liveness_server: "PASS" | "FAIL";
  full_name?: string;
  aadhaar_last4?: string;
}

export interface AadhaarProvider {
  verify(sessionId: string, phone: string): Promise<AadhaarVerifyResult>;
}

// ─── DigiLocker ──────────────────────────────────────────────────

export interface PanDocument {
  number: string;
  name: string;
  fathers_name: string;
  dob: string;
  status: "ACTIVE" | "INACTIVE";
  verified: boolean;
}

export interface DLDocument {
  number: string;
  name: string;
  dob: string;
  validity: string;
  address: string;
  verified: boolean;
}

export interface DigiLockerResult {
  pan: PanDocument;
  dl: DLDocument;
}

export interface DigiLockerProvider {
  fetchDocuments(sessionId: string, phone: string): Promise<DigiLockerResult>;
}

// ─── CKYC (CERSAI) ──────────────────────────────────────────────

export interface CKYCResult {
  kin: string;
  name: string;
  name_match: boolean;
  address_match: boolean;
  pan_match: boolean;
  status: "VERIFIED" | "NOT_FOUND" | "MISMATCH";
}

export interface CKYCProvider {
  verify(sessionId: string, phone: string): Promise<CKYCResult>;
}

// ─── CIBIL (TransUnion) ─────────────────────────────────────────

export interface CIBILResult {
  score: number;
  band: "EXCELLENT" | "GOOD" | "FAIR" | "POOR";
  existing_loans: number;
  delinquency_count: number;
  oldest_account: string;
  total_outstanding: number;
  monthly_emi: number;
}

export interface CIBILProvider {
  checkScore(sessionId: string, phone: string): Promise<CIBILResult>;
}

// ─── Account Aggregator (Setu FIU) ──────────────────────────────

export interface AAFinancialData {
  fip_name: string;
  months_data: number;
  avg_balance: number;
  monthly_income: number;
  monthly_expenses: number;
  transaction_count: number;
  unique_merchants: number;
  income_regularity: number;
  salary_dates: string[];
  top_categories: Array<{ category: string; amount: number }>;
}

export interface AAProvider {
  fetchFinancialData(sessionId: string, phone: string): Promise<AAFinancialData>;
}

// ─── Unified Provider ───────────────────────────────────────────

export interface IndiaStackProvider {
  aadhaar: AadhaarProvider;
  digilocker: DigiLockerProvider;
  ckyc: CKYCProvider;
  cibil: CIBILProvider;
  aa: AAProvider;
}
