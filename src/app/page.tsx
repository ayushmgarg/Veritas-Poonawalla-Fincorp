"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Shield,
  ChevronRight,
  Lock,
  ScanFace,
  FileText,
  TrendingUp,
  ArrowRight,
  LayoutDashboard,
  UserCheck,
  Zap,
  Activity,
  Building2,
  Users,
  CheckCircle2,
  Star,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { SessionQRCode } from "@/components/ui/QRCode";
import { GoogleSignIn } from "@/components/ui/GoogleSignIn";

const EASE = [0.25, 0.1, 0.25, 1] as [number, number, number, number];

const STATS = [
  { value: "< 8 min", label: "End-to-end onboarding" },
  { value: "1.3B+", label: "Aadhaar profiles" },
  { value: "250M+", label: "DigiLocker documents" },
  { value: "Zero", label: "Physical paperwork" },
];

const STEPS = [
  {
    icon: ScanFace,
    step: "01",
    title: "Live Video Identity",
    desc: "Face matched against Aadhaar biometrics with real-time liveness detection. No document scanning.",
  },
  {
    icon: FileText,
    step: "02",
    title: "Instant Document Pull",
    desc: "PAN, driving licence, and bank statements fetched directly from DigiLocker and Account Aggregator.",
  },
  {
    icon: TrendingUp,
    step: "03",
    title: "AI Credit Decision",
    desc: "LLM risk engine cross-references 40+ signals for an RBI-compliant, explainable credit assessment.",
  },
];

const COMPLIANCE = ["RBI V-CIP 2026", "DPDP Act 2023", "PMLA Compliant", "UIDAI KUA", "CERT-In"];

const AGENT_FEATURES = [
  { icon: Activity, label: "Live Risk Meter", desc: "Real-time 0–100 session risk score" },
  { icon: Users, label: "Trust Graph", desc: "Cross-session fraud ring detection" },
  { icon: Shield, label: "Intent Drift", desc: "AI contradiction detection across transcripts" },
  { icon: Zap, label: "Audit Trail", desc: "SHA-256 hash chain, PMLA compliant" },
];

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.07 } } },
  item: {
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.42, ease: EASE } },
  },
};

type View = "home" | "customer" | "agent-info";

export default function HomePage() {
  const [view, setView] = useState<View>("home");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionUrl, setSessionUrl] = useState<string | null>(null);
  const router = useRouter();

  async function handleStart() {
    if (phone.length < 10) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/session/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (res.status === 409) {
        router.push(`/session/${data.session_id}`);
        return;
      }
      setSessionUrl(`${window.location.origin}/session/${data.session.id}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] transition-colors duration-300 overflow-x-hidden">
      {/* Nav */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 lg:px-16 h-14 border-b border-[var(--border-subtle)] bg-[var(--glass-bg)] backdrop-blur-md">
        <button onClick={() => { setView("home"); setSessionUrl(null); setPhone(""); }} className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#0074D9] to-[#00C9A7] flex items-center justify-center shrink-0">
            <Shield className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">VERITAS</span>
          <span className="hidden sm:block text-xs text-[var(--text-muted)]">by Poonawalla Fincorp</span>
        </button>
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] transition-all"
          >
            <LayoutDashboard className="w-3 h-3" />
            Agent Portal
          </Link>
        </div>
      </nav>

      <AnimatePresence mode="wait">
        {/* ── HOME VIEW ── */}
        {view === "home" && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            {/* Hero */}
            <section className="max-w-6xl mx-auto px-6 lg:px-16 pt-20 pb-10">
              <motion.div variants={stagger.container} initial="initial" animate="animate" className="text-center">
                <motion.div variants={stagger.item}>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0074D9]/10 border border-[#0074D9]/20 text-[10px] font-semibold text-[#0074D9] mb-8 tracking-wider uppercase">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#0074D9] animate-pulse" />
                    AI-Powered Video KYC · RBI V-CIP 2026
                  </div>
                </motion.div>

                <motion.h1
                  variants={stagger.item}
                  className="text-5xl sm:text-6xl lg:text-[4.5rem] font-bold tracking-[-0.03em] leading-[1.05] text-[var(--text-primary)]"
                >
                  Loan approved.
                  <br />
                  <span className="bg-gradient-to-r from-[#0074D9] to-[#00C9A7] bg-clip-text text-transparent">
                    In under 8 minutes.
                  </span>
                </motion.h1>

                <motion.p
                  variants={stagger.item}
                  className="mt-6 text-base sm:text-lg text-[var(--text-secondary)] max-w-xl mx-auto leading-relaxed"
                >
                  Fully agentic V-CIP platform. AI verifies your identity, pulls documents from
                  India Stack, assesses credit — all in one live video call.
                </motion.p>

                {/* Dual CTA */}
                <motion.div variants={stagger.item} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <motion.button
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setView("customer")}
                    className="group flex items-center gap-3 px-7 py-4 rounded-2xl bg-gradient-to-r from-[#0074D9] to-[#0066CC] text-white font-semibold text-sm shadow-lg shadow-[#0074D9]/25 hover:shadow-[#0074D9]/40 transition-all"
                  >
                    <UserCheck className="w-4 h-4" />
                    Apply for a Loan
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </motion.button>

                  <Link href="/dashboard">
                    <motion.div
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      className="group flex items-center gap-3 px-7 py-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] text-[var(--text-primary)] font-semibold text-sm hover:border-[var(--border-default)] hover:bg-[var(--bg-elevated)] transition-all"
                    >
                      <LayoutDashboard className="w-4 h-4 text-[var(--text-muted)]" />
                      Agent Dashboard
                      <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:translate-x-0.5 transition-transform" />
                    </motion.div>
                  </Link>
                </motion.div>

                <motion.div
                  variants={stagger.item}
                  className="mt-5 flex items-center justify-center gap-1.5 text-xs text-[var(--text-muted)]"
                >
                  <Lock className="w-3 h-3 shrink-0" />
                  AES-256-GCM encrypted · RBI V-CIP certified · No documents required
                </motion.div>
              </motion.div>
            </section>

            {/* Stats */}
            <section className="max-w-5xl mx-auto px-6 lg:px-16 pb-14">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.3, ease: EASE }}
                className="grid grid-cols-2 lg:grid-cols-4 overflow-hidden rounded-2xl border border-[var(--border-subtle)]"
                style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
              >
                {STATS.map((stat, i) => (
                  <div
                    key={i}
                    className={`bg-[var(--bg-card)] px-6 py-5 ${i < STATS.length - 1 ? "border-r border-[var(--border-subtle)]" : ""} ${i < 2 ? "border-b lg:border-b-0 border-[var(--border-subtle)]" : ""}`}
                  >
                    <p className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">{stat.value}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </motion.div>
            </section>

            {/* How it works */}
            <section className="max-w-5xl mx-auto px-6 lg:px-16 pb-16">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-5"
              >
                How it works
              </motion.p>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-3"
              >
                {STEPS.map((step, i) => (
                  <motion.div
                    key={step.step}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.42 + i * 0.07, ease: EASE }}
                    className="group p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] hover:shadow-sm transition-all duration-200"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-9 h-9 rounded-xl bg-[#0074D9]/10 flex items-center justify-center group-hover:bg-[#0074D9]/15 transition-colors">
                        <step.icon className="w-4 h-4 text-[#0074D9]" />
                      </div>
                      <span className="text-xs font-mono text-[var(--text-muted)]">{step.step}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1.5">{step.title}</h3>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{step.desc}</p>
                  </motion.div>
                ))}
              </motion.div>
            </section>

            {/* Agent features strip */}
            <section className="max-w-5xl mx-auto px-6 lg:px-16 pb-20">
              <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-1">For Agents</p>
                    <h2 className="text-base font-bold text-[var(--text-primary)]">Real-time fraud intelligence dashboard</h2>
                  </div>
                  <Link href="/dashboard">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-all"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      Open Dashboard
                    </motion.div>
                  </Link>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {AGENT_FEATURES.map((f, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + i * 0.06, ease: EASE }}
                      className="flex flex-col gap-2 p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]"
                    >
                      <f.icon className="w-4 h-4 text-[#0074D9]" />
                      <p className="text-xs font-semibold text-[var(--text-primary)]">{f.label}</p>
                      <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">{f.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
          </motion.div>
        )}

        {/* ── CUSTOMER VIEW ── */}
        {view === "customer" && (
          <motion.div
            key="customer"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="max-w-5xl mx-auto px-6 lg:px-16 pt-16 pb-20"
          >
            <div className="max-w-xl">
              {/* Back */}
              <button
                onClick={() => { setView("home"); setSessionUrl(null); setPhone(""); setError(null); }}
                className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-8 transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                Back
              </button>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-2 mb-6">
                {[
                  { icon: Star, label: "RBI Certified" },
                  { icon: Lock, label: "AES-256 Encrypted" },
                  { icon: CheckCircle2, label: "DPDP Compliant" },
                  { icon: Building2, label: "Poonawalla Fincorp" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[10px] text-[var(--text-muted)]">
                    <Icon className="w-3 h-3" />
                    {label}
                  </div>
                ))}
              </div>

              <h1 className="text-4xl sm:text-5xl font-bold tracking-[-0.03em] leading-[1.08] text-[var(--text-primary)] mb-4">
                Start your
                <br />
                <span className="bg-gradient-to-r from-[#0074D9] to-[#00C9A7] bg-clip-text text-transparent">
                  loan application.
                </span>
              </h1>
              <p className="text-sm text-[var(--text-secondary)] mb-8 leading-relaxed">
                Enter your mobile number to begin. Your Aadhaar-linked identity will be verified via a short AI video call — no documents to upload.
              </p>

              <AnimatePresence mode="wait">
                {!sessionUrl ? (
                  <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3 max-w-sm">
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm select-none pointer-events-none">+91</span>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                          onKeyDown={(e) => e.key === "Enter" && handleStart()}
                          placeholder="Mobile number"
                          className="w-full pl-11 pr-4 py-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#0074D9]/60 focus:ring-2 focus:ring-[#0074D9]/15 transition-all text-sm"
                        />
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleStart}
                        disabled={phone.length < 10 || loading}
                        className="px-5 py-3 rounded-xl bg-[#0074D9] hover:bg-[#0066CC] text-white font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-lg shadow-[#0074D9]/20 shrink-0"
                      >
                        {loading
                          ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          : <><span>Begin KYC</span><ChevronRight className="w-3.5 h-3.5" /></>
                        }
                      </motion.button>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-[var(--border-subtle)]" />
                      <span className="text-[11px] text-[var(--text-muted)]">or</span>
                      <div className="flex-1 h-px bg-[var(--border-subtle)]" />
                    </div>

                    <GoogleSignIn redirectTo={typeof window !== "undefined" ? `${window.location.origin}/` : "/"} />

                    {error && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-[#FF4136]">
                        {error}
                      </motion.p>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="qr"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col sm:flex-row items-start gap-5 max-w-sm"
                  >
                    <SessionQRCode url={sessionUrl} label="Scan to continue on your phone" />
                    <div className="flex flex-col gap-3 pt-1">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">Session ready</p>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                        Scan the QR with your phone camera, or continue on this device.
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => router.push(sessionUrl)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0074D9] text-white text-sm font-medium shadow-lg shadow-[#0074D9]/20"
                      >
                        Continue here <ArrowRight className="w-3.5 h-3.5" />
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* What to expect */}
              <div className="mt-10 pt-8 border-t border-[var(--border-subtle)]">
                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-4">What to expect</p>
                <div className="space-y-3">
                  {[
                    { icon: ScanFace, text: "Allow camera + microphone access" },
                    { icon: FileText, text: "Aadhaar & PAN verified automatically — nothing to upload" },
                    { icon: TrendingUp, text: "Personalised loan offer generated in real-time" },
                  ].map(({ icon: Icon, text }, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-lg bg-[#0074D9]/10 flex items-center justify-center shrink-0">
                        <Icon className="w-3 h-3 text-[#0074D9]" />
                      </div>
                      <p className="text-xs text-[var(--text-secondary)]">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      {view === "home" && (
        <footer className="max-w-5xl mx-auto px-6 lg:px-16 pb-8">
          <div className="border-t border-[var(--border-subtle)] pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {COMPLIANCE.map((badge) => (
                <span key={badge} className="px-2.5 py-1 rounded-full border border-[var(--border-subtle)] text-[10px] text-[var(--text-muted)] tracking-wide">
                  {badge}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-[var(--text-muted)] whitespace-nowrap">
              &copy; 2026 Poonawalla Fincorp
            </p>
          </div>
        </footer>
      )}
    </main>
  );
}
