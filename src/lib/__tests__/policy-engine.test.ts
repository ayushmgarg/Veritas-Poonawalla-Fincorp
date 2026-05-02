import { describe, it, expect } from "vitest";
import { evaluatePolicy, determineRiskTier } from "../policy-engine";

const validData = {
  age: 35,
  cibilScore: 750,
  income: 85000,
  existingEMI: 8500,
  hasUnresolvedFraud: false,
  livenessVerified: true,
  identityVerified: true,
  consentRecorded: true,
  loanAmount: 1500000,
  delinquencyCount: 0,
};

describe("evaluatePolicy", () => {
  it("passes all rules for a valid applicant", () => {
    const result = evaluatePolicy(validData);
    expect(result.eligible).toBe(true);
    expect(result.failures).toHaveLength(0);
    expect(result.rulesEvaluated).toBe(13);
    expect(result.rulesPassed).toBe(13);
  });

  it("fails AGE_MIN for under-21", () => {
    const result = evaluatePolicy({ ...validData, age: 20 });
    expect(result.eligible).toBe(false);
    expect(result.failures).toContainEqual(
      expect.objectContaining({ ruleId: "AGE_MIN" })
    );
  });

  it("fails AGE_MAX for over-60", () => {
    const result = evaluatePolicy({ ...validData, age: 61 });
    expect(result.eligible).toBe(false);
    expect(result.failures).toContainEqual(
      expect.objectContaining({ ruleId: "AGE_MAX" })
    );
  });

  it("passes at boundary: age 21", () => {
    const result = evaluatePolicy({ ...validData, age: 21 });
    expect(result.eligible).toBe(true);
  });

  it("passes at boundary: age 60", () => {
    const result = evaluatePolicy({ ...validData, age: 60 });
    expect(result.eligible).toBe(true);
  });

  it("fails CIBIL_MIN for score below 650", () => {
    const result = evaluatePolicy({ ...validData, cibilScore: 649 });
    expect(result.eligible).toBe(false);
    expect(result.failures).toContainEqual(
      expect.objectContaining({ ruleId: "CIBIL_MIN" })
    );
  });

  it("passes CIBIL_MIN at exactly 650", () => {
    const result = evaluatePolicy({ ...validData, cibilScore: 650 });
    expect(result.eligible).toBe(true);
  });

  it("fails INCOME_MIN for income below 25000", () => {
    const result = evaluatePolicy({ ...validData, income: 24999 });
    expect(result.eligible).toBe(false);
    expect(result.failures).toContainEqual(
      expect.objectContaining({ ruleId: "INCOME_MIN" })
    );
  });

  it("fails FOIR_MAX when EMI exceeds 50% of income", () => {
    const result = evaluatePolicy({ ...validData, existingEMI: 43000 });
    expect(result.eligible).toBe(false);
    expect(result.failures).toContainEqual(
      expect.objectContaining({ ruleId: "FOIR_MAX" })
    );
  });

  it("passes FOIR_MAX at exactly 50%", () => {
    const result = evaluatePolicy({ ...validData, income: 100000, existingEMI: 50000 });
    expect(result.eligible).toBe(true);
  });

  it("fails FRAUD_CLEAR with unresolved fraud", () => {
    const result = evaluatePolicy({ ...validData, hasUnresolvedFraud: true });
    expect(result.eligible).toBe(false);
    expect(result.failures).toContainEqual(
      expect.objectContaining({ ruleId: "FRAUD_CLEAR" })
    );
  });

  it("fails LIVENESS_PASS when not verified", () => {
    const result = evaluatePolicy({ ...validData, livenessVerified: false });
    expect(result.eligible).toBe(false);
  });

  it("fails LOAN_MIN for amount below 50000", () => {
    const result = evaluatePolicy({ ...validData, loanAmount: 49999 });
    expect(result.eligible).toBe(false);
  });

  it("fails LOAN_MAX for amount above 75 lakhs", () => {
    const result = evaluatePolicy({ ...validData, loanAmount: 7500001 });
    expect(result.eligible).toBe(false);
  });

  it("fails DELINQUENCY_MAX for more than 2", () => {
    const result = evaluatePolicy({ ...validData, delinquencyCount: 3 });
    expect(result.eligible).toBe(false);
  });

  it("fails INCOME_LOAN_RATIO when loan > 60x income", () => {
    const result = evaluatePolicy({ ...validData, income: 25000, loanAmount: 1500001 });
    expect(result.eligible).toBe(false);
  });

  it("can accumulate multiple failures", () => {
    const result = evaluatePolicy({
      ...validData,
      age: 18,
      cibilScore: 400,
      hasUnresolvedFraud: true,
    });
    expect(result.eligible).toBe(false);
    expect(result.failures.length).toBeGreaterThanOrEqual(3);
  });
});

describe("determineRiskTier", () => {
  it("returns tier 1 for excellent scores", () => {
    expect(determineRiskTier(800, 90, 85, 0)).toBe(1);
  });

  it("returns tier 2 for moderate scores", () => {
    expect(determineRiskTier(680, 60, 60, 1)).toBe(2);
  });

  it("returns tier 3 for poor scores", () => {
    expect(determineRiskTier(500, 30, 30, 3)).toBe(3);
  });

  it("handles delinquency impact on composite", () => {
    // Same scores but different delinquency
    const tierA = determineRiskTier(700, 70, 70, 0);
    const tierB = determineRiskTier(700, 70, 70, 3);
    expect(tierB).toBeGreaterThanOrEqual(tierA);
  });
});
