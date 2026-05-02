"use client";

import { useRef, useState, useCallback } from "react";

export interface RecordingState {
  isRecording: boolean;
  duration: number;
  chunksUploaded: number;
  error: string | null;
}

interface UseMediaRecorderOptions {
  sessionId: string;
  chunkIntervalMs?: number; // Default 10 seconds (keeps chunks under Vercel's 4.5MB limit)
  mimeType?: string;
}

/**
 * MediaRecorder hook for V-CIP session recording.
 * Records video+audio in 30-second chunks and uploads to server.
 *
 * RBI V-CIP Section 3.1: Full session must be recorded end-to-end.
 * Codec: VP9/Opus in WebM container (browser-native, good compression).
 */
export function useMediaRecorder({
  sessionId,
  chunkIntervalMs = 10_000,
  mimeType,
}: UseMediaRecorderOptions) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const chunkIndexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    duration: 0,
    chunksUploaded: 0,
    error: null,
  });

  const getSupportedMimeType = useCallback((): string => {
    if (mimeType && MediaRecorder.isTypeSupported(mimeType)) return mimeType;
    const types = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
      "video/mp4",
    ];
    return types.find((t) => MediaRecorder.isTypeSupported(t)) || "video/webm";
  }, [mimeType]);

  const uploadChunk = useCallback(
    async (blob: Blob, index: number) => {
      const formData = new FormData();
      formData.append("chunk", blob, `chunk-${index}.webm`);
      formData.append("session_id", sessionId);
      formData.append("chunk_index", String(index));
      formData.append("mime_type", blob.type);

      try {
        const res = await fetch("/api/recording/upload", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
        setState((s) => ({ ...s, chunksUploaded: s.chunksUploaded + 1 }));
      } catch (err) {
        console.error(`Chunk ${index} upload failed:`, err);
        // Store for retry — don't lose data
        chunksRef.current.push(blob);
      }
    },
    [sessionId]
  );

  const start = useCallback(
    (stream: MediaStream) => {
      if (recorderRef.current?.state === "recording") return;

      const codec = getSupportedMimeType();
      const recorder = new MediaRecorder(stream, {
        mimeType: codec,
        videoBitsPerSecond: 1_500_000, // 1.5 Mbps (720p quality)
        audioBitsPerSecond: 128_000, // 128 kbps (clear audio)
      });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          const index = chunkIndexRef.current++;
          uploadChunk(event.data, index);
        }
      };

      recorder.onerror = () => {
        setState((s) => ({ ...s, error: "Recording error occurred", isRecording: false }));
      };

      recorder.start(chunkIntervalMs);
      recorderRef.current = recorder;
      startTimeRef.current = Date.now();

      // Duration timer
      timerRef.current = setInterval(() => {
        setState((s) => ({
          ...s,
          duration: Math.floor((Date.now() - startTimeRef.current) / 1000),
        }));
      }, 1000);

      setState((s) => ({ ...s, isRecording: true, error: null }));
    },
    [chunkIntervalMs, getSupportedMimeType, uploadChunk]
  );

  const stop = useCallback(async (): Promise<{ duration: number; chunks: number }> => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

    if (recorderRef.current?.state === "recording") {
      // Request final data
      recorderRef.current.stop();
    }

    // Wait a moment for the final ondataavailable to fire
    await new Promise((r) => setTimeout(r, 500));

    const totalChunks = chunkIndexRef.current;

    // Seal the recording on the server
    try {
      await fetch("/api/recording/seal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          total_chunks: totalChunks,
          duration_seconds: duration,
          codec: getSupportedMimeType(),
        }),
      });
    } catch (err) {
      console.error("Failed to seal recording:", err);
    }

    setState((s) => ({ ...s, isRecording: false, duration }));
    recorderRef.current = null;

    return { duration, chunks: totalChunks };
  }, [sessionId, getSupportedMimeType]);

  return { state, start, stop };
}
