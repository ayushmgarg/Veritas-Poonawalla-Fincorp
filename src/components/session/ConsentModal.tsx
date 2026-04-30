"use client";

import { motion } from "framer-motion";
import { Shield, FileText, Mic } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

interface ConsentModalProps {
  open: boolean;
  onAccept: () => void;
  isLoading: boolean;
}

const CONSENT_POINTS = [
  "This video session will be recorded for RBI V-CIP compliance",
  "Your biometric data will be used solely for identity verification",
  "Financial data pulled via Account Aggregator will not be stored permanently",
  "All data is processed under DPDP Act 2023 §8 — data minimisation applies",
  "You can request deletion of your data at any time",
];

export function ConsentModal({ open, onAccept, isLoading }: ConsentModalProps) {
  return (
    <Modal open={open} title="" closeable={false} size="md">
      <div className="space-y-5">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0074D9]/20 to-[#00C9A7]/20 border border-[#0074D9]/20 flex items-center justify-center">
            <Shield className="w-6 h-6 text-[#0074D9]" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-text-primary">
              Verbal KYC Consent
            </h2>
            <p className="text-xs text-text-secondary mt-1">
              RBI V-CIP §5.1 requires your explicit consent before proceeding
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 space-y-2.5">
          {CONSENT_POINTS.map((point, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <FileText className="w-3 h-3 text-text-muted mt-0.5 shrink-0" />
              <p className="text-xs text-text-secondary leading-relaxed">{point}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-[#0074D9]/5 border border-[#0074D9]/15 p-3 flex items-center gap-2.5">
          <Mic className="w-4 h-4 text-[#0074D9] shrink-0" />
          <p className="text-xs text-text-secondary">
            By clicking <strong className="text-text-primary">I Consent</strong>, your verbal agreement is captured and hashed per SHA-256 for the audit trail.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onAccept}
          disabled={isLoading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0074D9] to-[#005FA3] text-white font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#0074D9]/20 transition-all"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            "I Consent — Proceed with Video KYC"
          )}
        </motion.button>

        <p className="text-[10px] text-center text-text-muted">
          Encrypted session under AES-256-GCM · RBI V-CIP compliant
        </p>
      </div>
    </Modal>
  );
}
