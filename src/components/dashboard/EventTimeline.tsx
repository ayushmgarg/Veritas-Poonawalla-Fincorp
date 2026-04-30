"use client";

import { useState } from "react";
import { Clock, ChevronDown, ShieldCheck, Fingerprint, Brain, FileCheck, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { AuditLogEntry } from "@/types";
import { timeAgo } from "@/lib/utils";

interface EventTimelineProps {
  entries: AuditLogEntry[];
}

const EVENT_ICONS: Record<string, React.ElementType> = {
  session_created: Clock,
  consent_recorded: ShieldCheck,
  liveness_verified: Fingerprint,
  aadhaar_verified: Fingerprint,
  digilocker_verified: FileCheck,
  financial_data_pulled: Brain,
  risk_assessed: Brain,
  offers_generated: CheckCircle2,
  offer_accepted: CheckCircle2,
  fraud_detected: AlertTriangle,
  spoof_detected: AlertTriangle,
};

const EVENT_COLORS: Record<string, string> = {
  session_created: "#0074D9",
  consent_recorded: "#00C9A7",
  liveness_verified: "#00C9A7",
  aadhaar_verified: "#00C9A7",
  digilocker_verified: "#00C9A7",
  financial_data_pulled: "#FFB800",
  risk_assessed: "#7FDBFF",
  offers_generated: "#FFB800",
  offer_accepted: "#00C9A7",
  fraud_detected: "#FF4136",
  spoof_detected: "#FF4136",
};

export function EventTimeline({ entries }: EventTimelineProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-text-secondary" />
        <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wide">
          Audit Trail
        </h3>
        <span className="ml-auto text-[10px] text-text-muted">
          {entries.length} events
        </span>
      </div>

      {entries.length === 0 ? (
        <p className="text-xs text-text-muted text-center py-4">No events yet</p>
      ) : (
        <div className="space-y-1 max-h-[340px] overflow-y-auto pr-1">
          {entries.map((entry, i) => {
            const Icon = EVENT_ICONS[entry.event_type] || Clock;
            const color = EVENT_COLORS[entry.event_type] || "#64748B";
            const isExpanded = expanded === entry.id;

            return (
              <div key={entry.id} className="relative">
                {i < entries.length - 1 && (
                  <div
                    className="absolute left-[14px] top-8 bottom-0 w-px"
                    style={{ background: `${color}20` }}
                  />
                )}
                <button
                  onClick={() => setExpanded(isExpanded ? null : entry.id)}
                  className="w-full text-left"
                >
                  <div className="flex items-start gap-3 p-2 rounded-xl hover:bg-white/[0.03] transition-colors">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: `${color}15`, border: `1px solid ${color}30` }}
                    >
                      <Icon className="w-3.5 h-3.5" style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-text-primary">
                        {entry.event_type.replace(/_/g, " ")}
                      </p>
                      <p className="text-[10px] text-text-muted">
                        {timeAgo(entry.created_at)}
                      </p>
                    </div>
                    <ChevronDown
                      className="w-3 h-3 text-text-muted shrink-0 mt-1 transition-transform"
                      style={{ transform: isExpanded ? "rotate(180deg)" : "none" }}
                    />
                  </div>
                </button>

                {isExpanded && (
                  <div className="ml-10 mb-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <p className="text-[10px] font-mono text-text-muted break-all">
                      hash: {entry.hash.slice(0, 24)}...
                    </p>
                    <pre className="text-[10px] text-text-secondary mt-1.5 overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(entry.event_data, null, 2).slice(0, 200)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
