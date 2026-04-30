import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { recalculateOffer } from "@/lib/offer-calculator";
import { logAuditEvent } from "@/lib/audit-logger";
import { queryLLM, parseLLMJson } from "@/lib/llm";

interface NegotiateIntent {
  intent: "extend_tenure" | "reduce_amount" | "explain" | "other";
  new_tenure?: number;
  new_amount?: number;
  message: string;
}

export async function POST(request: Request) {
  const { session_id, offer_id, new_tenure, new_amount, message } =
    await request.json();
  const db = getServiceClient();

  const { data: existingOffer, error } = await db
    .from("loan_offers")
    .select("*")
    .eq("id", offer_id)
    .eq("session_id", session_id)
    .single();

  if (error || !existingOffer) {
    return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  }

  let finalTenure = new_tenure;
  let finalAmount = new_amount;
  let agentMessage = "";

  if (message) {
    let intent: NegotiateIntent;
    try {
      const llmRes = await queryLLM(`You are a loan officer AI. The customer has a loan offer:
Amount: ₹${existingOffer.eligible_amount}, Rate: ${existingOffer.interest_rate}%, Tenure: ${existingOffer.tenure_months} months, EMI: ₹${existingOffer.emi}

Customer says: "${message}"

Respond with JSON:
{
  "intent": "extend_tenure"|"reduce_amount"|"explain"|"other",
  "new_tenure": <number in months if changing tenure, null otherwise>,
  "new_amount": <number in rupees if changing amount, null otherwise>,
  "message": "<your helpful, concise response to the customer>"
}`);
      intent = parseLLMJson<NegotiateIntent>(llmRes);
    } catch {
      intent = {
        intent: "explain",
        message: `Your current EMI of ₹${existingOffer.emi.toLocaleString("en-IN")} is calculated at ${existingOffer.interest_rate}% p.a. over ${existingOffer.tenure_months} months. I can extend the tenure to reduce your EMI if needed.`,
      };
    }

    finalTenure = intent.new_tenure || finalTenure;
    finalAmount = intent.new_amount || finalAmount;
    agentMessage = intent.message;
  }

  if (!finalTenure && !finalAmount) {
    return NextResponse.json({
      offer: existingOffer,
      message: agentMessage || "How can I help you customise this offer?",
    });
  }

  const recalculated = recalculateOffer(existingOffer, finalTenure, finalAmount);

  const { data: updatedOffer } = await db
    .from("loan_offers")
    .update({
      eligible_amount: recalculated.eligible_amount,
      tenure_months: recalculated.tenure_months,
      emi: recalculated.emi,
      processing_fee: recalculated.processing_fee,
      offer_status: "negotiated",
    })
    .eq("id", offer_id)
    .select()
    .single();

  await logAuditEvent(session_id, "offer_negotiated", {
    offer_id,
    original_emi: existingOffer.emi,
    new_emi: recalculated.emi,
    new_tenure: recalculated.tenure_months,
  });

  return NextResponse.json({
    offer: updatedOffer,
    message:
      agentMessage ||
      `Updated your offer. New EMI: ₹${recalculated.emi.toLocaleString("en-IN")} over ${recalculated.tenure_months} months.`,
  });
}
