import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
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
