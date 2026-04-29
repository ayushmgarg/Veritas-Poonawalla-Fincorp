import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { recalculateOffer } from "@/lib/offer-calculator";
import { logAuditEvent } from "@/lib/audit-logger";

export async function POST(request: Request) {
  const { session_id, offer_id, new_tenure, new_amount } =
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

  const recalculated = recalculateOffer(existingOffer, new_tenure, new_amount);

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

  return NextResponse.json({ offer: updatedOffer });
}
