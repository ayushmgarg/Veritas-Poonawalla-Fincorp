"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, Eye, EyeOff } from "lucide-react";

const DASHBOARD_PIN = "VERITAS";

export default function DashboardLogin() {
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(false);

    setTimeout(() => {
      if (pin === DASHBOARD_PIN) {
        localStorage.setItem("veritas_dashboard_auth", "1");
        router.push("/dashboard");
      } else {
        setError(true);
        setPin("");
        setLoading(false);
      }
    }, 400);
  }

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0074D9] to-[#00C9A7] flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-white">Agent Dashboard</h1>
          <p className="text-sm text-text-secondary mt-1">Enter access PIN to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showPin ? "text" : "password"}
              value={pin}
              onChange={(e) => { setPin(e.target.value.toUpperCase()); setError(false); }}
              placeholder="Access PIN"
              autoFocus
              className={`w-full px-4 py-3.5 rounded-xl bg-white/5 border text-white placeholder:text-text-muted focus:outline-none focus:ring-1 transition-all text-sm tracking-widest font-mono ${
                error
                  ? "border-[#FF4136]/50 focus:border-[#FF4136]/60 focus:ring-[#FF4136]/20"
                  : "border-white/10 focus:border-[#0074D9]/50 focus:ring-[#0074D9]/20"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
            >
              {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-[#FF4136] text-center"
            >
              Incorrect PIN. Please try again.
            </motion.p>
          )}

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={pin.length < 1 || loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#0074D9] to-[#005FA3] text-white font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-[#0074D9]/20"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
            ) : (
              "Access Dashboard"
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
