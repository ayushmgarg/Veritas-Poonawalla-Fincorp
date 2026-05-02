import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { logAuditEvent } from "@/lib/audit-logger";
import { validateParam } from "@/lib/validation";

export async function PUT(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const paramCheck = validateParam(rawId);
  if (!paramCheck.success) return paramCheck.response;
  const id = paramCheck.data;
  const db = getServiceClient();

  const { data: offer, error } = await db
    .from("loan_offers")
    .update({ is_selected: true, offer_status: "accepted" })
    .eq("id", id)
    .select()
    .single();

  if (error || !offer) {
    return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  }

  await db
    .from("sessions")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      is_immutable: true,
    })
    .eq("id", offer.session_id);

  await logAuditEvent(offer.session_id, "offer_accepted", {
    offer_id: id,
    product: offer.product_name,
    amount: offer.eligible_amount,
    emi: offer.emi,
    compliance:
      "PMLA Section 12 - Session sealed with WORM lock. 10-year immutable retention.",
  });

  // Fire WhatsApp notification (non-blocking — failure doesn't break accept)
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    await fetch(`${baseUrl}/api/notify/whatsapp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: offer.session_id, offer_id: id }),
    });
  } catch {
    // silent — notification is best-effort
  }

  return NextResponse.json({ offer, sealed: true });
}
