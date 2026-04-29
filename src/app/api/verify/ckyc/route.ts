import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { logAuditEvent } from "@/lib/audit-logger";
import { getDefaultPersona } from "@/lib/mock-data";

export async function POST(request: Request) {
  const { session_id } = await request.json();
  const db = getServiceClient();
  const persona = getDefaultPersona();

  await new Promise((r) => setTimeout(r, 1000));

  const result = persona.ckyc;

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
