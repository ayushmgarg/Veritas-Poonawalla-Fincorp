const HESITATION_WORDS = ["um", "uh", "er", "like", "you know", "basically", "actually", "hmm", "hm"];
const CONFIDENCE_WORDS = ["yes", "correct", "definitely", "absolutely", "sure", "confirmed"];
const EVASION_PATTERNS = [
  /i (don't|dont) (know|remember|recall)/i,
  /not sure (about|of)/i,
  /maybe|perhaps|possibly/i,
  /can't (say|tell|recall)/i,
];

export interface SpeechMetrics {
  hesitation_count: number;
  hesitation_rate: number;       // hesitations per 100 words
  confidence_markers: number;
  evasion_count: number;
  word_count: number;
  avg_response_length: number;
}

export interface SpeechAssessment {
  score: number;                  // 0-100, higher = better
  fluency: "high" | "medium" | "low";
  confidence: "high" | "medium" | "low";
  flags: string[];
  metrics: SpeechMetrics;
}

export function analyzeSpeech(transcripts: string[]): SpeechAssessment {
  if (transcripts.length === 0) {
    return {
      score: 70,
      fluency: "medium",
      confidence: "medium",
      flags: [],
      metrics: {
        hesitation_count: 0,
        hesitation_rate: 0,
        confidence_markers: 0,
        evasion_count: 0,
        word_count: 0,
        avg_response_length: 0,
      },
    };
  }

  const fullText = transcripts.join(" ").toLowerCase();
  const words = fullText.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  let hesitationCount = 0;
  for (const hw of HESITATION_WORDS) {
    const regex = new RegExp(`\\b${hw}\\b`, "gi");
    const matches = fullText.match(regex);
    hesitationCount += matches?.length ?? 0;
  }

  let confidenceMarkers = 0;
  for (const cw of CONFIDENCE_WORDS) {
    const regex = new RegExp(`\\b${cw}\\b`, "gi");
    const matches = fullText.match(regex);
    confidenceMarkers += matches?.length ?? 0;
  }

  let evasionCount = 0;
  for (const pattern of EVASION_PATTERNS) {
    if (pattern.test(fullText)) evasionCount++;
  }

  const hesitationRate = wordCount > 0 ? (hesitationCount / wordCount) * 100 : 0;
  const avgLength = wordCount / transcripts.length;

  const flags: string[] = [];
  let score = 75;

  // Penalize high hesitation rate
  if (hesitationRate > 8) { score -= 20; flags.push("high_hesitation"); }
  else if (hesitationRate > 4) { score -= 10; flags.push("moderate_hesitation"); }

  // Penalize evasion
  if (evasionCount >= 3) { score -= 20; flags.push("evasive_responses"); }
  else if (evasionCount >= 1) { score -= 8; flags.push("some_evasion"); }

  // Reward confidence markers
  score += Math.min(15, confidenceMarkers * 3);

  // Penalize very short responses (terse, non-cooperative)
  if (avgLength < 4) { score -= 10; flags.push("terse_responses"); }

  // Reward detailed responses
  if (avgLength > 15) score += 10;

  score = Math.max(0, Math.min(100, Math.round(score)));

  const fluency: SpeechAssessment["fluency"] =
    hesitationRate > 8 ? "low" : hesitationRate > 3 ? "medium" : "high";
  const confidence: SpeechAssessment["confidence"] =
    evasionCount >= 2 || confidenceMarkers === 0 ? "low"
    : evasionCount === 0 && confidenceMarkers > 2 ? "high"
    : "medium";

  return {
    score,
    fluency,
    confidence,
    flags,
    metrics: {
      hesitation_count: hesitationCount,
      hesitation_rate: Math.round(hesitationRate * 10) / 10,
      confidence_markers: confidenceMarkers,
      evasion_count: evasionCount,
      word_count: wordCount,
      avg_response_length: Math.round(avgLength),
    },
  };
}

// Speech score → interest rate adjustment (basis points)
export function speechScoreToRateAdjustment(score: number): number {
  if (score >= 80) return 0;
  if (score >= 65) return 50;    // +0.5%
  if (score >= 50) return 150;   // +1.5%
  return 300;                    // +3.0%
}
