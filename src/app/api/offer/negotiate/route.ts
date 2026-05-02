import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { recalculateOffer } from "@/lib/offer-calculator";
import { logAuditEvent } from "@/lib/audit-logger";
import { queryLLM, parseLLMJson } from "@/lib/llm";
import { validateRequest, offerNegotiateSchema } from "@/lib/validation";

interface NegotiateIntent {
  intent: "extend_tenure" | "reduce_amount" | "increase_amount" | "reduce_emi" | "explain" | "other";
  new_tenure?: number;
  new_amount?: number;
  message: string;
}

export async function POST(request: Request) {
  const validation = await validateRequest(request, offerNegotiateSchema);
  if (!validation.success) return validation.response;
  const { session_id, offer_id, new_tenure, new_amount, message } =
    validation.data;
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
      const llmRes = await queryLLM(`You are a loan negotiation AI. The customer has an existing loan offer:
Amount: ₹${existingOffer.eligible_amount} (${(Number(existingOffer.eligible_amount) / 100000).toFixed(1)} lakh), Rate: ${existingOffer.interest_rate}%, Tenure: ${existingOffer.tenure_months} months, EMI: ₹${existingOffer.emi}

Customer says: "${message}"

Parse the customer's request. Convert Indian number formats: 1 lakh = 100000, 1 crore = 10000000.

Respond ONLY with valid JSON:
{
  "intent": "increase_amount" | "reduce_amount" | "extend_tenure" | "reduce_emi" | "explain" | "other",
  "new_amount": <number in rupees if changing amount, e.g. "20 lakh" = 2000000, null if not changing>,
  "new_tenure": <number in months if changing tenure, null if not changing>,
  "message": "<concise response to customer>"
}`);
      intent = parseLLMJson<NegotiateIntent>(llmRes);
    } catch {
      intent = {
        intent: "explain",
        message: `Your current EMI of ₹${existingOffer.emi.toLocaleString("en-IN")} is calculated at ${existingOffer.interest_rate}% p.a. over ${existingOffer.tenure_months} months. I can extend the tenure to reduce your EMI if needed.`,
      };
    }

    finalTenure = intent.new_tenure ?? finalTenure;
    finalAmount = intent.new_amount ?? finalAmount;
    agentMessage = intent.message;
  }

  // Fallback: regex extraction if LLM didn't parse amount from message
  if (!finalAmount && !finalTenure && message) {
    const amountMatch = message.match(/(\d+\.?\d*)\s*(lakh|lac|lakhs|lacs|crore|crores|l)\b/i);
    if (amountMatch) {
      const num = parseFloat(amountMatch[1]);
      const unit = amountMatch[2].toLowerCase();
      if (unit.startsWith("lakh") || unit.startsWith("lac") || unit === "l") {
        finalAmount = num * 100000;
      } else if (unit.startsWith("crore")) {
        finalAmount = num * 10000000;
      }
    }
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
