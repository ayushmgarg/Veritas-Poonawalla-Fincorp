"use client";

import { Brain, BookOpen, AlertCircle, CheckCircle2 } from "lucide-react";
import type { LLMDecision } from "@/types";

interface LLMReasoningPanelProps {
  llmDecision: LLMDecision | null;
}

const TIER_CONFIG = {
  1: { label: "TIER 1 — PRIME", color: "#00C9A7", bg: "bg-[#00C9A7]/10 border-[#00C9A7]/20" },
  2: { label: "TIER 2 — STANDARD", color: "#FFB800", bg: "bg-[#FFB800]/10 border-[#FFB800]/20" },
  3: { label: "TIER 3 — SUBPRIME", color: "#FF4136", bg: "bg-[#FF4136]/10 border-[#FF4136]/20" },
};

export function LLMReasoningPanel({ llmDecision }: LLMReasoningPanelProps) {
  if (!llmDecision) {
    return (
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-4 h-4 text-[#7FDBFF]" />
          <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wide">
            AI Risk Assessment
          </h3>
        </div>
        <p className="text-xs text-text-muted text-center py-4">
          Awaiting LLM risk classification
        </p>
      </div>
    );
  }

  const tierConfig = TIER_CONFIG[llmDecision.risk_tier];
  const passRate = Math.round(
    (llmDecision.policy_rules_passed / llmDecision.policy_rules_evaluated) * 100
  );

  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Brain className="w-4 h-4 text-[#7FDBFF]" />
        <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wide">
          AI Risk Assessment
        </h3>
      </div>

      <div className={`rounded-xl border p-3 ${tierConfig.bg}`}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold" style={{ color: tierConfig.color }}>
            {tierConfig.label}
          </p>
          <span className="text-xs text-text-muted">
            {Math.round(llmDecision.confidence * 100)}% confidence
          </span>
        </div>
        <p className="text-[10px] text-text-muted mt-1">
          {llmDecision.persona_classification}
        </p>
      </div>

      <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
        <CheckCircle2
          className="w-4 h-4 shrink-0"
          style={{ color: passRate >= 80 ? "#00C9A7" : "#FF4136" }}
        />
        <div>
          <p className="text-xs text-text-primary">
            {llmDecision.policy_rules_passed}/{llmDecision.policy_rules_evaluated} policy rules passed
          </p>
          <p className="text-[10px] text-text-muted">Deterministic engine override active</p>
        </div>
        <span
          className="ml-auto text-sm font-bold"
          style={{ color: passRate >= 80 ? "#00C9A7" : "#FF4136" }}
        >
          {passRate}%
        </span>
      </div>

      <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <AlertCircle className="w-3 h-3 text-text-muted" />
          <span className="text-[10px] text-text-muted uppercase tracking-wide">
            LLM Reasoning
          </span>
        </div>
        <p className="text-xs text-text-secondary leading-relaxed line-clamp-4">
          {llmDecision.reasoning}
        </p>
      </div>

      {llmDecision.rbi_citations?.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3 h-3 text-[#0074D9]" />
            <span className="text-[10px] text-text-muted uppercase tracking-wide">
              RBI Citations
            </span>
          </div>
          {llmDecision.rbi_citations.slice(0, 3).map((citation, i) => (
            <div
              key={i}
              className="flex items-start gap-2 p-2 rounded-lg bg-[#0074D9]/5 border border-[#0074D9]/10"
            >
              <span className="text-[10px] font-medium text-[#0074D9] shrink-0">
                {citation.clause}
              </span>
              <span className="text-[10px] text-text-muted leading-relaxed">
                {citation.relevance}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
