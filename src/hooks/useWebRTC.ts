"use client";

import { useRef, useState, useCallback, useEffect } from "react";

interface WebRTCState {
  stream: MediaStream | null;
  isActive: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  error: string | null;
}

export function useWebRTC() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<WebRTCState>({
    stream: null,
    isActive: false,
    isMuted: false,
    isCameraOff: false,
    error: null,
  });

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setState((s) => ({ ...s, stream, isActive: true, error: null }));
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Camera access denied";
      setState((s) => ({ ...s, error: msg }));
    }
  }, []);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setState((s) => ({ ...s, stream: null, isActive: false }));
  }, []);

  const toggleMute = useCallback(() => {
    const audioTrack = streamRef.current?.getAudioTracks()[0];
    if (!audioTrack) return;
    audioTrack.enabled = !audioTrack.enabled;
    setState((s) => ({ ...s, isMuted: !audioTrack.enabled }));
  }, []);

  const toggleCamera = useCallback(() => {
    const videoTrack = streamRef.current?.getVideoTracks()[0];
    if (!videoTrack) return;
    videoTrack.enabled = !videoTrack.enabled;
    setState((s) => ({ ...s, isCameraOff: !videoTrack.enabled }));
  }, []);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return { videoRef, state, start, stop, toggleMute, toggleCamera };
}
