import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { logAuditEvent } from "@/lib/audit-logger";

export async function POST(request: Request) {
  const { session_id, offer_id } = await request.json();

  // Skip silently if Twilio not configured (dev without credentials)
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    return NextResponse.json({ sent: false, reason: "Twilio not configured" });
  }

  const db = getServiceClient();

  const [{ data: session }, { data: offer }] = await Promise.all([
    db.from("sessions").select("phone").eq("id", session_id).single(),
    db.from("loan_offers").select("*").eq("id", offer_id).single(),
  ]);

  if (!session?.phone || !offer) {
    return NextResponse.json({ error: "Session or offer not found" }, { status: 404 });
  }

  const phone = session.phone.replace(/\D/g, "");
  const to = phone.startsWith("91") ? `whatsapp:+${phone}` : `whatsapp:+91${phone}`;

  const amount = Number(offer.eligible_amount).toLocaleString("en-IN");
  const emi = Number(offer.emi).toLocaleString("en-IN");
  const fee = Number(offer.processing_fee).toLocaleString("en-IN");

  const body =
    `✅ *VERITAS — Loan Approved!*\n\n` +
    `Congratulations! Your loan application has been approved.\n\n` +
    `*Approved Terms*\n` +
    `• Product: ${offer.product_name}\n` +
    `• Amount: ₹${amount}\n` +
    `• Interest Rate: ${offer.interest_rate}% p.a.\n` +
    `• Tenure: ${offer.tenure_months} months\n` +
    `• Monthly EMI: ₹${emi}\n` +
    `• Processing Fee: ₹${fee} (one-time)\n\n` +
    `Your sanction letter will be emailed within 24 hours.\n\n` +
    `_Poonawalla Fincorp · Powered by VERITAS AI_\n` +
    `_RBI V-CIP Compliant · AES-256-GCM Encrypted_`;

  try {
    const twilio = (await import("twilio")).default;
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    const message = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM ?? "whatsapp:+14155238886",
      to,
      body,
    });

    await logAuditEvent(session_id, "whatsapp_notification_sent", {
      message_sid: message.sid,
      to: phone.slice(-4).padStart(phone.length, "*"), // mask for audit
      compliance: "RBI V-CIP §3.1 — post-approval sanction communication",
    });

    return NextResponse.json({ sent: true, sid: message.sid });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("WhatsApp send failed:", msg);
    return NextResponse.json({ sent: false, error: msg }, { status: 500 });
  }
}
