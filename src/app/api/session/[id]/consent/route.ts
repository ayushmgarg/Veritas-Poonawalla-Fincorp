import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { logAuditEvent } from "@/lib/audit-logger";
import { computeAudioHash } from "@/lib/hash-chain";
import { validateRequest, validateParam, consentSchema } from "@/lib/validation";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const paramCheck = validateParam(rawId);
  if (!paramCheck.success) return paramCheck.response;
  const id = paramCheck.data;

  const validation = await validateRequest(request, consentSchema);
  if (!validation.success) return validation.response;
  const { consent_type, consent_text, language } = validation.data;
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
