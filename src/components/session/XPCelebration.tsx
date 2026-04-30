"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";

interface XPCelebrationProps {
  show: boolean;
  xp: number;
  label: string;
  onDone: () => void;
}

export function XPCelebration({ show, xp, label, onDone }: XPCelebrationProps) {
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [show, onDone]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#FFB800]/10 border border-[#FFB800]/30 backdrop-blur-md shadow-lg shadow-black/30"
        >
          <Zap className="w-4 h-4 text-[#FFB800]" />
          <span className="text-sm font-bold text-[#FFB800]">+{xp} XP</span>
          <span className="text-xs text-text-secondary">{label}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
