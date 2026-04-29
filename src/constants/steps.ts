import { SessionStep } from "@/types";

export const SESSION_STEPS: SessionStep[] = [
  {
    id: 0,
    name: "session_init",
    label: "Session Init",
    xpReward: 100,
    description: "Establishing secure V-CIP session",
  },
  {
    id: 1,
    name: "consent_capture",
    label: "Consent & Data",
    xpReward: 150,
    description: "Verbal consent and loan details",
  },
  {
    id: 2,
    name: "fraud_check",
    label: "Liveness Check",
    xpReward: 200,
    description: "Real-time fraud and liveness verification",
  },
  {
    id: 3,
    name: "identity_verification",
    label: "UIDAI Face Auth",
    xpReward: 250,
    description: "Aadhaar-based face authentication",
  },
  {
    id: 4,
    name: "document_verification",
    label: "Documents",
    xpReward: 200,
    description: "DigiLocker PAN and DL verification",
  },
  {
    id: 5,
    name: "financial_data",
    label: "Financials",
    xpReward: 300,
    description: "Account Aggregator and CIBIL check",
  },
  {
    id: 6,
    name: "risk_assessment",
    label: "AI Assessment",
    xpReward: 250,
    description: "LLM risk classification and scoring",
  },
  {
    id: 7,
    name: "offer_generation",
    label: "Loan Offer",
    xpReward: 350,
    description: "Personalized loan offer generation",
  },
];

export const TOTAL_XP = SESSION_STEPS.reduce((sum, s) => sum + s.xpReward, 0);
