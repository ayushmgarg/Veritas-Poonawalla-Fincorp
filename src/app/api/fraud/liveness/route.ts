import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function POST(request: Request) {
  const {
    session_id,
    blink_count,
    micro_movement_count,
    head_yaw,
    head_pitch,
    face_confidence,
  } = await request.json();

  const db = getServiceClient();

  const isLive =
    blink_count > 0 && micro_movement_count > 10 && face_confidence > 0.7;

  const { data, error } = await db
    .from("liveness_checks")
    .insert({
      session_id,
      blink_count,
      micro_movement_count,
      head_yaw: head_yaw || 0,
      head_pitch: head_pitch || 0,
      face_confidence: face_confidence || 0,
      is_live: isLive,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ livenessCheck: data, isLive });
}
