import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { logAuditEvent } from "@/lib/audit-logger";
import { validateRequest, whatsappNotifySchema } from "@/lib/validation";
import { decryptField } from "@/lib/encryption";

function fmt(n: number) {
  return n.toLocaleString("en-IN");
}

export async function POST(request: Request) {
  const validation = await validateRequest(request, whatsappNotifySchema);
  if (!validation.success) return validation.response;
  const { session_id, offer_id } = validation.data;

  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    return NextResponse.json({ sent: false, reason: "Twilio not configured" });
  }

  const db = getServiceClient();

  // Fetch everything needed for both messages
  const [
    { data: session },
    { data: offer },
    { data: customer },
    { data: financial },
    { data: llmDecision },
  ] = await Promise.all([
    db.from("sessions").select("phone, live_risk_score, speech_assessment, started_at, completed_at").eq("id", session_id).single(),
    db.from("loan_offers").select("*").eq("id", offer_id).single(),
    db.from("customer_data").select("full_name, employer, income_declared, loan_purpose").eq("session_id", session_id).single(),
    db.from("financial_data").select("cibil_score, cibil_band, monthly_income, digital_trust_score, speech_assessment_score").eq("session_id", session_id).single(),
    db.from("llm_decisions").select("risk_tier, confidence, persona_classification").eq("session_id", session_id).order("decided_at", { ascending: false }).limit(1).single(),
  ]);

  if (!session?.phone || !offer) {
    return NextResponse.json({ error: "Session or offer not found" }, { status: 404 });
  }

  const twilio = (await import("twilio")).default;
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  const from = process.env.TWILIO_WHATSAPP_FROM ?? "whatsapp:+14155238886";

  const phone = session.phone.replace(/\D/g, "");
  const customerTo = phone.startsWith("91") ? `whatsapp:+${phone}` : `whatsapp:+91${phone}`;

  // ── Message 1: Customer sanction ──────────────────────────────────────────
  const decryptedName = decryptField(customer?.full_name);
  const customerMsg =
    `✅ *VERITAS — Loan Approved!*\n\n` +
    `Congratulations${decryptedName ? `, ${decryptedName.split(" ")[0]}` : ""}! Your application has been approved.\n\n` +
    `*Sanctioned Terms*\n` +
    `• Product: ${offer.product_name}\n` +
    `• Amount: ₹${fmt(Number(offer.eligible_amount))}\n` +
    `• Interest Rate: ${offer.interest_rate}% p.a.\n` +
    `• Tenure: ${offer.tenure_months} months\n` +
    `• Monthly EMI: ₹${fmt(Number(offer.emi))}\n` +
    `• Processing Fee: ₹${fmt(Number(offer.processing_fee))} (one-time)\n\n` +
    `Your sanction letter will be shared within 24 hours.\n\n` +
    `_Poonawalla Fincorp · VERITAS AI · RBI V-CIP Compliant_`;

  // ── Message 2: Admin report ───────────────────────────────────────────────
  const riskTier = llmDecision?.risk_tier ?? "—";
  const riskLabel = riskTier === 1 ? "TIER 1 — LOW" : riskTier === 2 ? "TIER 2 — MEDIUM" : riskTier === 3 ? "TIER 3 — HIGH" : "—";
  const riskScore = session.live_risk_score ?? "—";
  const cibil = financial?.cibil_score ?? "—";
  const cibilBand = financial?.cibil_band ?? "—";
  const income = financial?.monthly_income ? `₹${fmt(Number(financial.monthly_income))}/mo` : "—";
  const trustScore = financial?.digital_trust_score ? `${Math.round(Number(financial.digital_trust_score))}` : "—";
  const speechScore = financial?.speech_assessment_score ?? (session.speech_assessment as { score?: number } | null)?.score ?? "—";
  const employer = customer?.employer ?? "—";
  const purpose = customer?.loan_purpose ?? "—";
  const confidence = llmDecision?.confidence ? `${Math.round(Number(llmDecision.confidence) * 100)}%` : "—";
  const duration = session.started_at && session.completed_at
    ? `${Math.round((new Date(session.completed_at).getTime() - new Date(session.started_at).getTime()) / 60000)} min`
    : "—";

  const adminMsg =
    `📊 *VERITAS — New Loan Disbursed*\n\n` +
    `*Applicant*\n` +
    `• Name: ${decryptedName ?? "—"}\n` +
    `• Phone: +91 ${phone.slice(-10, -6)}****\n` +
    `• Employer: ${employer}\n` +
    `• Income: ${income}\n` +
    `• Purpose: ${purpose}\n\n` +
    `*Credit Assessment*\n` +
    `• CIBIL: ${cibil} (${cibilBand})\n` +
    `• Risk Tier: ${riskLabel}\n` +
    `• LLM Confidence: ${confidence}\n` +
    `• Live Risk Score: ${riskScore}/100\n` +
    `• Digital Trust: ${trustScore}/100\n` +
    `• Speech Score: ${speechScore}/100\n\n` +
    `*Loan Sanctioned*\n` +
    `• Product: ${offer.product_name}\n` +
    `• Amount: ₹${fmt(Number(offer.eligible_amount))}\n` +
    `• Rate: ${offer.interest_rate}% p.a.\n` +
    `• EMI: ₹${fmt(Number(offer.emi))}/mo × ${offer.tenure_months} months\n\n` +
    `*Session*\n` +
    `• Duration: ${duration}\n` +
    `• Session ID: ${session_id.slice(0, 8)}...\n\n` +
    `_VERITAS AI · Poonawalla Fincorp_`;

  const results: { customer?: string; admin?: string; errors: string[] } = { errors: [] };

  // Send customer message
  try {
    const msg = await client.messages.create({ from, to: customerTo, body: customerMsg });
    results.customer = msg.sid;
  } catch (err) {
    results.errors.push(`customer: ${err instanceof Error ? err.message : "failed"}`);
  }

  // Send admin message (only if TWILIO_ADMIN_WHATSAPP is set)
  if (process.env.TWILIO_ADMIN_WHATSAPP) {
    try {
      const msg = await client.messages.create({ from, to: process.env.TWILIO_ADMIN_WHATSAPP, body: adminMsg });
      results.admin = msg.sid;
    } catch (err) {
      results.errors.push(`admin: ${err instanceof Error ? err.message : "failed"}`);
    }
  }

  await logAuditEvent(session_id, "whatsapp_notifications_sent", {
    customer_sid: results.customer,
    admin_sid: results.admin,
    to_masked: `+91${phone.slice(-10, -6)}****`,
    compliance: "RBI V-CIP §3.1 — post-approval sanction communication",
  });

  return NextResponse.json({ sent: true, ...results });
}
