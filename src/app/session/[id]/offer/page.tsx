"use client";

import { useState, useEffect, useCallback, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  CheckCircle2,
  Zap,
  Send,
  ChevronRight,
  Sparkles,
  MessageSquare,
  TrendingDown,
  Clock,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";
import type { LoanOffer } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "agent";
  text: string;
  timestamp: Date;
}

const OFFER_GRADIENTS = [
  "from-[#0074D9]/20 to-[#005FA3]/20",
  "from-[#00C9A7]/20 to-[#009B82]/20",
  "from-[#FFB800]/20 to-[#FF851B]/20",
];

const OFFER_BORDERS = [
  "border-[#0074D9]/30",
  "border-[#00C9A7]/30",
  "border-[#FFB800]/30",
];

const OFFER_COLORS = ["#0074D9", "#00C9A7", "#FFB800"];

const OFFER_TAGS = ["Most Popular", "Best Value", "Premium"];

export default function OfferPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [offers, setOffers] = useState<LoanOffer[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<LoanOffer | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: "agent",
      text: "Hi! I can help you customise your loan offer. You can ask me to adjust the tenure, explain any terms, or compare options.",
      timestamp: new Date(),
    },
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [customerName, setCustomerName] = useState("there");

  const fetchOffers = useCallback(async () => {
    const res = await fetch(`/api/session/${id}`);
    const data = await res.json();
    setOffers(data.offers || []);
    if (data.customerData?.full_name) {
      setCustomerName(data.customerData.full_name.split(" ")[0]);
    }
    if (data.offers?.length > 0 && !selectedOffer) {
      setSelectedOffer(data.offers[0]);
    }
  }, [id, selectedOffer]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  async function handleAccept() {
    if (!selectedOffer || accepting) return;
    setAccepting(true);
    try {
      await fetch(`/api/offer/${selectedOffer.id}/accept`, { method: "PUT" });
      setAccepted(true);
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#0074D9", "#00C9A7", "#FFB800", "#ffffff"],
      });
      setTimeout(() => {
        confetti({
          particleCount: 60,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: ["#0074D9", "#00C9A7"],
        });
        confetti({
          particleCount: 60,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: ["#FFB800", "#00C9A7"],
        });
      }, 300);
    } finally {
      setAccepting(false);
    }
  }

  async function handleChat() {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg: ChatMessage = {
      role: "user",
      text: chatInput.trim(),
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch("/api/offer/negotiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: id,
          offer_id: selectedOffer?.id,
          message: userMsg.text,
        }),
      });
      const data = await res.json();
      if (data.offer) {
        setSelectedOffer(data.offer);
        setOffers((prev) =>
          prev.map((o) => (o.id === data.offer.id ? data.offer : o))
        );
      }
      setChatMessages((prev) => [
        ...prev,
        {
          role: "agent",
          text:
            data.message ||
            "I've updated your offer based on your preference. The new EMI reflects the adjusted terms.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  if (accepted) {
    return (
      <main className="min-h-screen bg-bg-primary flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 20 }}
          className="max-w-md w-full text-center space-y-6"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#00C9A7]/20 to-[#0074D9]/20 border border-[#00C9A7]/30 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-[#00C9A7]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Loan Approved!</h1>
            <p className="text-text-secondary mt-2">
              Congratulations {customerName}. Your application has been sealed.
            </p>
          </div>
          {selectedOffer && (
            <div className="p-5 rounded-2xl bg-white/[0.04] border border-[#00C9A7]/20 text-left space-y-3">
              <p className="text-xs text-text-muted uppercase tracking-wide">
                Approved Terms
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Amount", value: formatCurrency(selectedOffer.eligible_amount) },
                  { label: "Interest Rate", value: `${selectedOffer.interest_rate}% p.a.` },
                  { label: "Tenure", value: `${selectedOffer.tenure_months} months` },
                  { label: "Monthly EMI", value: formatCurrency(selectedOffer.emi) },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[10px] text-text-muted">{label}</p>
                    <p className="text-sm font-semibold text-text-primary">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="rounded-xl bg-[#FFB800]/5 border border-[#FFB800]/15 p-3 flex items-center gap-2.5">
            <Send className="w-4 h-4 text-[#FFB800] shrink-0" />
            <p className="text-xs text-text-secondary">
              Sanction letter dispatched via WhatsApp and email. Check your registered mobile.
            </p>
          </div>
          <div className="space-y-2">
            <Link
              href={`/audit/${id}`}
              className="block w-full py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-text-secondary hover:bg-white/[0.07] transition-colors text-center"
            >
              View Audit Trail
            </Link>
            <Link
              href="/"
              className="block text-xs text-text-muted hover:text-text-secondary transition-colors text-center"
            >
              Return to Home
            </Link>
          </div>
          <p className="text-[10px] text-text-muted">
            Session sealed under PMLA §12 · 10-year WORM retention active
          </p>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg-primary relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#0074D9]/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#00C9A7]/4 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3 pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00C9A7]/10 border border-[#00C9A7]/20 text-xs text-[#00C9A7] mb-4">
            <Sparkles className="w-3 h-3" />
            Personalised offers based on your profile
          </div>
          <h1 className="text-3xl font-bold text-white">
            Congratulations, {customerName}!
          </h1>
          <p className="text-text-secondary mt-2">
            Based on your AI assessment, here are your pre-approved loan options.
          </p>
        </motion.div>

        {offers.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-full border-2 border-[#0074D9]/30 border-t-[#0074D9] animate-spin mx-auto" />
            <p className="text-text-muted mt-4 text-sm">Loading your offers...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {offers.map((offer, i) => {
              const isSelected = selectedOffer?.id === offer.id;
              const color = OFFER_COLORS[i % OFFER_COLORS.length];
              return (
                <motion.button
                  key={offer.id}
                  onClick={() => setSelectedOffer(offer)}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.99 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`relative p-5 rounded-2xl bg-gradient-to-br ${OFFER_GRADIENTS[i % 3]} border ${OFFER_BORDERS[i % 3]} text-left transition-all duration-200 ${
                    isSelected ? `ring-2 ring-offset-2 ring-offset-bg-primary ring-[${color}]` : ""
                  }`}
                >
                  {i === 0 && (
                    <div
                      className="absolute -top-2.5 left-4 px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-white"
                      style={{ background: color }}
                    >
                      {OFFER_TAGS[i]}
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute top-3 right-3">
                      <CheckCircle2 className="w-5 h-5" style={{ color }} />
                    </div>
                  )}

                  <p
                    className="text-xs font-semibold uppercase tracking-wide mb-3"
                    style={{ color }}
                  >
                    {offer.product_name}
                  </p>

                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(offer.eligible_amount)}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">Eligible amount</p>

                  <div className="mt-4 space-y-2">
                    {[
                      { icon: TrendingDown, label: "Interest Rate", value: `${offer.interest_rate}% p.a.` },
                      { icon: Clock, label: "Tenure", value: `${offer.tenure_months} months` },
                      { icon: DollarSign, label: "Monthly EMI", value: formatCurrency(offer.emi) },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Icon className="w-3 h-3 text-text-muted" />
                          <span className="text-[11px] text-text-secondary">{label}</span>
                        </div>
                        <span className="text-[11px] font-semibold text-text-primary">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/[0.06]">
                    <p className="text-[10px] text-text-muted">
                      Processing fee: {formatCurrency(offer.processing_fee)} · one-time
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}

        {selectedOffer && !accepted && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row gap-3 justify-center items-center"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAccept}
              disabled={accepting}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#0074D9] to-[#00C9A7] text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-lg hover:shadow-[#0074D9]/20 transition-all"
            >
              {accepting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Accept {selectedOffer.product_name}
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </motion.button>

            <button
              onClick={() => setChatOpen(true)}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-text-secondary flex items-center justify-center gap-2 hover:bg-white/[0.07] transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Negotiate with AI
            </button>
          </motion.div>
        )}

        <p className="text-center text-[10px] text-text-muted mt-4">
          Offers valid for 30 minutes · Subject to final policy check · RBI MD §9
        </p>
      </div>

      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            className="fixed right-4 bottom-4 w-80 rounded-2xl bg-bg-card border border-white/[0.08] shadow-2xl overflow-hidden z-50"
          >
            <div className="flex items-center justify-between p-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#0074D9] to-[#00C9A7] flex items-center justify-center">
                  <Shield className="w-3 h-3 text-white" />
                </div>
                <span className="text-xs font-medium text-text-primary">
                  VERITAS AI
                </span>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="text-text-muted hover:text-text-secondary text-xs"
              >
                Close
              </button>
            </div>

            <div className="p-3 h-56 overflow-y-auto space-y-2.5">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "bg-[#0074D9]/20 border border-[#0074D9]/30 text-text-primary"
                        : "bg-white/[0.04] border border-white/[0.06] text-text-secondary"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                    <div className="flex items-center gap-1">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-white/[0.06] flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleChat()}
                placeholder="Ask about your offer..."
                className="flex-1 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[#0074D9]/40 transition-colors"
              />
              <button
                onClick={handleChat}
                disabled={!chatInput.trim() || chatLoading}
                className="p-2 rounded-xl bg-[#0074D9]/20 border border-[#0074D9]/30 text-[#0074D9] disabled:opacity-40 hover:bg-[#0074D9]/30 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
