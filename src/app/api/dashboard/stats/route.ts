import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function GET() {
  const db = getServiceClient();

  const { count: totalSessions } = await db
    .from("sessions")
    .select("*", { count: "exact", head: true });

  const { count: completedSessions } = await db
    .from("sessions")
    .select("*", { count: "exact", head: true })
    .eq("status", "completed");

  const { count: activeSessions } = await db
    .from("sessions")
    .select("*", { count: "exact", head: true })
    .eq("status", "in_progress");

  const { count: fraudBlocked } = await db
    .from("sessions")
    .select("*", { count: "exact", head: true })
    .eq("status", "fraud_blocked");

  const { count: totalFraudEvents } = await db
    .from("fraud_events")
    .select("*", { count: "exact", head: true });

  const { data: recentSessions } = await db
    .from("sessions")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(10);

  return NextResponse.json({
    totalSessions: totalSessions || 0,
    completedSessions: completedSessions || 0,
    activeSessions: activeSessions || 0,
    fraudBlocked: fraudBlocked || 0,
    totalFraudEvents: totalFraudEvents || 0,
    approvalRate:
      totalSessions && totalSessions > 0
        ? Math.round(((completedSessions || 0) / totalSessions) * 100)
        : 0,
    recentSessions: recentSessions || [],
  });
}
