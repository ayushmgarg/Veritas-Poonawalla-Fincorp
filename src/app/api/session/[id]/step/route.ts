import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { logAuditEvent } from "@/lib/audit-logger";
import { SESSION_STEPS } from "@/constants/steps";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { step } = await request.json();
  const db = getServiceClient();

  if (step < 0 || step >= SESSION_STEPS.length) {
    return NextResponse.json({ error: "Invalid step" }, { status: 400 });
  }

  const status = step === SESSION_STEPS.length - 1 ? "completed" : "in_progress";

  const { data: session, error } = await db
    .from("sessions")
    .update({
      current_step: step,
      status,
      ...(status === "completed" ? { completed_at: new Date().toISOString() } : {}),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const stepInfo = SESSION_STEPS[step];
  await logAuditEvent(id, "step_advanced", {
    step,
    step_name: stepInfo.name,
    xp_awarded: stepInfo.xpReward,
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json({ session, stepInfo });
}
