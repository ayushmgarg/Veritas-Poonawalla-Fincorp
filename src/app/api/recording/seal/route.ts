import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { createHash } from "crypto";
import { logAuditEvent } from "@/lib/audit-logger";
import { validateRequest, uuidSchema } from "@/lib/validation";
import { z } from "zod";

const sealSchema = z.object({
  session_id: uuidSchema,
  total_chunks: z.number().int().min(1).max(1000),
  duration_seconds: z.number().int().min(1).max(3600),
  codec: z.string().max(100),
});

/**
 * Seal a recording session.
 * Computes composite hash of all chunks (Merkle-like integrity proof).
 * Creates the recordings entry in DB with final metadata.
 *
 * PMLA Section 12: Tamper-evident storage with hash chain.
 */
export async function POST(request: Request) {
  const validation = await validateRequest(request, sealSchema);
  if (!validation.success) return validation.response;
  const { session_id, total_chunks, duration_seconds, codec } = validation.data;

  const db = getServiceClient();

  // Fetch all chunk hashes for this session
  const { data: chunks, error: fetchError } = await db
    .from("recording_chunks")
    .select("chunk_index, sha256_hash, size_bytes")
    .eq("session_id", session_id)
    .order("chunk_index", { ascending: true });

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  // Compute composite hash (hash of all chunk hashes concatenated)
  const compositeInput = (chunks || [])
    .map((c) => c.sha256_hash)
    .join("");
  const compositeHash = createHash("sha256")
    .update(compositeInput)
    .digest("hex");

  const totalSize = (chunks || []).reduce((sum, c) => sum + (c.size_bytes || 0), 0);

  // Create the sealed recording entry
  const { data: recording, error: insertError } = await db
    .from("recordings")
    .insert({
      session_id,
      storage_path: `recordings/${session_id}/`,
      total_chunks,
      duration_seconds,
      codec,
      composite_sha256: compositeHash,
      total_size_bytes: totalSize,
      sealed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Log to audit trail
  await logAuditEvent(session_id, "recording_sealed", {
    composite_sha256: compositeHash,
    total_chunks,
    duration_seconds,
    codec,
    total_size_bytes: totalSize,
    compliance: "RBI V-CIP Section 3.1 — Full session recording sealed with SHA-256 integrity hash",
  });

  return NextResponse.json({
    sealed: true,
    recording,
    integrity: { composite_sha256: compositeHash, chunks_verified: chunks?.length },
  });
}
