import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { logAuditEvent } from "@/lib/audit-logger";
import { getIndiaStackProvider } from "@/lib/india-stack";
import { updateLiveRisk } from "@/lib/risk-engine";
import { validateRequest, sessionIdBody } from "@/lib/validation";
import { encryptField } from "@/lib/encryption";

export async function POST(request: Request) {
  const validation = await validateRequest(request, sessionIdBody);
  if (!validation.success) return validation.response;
  const { session_id } = validation.data;
  const db = getServiceClient();
  const { data: sess } = await db.from("sessions").select("phone").eq("id", session_id).single();
  const phone = sess?.phone ?? "";

  const provider = getIndiaStackProvider();
  const result = await provider.aadhaar.verify(session_id, phone);

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
    })
    .eq("session_id", session_id);

  await updateLiveRisk(session_id, "aadhaar_verified", `Face match ${result.match_score}%`);

  await logAuditEvent(session_id, "uidai_verification", {
    match_score: result.match_score,
    age_estimated: result.age_estimated,
    reference: result.uidai_reference,
    compliance: "RBI Master Direction Section 3.1 - UIDAI e-KYC verification",
  });

  return NextResponse.json({ verification, result });
}
