"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  RefreshCw,
  Users,
  CheckCircle2,
  AlertTriangle,
  Activity,
  User,
  Phone,
  MapPin,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import type { Session, Verification, FinancialData, FraudEvent, LivenessCheck, LLMDecision, AuditLogEntry } from "@/types";
import { SessionCard } from "@/components/dashboard/SessionCard";
import { FraudGauges } from "@/components/dashboard/FraudGauges";
import { IndiaStackChecklist } from "@/components/dashboard/IndiaStackChecklist";
import { FinancialSummary } from "@/components/dashboard/FinancialSummary";
import { LLMReasoningPanel } from "@/components/dashboard/LLMReasoningPanel";
import { EventTimeline } from "@/components/dashboard/EventTimeline";

interface DashboardStats {
  totalSessions: number;
  completedSessions: number;
  activeSessions: number;
  fraudBlocked: number;
  totalFraudEvents: number;
  approvalRate: number;
  recentSessions: Session[];
}

interface SessionDetail {
  session: Session;
  customerData: { full_name: string | null; phone?: string; loan_amount_requested?: number | null } | null;
  verifications: Verification[];
  financialData: FinancialData | null;
  fraudEvents: FraudEvent[];
  livenessChecks: LivenessCheck[];
  llmDecision: LLMDecision | null;
  auditEntries: AuditLogEntry[];
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  delta,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  delta?: string;
}) {
  return (
    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
      <div className="flex items-center justify-between mb-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `${color}15`, border: `1px solid ${color}25` }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        {delta && (
          <span className="text-[10px] text-[#00C9A7] bg-[#00C9A7]/10 px-2 py-0.5 rounded-full">
            {delta}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      <p className="text-xs text-text-muted mt-0.5">{label}</p>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const authChecked = useRef(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    if (authChecked.current) return;
    authChecked.current = true;
    if (typeof window !== "undefined" && !localStorage.getItem("veritas_dashboard_auth")) {
      router.replace("/dashboard/login");
    }
  }, [router]);

  const fetchStats = useCallback(async () => {
    const res = await fetch("/api/dashboard/stats");
    const data = await res.json();
    setStats(data);
    setLastRefresh(new Date());
    if (!selectedId && data.recentSessions?.length > 0) {
      setSelectedId(data.recentSessions[0].id);
    }
  }, [selectedId]);

  const fetchDetail = useCallback(async (id: string) => {
    setLoadingDetail(true);
    try {
      const [sessionRes, auditRes] = await Promise.all([
        fetch(`/api/session/${id}`),
        fetch(`/api/audit/${id}`),
      ]);
      const sessionData = await sessionRes.json();
      const auditData = await auditRes.json();
      setDetail({
        session: sessionData.session,
        customerData: sessionData.customerData,
        verifications: sessionData.verifications || [],
        financialData: sessionData.financialData,
        fraudEvents: sessionData.fraudEvents || [],
        livenessChecks: [],
        llmDecision: sessionData.llmDecision,
        auditEntries: auditData.entries || [],
      });
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const t = setInterval(fetchStats, 10000);
    return () => clearInterval(t);
  }, [fetchStats]);

  useEffect(() => {
    if (selectedId) fetchDetail(selectedId);
  }, [selectedId, fetchDetail]);

  return (
    <div className="min-h-screen bg-bg-primary">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0074D9] to-[#00C9A7] flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-sm font-semibold text-white">VERITAS</span>
            <span className="text-xs text-text-muted ml-2">Agent Dashboard</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00C9A7] animate-pulse" />
            <span className="text-xs text-text-muted">Live</span>
          </div>
          <button
            onClick={fetchStats}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.07] transition-colors text-xs text-text-secondary"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
          <Link
            href="/"
            className="text-xs text-text-muted hover:text-text-secondary transition-colors"
          >
            Customer View
          </Link>
          <button
            onClick={() => {
              localStorage.removeItem("veritas_dashboard_auth");
              router.push("/dashboard/login");
            }}
            className="text-xs text-text-muted hover:text-[#FF4136] transition-colors"
          >
            Sign out
          </button>
        </div>
      </nav>

      <div className="p-6 space-y-6">
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              label="Total Sessions"
              value={stats.totalSessions}
              icon={Users}
              color="#0074D9"
            />
            <StatCard
              label="Active Now"
              value={stats.activeSessions}
              icon={Activity}
              color="#FFB800"
              delta={stats.activeSessions > 0 ? "LIVE" : undefined}
            />
            <StatCard
              label="Completed"
              value={stats.completedSessions}
              icon={CheckCircle2}
              color="#00C9A7"
              delta={`${stats.approvalRate}% rate`}
            />
            <StatCard
              label="Fraud Blocked"
              value={stats.fraudBlocked}
              icon={AlertTriangle}
              color="#FF4136"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1 mb-3">
              <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                Sessions
              </h2>
              <span className="text-[10px] text-text-muted">
                {lastRefresh.toLocaleTimeString()}
              </span>
            </div>
            {!stats ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-16 rounded-xl bg-white/[0.02] border border-white/[0.04] animate-pulse"
                  />
                ))}
              </div>
            ) : stats.recentSessions.length === 0 ? (
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] text-center">
                <p className="text-xs text-text-muted">No sessions yet</p>
                <Link
                  href="/"
                  className="text-xs text-[#0074D9] mt-1 block hover:underline"
                >
                  Start a session
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {stats.recentSessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    selected={selectedId === session.id}
                    onClick={() => setSelectedId(session.id)}
                  />
                ))}
              </div>
            )}
          </div>

          <AnimatePresence mode="wait">
            {loadingDetail ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-64 rounded-2xl bg-white/[0.02] border border-white/[0.04] animate-pulse"
                  />
                ))}
              </motion.div>
            ) : detail ? (
              <motion.div
                key={selectedId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0074D9]/20 to-[#00C9A7]/20 border border-[#0074D9]/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-[#0074D9]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">
                        {detail.customerData?.full_name || "Unknown Applicant"}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1 text-xs text-text-muted">
                          <Phone className="w-3 h-3" />
                          +91 {detail.session.phone}
                        </span>
                        {detail.session.geo_location && (
                          <span className="flex items-center gap-1 text-xs text-text-muted">
                            <MapPin className="w-3 h-3" />
                            {detail.session.geo_location.city}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/session/${detail.session.id}`}
                      target="_blank"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0074D9]/10 border border-[#0074D9]/20 text-xs text-[#0074D9] hover:bg-[#0074D9]/15 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Open Session
                    </Link>
                    <Link
                      href={`/audit/${detail.session.id}`}
                      target="_blank"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-text-secondary hover:bg-white/[0.07] transition-colors"
                    >
                      Audit Trail
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-4">
                    <FraudGauges
                      fraudEvents={detail.fraudEvents}
                      livenessChecks={detail.livenessChecks}
                    />
                    <IndiaStackChecklist verifications={detail.verifications} />
                  </div>

                  <div className="space-y-4">
                    <FinancialSummary financial={detail.financialData} />
                    <LLMReasoningPanel llmDecision={detail.llmDecision} />
                  </div>

                  <div>
                    <EventTimeline entries={detail.auditEntries} />
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center h-64 rounded-2xl bg-white/[0.02] border border-white/[0.04] border-dashed"
              >
                <p className="text-sm text-text-muted">Select a session to inspect</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
