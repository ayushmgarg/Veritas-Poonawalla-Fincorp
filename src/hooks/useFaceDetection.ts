"use client";

import { useRef, useState, useCallback, useEffect } from "react";

export interface FaceLandmark {
  x: number;
  y: number;
  z: number;
}

export interface FaceDetectionResult {
  landmarks: FaceLandmark[] | null;
  blendShapes: Record<string, number> | null;
  faceDetected: boolean;
}

type FaceLandmarkerInstance = {
  detectForVideo: (
    video: HTMLVideoElement,
    ts: number
  ) => { faceLandmarks: { x: number; y: number; z: number }[][], faceBlendshapes: { categories: { categoryName: string; score: number }[] }[] };
  close: () => void;
};

const MEDIAPIPE_VISION_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

export function useFaceDetection(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  isActive: boolean
) {
  const landmarkerRef = useRef<FaceLandmarkerInstance | null>(null);
  const rafRef = useRef<number>(0);
  const [result, setResult] = useState<FaceDetectionResult>({
    landmarks: null,
    blendShapes: null,
    faceDetected: false,
  });
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const { FaceLandmarker, FilesetResolver } = await import(
          "@mediapipe/tasks-vision"
        );
        const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_VISION_URL);
        const landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
          outputFaceBlendshapes: true,
          runningMode: "VIDEO",
          numFaces: 1,
        });

        if (!cancelled) {
          landmarkerRef.current = landmarker;
          setIsReady(true);
        }
      } catch {
        if (!cancelled) {
          setLoadError("Face detection unavailable — using fallback liveness");
          setIsReady(true);
        }
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const drawLandmarks = useCallback(
    (landmarks: FaceLandmark[]) => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "rgba(0, 201, 167, 0.6)";
      for (const lm of landmarks) {
        ctx.beginPath();
        ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    [canvasRef, videoRef]
  );

  useEffect(() => {
    if (!isActive || !isReady || !landmarkerRef.current) return;

    let lastVideoTime = -1;

    function detect() {
      const video = videoRef.current;
      if (!video || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(detect);
        return;
      }

      if (video.currentTime !== lastVideoTime && landmarkerRef.current) {
        lastVideoTime = video.currentTime;
        try {
          const detection = landmarkerRef.current.detectForVideo(
            video,
            performance.now()
          );

          if (detection.faceLandmarks?.length > 0) {
            const landmarks = detection.faceLandmarks[0] as FaceLandmark[];
            const shapes: Record<string, number> = {};

            if (detection.faceBlendshapes?.[0]?.categories) {
              for (const cat of detection.faceBlendshapes[0].categories) {
                shapes[cat.categoryName] = cat.score;
              }
            }

            setResult({ landmarks, blendShapes: shapes, faceDetected: true });
            drawLandmarks(landmarks);
          } else {
            setResult({ landmarks: null, blendShapes: null, faceDetected: false });
            const canvas = canvasRef.current;
            if (canvas) canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
          }
        } catch {
          // continue
        }
      }

      rafRef.current = requestAnimationFrame(detect);
    }

    rafRef.current = requestAnimationFrame(detect);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isActive, isReady, videoRef, canvasRef, drawLandmarks]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      landmarkerRef.current?.close();
    };
  }, []);

  return { result, isReady, loadError };
}
