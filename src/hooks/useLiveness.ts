"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { FaceDetectionResult, FaceLandmark } from "./useFaceDetection";

export interface LivenessState {
  isLive: boolean;
  blinkCount: number;
  microMovements: number;
  spoofConfidence: number;
  headYaw: number;
  headPitch: number;
  status: "initializing" | "checking" | "live" | "spoof_suspected" | "spoof_confirmed";
}

const HISTORY_FRAMES = 60;
const SPOOF_MOVEMENT_THRESHOLD = 0.0015;
const BLINK_THRESHOLD = 0.35;
const BLINK_COOLDOWN_MS = 400;

export function useLiveness(faceResult: FaceDetectionResult) {
  const nosePosHistory = useRef<{ x: number; y: number }[]>([]);
  const lastBlinkTime = useRef<number>(0);
  const blinkInProgress = useRef<boolean>(false);

  const [liveness, setLiveness] = useState<LivenessState>({
    isLive: false,
    blinkCount: 0,
    microMovements: 0,
    spoofConfidence: 0,
    headYaw: 0,
    headPitch: 0,
    status: "initializing",
  });

  const computeStdDev = (values: number[]): number => {
    if (values.length < 2) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
    return Math.sqrt(variance);
  };

  const estimateHeadPose = (landmarks: FaceLandmark[]) => {
    if (landmarks.length < 10) return { yaw: 0, pitch: 0 };
    const noseTip = landmarks[4];
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];

    const eyeMidX = (leftEye.x + rightEye.x) / 2;
    const yaw = (noseTip.x - eyeMidX) * 100;
    const pitch = (noseTip.y - (leftEye.y + rightEye.y) / 2) * 100;
    return { yaw, pitch };
  };

  useEffect(() => {
    if (!faceResult.faceDetected || !faceResult.landmarks) {
      setLiveness((s) => ({ ...s, status: "checking" }));
      return;
    }

    const { landmarks, blendShapes } = faceResult;

    const noseTip = landmarks[4];
    nosePosHistory.current.push({ x: noseTip.x, y: noseTip.y });
    if (nosePosHistory.current.length > HISTORY_FRAMES) {
      nosePosHistory.current.shift();
    }

    const xs = nosePosHistory.current.map((p) => p.x);
    const ys = nosePosHistory.current.map((p) => p.y);
    const movementX = computeStdDev(xs);
    const movementY = computeStdDev(ys);
    const totalMovement = Math.sqrt(movementX ** 2 + movementY ** 2);
    const microMovements = Math.round(totalMovement * 10000);

    const isStatic =
      nosePosHistory.current.length >= HISTORY_FRAMES &&
      totalMovement < SPOOF_MOVEMENT_THRESHOLD;

    const spoofConfidence = isStatic
      ? Math.min(100, 40 + (1 - totalMovement / SPOOF_MOVEMENT_THRESHOLD) * 60)
      : Math.max(0, (SPOOF_MOVEMENT_THRESHOLD - totalMovement) / SPOOF_MOVEMENT_THRESHOLD * 30);

    const { yaw, pitch } = estimateHeadPose(landmarks);

    setLiveness((prev) => {
      let newBlinkCount = prev.blinkCount;

      if (blendShapes) {
        const blinkLeft = blendShapes["eyeBlinkLeft"] || 0;
        const blinkRight = blendShapes["eyeBlinkRight"] || 0;
        const avgBlink = (blinkLeft + blinkRight) / 2;

        if (avgBlink > BLINK_THRESHOLD && !blinkInProgress.current) {
          blinkInProgress.current = true;
        } else if (avgBlink < BLINK_THRESHOLD * 0.6 && blinkInProgress.current) {
          const now = Date.now();
          if (now - lastBlinkTime.current > BLINK_COOLDOWN_MS) {
            newBlinkCount++;
            lastBlinkTime.current = now;
          }
          blinkInProgress.current = false;
        }
      }

      const isLive = newBlinkCount >= 1 && microMovements > 5 && spoofConfidence < 50;

      const status: LivenessState["status"] =
        spoofConfidence > 75
          ? "spoof_confirmed"
          : spoofConfidence > 40
          ? "spoof_suspected"
          : isLive
          ? "live"
          : "checking";

      return {
        isLive,
        blinkCount: newBlinkCount,
        microMovements,
        spoofConfidence: Math.round(spoofConfidence),
        headYaw: Math.round(yaw),
        headPitch: Math.round(pitch),
        status,
      };
    });
  }, [faceResult]);

  const reset = useCallback(() => {
    nosePosHistory.current = [];
    lastBlinkTime.current = 0;
    blinkInProgress.current = false;
    setLiveness({
      isLive: false,
      blinkCount: 0,
      microMovements: 0,
      spoofConfidence: 0,
      headYaw: 0,
      headPitch: 0,
      status: "initializing",
    });
  }, []);

  return { liveness, reset };
}
