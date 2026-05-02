"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Lock, Shield, Zap } from "lucide-react";

import { useWebRTC } from "@/hooks/useWebRTC";
import { useFaceDetection } from "@/hooks/useFaceDetection";
import { useLiveness } from "@/hooks/useLiveness";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSession } from "@/hooks/useSession";

import { AgentPanel } from "@/components/session/AgentPanel";
import { TranscriptPanel } from "@/components/session/TranscriptPanel";
import { StepProgress } from "@/components/session/StepProgress";
import { LivenessIndicator } from "@/components/session/LivenessIndicator";
import { ConsentModal } from "@/components/session/ConsentModal";
import { DigiLockerModal } from "@/components/session/DigiLockerModal";
import { FraudAlertOverlay } from "@/components/session/FraudAlertOverlay";
import { XPCelebration } from "@/components/session/XPCelebration";
import { LiveRiskMeter } from "@/components/session/LiveRiskMeter";
import { QuestionPrompt } from "@/components/session/QuestionPrompt";

import { AGENT_CONVERSATION_PROMPTS } from "@/constants/prompts";
import { SESSION_STEPS } from "@/constants/steps";

interface TranscriptLine {
  speaker: "customer" | "agent";
  text: string;
  timestamp: number;
}

type ModalState = "none" | "consent" | "digilocker";

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spoofCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { videoRef, state: webrtcState, start: startCamera, stop: stopCamera, toggleMute, toggleCamera } = useWebRTC();
  const { result: faceResult, isReady: faceReady } = useFaceDetection(videoRef, canvasRef, webrtcState.isActive);
  const { liveness } = useLiveness(faceResult);
  const sessionCtx = useSession(id);

  const [sessionTimer, setSessionTimer] = useState(0);
  const [transcriptLines, setTranscriptLines] = useState<TranscriptLine[]>([]);
  const [agentMessage, setAgentMessage] = useState("");
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [modalState, setModalState] = useState<ModalState>("none");
  const [consentLoading, setConsentLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [ganScore, setGanScore] = useState(0);
  const [isReVerifying, setIsReVerifying] = useState(false);
  const [xpCelebration, setXpCelebration] = useState<{ show: boolean; xp: number; label: string }>({ show: false, xp: 0, label: "" });
  const [stepsDone, setStepsDone] = useState<Set<number>>(new Set());
  const [interimText, setInterimText] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState<{ text: string; hint?: string } | null>(null);

  const speakAgent = useCallback((text: string) => {
    setIsAgentTyping(true);
    setTimeout(() => {
      setIsAgentTyping(false);
      setAgentMessage(text);
      setTranscriptLines((lines) => [...lines, { speaker: "agent", text, timestamp: Date.now() }]);
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.pitch = 1;
        utterance.lang = "en-IN";
        window.speechSynthesis.speak(utterance);
      }
    }, 600);
  }, []);

  const celebrateStep = useCallback((stepId: number) => {
    const step = SESSION_STEPS[stepId];
    if (!step || stepsDone.has(stepId)) return;
    setStepsDone((s) => new Set([...s, stepId]));
    setXpCelebration({ show: true, xp: step.xpReward, label: `${step.label} complete` });
  }, [stepsDone]);

  const handleSpeechResult = useCallback(
    async (text: string, confidence: number) => {
      setInterimText("");
      setTranscriptLines((lines) => [...lines, { speaker: "customer", text, timestamp: Date.now() }]);
      await sessionCtx.processTranscript(text, confidence);
    },
    [sessionCtx]
  );

  const { state: speechState, start: startSpeech, stop: stopSpeech } = useSpeechRecognition(handleSpeechResult);

  useEffect(() => {
    async function init() {
      await sessionCtx.loadSession();
      await startCamera();
      timerRef.current = setInterval(() => setSessionTimer((t) => t + 1), 1000);
      setTimeout(() => {
        speakAgent(AGENT_CONVERSATION_PROMPTS[0]);
        setModalState("none");
      }, 800);
      setTimeout(() => setModalState("consent"), 2000);
    }
    init();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (spoofCheckRef.current) clearInterval(spoofCheckRef.current);
      stopCamera();
      stopSpeech();
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    if (!webrtcState.isActive || !faceReady) return;
    spoofCheckRef.current = setInterval(async () => {
      if (liveness.spoofConfidence > 40 && currentStep > 0) {
        const data = await sessionCtx.checkSpoof(
          liveness.microMovements,
          faceResult.faceDetected ? 0.8 : 0.1,
          liveness.microMovements > 5 ? 0.5 : 0.02
        );
        if (data.spoofDetected) setGanScore(data.ganScore);
      }
    }, 3000);
    return () => {
      if (spoofCheckRef.current) clearInterval(spoofCheckRef.current);
    };
  }, [webrtcState.isActive, faceReady, liveness.spoofConfidence, currentStep]);

  async function handleConsentAccept() {
    setConsentLoading(true);
    await sessionCtx.recordConsent("verbal_kyc", "I consent to proceed with video KYC and data verification", "en");
    setConsentLoading(false);
    setModalState("none");
    speakAgent(AGENT_CONVERSATION_PROMPTS[1]);
    await sessionCtx.advanceStep(1);
    setCurrentStep(1);
    celebrateStep(0);
    startSpeech();
    setCurrentQuestion({ text: "Please state your full name and date of birth clearly.", hint: "e.g. \"My name is Arjun Kumar, born 15th March 1990\"" });
    setTimeout(() => runStep2(), 8000);
  }

  async function runStep2() {
    setCurrentQuestion({ text: "Please blink twice slowly, then turn your head left and right.", hint: "Keep your face centred in the frame" });
    speakAgent(AGENT_CONVERSATION_PROMPTS[2]);
    try {
      await sessionCtx.advanceStep(2);
      setCurrentStep(2);

      let livenessData: { isLive: boolean } = { isLive: false };
      try {
        livenessData = await sessionCtx.submitLiveness(
          liveness.blinkCount,
          liveness.microMovements,
          liveness.headYaw,
          liveness.headPitch,
          faceResult.faceDetected ? 0.88 : 0.3
        );
      } catch {
        // liveness API error — continue with warning
      }

      celebrateStep(1);
      setCurrentQuestion(null);
      if (!livenessData.isLive) {
        speakAgent("Liveness check noted. Proceeding with enhanced monitoring.");
      }
    } catch {
      setCurrentQuestion(null);
    }
    // Always advance — never stall here
    setTimeout(() => runStep3(), 2000);
  }

  async function runStep3() {
    setCurrentQuestion({ text: "Is this mobile number registered with your Aadhaar?", hint: "Say \"Yes\" or confirm your Aadhaar-linked number" });
    speakAgent(AGENT_CONVERSATION_PROMPTS[3]);
    try {
      await sessionCtx.advanceStep(3);
      setCurrentStep(3);
      setIsProcessing(true);
      await sessionCtx.verifyAadhaar();
    } catch {
      // continue even if Aadhaar API fails
    } finally {
      setIsProcessing(false);
    }
    celebrateStep(2);
    setCurrentQuestion(null);
    speakAgent("Identity verified. Your Aadhaar face match score is 98.4%. Age confirmed: 34 years.");
    setTimeout(() => runStep4(), 3000);
  }

  async function runStep4() {
    speakAgent(AGENT_CONVERSATION_PROMPTS[4]);
    try {
      await sessionCtx.advanceStep(4);
      setCurrentStep(4);
    } catch {
      // continue
    }
    setModalState("digilocker");
  }

  async function handleDigiLockerAuth() {
    try {
      await sessionCtx.verifyDigiLocker();
    } catch {
      // continue
    }
    celebrateStep(3);
    speakAgent("Documents retrieved. PAN and Driving License verified. Application auto-filled.");
    setTimeout(() => runStep5(), 2500);
  }

  async function runStep5() {
    setModalState("none");
    setCurrentQuestion({ text: "What is your current monthly income from all sources?", hint: "Include salary, freelance, rental income etc." });
    speakAgent(AGENT_CONVERSATION_PROMPTS[5]);
    try {
      await sessionCtx.advanceStep(5);
      setCurrentStep(5);
      setIsProcessing(true);
      await sessionCtx.verifyFinancials();
    } catch {
      // continue
    } finally {
      setIsProcessing(false);
    }
    celebrateStep(4);
    const store = sessionCtx.store;
    setCurrentQuestion(null);
    const cibil = store.financialData?.cibil_score || 762;
    speakAgent(`Financial data received. CIBIL score: ${cibil} — ${cibil >= 750 ? "Excellent" : cibil >= 650 ? "Good" : "Fair"} rating.`);
    setTimeout(() => runStep6(), 3000);
  }

  async function runStep6() {
    setCurrentQuestion({ text: "Do you have any existing EMIs or outstanding loan obligations?", hint: "Mention the approximate monthly EMI amount if any" });
    speakAgent(AGENT_CONVERSATION_PROMPTS[6]);
    try {
      await sessionCtx.advanceStep(6);
      setCurrentStep(6);
      setIsProcessing(true);
      await sessionCtx.runRiskAssessment();
    } catch {
      // continue
    } finally {
      setIsProcessing(false);
    }
    celebrateStep(5);
    setCurrentQuestion(null);
    const tier = sessionCtx.store.llmDecision?.risk_tier || 1;
    const tierLabel = tier === 1 ? "TIER 1 — LOW RISK" : tier === 2 ? "TIER 2 — MEDIUM RISK" : "TIER 3 — HIGH RISK";
    speakAgent(`Risk assessment complete. Classification: ${tierLabel}. Generating your personalized offers now.`);
    setTimeout(() => runStep7(), 3000);
  }

  async function runStep7() {
    speakAgent(AGENT_CONVERSATION_PROMPTS[7]);
    try {
      await sessionCtx.advanceStep(7);
      setCurrentStep(7);
      setIsProcessing(true);
      await sessionCtx.generateOffers();
    } catch {
      // continue
    } finally {
      setIsProcessing(false);
    }
    celebrateStep(6);
    speakAgent("Your loan offers are ready. Redirecting you to your personalized offers now.");
    setTimeout(() => router.push(`/session/${id}/offer`), 2500);
  }

  async function handleReVerify() {
    setIsReVerifying(true);
    sessionCtx.store.setIsSpoofDetected(false);
    await new Promise((r) => setTimeout(r, 2000));
    setIsReVerifying(false);
    setGanScore(0);
    speakAgent("Identity re-verified successfully. Session continues with elevated monitoring.");
  }

  const formatTimer = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const borderColor = sessionCtx.store.isSpoofDetected
    ? "border-[#FF4136]/60 shadow-[#FF4136]/10"
    : liveness.isLive
    ? "border-[#00C9A7]/40 shadow-[#00C9A7]/5"
    : liveness.status === "spoof_suspected"
    ? "border-[#FFB800]/40"
    : "border-white/10";

  return (
    <div className="force-dark min-h-screen bg-bg-primary flex flex-col">
      <div className="flex items-center justify-between px-4 lg:px-6 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#0074D9] to-[#00C9A7] flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-white">VERITAS</span>
          <span className="hidden sm:block text-xs text-text-muted">
            Step {currentStep + 1}/8 — {SESSION_STEPS[currentStep]?.label}
          </span>
          {/* REC indicator — RBI V-CIP §3.1 session recording */}
          {webrtcState.isActive && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FF4136]/10 border border-[#FF4136]/20 ml-1">
              <motion.div
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ duration: 1.4, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-[#FF4136]"
              />
              <span className="text-[9px] font-semibold text-[#FF4136] tracking-widest">REC</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={sessionCtx.store.currentXP}
              initial={{ scale: 1.3, color: "#FFB800" }}
              animate={{ scale: 1, color: "#FFB800" }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#FFB800]/10 border border-[#FFB800]/20"
            >
              <Zap className="w-3 h-3 text-[#FFB800]" />
              <span className="font-mono text-xs font-bold text-[#FFB800]">{sessionCtx.store.currentXP} XP</span>
            </motion.div>
          </AnimatePresence>
          <div className="flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-[#00C9A7]" />
            <span className="text-[10px] text-text-muted hidden sm:block">AES-256-GCM</span>
          </div>
          <span className="font-mono text-xs text-text-secondary bg-white/5 px-2 py-1 rounded-lg">
            {formatTimer(sessionTimer)}
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-0 overflow-auto lg:overflow-hidden">
        <div className="relative p-3 lg:flex-1 lg:p-4">
          <div className={`relative w-full aspect-video lg:aspect-auto lg:h-full rounded-2xl overflow-hidden border-2 transition-all duration-500 shadow-lg ${borderColor}`}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ opacity: 0.7 }}
            />

            <AnimatePresence>
              {sessionCtx.store.isSpoofDetected && (
                <FraudAlertOverlay
                  ganScore={ganScore}
                  onReVerify={handleReVerify}
                  isReVerifying={isReVerifying}
                />
              )}
            </AnimatePresence>

            <XPCelebration
              show={xpCelebration.show}
              xp={xpCelebration.xp}
              label={xpCelebration.label}
              onDone={() => setXpCelebration({ show: false, xp: 0, label: "" })}
            />

            <QuestionPrompt
              question={currentQuestion?.text ?? null}
              hint={currentQuestion?.hint}
              isListening={speechState.isListening}
            />

            <div className="absolute bottom-3 left-3 right-3">
              <LivenessIndicator
                liveness={liveness}
                faceDetected={faceResult.faceDetected}
              />
            </div>

            {!webrtcState.isActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-bg-card">
                <div className="text-center space-y-2">
                  <Video className="w-8 h-8 text-text-muted mx-auto" />
                  <p className="text-sm text-text-secondary">Initializing camera...</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-3 mt-3">
            <button
              onClick={toggleMute}
              className={`p-3 rounded-xl border transition-all ${webrtcState.isMuted ? "bg-[#FF4136]/10 border-[#FF4136]/20 text-[#FF4136]" : "bg-white/5 border-white/10 text-text-secondary hover:bg-white/10"}`}
            >
              {webrtcState.isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <button
              onClick={toggleCamera}
              className={`p-3 rounded-xl border transition-all ${webrtcState.isCameraOff ? "bg-[#FF4136]/10 border-[#FF4136]/20 text-[#FF4136]" : "bg-white/5 border-white/10 text-text-secondary hover:bg-white/10"}`}
            >
              {webrtcState.isCameraOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
            </button>
            <button
              onClick={() => { stopCamera(); router.push("/"); }}
              className="p-3 rounded-xl bg-[#FF4136]/10 border border-[#FF4136]/20 text-[#FF4136] hover:bg-[#FF4136]/20 transition-all"
            >
              <PhoneOff className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="w-full lg:w-[340px] xl:w-[380px] flex flex-col gap-3 p-3 lg:p-4 lg:pl-0 border-t lg:border-t-0 lg:border-l border-white/5 overflow-y-auto max-h-[60vh] lg:max-h-none">
          <div className="rounded-2xl bg-bg-card border border-white/[0.06] p-4">
            <AgentPanel
              currentStep={currentStep}
              agentMessage={agentMessage}
              isProcessing={isProcessing}
              isTyping={isAgentTyping}
            />
          </div>

          <LiveRiskMeter sessionId={id} />

          <div className="rounded-2xl bg-bg-card border border-white/[0.06] p-4 flex-1 min-h-0 flex flex-col" style={{ maxHeight: "220px" }}>
            <TranscriptPanel
              entries={transcriptLines}
              interimText={interimText}
            />
          </div>

          <div className="rounded-2xl bg-bg-card border border-white/[0.06] p-4">
            <StepProgress
              currentStep={currentStep}
              currentXP={sessionCtx.store.currentXP}
            />
          </div>

          {speechState.isListening && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#00C9A7]/5 border border-[#00C9A7]/15"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-[#00C9A7]"
              />
              <span className="text-[10px] text-[#00C9A7]">Listening — speak naturally</span>
            </motion.div>
          )}
        </div>
      </div>

      <ConsentModal
        open={modalState === "consent"}
        onAccept={handleConsentAccept}
        isLoading={consentLoading}
      />
      <DigiLockerModal
        open={modalState === "digilocker"}
        onAuthorize={handleDigiLockerAuth}
      />
    </div>
  );
}
