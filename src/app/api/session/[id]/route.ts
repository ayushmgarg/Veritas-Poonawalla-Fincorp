import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getServiceClient();

  const { data: session, error } = await db
    .from("sessions")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const { data: customerData } = await db
    .from("customer_data")
    .select("*")
    .eq("session_id", id)
    .single();

  const { data: verifications } = await db
    .from("verifications")
    .select("*")
    .eq("session_id", id);

  const { data: financialData } = await db
    .from("financial_data")
    .select("*")
    .eq("session_id", id)
    .single();

  const { data: fraudEvents } = await db
    .from("fraud_events")
    .select("*")
    .eq("session_id", id);

  const { data: offers } = await db
    .from("loan_offers")
    .select("*")
    .eq("session_id", id);

  const { data: llmDecision } = await db
    .from("llm_decisions")
    .select("*")
    .eq("session_id", id)
    .order("decided_at", { ascending: false })
    .limit(1)
    .single();

  const { data: transcripts } = await db
    .from("transcripts")
    .select("*")
    .eq("session_id", id)
    .order("timestamp_ms", { ascending: true });

  return NextResponse.json({
    session,
    customerData,
    verifications: verifications || [],
    financialData,
    fraudEvents: fraudEvents || [],
    offers: offers || [],
    llmDecision,
    transcripts: transcripts || [],
  });
}
