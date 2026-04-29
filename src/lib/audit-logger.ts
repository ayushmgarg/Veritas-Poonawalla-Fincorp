import { getServiceClient } from "./supabase";
import { computeHash } from "./hash-chain";

const GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";

export async function logAuditEvent(
  sessionId: string,
  eventType: string,
  eventData: Record<string, unknown>
): Promise<{ hash: string }> {
  const db = getServiceClient();

  const { data: lastEntry } = await db
    .from("audit_log")
    .select("hash")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const previousHash = lastEntry?.hash || GENESIS_HASH;
  const hash = computeHash(JSON.stringify(eventData), previousHash);

  await db.from("audit_log").insert({
    session_id: sessionId,
    event_type: eventType,
    event_data: eventData,
    hash,
    previous_hash: previousHash,
  });

  return { hash };
}
