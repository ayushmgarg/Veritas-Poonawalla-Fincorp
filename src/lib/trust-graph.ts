import { getServiceClient } from "./supabase";

export interface TrustNode {
  type: "phone" | "ip" | "pan" | "face_hash" | "device_fp";
  value: string;
}

export interface TrustCheckResult {
  network_risk_score: number;
  flags: string[];
  reuse_count: number;
  suspicious_cluster: boolean;
  shared_attributes: { type: string; shared_with: number }[];
}

export async function checkTrustGraph(
  sessionId: string,
  phone: string,
  nodes: TrustNode[]
): Promise<TrustCheckResult> {
  const db = getServiceClient();
  const flags: string[] = [];
  const sharedAttributes: { type: string; shared_with: number }[] = [];
  let riskScore = 0;
  let totalReuseCount = 0;

  for (const node of nodes) {
    if (!node.value || node.value.length < 2) continue;

    try {
      const { data: existing } = await db
        .from("trust_nodes")
        .select("id, session_count, risk_score")
        .eq("type", node.type)
        .eq("value", node.value)
        .maybeSingle();

      if (existing) {
        totalReuseCount += existing.session_count;
        await db
          .from("trust_nodes")
          .update({
            session_count: existing.session_count + 1,
            last_seen: new Date().toISOString(),
          })
          .eq("id", existing.id);

        if (existing.session_count >= 3) {
          flags.push(`${node.type}_reused_${existing.session_count + 1}x`);
          riskScore += Math.min(25, existing.session_count * 6);
        }
      } else {
        await db.from("trust_nodes").insert({
          type: node.type,
          value: node.value,
          session_count: 1,
          risk_score: 0,
        });
      }

      if (node.type !== "phone") {
        await db.from("trust_edges").insert({
          source_type: "phone",
          source_value: phone,
          target_type: node.type,
          target_value: node.value,
          session_id: sessionId,
        });

        // Count how many OTHER phones share this attribute
        const { count } = await db
          .from("trust_edges")
          .select("id", { count: "exact", head: true })
          .eq("target_type", node.type)
          .eq("target_value", node.value)
          .neq("source_value", phone);

        const sharedCount = count ?? 0;
        if (sharedCount > 0) {
          sharedAttributes.push({ type: node.type, shared_with: sharedCount });
        }

        if (sharedCount >= 5) {
          flags.push(`suspicious_${node.type}_cluster`);
          riskScore += 20;
        }
      }
    } catch {
      // trust graph tables may not exist yet — fail silently
    }
  }

  return {
    network_risk_score: Math.min(100, riskScore),
    flags,
    reuse_count: totalReuseCount,
    suspicious_cluster: flags.some((f) => f.includes("cluster")),
    shared_attributes: sharedAttributes,
  };
}
