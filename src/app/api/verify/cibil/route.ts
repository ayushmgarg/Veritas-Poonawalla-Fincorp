import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { logAuditEvent } from "@/lib/audit-logger";
import { getDefaultPersona } from "@/lib/mock-data";

export async function POST(request: Request) {
  const { session_id } = await request.json();
  const db = getServiceClient();
  const persona = getDefaultPersona();

  await new Promise((r) => setTimeout(r, 1800));

  const result = persona.cibil;

  const { data: verification, error } = await db
    .from("verifications")
    .insert({
      session_id,
      provider: "cibil",
      status: "success",
      match_score: result.score,
      response_data: result,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAuditEvent(session_id, "cibil_check", {
    score: result.score,
    band: result.band,
    delinquencies: result.delinquency_count,
    compliance: "Bureau Section 3 - TransUnion CIBIL credit check",
  });

  return NextResponse.json({ verification, result });
}
