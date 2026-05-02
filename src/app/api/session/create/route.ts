import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { logAuditEvent } from "@/lib/audit-logger";
import { validateRequest, sessionCreateSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const validation = await validateRequest(request, sessionCreateSchema);
  if (!validation.success) return validation.response;
  const { phone } = validation.data;

  const db = getServiceClient();

  const { data: existing } = await db
    .from("sessions")
    .select("id")
    .eq("phone", phone)
    .in("status", ["initiated", "consent", "in_progress"])
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "duplicate", session_id: existing.id }, { status: 409 });
  }

  const { data: session, error } = await db
    .from("sessions")
    .insert({
      phone,
      status: "initiated",
      current_step: 0,
      device_info: {},
      geo_location: {
        lat: 12.9716,
        lng: 77.5946,
        ip: "203.0.113.42",
        city: "Bangalore",
        state: "Karnataka",
      },
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await db.from("customer_data").insert({
    session_id: session.id,
    extracted_via: "speech",
  });

  await logAuditEvent(session.id, "session_created", {
    phone,
    timestamp: new Date().toISOString(),
    encryption: "AES-256-GCM",
    protocol: "WebRTC DTLS-SRTP",
  });

  return NextResponse.json({ session });
}
