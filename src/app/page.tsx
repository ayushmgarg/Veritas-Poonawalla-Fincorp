"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Shield,
  ChevronRight,
  Lock,
  LayoutDashboard,
  ScanFace,
  FileText,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { SessionQRCode } from "@/components/ui/QRCode";
import { GoogleSignIn } from "@/components/ui/GoogleSignIn";

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
    desc: "PAN, driving license, and bank statements fetched directly from DigiLocker and Account Aggregator.",
  },
  {
    icon: TrendingUp,
    step: "03",
    title: "AI Credit Decision",
    desc: "LLM risk engine cross-references 40+ signals for an RBI-compliant, explainable credit assessment.",
  },
];

const COMPLIANCE = ["RBI V-CIP 2026", "DPDP Act 2023", "PMLA Compliant", "UIDAI KUA", "CERT-In"];

const EASE = [0.25, 0.1, 0.25, 1] as [number, number, number, number];

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.08 } } },
  item: {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
  },
};

export default function LandingPage() {
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
      const url = `${window.location.origin}/session/${data.session.id}`;
      setSessionUrl(url);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] transition-colors duration-300">
      {/* Nav */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 lg:px-16 h-14 border-b border-[var(--border-subtle)] bg-[var(--glass-bg)] backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#0074D9] to-[#00C9A7] flex items-center justify-center shrink-0">
            <Shield className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">VERITAS</span>
          <span className="hidden sm:block text-xs text-[var(--text-muted)]">by Poonawalla Fincorp</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] transition-all"
          >
            <LayoutDashboard className="w-3 h-3" />
            Dashboard
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 lg:px-16 pt-20 pb-12">
        <motion.div
          variants={stagger.container}
          initial="initial"
          animate="animate"
          className="max-w-2xl"
        >
          <motion.div variants={stagger.item}>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0074D9]/10 border border-[#0074D9]/20 text-[10px] font-semibold text-[#0074D9] mb-8 tracking-wider uppercase">
              <div className="w-1.5 h-1.5 rounded-full bg-[#0074D9] animate-pulse" />
              AI-Powered Video KYC
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
            className="mt-6 text-base sm:text-lg text-[var(--text-secondary)] max-w-lg leading-relaxed"
          >
            A fully agentic V-CIP platform. AI verifies your identity, pulls
            documents from India Stack, assesses credit — all in one live video
            call.
          </motion.p>

          <AnimatePresence mode="wait">
            {!sessionUrl ? (
              <motion.div key="form" variants={stagger.item} className="space-y-3 max-w-sm">
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm select-none pointer-events-none">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) =>
                        setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                      }
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
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>Begin KYC <ChevronRight className="w-3.5 h-3.5" /></>
                    )}
                  </motion.button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-[var(--border-subtle)]" />
                  <span className="text-[11px] text-[var(--text-muted)]">or</span>
                  <div className="flex-1 h-px bg-[var(--border-subtle)]" />
                </div>

                <GoogleSignIn redirectTo={`${typeof window !== "undefined" ? window.location.origin : ""}/`} />

                {error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-[#FF4136]"
                  >
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

          <motion.div
            variants={stagger.item}
            className="mt-5 flex items-center gap-1.5 text-xs text-[var(--text-muted)]"
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
          transition={{ duration: 0.45, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className="grid grid-cols-2 lg:grid-cols-4 overflow-hidden rounded-2xl border border-[var(--border-subtle)]"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
        >
          {STATS.map((stat, i) => (
            <div
              key={i}
              className={`bg-[var(--bg-card)] px-6 py-5 ${
                i < STATS.length - 1 ? "border-r border-[var(--border-subtle)]" : ""
              } ${i < 2 ? "border-b lg:border-b-0 border-[var(--border-subtle)]" : ""}`}
            >
              <p className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
                {stat.value}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-6 lg:px-16 pb-20">
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
              transition={{ duration: 0.4, delay: 0.42 + i * 0.07, ease: [0.25, 0.1, 0.25, 1] }}
              className="group p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] hover:shadow-sm transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-9 h-9 rounded-xl bg-[#0074D9]/10 flex items-center justify-center group-hover:bg-[#0074D9]/15 transition-colors">
                  <step.icon className="w-4 h-4 text-[#0074D9]" />
                </div>
                <span className="text-xs font-mono text-[var(--text-muted)]">{step.step}</span>
              </div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1.5">
                {step.title}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-6 lg:px-16 pb-8">
        <div className="border-t border-[var(--border-subtle)] pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {COMPLIANCE.map((badge) => (
              <span
                key={badge}
                className="px-2.5 py-1 rounded-full border border-[var(--border-subtle)] text-[10px] text-[var(--text-muted)] tracking-wide"
              >
                {badge}
              </span>
            ))}
          </div>
          <p className="text-[11px] text-[var(--text-muted)] whitespace-nowrap">
            © 2026 Poonawalla Fincorp
          </p>
        </div>
      </footer>
    </main>
  );
}
