import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

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
  const { session_id, text, language, confidence, timestamp_ms } =
    await request.json();

  const db = getServiceClient();

  const entities: { type: string; value: string; raw: string }[] = [];
  for (const { type, pattern, extract } of ENTITY_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      entities.push({ type, value: extract(match), raw: match[0] });
    }
  }

  await db.from("transcripts").insert({
    session_id,
    speaker: "customer",
    text,
    language: language || "en",
    confidence: confidence || 0.9,
    entities_extracted: entities,
    timestamp_ms: timestamp_ms || Date.now(),
  });

  const updates: Record<string, unknown> = {};
  for (const entity of entities) {
    switch (entity.type) {
      case "loan_amount":
        updates.loan_amount_requested = parseFloat(entity.value);
        break;
      case "income":
        updates.income_declared = parseFloat(entity.value);
        break;
      case "loan_purpose":
        updates.loan_purpose = entity.value;
        break;
      case "employer":
        updates.employer = entity.value;
        break;
      case "name":
        updates.full_name = entity.value;
        break;
    }
  }

  if (Object.keys(updates).length > 0) {
    await db
      .from("customer_data")
      .update(updates)
      .eq("session_id", session_id);
  }

  return NextResponse.json({ entities, updated: Object.keys(updates) });
}
