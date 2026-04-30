"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FolderOpen, FileCheck, Loader2, CheckCircle2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

interface DigiLockerModalProps {
  open: boolean;
  onAuthorize: () => Promise<void>;
}

const DOCS = [
  { icon: FileCheck, label: "PAN Card", desc: "ABCPS1234A · Active" },
  { icon: FileCheck, label: "Driving License", desc: "KA-01 20202200001234 · Valid till 2032" },
];

export function DigiLockerModal({ open, onAuthorize }: DigiLockerModalProps) {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  async function handleAuthorize() {
    setState("loading");
    await onAuthorize();
    setState("done");
  }

  return (
    <Modal open={open} title="" closeable={false} size="md">
      <div className="space-y-5">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FFB800]/20 to-[#FF851B]/20 border border-[#FFB800]/20 flex items-center justify-center">
            <FolderOpen className="w-6 h-6 text-[#FFB800]" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-text-primary">
              DigiLocker Authorization
            </h2>
            <p className="text-xs text-text-secondary mt-1">
              MeitY DigiLocker §4 — OAuth 2.0 document pull
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] divide-y divide-white/5">
          {DOCS.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-center gap-3 p-3.5">
              {state === "done" ? (
                <CheckCircle2 className="w-4 h-4 text-[#00C9A7] shrink-0" />
              ) : (
                <Icon className="w-4 h-4 text-text-muted shrink-0" />
              )}
              <div>
                <p className="text-xs font-medium text-text-primary">{label}</p>
                <p className="text-[10px] text-text-muted">{desc}</p>
              </div>
              {state === "done" && (
                <span className="ml-auto text-[10px] text-[#00C9A7] font-medium">Verified</span>
              )}
            </div>
          ))}
        </div>

        {state !== "done" ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAuthorize}
            disabled={state === "loading"}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FFB800] to-[#FF851B] text-white font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {state === "loading" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Pulling documents...
              </>
            ) : (
              "Authorize DigiLocker Access"
            )}
          </motion.button>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#00C9A7]/10 border border-[#00C9A7]/20"
          >
            <CheckCircle2 className="w-4 h-4 text-[#00C9A7]" />
            <span className="text-sm font-medium text-[#00C9A7]">
              Documents verified. Auto-filling application...
            </span>
          </motion.div>
        )}
      </div>
    </Modal>
  );
}
