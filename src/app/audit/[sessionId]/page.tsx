"use client";

import { useState, useEffect, useCallback, use } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Download,
  Lock,
  Clock,
  Hash,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import type { AuditLogEntry } from "@/types";
import { timeAgo } from "@/lib/utils";

interface AuditData {
  entries: AuditLogEntry[];
  totalEntries: number;
  chainIntegrity: { valid: boolean; brokenAt: number | null };
}

const EVENT_COLORS: Record<string, string> = {
  session_created: "#0074D9",
  consent_recorded: "#00C9A7",
  liveness_verified: "#00C9A7",
  aadhaar_verified: "#00C9A7",
  digilocker_verified: "#00C9A7",
  financial_data_pulled: "#FFB800",
  risk_assessed: "#7FDBFF",
  offers_generated: "#FFB800",
  offer_negotiated: "#FFB800",
  offer_accepted: "#00C9A7",
  fraud_detected: "#FF4136",
  spoof_detected: "#FF4136",
  step_advanced: "#64748B",
};

export default function AuditPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const [data, setData] = useState<AuditData | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchAudit = useCallback(async () => {
    const res = await fetch(`/api/audit/${sessionId}`);
    const json = await res.json();
    if (res.ok && json.entries) {
      setData(json);
    }
    setLoading(false);
  }, [sessionId]);

  useEffect(() => {
    fetchAudit();
  }, [fetchAudit]);

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleExport() {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-${sessionId.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-[#0074D9]/30 border-t-[#0074D9] animate-spin" />
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-bg-primary flex items-center justify-center">
        <p className="text-text-muted">Audit trail not found.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg-primary">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0074D9] to-[#00C9A7] flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-sm font-semibold text-white">VERITAS</span>
            <span className="text-xs text-text-muted ml-2">Audit Trail</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/session/${sessionId}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-text-secondary hover:bg-white/[0.07] transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Open Session
          </Link>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0074D9]/10 border border-[#0074D9]/20 text-xs text-[#0074D9] hover:bg-[#0074D9]/15 transition-colors"
          >
            <Download className="w-3 h-3" />
            Export JSON
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-5 rounded-2xl border flex items-start gap-4 ${
            data.chainIntegrity?.valid
              ? "bg-[#00C9A7]/5 border-[#00C9A7]/20"
              : "bg-[#FF4136]/5 border-[#FF4136]/20"
          }`}
        >
          {data.chainIntegrity?.valid ? (
            <CheckCircle2 className="w-6 h-6 text-[#00C9A7] shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-6 h-6 text-[#FF4136] shrink-0 mt-0.5" />
          )}
          <div>
            <p
              className="text-sm font-semibold"
              style={{ color: data.chainIntegrity?.valid ? "#00C9A7" : "#FF4136" }}
            >
              {data.chainIntegrity?.valid
                ? "Hash Chain Integrity Verified"
                : "Hash Chain Integrity FAILED"}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">
              {data.chainIntegrity?.valid
                ? `All ${data.totalEntries} audit events verified — tamper-evident SHA-256 chain intact`
                : "One or more entries have been modified. Chain verification failed."}
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
            <p className="text-xl font-bold text-text-primary">{data.totalEntries}</p>
            <p className="text-[10px] text-text-muted">Total Events</p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Lock className="w-3 h-3 text-[#FFB800]" />
              <p className="text-[10px] font-medium text-[#FFB800]">SHA-256</p>
            </div>
            <p className="text-[10px] text-text-muted">Hash Algorithm</p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Clock className="w-3 h-3 text-[#0074D9]" />
              <p className="text-[10px] font-medium text-[#0074D9]">10 Year</p>
            </div>
            <p className="text-[10px] text-text-muted">WORM Retention</p>
          </div>
        </div>

        <div className="space-y-1">
          {data.entries.map((entry, i) => {
            const color = EVENT_COLORS[entry.event_type] || "#64748B";
            const isExpanded = expanded.has(entry.id);
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.5) }}
                className="relative"
              >
                {i < data.entries.length - 1 && (
                  <div
                    className="absolute left-[19px] top-10 bottom-0 w-px"
                    style={{ background: `${color}20` }}
                  />
                )}

                <button
                  onClick={() => toggleExpand(entry.id)}
                  className="w-full text-left"
                >
                  <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/[0.02] transition-colors">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: `${color}15`, border: `1px solid ${color}25` }}
                    >
                      <span className="text-[10px] font-bold" style={{ color }}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary">
                        {entry.event_type.replace(/_/g, " ")}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-text-muted">
                          {timeAgo(entry.created_at)}
                        </p>
                        <span className="text-text-muted">·</span>
                        <div className="flex items-center gap-1">
                          <Hash className="w-2.5 h-2.5 text-text-muted" />
                          <span className="text-[10px] font-mono text-text-muted">
                            {entry.hash.slice(0, 12)}...
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronDown
                      className="w-4 h-4 text-text-muted shrink-0 mt-1 transition-transform"
                      style={{ transform: isExpanded ? "rotate(180deg)" : "none" }}
                    />
                  </div>
                </button>

                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="ml-12 mb-2 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-2"
                  >
                    <div className="grid grid-cols-1 gap-1.5">
                      <div>
                        <span className="text-[10px] text-text-muted">Full Hash</span>
                        <p className="text-[10px] font-mono text-text-secondary break-all mt-0.5">
                          {entry.hash}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-text-muted">Previous Hash</span>
                        <p className="text-[10px] font-mono text-text-secondary break-all mt-0.5">
                          {entry.previous_hash || "GENESIS"}
                        </p>
                      </div>
                    </div>
                    {Object.keys(entry.event_data).length > 0 && (
                      <div>
                        <span className="text-[10px] text-text-muted">Event Data</span>
                        <pre className="text-[10px] text-text-secondary mt-1 overflow-x-auto whitespace-pre-wrap">
                          {JSON.stringify(entry.event_data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {data.entries.length === 0 && (
          <div className="text-center py-12">
            <p className="text-text-muted text-sm">No audit events found for this session.</p>
          </div>
        )}

        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] space-y-1.5">
          <p className="text-xs font-medium text-text-secondary">Session ID</p>
          <p className="text-xs font-mono text-text-muted break-all">{sessionId}</p>
          <p className="text-[10px] text-text-muted mt-2">
            Compliant with PMLA §12 · DPDP Act 2023 · RBI V-CIP Master Direction 2024
          </p>
        </div>
      </div>
    </main>
  );
}
