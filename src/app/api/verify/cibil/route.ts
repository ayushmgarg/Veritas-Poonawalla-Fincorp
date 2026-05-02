import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { logAuditEvent } from "@/lib/audit-logger";
import { getIndiaStackProvider } from "@/lib/india-stack";
import { updateLiveRisk } from "@/lib/risk-engine";
import { validateRequest, sessionIdBody } from "@/lib/validation";

export async function POST(request: Request) {
  const validation = await validateRequest(request, sessionIdBody);
  if (!validation.success) return validation.response;
  const { session_id } = validation.data;
  const db = getServiceClient();
  const { data: sess } = await db.from("sessions").select("phone").eq("id", session_id).single();
  const phone = sess?.phone ?? "";

  const provider = getIndiaStackProvider();
  const result = await provider.cibil.checkScore(session_id, phone);

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

  const cibilEvent = result.score >= 750 ? "cibil_good" : result.score >= 650 ? "cibil_fair" : "cibil_poor";
  await updateLiveRisk(session_id, cibilEvent, `CIBIL ${result.score} — ${result.band}`);

  await logAuditEvent(session_id, "cibil_check", {
    score: result.score,
    band: result.band,
    delinquencies: result.delinquency_count,
    compliance: "Bureau Section 3 - TransUnion CIBIL credit check",
  });

  return NextResponse.json({ verification, result });
}
