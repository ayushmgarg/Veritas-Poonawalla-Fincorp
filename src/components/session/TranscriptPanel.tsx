"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Bot } from "lucide-react";

interface TranscriptEntry {
  speaker: "customer" | "agent";
  text: string;
  timestamp: number;
}

interface TranscriptPanelProps {
  entries: TranscriptEntry[];
  interimText?: string;
}

export function TranscriptPanel({ entries, interimText }: TranscriptPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries.length, interimText]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1.5 pb-2 border-b border-white/5">
        <div className="w-1.5 h-1.5 rounded-full bg-[#0074D9] animate-pulse" />
        <span className="text-[10px] text-text-muted uppercase tracking-wider font-medium">
          Live Transcript
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pt-2 space-y-2 min-h-0">
        <AnimatePresence initial={false}>
          {entries.map((entry, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-start gap-2"
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  entry.speaker === "agent"
                    ? "bg-[#0074D9]/20"
                    : "bg-[#00C9A7]/20"
                }`}
              >
                {entry.speaker === "agent" ? (
                  <Bot className="w-2.5 h-2.5 text-[#0074D9]" />
                ) : (
                  <Mic className="w-2.5 h-2.5 text-[#00C9A7]" />
                )}
              </div>
              <div>
                <span
                  className={`text-[10px] font-medium ${
                    entry.speaker === "agent" ? "text-[#0074D9]" : "text-[#00C9A7]"
                  }`}
                >
                  {entry.speaker === "agent" ? "VERITAS" : "You"}
                </span>
                <p className="text-xs text-text-secondary leading-relaxed mt-0.5">
                  {entry.text}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {interimText && (
          <div className="flex items-start gap-2 opacity-60">
            <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-[#00C9A7]/20">
              <Mic className="w-2.5 h-2.5 text-[#00C9A7]" />
            </div>
            <div>
              <span className="text-[10px] font-medium text-[#00C9A7]">You</span>
              <p className="text-xs text-text-muted leading-relaxed mt-0.5 italic">
                {interimText}
              </p>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
