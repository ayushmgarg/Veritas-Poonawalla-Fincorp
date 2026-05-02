import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { checkTrustGraph } from "@/lib/trust-graph";
import { updateLiveRisk } from "@/lib/risk-engine";
import { logAuditEvent } from "@/lib/audit-logger";
import { validateRequest, sessionIdBody } from "@/lib/validation";

export async function POST(request: Request) {
  const validation = await validateRequest(request, sessionIdBody);
  if (!validation.success) return validation.response;
  const { session_id } = validation.data;
  const db = getServiceClient();

  const { data: session } = await db
    .from("sessions")
    .select("phone")
    .eq("id", session_id)
    .single();

  const phone = session?.phone ?? "unknown";

  // Build nodes from session attributes
  const { data: customer } = await db
    .from("customer_data")
    .select("pan")
    .eq("session_id", session_id)
    .single();

  const nodes = [
    { type: "phone" as const, value: phone },
    ...(customer?.pan ? [{ type: "pan" as const, value: customer.pan }] : []),
  ];

  const result = await checkTrustGraph(session_id, phone, nodes);

  // Feed into live risk
  if (result.network_risk_score > 30) {
    await updateLiveRisk(session_id, "trust_graph_suspicious", `Network risk: ${result.flags.join(", ")}`);
  } else {
    await updateLiveRisk(session_id, "trust_graph_clean", "No suspicious network patterns");
  }

  await logAuditEvent(session_id, "trust_graph_check", {
    network_risk_score: result.network_risk_score,
    flags: result.flags,
    reuse_count: result.reuse_count,
  });

  return NextResponse.json(result);
}
