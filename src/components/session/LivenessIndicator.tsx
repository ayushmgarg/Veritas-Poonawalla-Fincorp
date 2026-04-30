"use client";

import { motion } from "framer-motion";
import { Eye, Activity, AlertTriangle } from "lucide-react";
import { LivenessState } from "@/hooks/useLiveness";
import { cn } from "@/lib/utils";

interface LivenessIndicatorProps {
  liveness: LivenessState;
  faceDetected: boolean;
}

export function LivenessIndicator({ liveness, faceDetected }: LivenessIndicatorProps) {
  const isSpoof = liveness.status === "spoof_confirmed" || liveness.status === "spoof_suspected";
  const color = isSpoof ? "#FF4136" : liveness.isLive ? "#00C9A7" : "#FFB800";

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div
          className="w-2 h-2 rounded-full transition-colors duration-300"
          style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
        />
        <span className="text-xs font-medium text-text-secondary">
          {isSpoof ? "SPOOF DETECTED" : liveness.isLive ? "LIVE" : faceDetected ? "CHECKING" : "NO FACE"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <LivenessStat
          icon={Eye}
          label="Blinks"
          value={liveness.blinkCount}
          good={liveness.blinkCount > 0}
        />
        <LivenessStat
          icon={Activity}
          label="Movements"
          value={liveness.microMovements}
          good={liveness.microMovements > 10}
        />
      </div>

      {isSpoof && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-[#FF4136]/10 border border-[#FF4136]/20"
        >
          <AlertTriangle className="w-3 h-3 text-[#FF4136] shrink-0" />
          <span className="text-[10px] text-[#FF4136]">
            GAN score: {liveness.spoofConfidence}%
          </span>
        </motion.div>
      )}
    </div>
  );
}

function LivenessStat({
  icon: Icon,
  label,
  value,
  good,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  good: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px]",
        good ? "bg-[#00C9A7]/5 border border-[#00C9A7]/10" : "bg-white/[0.03] border border-white/5"
      )}
    >
      <Icon className={cn("w-2.5 h-2.5", good ? "text-[#00C9A7]" : "text-text-muted")} />
      <span className={good ? "text-[#00C9A7]" : "text-text-muted"}>{label}:</span>
      <span className="font-mono font-medium text-text-secondary">{value}</span>
    </div>
  );
}
