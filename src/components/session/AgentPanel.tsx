"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Shield, Loader2 } from "lucide-react";
import { SESSION_STEPS } from "@/constants/steps";

interface AgentPanelProps {
  currentStep: number;
  agentMessage: string;
  isProcessing: boolean;
  isTyping: boolean;
}

export function AgentPanel({
  currentStep,
  agentMessage,
  isProcessing,
  isTyping,
}: AgentPanelProps) {
  const step = SESSION_STEPS[currentStep];

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0074D9] to-[#00C9A7] flex items-center justify-center shadow-lg shadow-[#0074D9]/20">
          <Shield className="w-7 h-7 text-white" />
        </div>
        {isProcessing && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-1 rounded-2xl border-2 border-[#0074D9]/40 border-t-[#0074D9]"
          />
        )}
        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#00C9A7] border-2 border-bg-card flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-white" />
        </div>
      </div>

      <div className="text-center">
        <p className="text-xs font-bold text-white tracking-widest">VERITAS</p>
        <p className="text-[10px] text-text-muted mt-0.5">
          {step?.label || "AI Agent"}
        </p>
      </div>

      <div className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] p-3.5 min-h-[80px] flex items-start">
        <AnimatePresence mode="wait">
          {isTyping ? (
            <motion.div
              key="typing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1 pt-1"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-[#0074D9]"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </motion.div>
          ) : (
            <motion.p
              key={agentMessage}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3 }}
              className="text-xs text-text-secondary leading-relaxed"
            >
              {agentMessage}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {isProcessing && (
        <div className="flex items-center gap-1.5">
          <Loader2 className="w-3 h-3 text-[#0074D9] animate-spin" />
          <span className="text-[10px] text-text-muted">Verifying...</span>
        </div>
      )}
    </div>
  );
}
