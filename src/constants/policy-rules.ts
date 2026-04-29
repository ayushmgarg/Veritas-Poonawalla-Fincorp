import { PolicyRule, LoanProduct } from "@/types";

export const POLICY_RULES: PolicyRule[] = [
  {
    id: "AGE_MIN",
    check: (d) => d.age >= 21,
    message: "Applicant must be at least 21 years old",
  },
  {
    id: "AGE_MAX",
    check: (d) => d.age <= 60,
    message: "Applicant must be 60 years or younger",
  },
  {
    id: "CIBIL_MIN",
    check: (d) => d.cibilScore >= 650,
    message: "Minimum CIBIL score of 650 required",
  },
  {
    id: "INCOME_MIN",
    check: (d) => d.income >= 25000,
    message: "Minimum monthly income of INR 25,000 required",
  },
  {
    id: "FOIR_MAX",
    check: (d) => d.income === 0 || d.existingEMI / d.income <= 0.5,
    message: "Fixed obligation to income ratio must not exceed 50%",
  },
  {
    id: "FRAUD_CLEAR",
    check: (d) => !d.hasUnresolvedFraud,
    message: "No unresolved fraud events on record",
  },
  {
    id: "LIVENESS_PASS",
    check: (d) => d.livenessVerified,
    message: "Liveness verification must be completed",
  },
  {
    id: "IDENTITY_PASS",
    check: (d) => d.identityVerified,
    message: "Identity must be verified via UIDAI",
  },
  {
    id: "CONSENT_GIVEN",
    check: (d) => d.consentRecorded,
    message: "Customer consent must be recorded",
  },
  {
    id: "LOAN_MIN",
    check: (d) => d.loanAmount >= 50000,
    message: "Minimum loan amount is INR 50,000",
  },
  {
    id: "LOAN_MAX",
    check: (d) => d.loanAmount <= 7500000,
    message: "Maximum loan amount is INR 75,00,000",
  },
  {
    id: "DELINQUENCY_MAX",
    check: (d) => d.delinquencyCount <= 2,
    message: "Maximum 2 past delinquencies allowed",
  },
  {
    id: "INCOME_LOAN_RATIO",
    check: (d) =>
      d.income === 0 || d.loanAmount <= d.income * 60,
    message: "Loan amount cannot exceed 60x monthly income",
  },
];

export const LOAN_PRODUCTS: LoanProduct[] = [
  {
    name: "Personal Loan",
    minAmount: 100000,
    maxAmount: 2500000,
    rateByTier: { 1: 10.49, 2: 14.99, 3: 18.99 },
    tenureOptions: [12, 24, 36, 48, 60],
    processingFee: 2.0,
  },
  {
    name: "Home Renovation Loan",
    minAmount: 200000,
    maxAmount: 5000000,
    rateByTier: { 1: 9.99, 2: 13.49, 3: 16.99 },
    tenureOptions: [12, 24, 36, 48, 60, 72, 84],
    processingFee: 1.5,
  },
  {
    name: "Business Loan",
    minAmount: 500000,
    maxAmount: 7500000,
    rateByTier: { 1: 11.99, 2: 15.99, 3: 19.99 },
    tenureOptions: [12, 24, 36, 48, 60],
    processingFee: 2.5,
  },
];
