"use client";

import { CheckCircle2, XCircle, Clock, Fingerprint, FolderOpen, Building2, CreditCard, Database } from "lucide-react";
import type { Verification, VerificationProvider } from "@/types";

const PROVIDERS: {
  key: VerificationProvider;
  label: string;
  icon: React.ElementType;
  govRef: string;
}[] = [
  { key: "uidai", label: "UIDAI Face Auth", icon: Fingerprint, govRef: "UIDAI §4" },
  { key: "digilocker", label: "DigiLocker", icon: FolderOpen, govRef: "MeitY §6" },
  { key: "cersai_ckyc", label: "CERSAI CKYC", icon: Building2, govRef: "CERSAI Act" },
  { key: "cibil", label: "CIBIL Bureau", icon: CreditCard, govRef: "CIC Act §17" },
  { key: "account_aggregator", label: "Account Aggregator", icon: Database, govRef: "RBI AA §5" },
];

interface IndiaStackChecklistProps {
  verifications: Verification[];
}

export function IndiaStackChecklist({ verifications }: IndiaStackChecklistProps) {
  function getStatus(provider: VerificationProvider) {
    return verifications.find((v) => v.provider === provider);
  }

  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4">
      <div className="flex items-center gap-2 mb-4">
        <Database className="w-4 h-4 text-[#0074D9]" />
        <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wide">
          India Stack Verification
        </h3>
      </div>
      <div className="space-y-2.5">
        {PROVIDERS.map(({ key, label, icon: Icon, govRef }) => {
          const v = getStatus(key);
          const status = v?.status;
          return (
            <div
              key={key}
              className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]"
            >
              <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5 text-text-muted" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-text-primary truncate">{label}</p>
                <p className="text-[10px] text-text-muted">{govRef}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {status === "success" && (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#00C9A7]" />
                    {v?.match_score !== null && v?.match_score !== undefined && (
                      <span className="text-[10px] text-[#00C9A7]">
                        {v.match_score}%
                      </span>
                    )}
                  </>
                )}
                {status === "failed" && (
                  <XCircle className="w-4 h-4 text-[#FF4136]" />
                )}
                {(!status || status === "pending") && (
                  <Clock className="w-4 h-4 text-text-muted" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
