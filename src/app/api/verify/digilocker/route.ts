import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { logAuditEvent } from "@/lib/audit-logger";
import { getIndiaStackProvider } from "@/lib/india-stack";
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
  const result = await provider.digilocker.fetchDocuments(session_id, phone);

  const { data: verification, error } = await db
    .from("verifications")
    .insert({
      session_id,
      provider: "digilocker",
      status: "success",
      match_score: 100,
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
      pan: encryptField(result.pan.number),
      full_name: encryptField(result.pan.name),
      dob: encryptField(result.pan.dob),
      address: encryptField(result.dl.address),
    })
    .eq("session_id", session_id);

  await logAuditEvent(session_id, "digilocker_verification", {
    pan_verified: result.pan.verified,
    dl_verified: result.dl.verified,
    documents_pulled: ["PAN", "Driving License"],
    compliance: "DigiLocker Section 4 - OAuth 2.0 document pull",
  });

  return NextResponse.json({ verification, result });
}
