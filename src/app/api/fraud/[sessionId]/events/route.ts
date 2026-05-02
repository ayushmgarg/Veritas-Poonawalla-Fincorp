import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
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

  const { data: events, error } = await db
    .from("fraud_events")
    .select("*")
    .eq("session_id", sessionId)
    .order("detected_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ events: events || [] });
}
