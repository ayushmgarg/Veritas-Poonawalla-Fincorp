"use client";

import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Mic } from "lucide-react";

interface QuestionPromptProps {
  question: string | null;
  hint?: string;
  isListening: boolean;
}

export function QuestionPrompt({ question, hint, isListening }: QuestionPromptProps) {
  return (
    <AnimatePresence>
      {question && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.97 }}
          transition={{ type: "spring", damping: 24, stiffness: 280 }}
          className="absolute bottom-16 left-3 right-3 z-20"
        >
          <div className="rounded-2xl bg-bg-card/95 backdrop-blur-md border border-white/[0.08] p-4 shadow-2xl shadow-black/40">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0074D9] to-[#00C9A7] flex items-center justify-center shrink-0 mt-0.5">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white leading-snug">{question}</p>
                {hint && (
                  <p className="text-[11px] text-text-muted mt-1">{hint}</p>
                )}
              </div>
              {isListening && (
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className="w-7 h-7 rounded-full bg-[#00C9A7]/15 border border-[#00C9A7]/30 flex items-center justify-center shrink-0"
                >
                  <Mic className="w-3.5 h-3.5 text-[#00C9A7]" />
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
