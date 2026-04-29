import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { logAuditEvent } from "@/lib/audit-logger";
import { getDefaultPersona } from "@/lib/mock-data";
import { computeDigitalTrustScore } from "@/lib/digital-trust";

export async function POST(request: Request) {
  const { session_id } = await request.json();
  const db = getServiceClient();
  const persona = getDefaultPersona();

  await new Promise((r) => setTimeout(r, 2500));

  const aaData = persona.aa;
  const cibilData = persona.cibil;

  const trustScore = computeDigitalTrustScore({
    avg_balance: aaData.avg_balance,
    monthly_income: aaData.monthly_income,
    monthly_expenses: aaData.monthly_expenses,
    transaction_count: aaData.transaction_count,
    unique_merchants: aaData.unique_merchants,
    income_regularity: aaData.income_regularity,
  });

  const { data: verification, error: vError } = await db
    .from("verifications")
    .insert({
      session_id,
      provider: "account_aggregator",
      status: "success",
      match_score: trustScore.overall,
      response_data: { ...aaData, trust_score: trustScore },
    })
    .select()
    .single();

  if (vError) {
    return NextResponse.json({ error: vError.message }, { status: 500 });
  }

  const { error: fError } = await db.from("financial_data").insert({
    session_id,
    cibil_score: cibilData.score,
    cibil_band: cibilData.band,
    existing_loans: cibilData.existing_loans,
    delinquency_count: cibilData.delinquency_count,
    monthly_income: aaData.monthly_income,
    monthly_expenses: aaData.monthly_expenses,
    avg_balance: aaData.avg_balance,
    transaction_count_6m: aaData.transaction_count,
    unique_merchants: aaData.unique_merchants,
    income_regularity_score: aaData.income_regularity,
    digital_trust_score: trustScore.overall,
    shadow_nlp_score: 0,
    composite_score: 0,
  });

  if (fError) {
    return NextResponse.json({ error: fError.message }, { status: 500 });
  }

  await db
    .from("customer_data")
    .update({
      income_declared: aaData.monthly_income,
      employer: persona.customer.employer,
    })
    .eq("session_id", session_id);

  await logAuditEvent(session_id, "aa_data_pull", {
    fip: aaData.fip_name,
    months: aaData.months_data,
    digital_trust_score: trustScore.overall,
    compliance:
      "AA Section 6 - Setu FIU consent artifact. DPDP Section 8 - data processed in-memory only",
  });

  return NextResponse.json({
    verification,
    financials: { ...aaData, trust_score: trustScore },
    cibil: cibilData,
  });
}
