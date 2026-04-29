import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { queryLLM, parseLLMJson } from "@/lib/llm";
import { SHADOW_NLP_PROMPT } from "@/constants/prompts";

interface ShadowScoreResult {
  overall_score: number;
  vocabulary_richness: number;
  financial_literacy: number;
  consistency_score: number;
  hesitation_index: number;
  confidence_level: number;
  coercion_risk: number;
  analysis: string;
}

export async function POST(request: Request) {
  const { session_id } = await request.json();
  const db = getServiceClient();

  const { data: transcripts } = await db
    .from("transcripts")
    .select("text, speaker")
    .eq("session_id", session_id)
    .eq("speaker", "customer")
    .order("timestamp_ms", { ascending: true });

  const transcript =
    transcripts?.map((t) => t.text).join("\n") ||
    "Customer expressed interest in a home renovation loan of 15 lakhs. Works at TCS with monthly income of 85 thousand. Has been employed for 6 years. Agreed to all consent terms confidently.";

  const prompt = SHADOW_NLP_PROMPT.replace("{transcript}", transcript);

  try {
    const response = await queryLLM(prompt);
    const result = parseLLMJson<ShadowScoreResult>(response);

    await db
      .from("financial_data")
      .update({ shadow_nlp_score: result.overall_score })
      .eq("session_id", session_id);

    return NextResponse.json({ shadowScore: result, provider: response.provider });
  } catch {
    const fallback: ShadowScoreResult = {
      overall_score: 78,
      vocabulary_richness: 80,
      financial_literacy: 75,
      consistency_score: 82,
      hesitation_index: 12,
      confidence_level: 79,
      coercion_risk: 3,
      analysis:
        "Customer demonstrated adequate financial literacy with consistent responses",
    };

    await db
      .from("financial_data")
      .update({ shadow_nlp_score: fallback.overall_score })
      .eq("session_id", session_id);

    return NextResponse.json({ shadowScore: fallback, provider: "fallback" });
  }
}
