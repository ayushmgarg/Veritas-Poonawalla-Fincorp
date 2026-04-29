import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { computeDigitalTrustScore } from "@/lib/digital-trust";

export async function POST(request: Request) {
  const { session_id } = await request.json();
  const db = getServiceClient();

  const { data: financial } = await db
    .from("financial_data")
    .select("*")
    .eq("session_id", session_id)
    .single();

  if (!financial) {
    return NextResponse.json(
      { error: "No financial data found for session" },
      { status: 404 }
    );
  }

  const breakdown = computeDigitalTrustScore({
    avg_balance: financial.avg_balance,
    monthly_income: financial.monthly_income,
    monthly_expenses: financial.monthly_expenses,
    transaction_count: financial.transaction_count_6m,
    unique_merchants: financial.unique_merchants,
    income_regularity: financial.income_regularity_score,
  });

  await db
    .from("financial_data")
    .update({ digital_trust_score: breakdown.overall })
    .eq("session_id", session_id);

  return NextResponse.json({ trustScore: breakdown });
}
