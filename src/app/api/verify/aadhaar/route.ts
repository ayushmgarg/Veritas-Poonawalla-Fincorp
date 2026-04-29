import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { logAuditEvent } from "@/lib/audit-logger";
import { getDefaultPersona } from "@/lib/mock-data";

export async function POST(request: Request) {
  const { session_id } = await request.json();
  const db = getServiceClient();
  const persona = getDefaultPersona();

  await new Promise((r) => setTimeout(r, 1500));

  const result = persona.aadhaar;

  const { data: verification, error } = await db
    .from("verifications")
    .insert({
      session_id,
      provider: "uidai",
      status: "success",
      match_score: result.match_score,
      response_data: result,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await db
    .from("customer_data")
    .update({
      age_estimated: result.age_estimated,
      full_name: persona.customer.full_name,
      aadhaar_last4: persona.customer.aadhaar_last4,
    })
    .eq("session_id", session_id);

  await logAuditEvent(session_id, "uidai_verification", {
    match_score: result.match_score,
    age_estimated: result.age_estimated,
    reference: result.uidai_reference,
    compliance: "RBI Master Direction Section 3.1 - UIDAI e-KYC verification",
  });

  return NextResponse.json({ verification, result });
}
