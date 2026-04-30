"use client";

import { motion } from "framer-motion";
import { Shield, Activity, Eye } from "lucide-react";
import type { FraudEvent, LivenessCheck } from "@/types";

interface FraudGaugesProps {
  fraudEvents: FraudEvent[];
  livenessChecks: LivenessCheck[];
}

function CircularGauge({
  value,
  label,
  icon: Icon,
  color,
  dangerThreshold,
  invert = false,
}: {
  value: number;
  label: string;
  icon: React.ElementType;
  color: string;
  dangerThreshold: number;
  invert?: boolean;
}) {
  const isDanger = invert ? value < dangerThreshold : value > dangerThreshold;
  const activeColor = isDanger ? "#FF4136" : color;
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 88 88">
          <circle
            cx="44"
            cy="44"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="7"
          />
          <motion.circle
            cx="44"
            cy="44"
            r={radius}
            fill="none"
            stroke={activeColor}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold" style={{ color: activeColor }}>
            {value}
          </span>
          <Icon className="w-3 h-3 text-text-muted mt-0.5" />
        </div>
      </div>
      <p className="text-xs text-text-secondary text-center leading-tight">{label}</p>
      <div
        className="px-2 py-0.5 rounded-full text-[10px] font-medium"
        style={{
          background: `${activeColor}15`,
          color: activeColor,
          border: `1px solid ${activeColor}30`,
        }}
      >
        {isDanger ? "ALERT" : "CLEAR"}
      </div>
    </div>
  );
}

export function FraudGauges({ fraudEvents, livenessChecks }: FraudGaugesProps) {
  const latestLiveness = livenessChecks[livenessChecks.length - 1];
  const latestFraud = fraudEvents[fraudEvents.length - 1];

  const ganScore = latestFraud ? Math.round(latestFraud.confidence * 100) : 0;
  const livenessScore = latestLiveness
    ? Math.round(latestLiveness.face_confidence * 100)
    : 0;
  const movementScore = latestLiveness
    ? Math.min(100, latestLiveness.micro_movement_count * 10)
    : 0;

  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-4 h-4 text-[#FF4136]" />
        <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wide">
          Fraud Detection
        </h3>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <CircularGauge
          value={ganScore}
          label="GAN / Spoof Score"
          icon={Eye}
          color="#0074D9"
          dangerThreshold={70}
        />
        <CircularGauge
          value={livenessScore}
          label="Liveness Confidence"
          icon={Activity}
          color="#00C9A7"
          dangerThreshold={50}
          invert
        />
        <CircularGauge
          value={movementScore}
          label="Micro-movement"
          icon={Activity}
          color="#FFB800"
          dangerThreshold={20}
          invert
        />
      </div>
      {fraudEvents.length > 0 && (
        <div className="mt-4 rounded-xl bg-[#FF4136]/5 border border-[#FF4136]/15 p-3">
          <p className="text-[10px] text-[#FF4136] font-medium mb-1">
            {fraudEvents.length} fraud event{fraudEvents.length > 1 ? "s" : ""} detected
          </p>
          <p className="text-[10px] text-text-muted">
            Last: {latestFraud?.event_type.replace(/_/g, " ")} — action:{" "}
            {latestFraud?.action_taken.replace(/_/g, " ")}
          </p>
        </div>
      )}
      {fraudEvents.length === 0 && (
        <div className="mt-4 rounded-xl bg-[#00C9A7]/5 border border-[#00C9A7]/15 p-3">
          <p className="text-[10px] text-[#00C9A7] font-medium">
            No fraud events — session clean
          </p>
        </div>
      )}
    </div>
  );
}
