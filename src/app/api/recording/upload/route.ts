import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { createHash } from "crypto";

/**
 * Chunked recording upload.
 * Receives FormData with video/audio chunk and stores in Supabase Storage.
 * Each chunk is SHA-256 hashed for tamper evidence (PMLA Section 12).
 */
export async function POST(request: Request) {
  const formData = await request.formData();
  const chunk = formData.get("chunk") as File | null;
  const sessionId = formData.get("session_id") as string | null;
  const chunkIndex = formData.get("chunk_index") as string | null;

  if (!chunk || !sessionId || chunkIndex === null) {
    return NextResponse.json(
      { error: "Missing required fields: chunk, session_id, chunk_index" },
      { status: 400 }
    );
  }

  // Validate session ID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(sessionId)) {
    return NextResponse.json({ error: "Invalid session_id" }, { status: 400 });
  }

  const buffer = Buffer.from(await chunk.arrayBuffer());
  const sha256 = createHash("sha256").update(buffer).digest("hex");
  const storagePath = `recordings/${sessionId}/chunk-${chunkIndex.padStart(4, "0")}.webm`;

  const db = getServiceClient();

  // Upload to Supabase Storage
  const { error: uploadError } = await db.storage
    .from("vcip-recordings")
    .upload(storagePath, buffer, {
      contentType: chunk.type || "video/webm",
      upsert: false,
    });

  if (uploadError) {
    // If bucket doesn't exist yet, return specific error
    if (uploadError.message?.includes("not found")) {
      return NextResponse.json(
        { error: "Storage bucket 'vcip-recordings' not configured. Create it in Supabase Dashboard." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // Log chunk metadata
  await db.from("recording_chunks").insert({
    session_id: sessionId,
    chunk_index: parseInt(chunkIndex),
    storage_path: storagePath,
    size_bytes: buffer.length,
    sha256_hash: sha256,
  });

  return NextResponse.json({
    uploaded: true,
    chunk_index: parseInt(chunkIndex),
    sha256,
    size_bytes: buffer.length,
  });
}
