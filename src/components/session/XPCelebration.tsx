"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Star } from "lucide-react";

interface XPCelebrationProps {
  show: boolean;
  xp: number;
  label: string;
  onDone: () => void;
}

export function XPCelebration({ show, xp, label, onDone }: XPCelebrationProps) {
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [show, onDone]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8, y: -30 }}
          transition={{ type: "spring", damping: 18, stiffness: 280 }}
          className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
        >
          <div className="flex flex-col items-center gap-3">
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FFB800] to-[#FF8C00] flex items-center justify-center shadow-2xl shadow-[#FFB800]/40"
            >
              <Star className="w-8 h-8 text-white fill-white" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-center"
            >
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Zap className="w-5 h-5 text-[#FFB800]" />
                <span className="text-3xl font-black text-[#FFB800]">+{xp} XP</span>
              </div>
              <p className="text-sm font-semibold text-white drop-shadow">{label}</p>
            </motion.div>

            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                animate={{
                  opacity: 0,
                  x: (i % 2 === 0 ? 1 : -1) * (40 + i * 15),
                  y: -(30 + i * 20),
                  scale: 0,
                }}
                transition={{ duration: 0.8, delay: 0.1 + i * 0.05 }}
                className="absolute w-2 h-2 rounded-full"
                style={{ background: i % 2 === 0 ? "#FFB800" : "#00C9A7" }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
