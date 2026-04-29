import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { logAuditEvent } from "@/lib/audit-logger";
import { generateOffers } from "@/lib/offer-calculator";

export async function POST(request: Request) {
  const { session_id } = await request.json();
  const db = getServiceClient();

  const { data: customer } = await db
    .from("customer_data")
    .select("*")
    .eq("session_id", session_id)
    .single();

  const { data: llmDecision } = await db
    .from("llm_decisions")
    .select("*")
    .eq("session_id", session_id)
    .order("decided_at", { ascending: false })
    .limit(1)
    .single();

  const { data: financial } = await db
    .from("financial_data")
    .select("*")
    .eq("session_id", session_id)
    .single();

  const riskTier = (llmDecision?.risk_tier || 1) as 1 | 2 | 3;
  const requestedAmount = customer?.loan_amount_requested || 1500000;
  const monthlyIncome = financial?.monthly_income || 50000;

  const offers = generateOffers(session_id, requestedAmount, riskTier, monthlyIncome);

  for (const offer of offers) {
    await db.from("loan_offers").insert({
      session_id: offer.session_id,
      product_name: offer.product_name,
      eligible_amount: offer.eligible_amount,
      interest_rate: offer.interest_rate,
      tenure_months: offer.tenure_months,
      emi: offer.emi,
      processing_fee: offer.processing_fee,
      is_selected: false,
      offer_status: "generated",
    });
  }

  await logAuditEvent(session_id, "offers_generated", {
    count: offers.length,
    risk_tier: riskTier,
    products: offers.map((o) => o.product_name),
    compliance: "RBI Master Direction Section 9 - Personalized offer generation",
  });

  const { data: savedOffers } = await db
    .from("loan_offers")
    .select("*")
    .eq("session_id", session_id);

  return NextResponse.json({ offers: savedOffers });
}
