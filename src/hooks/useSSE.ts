"use client";

import { useEffect, useCallback, useRef } from "react";

type SSEHandler = (data: unknown) => void;

export function useSSE(sessionId: string | null, handlers: Record<string, SSEHandler>) {
  const esRef = useRef<EventSource | null>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const connect = useCallback(() => {
    if (!sessionId || esRef.current) return;

    const es = new EventSource(`/api/session/${sessionId}/stream`);
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        handlersRef.current["message"]?.(data);
      } catch {
        // ignore malformed messages
      }
    };

    const eventTypes = ["sessions", "fraud_events", "verifications", "liveness_checks", "transcripts", "loan_offers", "heartbeat", "connected"];
    for (const type of eventTypes) {
      es.addEventListener(type, (e) => {
        try {
          const data = JSON.parse((e as MessageEvent).data);
          handlersRef.current[type]?.(data);
        } catch {
          // ignore
        }
      });
    }

    es.onerror = () => {
      es.close();
      esRef.current = null;
    };
  }, [sessionId]);

  useEffect(() => {
    connect();
    return () => {
      esRef.current?.close();
      esRef.current = null;
    };
  }, [connect]);
}
