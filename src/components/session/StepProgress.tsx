"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { SESSION_STEPS, TOTAL_XP } from "@/constants/steps";

interface StepProgressProps {
  currentStep: number;
  currentXP: number;
}

export function StepProgress({ currentStep, currentXP }: StepProgressProps) {
  const progress = Math.round((currentXP / TOTAL_XP) * 100);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-muted">Progress</span>
        <span className="font-mono text-[#FFB800] font-medium">{currentXP} XP</span>
      </div>

      <div className="relative h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#0074D9] to-[#00C9A7]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>

      <div className="flex items-center gap-1">
        {SESSION_STEPS.map((step) => {
          const done = step.id < currentStep;
          const active = step.id === currentStep;

          return (
            <div key={step.id} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold transition-all duration-300 ${
                  done
                    ? "bg-[#00C9A7] text-white"
                    : active
                    ? "bg-[#0074D9] text-white ring-2 ring-[#0074D9]/30"
                    : "bg-white/5 text-text-muted"
                }`}
              >
                {done ? <Check className="w-2.5 h-2.5" /> : step.id + 1}
              </div>
              {active && (
                <span className="text-[8px] text-[#0074D9] font-medium leading-none text-center max-w-[36px] truncate">
                  {step.label}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
