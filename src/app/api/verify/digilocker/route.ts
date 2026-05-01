import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { logAuditEvent } from "@/lib/audit-logger";
import { getPersonaForPhone } from "@/lib/mock-data";

export async function POST(request: Request) {
  const { session_id } = await request.json();
  const db = getServiceClient();
  const { data: sess } = await db.from("sessions").select("phone").eq("id", session_id).single();
  const persona = getPersonaForPhone(sess?.phone ?? "");

  await new Promise((r) => setTimeout(r, 2000));

  const result = persona.digilocker;

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
      pan: result.pan.number,
      full_name: result.pan.name,
      dob: persona.customer.dob,
      address: result.dl.address,
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
