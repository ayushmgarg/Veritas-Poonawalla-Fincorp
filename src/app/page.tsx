"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Shield,
  Fingerprint,
  Brain,
  Clock,
  Languages,
  FileCheck,
  ChevronRight,
  Lock,
  Zap,
  Eye,
  LayoutDashboard,
} from "lucide-react";

const FEATURES = [
  {
    icon: Eye,
    title: "Live Video KYC",
    desc: "Complete your loan application via a secure, AI-guided video call in under 8 minutes",
  },
  {
    icon: Shield,
    title: "Fraud Interception",
    desc: "GAN-powered deepfake detection and 3D liveness verification blocks spoofing in real-time",
  },
  {
    icon: Brain,
    title: "AI Credit Intelligence",
    desc: "LLM-powered risk assessment with RBI-compliant explainable decisions",
  },
  {
    icon: Fingerprint,
    title: "India Stack Native",
    desc: "UIDAI, DigiLocker, CKYC, Account Aggregator, CIBIL — unified in one session",
  },
  {
    icon: Languages,
    title: "22 Languages",
    desc: "Speak in any Indian language. Our AI understands and responds naturally",
  },
  {
    icon: FileCheck,
    title: "Zero Paperwork",
    desc: "100% digital document verification. No uploads, no forms, no waiting",
  },
];

const COMPLIANCE_BADGES = [
  "RBI V-CIP 2026",
  "DPDP Act 2023",
  "PMLA Compliant",
  "UIDAI KUA",
  "CERT-In Ready",
];

export default function LandingPage() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleStart() {
    if (phone.length < 10) return;
    setLoading(true);

    try {
      const res = await fetch("/api/session/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const { session } = await res.json();
      router.push(`/session/${session.id}`);
    } catch {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#003B73] via-[#0A0E1A] to-[#0A0E1A]" />
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#0074D9]/8 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#00C9A7]/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3" />

      <div className="relative z-10">
        <nav className="flex items-center justify-between px-6 lg:px-12 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#0074D9] to-[#00C9A7] flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-semibold tracking-tight text-white">
                VERITAS
              </span>
              <span className="hidden sm:inline text-xs text-text-secondary ml-2">
                Poonawalla Fincorp
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-text-secondary hover:bg-white/[0.07] transition-colors"
            >
              <LayoutDashboard className="w-3 h-3" />
              Agent Dashboard
            </Link>
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#00C9A7]" />
              <span className="text-xs text-text-secondary hidden sm:block">
                End-to-end encrypted
              </span>
            </div>
          </div>
        </nav>

        <section className="max-w-6xl mx-auto px-6 lg:px-12 pt-16 pb-12 lg:pt-24 lg:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-text-secondary mb-6">
              <Zap className="w-3 h-3 text-[#FFB800]" />
              AI-Powered V-CIP Platform
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] text-white">
              Get your loan approved
              <br />
              <span className="bg-gradient-to-r from-[#0074D9] to-[#00C9A7] bg-clip-text text-transparent">
                in under 8 minutes
              </span>
            </h1>

            <p className="mt-6 text-lg text-text-secondary max-w-xl leading-relaxed">
              VERITAS conducts your entire loan application via a secure video
              call. AI-verified identity, instant document pull, real-time
              credit assessment — zero paperwork.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-3 max-w-md">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-sm">
                  +91
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  placeholder="Enter mobile number"
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-text-muted focus:outline-none focus:border-[#0074D9]/50 focus:ring-1 focus:ring-[#0074D9]/30 transition-all text-sm"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleStart}
                disabled={phone.length < 10 || loading}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#0074D9] to-[#005FA3] text-white font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-[#0074D9]/20 transition-all"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Start Application
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </div>

            <div className="mt-6 flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#00C9A7]" />
                <span className="text-xs text-text-secondary">
                  ~7 min process
                </span>
              </div>
              <div className="w-px h-3 bg-white/10" />
              <span className="text-xs text-text-secondary">
                No documents needed
              </span>
              <div className="w-px h-3 bg-white/10" />
              <span className="text-xs text-text-secondary">
                Instant decision
              </span>
            </div>
          </motion.div>
        </section>

        <section className="max-w-6xl mx-auto px-6 lg:px-12 py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * i }}
                className="group p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.1] transition-all duration-300"
              >
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#0074D9]/20 to-[#00C9A7]/20 flex items-center justify-center mb-3">
                  <feature.icon className="w-4 h-4 text-[#0074D9]" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1.5">
                  {feature.title}
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 lg:px-12 py-8 pb-16">
          <div className="flex flex-wrap items-center justify-center gap-3">
            {COMPLIANCE_BADGES.map((badge) => (
              <div
                key={badge}
                className="px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-xs text-text-secondary flex items-center gap-1.5"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[#00C9A7]" />
                {badge}
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-text-muted mt-6">
            Poonawalla Fincorp &middot; TenzorX 2026 &middot; Team CodeBaes
          </p>
        </section>
      </div>
    </main>
  );
}
