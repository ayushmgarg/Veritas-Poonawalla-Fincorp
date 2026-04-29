import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { logAuditEvent } from "@/lib/audit-logger";
import { computeAudioHash } from "@/lib/hash-chain";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { consent_type, consent_text, language } = await request.json();
  const db = getServiceClient();

  const audioHash = computeAudioHash(
    `${id}-${consent_type}-${Date.now()}`
  );

  const { data: consent, error } = await db
    .from("consents")
    .insert({
      session_id: id,
      consent_type,
      consent_text: consent_text || `Verbal consent for ${consent_type}`,
      audio_hash: audioHash,
      language: language || "en",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAuditEvent(id, "consent_captured", {
    consent_type,
    audio_hash: audioHash,
    language: language || "en",
    timestamp: new Date().toISOString(),
    rbi_compliance: "V-CIP Section 5.1 - Explicit consent recorded",
  });

  return NextResponse.json({ consent });
}
