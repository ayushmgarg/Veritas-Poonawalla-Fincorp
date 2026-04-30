"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Shield, RefreshCcw } from "lucide-react";

interface FraudAlertOverlayProps {
  ganScore: number;
  onReVerify: () => void;
  isReVerifying: boolean;
}

export function FraudAlertOverlay({ ganScore, onReVerify, isReVerifying }: FraudAlertOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm rounded-2xl"
    >
      <motion.div
        initial={{ scale: 0.8, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 20 }}
        className="flex flex-col items-center gap-4 text-center px-6"
      >
        <div className="w-16 h-16 rounded-2xl bg-[#FF4136]/10 border border-[#FF4136]/20 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-[#FF4136]" />
        </div>

        <div>
          <p className="text-sm font-bold text-[#FF4136] uppercase tracking-wider">
            Spoof Detected
          </p>
          <p className="text-xs text-text-secondary mt-1">
            Static image detected. GAN score: {ganScore}%
          </p>
        </div>

        <div className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] p-3 text-left space-y-1">
          <p className="text-[10px] text-text-muted">
            Temporal analysis: 0 micro-movements in 60 frames
          </p>
          <p className="text-[10px] text-text-muted">
            Depth analysis: Flat surface — no facial geometry
          </p>
          <p className="text-[10px] text-text-muted">
            Session flagged under PMLA §12
          </p>
        </div>

        <button
          onClick={onReVerify}
          disabled={isReVerifying}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0074D9] text-white text-sm font-medium disabled:opacity-50 hover:bg-[#005FA3] transition-colors"
        >
          {isReVerifying ? (
            <RefreshCcw className="w-4 h-4 animate-spin" />
          ) : (
            <Shield className="w-4 h-4" />
          )}
          {isReVerifying ? "Verifying..." : "Re-verify Identity"}
        </button>

        <p className="text-[10px] text-text-muted">
          Look directly at the camera and blink twice
        </p>
      </motion.div>
    </motion.div>
  );
}
