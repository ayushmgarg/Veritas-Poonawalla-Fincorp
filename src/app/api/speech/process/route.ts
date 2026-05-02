import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { detectRuleDrift, ExtractedEntities } from "@/lib/intent-drift";
import { analyzeSpeech } from "@/lib/speech-analysis";
import { updateLiveRisk } from "@/lib/risk-engine";
import { validateRequest, speechProcessSchema } from "@/lib/validation";
import { encryptField } from "@/lib/encryption";

const ENTITY_PATTERNS: { type: string; pattern: RegExp; extract: (m: RegExpMatchArray) => string }[] = [
  {
    type: "loan_amount",
    pattern: /(\d+\.?\d*)\s*(lakh|lac|lakhs|lacs|crore|crores|thousand|k)\b/i,
    extract: (m) => {
      const num = parseFloat(m[1]);
      const unit = m[2].toLowerCase();
      if (unit.startsWith("lakh") || unit.startsWith("lac")) return String(num * 100000);
      if (unit.startsWith("crore")) return String(num * 10000000);
      if (unit === "k" || unit === "thousand") return String(num * 1000);
      return String(num);
    },
  },
  {
    type: "income",
    pattern: /(?:income|earn|salary|making)\s*(?:is|of|about|around)?\s*(?:rs\.?|inr|rupees?)?\s*(\d+[\d,]*)/i,
    extract: (m) => m[1].replace(/,/g, ""),
  },
  {
    type: "loan_purpose",
    pattern: /(?:for|purpose|want|need)\s+(?:a\s+)?(?:loan\s+for\s+)?(home\s+renovation|personal|business|education|medical|wedding|travel|car|vehicle|two[\s-]?wheeler)/i,
    extract: (m) => m[1],
  },
  {
    type: "employer",
    pattern: /(?:work|working|employed)\s+(?:at|in|for|with)\s+(.+?)(?:\.|,|$)/i,
    extract: (m) => m[1].trim(),
  },
  {
    type: "consent",
    pattern: /\b(i agree|i consent|yes|haan|ha ji|theek hai|okay proceed|agreed)\b/i,
    extract: (m) => m[1],
  },
  {
    type: "name",
    pattern: /(?:my name is|i am|this is|name's)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/,
    extract: (m) => m[1],
  },
];

export async function POST(request: Request) {
  const validation = await validateRequest(request, speechProcessSchema);
  if (!validation.success) return validation.response;
  const { session_id, text, language, confidence, timestamp_ms } = validation.data;
  const db = getServiceClient();

  // 1. Entity extraction
  const entities: { type: string; value: string; raw: string }[] = [];
  for (const { type, pattern, extract } of ENTITY_PATTERNS) {
    const match = text.match(pattern);
    if (match) entities.push({ type, value: extract(match), raw: match[0] });
  }

  // 2. Save transcript
  await db.from("transcripts").insert({
    session_id,
    speaker: "customer",
    text,
    language: language || "en",
    confidence: confidence || 0.9,
    entities_extracted: entities,
    timestamp_ms: timestamp_ms || Date.now(),
  });

  // 3. Update customer_data from entities
  const updates: Record<string, unknown> = {};
  const newEntities: ExtractedEntities = {};

  for (const entity of entities) {
    switch (entity.type) {
      case "loan_amount":
        updates.loan_amount_requested = parseFloat(entity.value);
        newEntities.loan_amount = parseFloat(entity.value);
        break;
      case "income":
        updates.income_declared = parseFloat(entity.value);
        newEntities.income = parseFloat(entity.value);
        break;
      case "loan_purpose":
        updates.loan_purpose = entity.value;
        newEntities.loan_purpose = entity.value;
        break;
      case "employer":
        updates.employer = entity.value;
        newEntities.employer = entity.value;
        break;
      case "name":
        updates.full_name = encryptField(entity.value);
        newEntities.name = entity.value;
        break;
    }
  }

  if (Object.keys(updates).length > 0) {
    await db.from("customer_data").update(updates).eq("session_id", session_id);
  }

  // 4. Intent drift check (only if we extracted something)
  let driftResult = null;
  if (Object.keys(newEntities).length > 0) {
    const { data: customer } = await db
      .from("customer_data")
      .select("income_declared, employer, loan_amount_requested, loan_purpose, full_name")
      .eq("session_id", session_id)
      .single();

    const prevEntities: ExtractedEntities = {
      income: customer?.income_declared ?? undefined,
      employer: customer?.employer ?? undefined,
      loan_amount: customer?.loan_amount_requested ?? undefined,
      loan_purpose: customer?.loan_purpose ?? undefined,
      name: customer?.full_name ?? undefined,
    };

    driftResult = detectRuleDrift(prevEntities, newEntities);

    if (driftResult.inconsistency_score > 40) {
      await updateLiveRisk(session_id, "intent_drift_high",
        `${driftResult.flags.map(f => f.type).join(", ")}`);
    } else if (driftResult.inconsistency_score > 15) {
      await updateLiveRisk(session_id, "intent_drift_low",
        `Minor drift detected`);
    }
  }

  // 5. Speech assessment (run every 3rd transcript to avoid hammering)
  const { count: transcriptCount } = await db
    .from("transcripts")
    .select("id", { count: "exact", head: true })
    .eq("session_id", session_id)
    .eq("speaker", "customer");

  let speechAssessment = null;
  if ((transcriptCount ?? 0) % 3 === 0) {
    const { data: allTranscripts } = await db
      .from("transcripts")
      .select("text")
      .eq("session_id", session_id)
      .eq("speaker", "customer")
      .order("timestamp_ms", { ascending: true });

    const texts = allTranscripts?.map((t) => t.text) ?? [];
    speechAssessment = analyzeSpeech(texts);

    // Store on session
    await db
      .from("sessions")
      .update({ speech_assessment: speechAssessment })
      .eq("id", session_id);

    // Update financial_data if exists
    await db
      .from("financial_data")
      .update({ speech_assessment_score: speechAssessment.score })
      .eq("session_id", session_id);

    // Feed into live risk
    if (speechAssessment.score >= 70) {
      await updateLiveRisk(session_id, "speech_confident", `Speech score: ${speechAssessment.score}`);
    } else if (speechAssessment.score < 50) {
      await updateLiveRisk(session_id, "speech_hesitant", `Speech score: ${speechAssessment.score}, flags: ${speechAssessment.flags.join(", ")}`);
    }
  }

  return NextResponse.json({
    entities,
    updated: Object.keys(updates),
    drift: driftResult,
    speech: speechAssessment,
  });
}
