"use client";

import { useCallback } from "react";
import { useSessionStore } from "@/lib/store";

export function useSession(sessionId: string) {
  const store = useSessionStore();

  const loadSession = useCallback(async () => {
    store.setIsLoading(true);
    try {
      const res = await fetch(`/api/session/${sessionId}`);
      const data = await res.json();
      store.setFullState({
        session: data.session,
        customerData: data.customerData,
        verifications: data.verifications || [],
        financialData: data.financialData,
        fraudEvents: data.fraudEvents || [],
        offers: data.offers || [],
        llmDecision: data.llmDecision,
        transcripts: data.transcripts || [],
      });
    } finally {
      store.setIsLoading(false);
    }
  }, [sessionId, store]);

  const advanceStep = useCallback(
    async (step: number) => {
      const res = await fetch(`/api/session/${sessionId}/step`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step }),
      });
      const data = await res.json();
      if (data.session) {
        store.setSession(data.session);
        store.addXP(data.stepInfo?.xpReward || 0);
      }
      return data;
    },
    [sessionId, store]
  );

  const recordConsent = useCallback(
    async (type: string, text: string, language = "en") => {
      await fetch(`/api/session/${sessionId}/consent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consent_type: type, consent_text: text, language }),
      });
    },
    [sessionId]
  );

  const processTranscript = useCallback(
    async (text: string, confidence: number, language = "en") => {
      const res = await fetch("/api/speech/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          text,
          language,
          confidence,
          timestamp_ms: Date.now(),
        }),
      });
      const data = await res.json();
      if (data.updated?.length > 0 && store.customerData) {
        await loadSession();
      }
      return data;
    },
    [sessionId, store.customerData, loadSession]
  );

  const verifyAadhaar = useCallback(async () => {
    const res = await fetch("/api/verify/aadhaar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId }),
    });
    const data = await res.json();
    if (data.verification) store.addVerification(data.verification);
    return data;
  }, [sessionId, store]);

  const verifyDigiLocker = useCallback(async () => {
    const [dlRes, ckycRes] = await Promise.all([
      fetch("/api/verify/digilocker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      }),
      fetch("/api/verify/ckyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      }),
    ]);
    const [dl, ckyc] = await Promise.all([dlRes.json(), ckycRes.json()]);
    if (dl.verification) store.addVerification(dl.verification);
    if (ckyc.verification) store.addVerification(ckyc.verification);
    return { dl, ckyc };
  }, [sessionId, store]);

  const verifyFinancials = useCallback(async () => {
    const [aaRes, cibilRes] = await Promise.all([
      fetch("/api/verify/aa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      }),
      fetch("/api/verify/cibil", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      }),
    ]);
    const [aa, cibil] = await Promise.all([aaRes.json(), cibilRes.json()]);
    if (aa.verification) store.addVerification(aa.verification);
    if (cibil.verification) store.addVerification(cibil.verification);
    await loadSession();
    return { aa, cibil };
  }, [sessionId, store, loadSession]);

  const runRiskAssessment = useCallback(async () => {
    const [shadowRes, riskRes] = await Promise.all([
      fetch("/api/credit/shadow-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      }),
      fetch("/api/credit/risk-classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      }),
    ]);
    const [shadow, risk] = await Promise.all([shadowRes.json(), riskRes.json()]);
    if (risk.decision) store.setLLMDecision(risk.decision);
    return { shadow, risk };
  }, [sessionId, store]);

  const generateOffers = useCallback(async () => {
    const res = await fetch("/api/offer/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId }),
    });
    const data = await res.json();
    if (data.offers) store.setOffers(data.offers);
    return data;
  }, [sessionId, store]);

  const submitLiveness = useCallback(
    async (blinkCount: number, microMovements: number, headYaw: number, headPitch: number, faceConfidence: number) => {
      const res = await fetch("/api/fraud/liveness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          blink_count: blinkCount,
          micro_movement_count: microMovements,
          head_yaw: headYaw,
          head_pitch: headPitch,
          face_confidence: faceConfidence,
        }),
      });
      return res.json();
    },
    [sessionId]
  );

  const checkSpoof = useCallback(
    async (microMovements: number, faceConfidence: number, depthVariance: number) => {
      const res = await fetch("/api/fraud/spoof-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          micro_movements: microMovements,
          face_confidence: faceConfidence,
          depth_variance: depthVariance,
        }),
      });
      const data = await res.json();
      if (data.spoofDetected && data.fraudEvent) {
        store.addFraudEvent(data.fraudEvent);
        store.setIsSpoofDetected(true);
      }
      return data;
    },
    [sessionId, store]
  );

  return {
    store,
    loadSession,
    advanceStep,
    recordConsent,
    processTranscript,
    verifyAadhaar,
    verifyDigiLocker,
    verifyFinancials,
    runRiskAssessment,
    generateOffers,
    submitLiveness,
    checkSpoof,
  };
}
