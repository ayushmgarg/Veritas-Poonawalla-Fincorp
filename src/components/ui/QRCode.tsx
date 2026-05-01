"use client";

import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";
import { Smartphone } from "lucide-react";

interface QRCodeProps {
  url: string;
  label?: string;
}

export function SessionQRCode({ url, label }: QRCodeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)]"
    >
      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
        <Smartphone className="w-3.5 h-3.5" />
        Continue on mobile
      </div>
      <div className="p-3 bg-white rounded-xl">
        <QRCodeSVG
          value={url}
          size={120}
          bgColor="#ffffff"
          fgColor="#0A0E1A"
          level="M"
        />
      </div>
      {label && (
        <p className="text-[10px] text-[var(--text-muted)] text-center max-w-[140px]">{label}</p>
      )}
    </motion.div>
  );
}
