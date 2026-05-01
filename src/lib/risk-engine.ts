import { getServiceClient } from "./supabase";

export interface RiskEvent {
  type: string;
  delta: number;      // positive = risk up, negative = risk down
  reason: string;
  timestamp: number;
}

export interface LiveRiskState {
  score: number;       // 0-100
  level: "low" | "medium" | "high" | "critical";
  events: RiskEvent[];
}

const RISK_DELTAS: Record<string, number> = {
  liveness_pass: -10,
  liveness_fail: +20,
  spoof_suspected: +15,
  spoof_confirmed: +35,
  aadhaar_verified: -8,
  digilocker_verified: -6,
  ckyc_verified: -4,
  cibil_good: -12,       // score >= 750
  cibil_fair: 0,
  cibil_poor: +15,
  aa_verified: -8,
  intent_drift_low: +8,
  intent_drift_high: +20,
  trust_graph_clean: -5,
  trust_graph_suspicious: +18,
  speech_confident: -6,
  speech_hesitant: +10,
};

export function getRiskLevel(score: number): LiveRiskState["level"] {
  if (score >= 75) return "critical";
  if (score >= 55) return "high";
  if (score >= 35) return "medium";
  return "low";
}

export async function updateLiveRisk(
  sessionId: string,
  eventType: string,
  reason: string
): Promise<LiveRiskState> {
  const db = getServiceClient();
  const delta = RISK_DELTAS[eventType] ?? 0;

  const { data: session } = await db
    .from("sessions")
    .select("live_risk_score, risk_events")
    .eq("id", sessionId)
    .single();

  const currentScore: number = session?.live_risk_score ?? 35;
  const currentEvents: RiskEvent[] = (session?.risk_events as RiskEvent[]) ?? [];

  const newEvent: RiskEvent = {
    type: eventType,
    delta,
    reason,
    timestamp: Date.now(),
  };

  const newScore = Math.max(0, Math.min(100, currentScore + delta));
  const newEvents = [...currentEvents, newEvent].slice(-20); // keep last 20

  await db
    .from("sessions")
    .update({
      live_risk_score: newScore,
      risk_events: newEvents,
    })
    .eq("id", sessionId);

  return {
    score: newScore,
    level: getRiskLevel(newScore),
    events: newEvents,
  };
}

export async function getLiveRisk(sessionId: string): Promise<LiveRiskState> {
  const db = getServiceClient();
  const { data } = await db
    .from("sessions")
    .select("live_risk_score, risk_events")
    .eq("id", sessionId)
    .single();

  const score = data?.live_risk_score ?? 35;
  return {
    score,
    level: getRiskLevel(score),
    events: (data?.risk_events as RiskEvent[]) ?? [],
  };
}
