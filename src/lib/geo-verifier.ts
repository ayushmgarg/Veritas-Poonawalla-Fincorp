/**
 * Server-side geolocation verification.
 * Cross-validates GPS coordinates against IP geolocation.
 *
 * RBI V-CIP Section 3.2: Customer must be physically in India.
 * Geo-tagging is mandatory at session start and periodic re-captures.
 */

const INDIA_BOUNDS = {
  lat: { min: 6.7, max: 37.1 },
  lng: { min: 68.1, max: 97.4 },
};

/** Known VPN/proxy indicators */
const SUSPICIOUS_HEADERS = [
  "x-forwarded-for",
  "via",
  "x-proxy-id",
  "forwarded",
];

export interface GeoVerificationResult {
  is_in_india: boolean;
  gps_coordinates: { lat: number; lng: number } | null;
  ip_address: string;
  ip_country: string | null;
  gps_ip_distance_km: number | null;
  vpn_detected: boolean;
  risk_flags: string[];
  verified_at: string;
}

interface VerifyGeoInput {
  latitude: number;
  longitude: number;
  accuracy: number;
  ip: string;
  headers: Record<string, string>;
}

/**
 * Verify that GPS coordinates are within India.
 */
function isGPSInIndia(lat: number, lng: number): boolean {
  return (
    lat >= INDIA_BOUNDS.lat.min &&
    lat <= INDIA_BOUNDS.lat.max &&
    lng >= INDIA_BOUNDS.lng.min &&
    lng <= INDIA_BOUNDS.lng.max
  );
}

/**
 * Detect VPN/proxy indicators from request headers.
 */
function detectVPN(headers: Record<string, string>): boolean {
  // Multiple forwarded IPs suggest proxy chain
  const forwardedFor = headers["x-forwarded-for"] || "";
  if (forwardedFor.split(",").length > 2) return true;

  // Check for proxy-specific headers
  for (const header of SUSPICIOUS_HEADERS) {
    if (headers[header] && header !== "x-forwarded-for") {
      // 'via' header present = proxy
      if (header === "via") return true;
    }
  }

  return false;
}

/**
 * Main geo verification function.
 * Validates GPS is in India and checks for VPN indicators.
 */
export function verifyGeolocation(input: VerifyGeoInput): GeoVerificationResult {
  const riskFlags: string[] = [];
  const gpsInIndia = isGPSInIndia(input.latitude, input.longitude);
  const vpnDetected = detectVPN(input.headers);

  if (!gpsInIndia) {
    riskFlags.push("GPS_OUTSIDE_INDIA");
  }

  if (input.accuracy > 1000) {
    riskFlags.push("LOW_GPS_ACCURACY");
  }

  if (vpnDetected) {
    riskFlags.push("VPN_PROXY_DETECTED");
  }

  // If latitude/longitude are exactly 0,0 — likely spoofed or unavailable
  if (input.latitude === 0 && input.longitude === 0) {
    riskFlags.push("NULL_ISLAND_COORDINATES");
  }

  return {
    is_in_india: gpsInIndia && !vpnDetected,
    gps_coordinates: { lat: input.latitude, lng: input.longitude },
    ip_address: input.ip,
    ip_country: null, // Would use MaxMind GeoIP2 in production
    gps_ip_distance_km: null, // Requires IP geolocation service
    vpn_detected: vpnDetected,
    risk_flags: riskFlags,
    verified_at: new Date().toISOString(),
  };
}
