import { POLICY_RULES } from "@/constants/policy-rules";
import { PolicyCheckData, RiskTier } from "@/types";

interface PolicyResult {
  eligible: boolean;
  rulesPassed: number;
  rulesEvaluated: number;
  failures: { ruleId: string; message: string }[];
}

export function evaluatePolicy(data: PolicyCheckData): PolicyResult {
  const failures: { ruleId: string; message: string }[] = [];

  for (const rule of POLICY_RULES) {
    if (!rule.check(data)) {
      failures.push({ ruleId: rule.id, message: rule.message });
    }
  }

  return {
    eligible: failures.length === 0,
    rulesPassed: POLICY_RULES.length - failures.length,
    rulesEvaluated: POLICY_RULES.length,
    failures,
  };
}

export function determineRiskTier(
  cibilScore: number,
  digitalTrustScore: number,
  shadowNlpScore: number,
  delinquencyCount: number
): RiskTier {
  const composite =
    cibilScore * 0.4 +
    digitalTrustScore * 7.5 * 0.25 +
    shadowNlpScore * 7.5 * 0.2 +
    (100 - delinquencyCount * 30) * 7.5 * 0.15;

  if (composite >= 650) return 1;
  if (composite >= 500) return 2;
  return 3;
}
