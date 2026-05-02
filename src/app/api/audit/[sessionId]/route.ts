import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { verifyChain } from "@/lib/hash-chain";
import { validateParam } from "@/lib/validation";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId: rawId } = await params;
  const paramCheck = validateParam(rawId, "sessionId");
  if (!paramCheck.success) return paramCheck.response;
  const sessionId = paramCheck.data;
  const db = getServiceClient();

  const { data: entries, error } = await db
    .from("audit_log")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const chainVerification = verifyChain(entries || []);

  return NextResponse.json({
    entries: entries || [],
    totalEntries: entries?.length || 0,
    chainIntegrity: chainVerification,
  });
}
