"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ShieldCheck, Activity } from "lucide-react";

interface LiveRiskMeterProps {
  sessionId: string;
}

type RiskLevel = "low" | "medium" | "high" | "critical";

const LEVEL_CONFIG: Record<RiskLevel, { color: string; bg: string; label: string; icon: typeof ShieldCheck }> = {
  low:      { color: "#00C9A7", bg: "rgba(0,201,167,0.1)",  label: "Low Risk",      icon: ShieldCheck },
  medium:   { color: "#FFB800", bg: "rgba(255,184,0,0.1)",  label: "Medium Risk",   icon: Activity },
  high:     { color: "#FF8C00", bg: "rgba(255,140,0,0.1)",  label: "High Risk",     icon: AlertTriangle },
  critical: { color: "#FF4136", bg: "rgba(255,65,54,0.12)", label: "Critical Risk", icon: AlertTriangle },
};

export function LiveRiskMeter({ sessionId }: LiveRiskMeterProps) {
  const [score, setScore] = useState(35);
  const [level, setLevel] = useState<RiskLevel>("medium");
  const [lastReason, setLastReason] = useState<string>("");
  const [pulse, setPulse] = useState(false);

  const fetchRisk = useCallback(async () => {
    try {
      const res = await fetch(`/api/session/${sessionId}/risk`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.score !== score) {
        setPulse(true);
        setTimeout(() => setPulse(false), 800);
      }
      setScore(data.score);
      setLevel(data.level);
      const lastEvent = data.events?.[data.events.length - 1];
      if (lastEvent?.reason) setLastReason(lastEvent.reason);
    } catch {
      // ignore
    }
  }, [sessionId, score]);

  useEffect(() => {
    fetchRisk();
    const interval = setInterval(fetchRisk, 3000);
    return () => clearInterval(interval);
  }, [fetchRisk]);

  const cfg = LEVEL_CONFIG[level];
  const Icon = cfg.icon;
  const circumference = 2 * Math.PI * 28;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div
      className="rounded-xl p-3 border transition-all duration-500"
      style={{ background: cfg.bg, borderColor: `${cfg.color}30` }}
    >
      <div className="flex items-center gap-3">
        {/* Circular gauge */}
        <div className="relative shrink-0">
          <svg width="64" height="64" className="-rotate-90">
            <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
            <motion.circle
              cx="32" cy="32" r="28"
              fill="none"
              stroke={cfg.color}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.span
              key={score}
              initial={{ scale: 1.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="text-xs font-bold"
              style={{ color: cfg.color }}
            >
              {score}
            </motion.span>
          </div>
          {pulse && (
            <motion.div
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 1.8, opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 rounded-full"
              style={{ border: `2px solid ${cfg.color}` }}
            />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Icon className="w-3 h-3 shrink-0" style={{ color: cfg.color }} />
            <span className="text-xs font-semibold" style={{ color: cfg.color }}>
              {cfg.label}
            </span>
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full ml-auto shrink-0"
              style={{ background: cfg.color }}
            />
          </div>
          <AnimatePresence mode="wait">
            {lastReason && (
              <motion.p
                key={lastReason}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-[10px] text-text-muted truncate"
              >
                {lastReason}
              </motion.p>
            )}
          </AnimatePresence>
          <div className="mt-1.5 h-1 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: cfg.color }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
