import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { detectRuleDrift, detectLLMDrift, ExtractedEntities } from "@/lib/intent-drift";
import { updateLiveRisk } from "@/lib/risk-engine";
import { logAuditEvent } from "@/lib/audit-logger";

export async function POST(request: Request) {
  const { session_id, current_entities, transcript } = await request.json();
  const db = getServiceClient();

  const { data: customer } = await db
    .from("customer_data")
    .select("income_declared, employer, loan_amount_requested, loan_purpose, full_name")
    .eq("session_id", session_id)
    .single();

  const prevEntities: ExtractedEntities = {
    income: customer?.income_declared ?? undefined,
    employer: customer?.employer ?? undefined,
    loan_amount: customer?.loan_amount_requested ?? undefined,
    loan_purpose: customer?.loan_purpose ?? undefined,
    name: customer?.full_name ?? undefined,
  };

  const ruleDrift = detectRuleDrift(prevEntities, current_entities ?? {});

  let llmDrift = { inconsistency_score: 0, analysis: "" };
  if (transcript && transcript.length > 50) {
    llmDrift = await detectLLMDrift(transcript, prevEntities);
  }

  const combinedScore = Math.round(
    ruleDrift.inconsistency_score * 0.6 + llmDrift.inconsistency_score * 0.4
  );

  if (combinedScore > 40) {
    await updateLiveRisk(session_id, "intent_drift_high", `Inconsistency score: ${combinedScore}. Flags: ${ruleDrift.flags.map(f => f.type).join(", ")}`);
  } else if (combinedScore > 15) {
    await updateLiveRisk(session_id, "intent_drift_low", `Minor inconsistency: ${combinedScore}`);
  }

  await logAuditEvent(session_id, "intent_drift_check", {
    inconsistency_score: combinedScore,
    rule_flags: ruleDrift.flags,
    llm_analysis: llmDrift.analysis,
  });

  return NextResponse.json({
    inconsistency_score: combinedScore,
    rule_flags: ruleDrift.flags,
    llm_analysis: llmDrift.analysis,
    risk_raised: combinedScore > 15,
  });
}
