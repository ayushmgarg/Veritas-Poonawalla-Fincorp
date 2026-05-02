"use client";

import { useState, useCallback } from "react";

export interface GeoPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface GeolocationState {
  position: GeoPosition | null;
  isLoading: boolean;
  error: string | null;
  isInIndia: boolean | null;
}

/**
 * India boundary box (approximate).
 * Latitude: 6.7° N to 37.1° N
 * Longitude: 68.1° E to 97.4° E
 */
const INDIA_BOUNDS = {
  lat: { min: 6.7, max: 37.1 },
  lng: { min: 68.1, max: 97.4 },
};

function isWithinIndia(lat: number, lng: number): boolean {
  return (
    lat >= INDIA_BOUNDS.lat.min &&
    lat <= INDIA_BOUNDS.lat.max &&
    lng >= INDIA_BOUNDS.lng.min &&
    lng <= INDIA_BOUNDS.lng.max
  );
}

/**
 * Browser Geolocation API hook.
 * Captures GPS coordinates and validates India boundary.
 *
 * RBI V-CIP Section 3.2: Geo-tagging mandatory.
 */
export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    isLoading: false,
    error: null,
    isInIndia: null,
  });

  const requestPosition = useCallback((): Promise<GeoPosition | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setState((s) => ({ ...s, error: "Geolocation not supported", isLoading: false }));
        resolve(null);
        return;
      }

      setState((s) => ({ ...s, isLoading: true, error: null }));

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const position: GeoPosition = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: pos.timestamp,
          };
          const inIndia = isWithinIndia(position.latitude, position.longitude);
          setState({
            position,
            isLoading: false,
            error: null,
            isInIndia: inIndia,
          });
          resolve(position);
        },
        (err) => {
          const errorMessages: Record<number, string> = {
            1: "Location permission denied. Please allow location access for V-CIP verification.",
            2: "Unable to determine location. Please check GPS settings.",
            3: "Location request timed out. Please try again.",
          };
          const message = errorMessages[err.code] || err.message;
          setState((s) => ({ ...s, isLoading: false, error: message }));
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000, // Accept cached position up to 30s old
        }
      );
    });
  }, []);

  return { ...state, requestPosition };
}
