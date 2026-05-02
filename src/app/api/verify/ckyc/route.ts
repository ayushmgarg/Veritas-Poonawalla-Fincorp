import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { logAuditEvent } from "@/lib/audit-logger";
import { getIndiaStackProvider } from "@/lib/india-stack";
import { validateRequest, sessionIdBody } from "@/lib/validation";

export async function POST(request: Request) {
  const validation = await validateRequest(request, sessionIdBody);
  if (!validation.success) return validation.response;
  const { session_id } = validation.data;
  const db = getServiceClient();
  const { data: sess } = await db.from("sessions").select("phone").eq("id", session_id).single();
  const phone = sess?.phone ?? "";

  const provider = getIndiaStackProvider();
  const result = await provider.ckyc.verify(session_id, phone);

  const { data: verification, error } = await db
    .from("verifications")
    .insert({
      session_id,
      provider: "cersai_ckyc",
      status: "success",
      match_score: 100,
      response_data: result,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAuditEvent(session_id, "ckyc_verification", {
    kin: result.kin,
    name_match: result.name_match,
    compliance: "CERSAI CKYC Section 8 - Aadhaar-indexed KIN verification",
  });

  return NextResponse.json({ verification, result });
}
