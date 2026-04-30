"use client";

import { useRef, useState, useCallback } from "react";

interface SpeechState {
  transcript: string;
  interimTranscript: string;
  isListening: boolean;
  isSupported: boolean;
  language: string;
}

type SpeechRecognitionEvent = Event & {
  results: { isFinal: boolean; [i: number]: { transcript: string; confidence: number } }[];
  resultIndex: number;
};

export function useSpeechRecognition(onResult: (text: string, confidence: number) => void) {
  const recognitionRef = useRef<{ start: () => void; stop: () => void; abort: () => void; continuous: boolean; interimResults: boolean; lang: string; onresult: ((e: SpeechRecognitionEvent) => void) | null; onerror: ((e: Event) => void) | null; onend: (() => void) | null } | null>(null);

  const [state, setState] = useState<SpeechState>({
    transcript: "",
    interimTranscript: "",
    isListening: false,
    isSupported: typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window),
    language: "en-IN",
  });

  const setLanguage = useCallback((lang: string) => {
    setState((s) => ({ ...s, language: lang }));
    if (recognitionRef.current) {
      recognitionRef.current.lang = lang;
    }
  }, []);

  const start = useCallback(() => {
    if (!state.isSupported) return;

    const SpeechRecognitionClass =
      (window as unknown as { SpeechRecognition?: new () => typeof recognitionRef.current; webkitSpeechRecognition?: new () => typeof recognitionRef.current }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => typeof recognitionRef.current }).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) return;

    const recognition = new SpeechRecognitionClass() as NonNullable<typeof recognitionRef.current>;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = state.language;

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";

      for (let i = e.resultIndex; i < e.results.length; i++) {
        const text = e.results[i][0].transcript;
        const confidence = e.results[i][0].confidence || 0.9;
        if (e.results[i].isFinal) {
          final += text;
          onResult(text.trim(), confidence);
        } else {
          interim += text;
        }
      }

      setState((s) => ({
        ...s,
        transcript: s.transcript + final,
        interimTranscript: interim,
      }));
    };

    recognition.onerror = () => {
      setState((s) => ({ ...s, isListening: false, interimTranscript: "" }));
    };

    recognition.onend = () => {
      setState((s) => ({ ...s, isListening: false, interimTranscript: "" }));
    };

    recognitionRef.current = recognition;
    recognition.start();
    setState((s) => ({ ...s, isListening: true }));
  }, [state.isSupported, state.language, onResult]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setState((s) => ({ ...s, isListening: false, interimTranscript: "" }));
  }, []);

  const clearTranscript = useCallback(() => {
    setState((s) => ({ ...s, transcript: "", interimTranscript: "" }));
  }, []);

  return { state, start, stop, setLanguage, clearTranscript };
}
