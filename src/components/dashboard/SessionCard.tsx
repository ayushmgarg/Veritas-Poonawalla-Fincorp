"use client";

import { motion } from "framer-motion";
import { Phone, Clock, AlertTriangle, CheckCircle2, Activity, XCircle } from "lucide-react";
import type { Session } from "@/types";
import { timeAgo } from "@/lib/utils";

interface SessionCardProps {
  session: Session;
  selected: boolean;
  onClick: () => void;
}

const STATUS_CONFIG = {
  initiated: { color: "#64748B", icon: Clock, label: "Initiated" },
  in_progress: { color: "#0074D9", icon: Activity, label: "In Progress" },
  completed: { color: "#00C9A7", icon: CheckCircle2, label: "Completed" },
  fraud_blocked: { color: "#FF4136", icon: AlertTriangle, label: "Fraud Blocked" },
  abandoned: { color: "#64748B", icon: XCircle, label: "Abandoned" },
};

export function SessionCard({ session, selected, onClick }: SessionCardProps) {
  const config = STATUS_CONFIG[session.status];
  const Icon = config.icon;

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`w-full text-left p-3 rounded-xl border transition-all duration-200 ${
        selected
          ? "bg-[#0074D9]/10 border-[#0074D9]/30"
          : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]"
      }`}
    >
      <div className="flex items-start gap-2.5">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${config.color}15`, border: `1px solid ${config.color}25` }}
        >
          <Icon className="w-4 h-4" style={{ color: config.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-text-primary truncate">
              +91 {session.phone}
            </p>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0"
              style={{
                background: `${config.color}15`,
                color: config.color,
                border: `1px solid ${config.color}25`,
              }}
            >
              {config.label}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-[10px] text-text-muted">
              Step {session.current_step}/7
            </p>
            <span className="text-text-muted">·</span>
            <p className="text-[10px] text-text-muted">
              {timeAgo(session.started_at)}
            </p>
          </div>
          <p className="text-[10px] font-mono text-text-muted mt-0.5 truncate">
            {session.id.slice(0, 8)}...
          </p>
        </div>
      </div>
      {session.status === "in_progress" && (
        <div className="mt-2 flex items-center gap-1.5">
          <div className="flex-1 h-0.5 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-[#0074D9]"
              initial={{ width: 0 }}
              animate={{ width: `${(session.current_step / 7) * 100}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
          <span className="text-[9px] text-text-muted">
            {Math.round((session.current_step / 7) * 100)}%
          </span>
        </div>
      )}
    </motion.button>
  );
}
