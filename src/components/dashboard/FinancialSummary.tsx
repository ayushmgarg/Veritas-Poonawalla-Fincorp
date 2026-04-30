"use client";

import { motion } from "framer-motion";
import { TrendingUp, Brain, Zap, BarChart3 } from "lucide-react";
import type { FinancialData } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface FinancialSummaryProps {
  financial: FinancialData | null;
}

function ScoreBar({
  value,
  max,
  color,
}: {
  value: number;
  max: number;
  color: string;
}) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
    </div>
  );
}

export function FinancialSummary({ financial }: FinancialSummaryProps) {
  if (!financial) {
    return (
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-[#FFB800]" />
          <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wide">
            Financial Intelligence
          </h3>
        </div>
        <p className="text-xs text-text-muted text-center py-4">
          Pending financial data pull
        </p>
      </div>
    );
  }

  const cibilColor =
    financial.cibil_score >= 750
      ? "#00C9A7"
      : financial.cibil_score >= 650
      ? "#FFB800"
      : "#FF4136";

  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-[#FFB800]" />
        <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wide">
          Financial Intelligence
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp className="w-3 h-3 text-[#FFB800]" />
            <span className="text-[10px] text-text-muted">CIBIL Score</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: cibilColor }}>
            {financial.cibil_score}
          </p>
          <p className="text-[10px] text-text-muted mt-0.5">{financial.cibil_band}</p>
          <div className="mt-2">
            <ScoreBar value={financial.cibil_score} max={900} color={cibilColor} />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
          <div className="flex items-center gap-1.5 mb-2">
            <Zap className="w-3 h-3 text-[#0074D9]" />
            <span className="text-[10px] text-text-muted">Digital Trust</span>
          </div>
          <p className="text-2xl font-bold text-[#0074D9]">
            {financial.digital_trust_score}
          </p>
          <p className="text-[10px] text-text-muted mt-0.5">/ 100 composite</p>
          <div className="mt-2">
            <ScoreBar
              value={financial.digital_trust_score}
              max={100}
              color="#0074D9"
            />
          </div>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Brain className="w-3 h-3 text-[#00C9A7]" />
            <span className="text-[10px] text-text-muted">Shadow NLP Score</span>
          </div>
          <span className="text-sm font-bold text-[#00C9A7]">
            {financial.shadow_nlp_score}/100
          </span>
        </div>
        <ScoreBar value={financial.shadow_nlp_score} max={100} color="#00C9A7" />
        <p className="text-[10px] text-text-muted mt-1.5">
          Conversation quality analysis · financial literacy signal
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
          <p className="text-xs font-semibold text-text-primary">
            {formatCurrency(financial.monthly_income)}
          </p>
          <p className="text-[10px] text-text-muted">Monthly Income</p>
        </div>
        <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
          <p className="text-xs font-semibold text-text-primary">
            {financial.existing_loans}
          </p>
          <p className="text-[10px] text-text-muted">Active Loans</p>
        </div>
        <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
          <p
            className="text-xs font-semibold"
            style={{
              color: financial.delinquency_count > 0 ? "#FF4136" : "#00C9A7",
            }}
          >
            {financial.delinquency_count}
          </p>
          <p className="text-[10px] text-text-muted">Delinquencies</p>
        </div>
      </div>
    </div>
  );
}
