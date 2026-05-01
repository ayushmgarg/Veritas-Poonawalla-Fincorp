import { queryLLM, parseLLMJson } from "./llm";

export interface ExtractedEntities {
  income?: number;
  employer?: string;
  loan_amount?: number;
  loan_purpose?: string;
  name?: string;
}

export interface DriftResult {
  inconsistency_score: number; // 0-100, higher = more inconsistent
  flags: { field: string; type: string; prev: string; curr: string }[];
  llm_analysis?: string;
}

export function detectRuleDrift(
  prev: ExtractedEntities,
  curr: ExtractedEntities
): DriftResult {
  const flags: DriftResult["flags"] = [];
  let score = 0;

  if (prev.income && curr.income) {
    const delta = Math.abs(prev.income - curr.income) / prev.income;
    if (delta > 0.3) {
      flags.push({
        field: "income",
        type: "income_conflict",
        prev: String(prev.income),
        curr: String(curr.income),
      });
      score += Math.min(30, delta * 60);
    }
  }

  if (prev.employer && curr.employer) {
    const prevNorm = prev.employer.toLowerCase().trim();
    const currNorm = curr.employer.toLowerCase().trim();
    if (prevNorm !== currNorm && !prevNorm.includes(currNorm) && !currNorm.includes(prevNorm)) {
      flags.push({
        field: "employer",
        type: "employment_mismatch",
        prev: prev.employer,
        curr: curr.employer,
      });
      score += 25;
    }
  }

  if (prev.loan_amount && curr.loan_amount) {
    const delta = Math.abs(prev.loan_amount - curr.loan_amount) / prev.loan_amount;
    if (delta > 0.5) {
      flags.push({
        field: "loan_amount",
        type: "amount_inconsistency",
        prev: String(prev.loan_amount),
        curr: String(curr.loan_amount),
      });
      score += 15;
    }
  }

  if (prev.name && curr.name) {
    const prevNorm = prev.name.toLowerCase().trim();
    const currNorm = curr.name.toLowerCase().trim();
    if (prevNorm !== currNorm) {
      flags.push({
        field: "name",
        type: "identity_conflict",
        prev: prev.name,
        curr: curr.name,
      });
      score += 35;
    }
  }

  return { inconsistency_score: Math.min(100, Math.round(score)), flags };
}

export async function detectLLMDrift(
  transcript: string,
  entities: ExtractedEntities
): Promise<{ inconsistency_score: number; analysis: string }> {
  const prompt = `Analyze this loan application conversation transcript for contradictions and inconsistencies.

Transcript:
${transcript}

Previously extracted entities: ${JSON.stringify(entities)}

Look for:
1. Contradictions in stated income, employer, or loan purpose
2. Vague or evasive answers to direct questions
3. Sudden changes in claimed facts
4. Inconsistencies between different parts of conversation

Return JSON:
{
  "inconsistency_score": <0-100>,
  "analysis": "<one sentence summary>",
  "specific_flags": ["<flag1>", "<flag2>"]
}`;

  try {
    const response = await queryLLM(prompt);
    const result = parseLLMJson<{ inconsistency_score: number; analysis: string }>(response);
    return { inconsistency_score: result.inconsistency_score ?? 0, analysis: result.analysis ?? "" };
  } catch {
    return { inconsistency_score: 0, analysis: "Analysis unavailable" };
  }
}
