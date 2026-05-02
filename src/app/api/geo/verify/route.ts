import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { verifyGeolocation } from "@/lib/geo-verifier";
import { logAuditEvent } from "@/lib/audit-logger";
import { updateLiveRisk } from "@/lib/risk-engine";
import { validateRequest, uuidSchema } from "@/lib/validation";
import { z } from "zod";

const geoVerifySchema = z.object({
  session_id: uuidSchema,
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().min(0).max(1000000),
});

/**
 * Server-side geolocation verification.
 * Cross-checks GPS with IP and validates India boundary.
 *
 * RBI V-CIP Section 3.2: Geo-tagging mandatory.
 */
export async function POST(request: Request) {
  const validation = await validateRequest(request, geoVerifySchema);
  if (!validation.success) return validation.response;
  const { session_id, latitude, longitude, accuracy } = validation.data;

  // Extract client IP from headers
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  // Collect headers for VPN detection
  const headers: Record<string, string> = {};
  for (const [key, value] of request.headers.entries()) {
    headers[key.toLowerCase()] = value;
  }

  const result = verifyGeolocation({ latitude, longitude, accuracy, ip, headers });

  const db = getServiceClient();

  // Update session with real geolocation
  await db
    .from("sessions")
    .update({
      geo_location: {
        lat: latitude,
        lng: longitude,
        accuracy,
        ip,
        verified: result.is_in_india,
        verified_at: result.verified_at,
      },
    })
    .eq("id", session_id);

  // Feed into live risk scoring
  if (!result.is_in_india) {
    await updateLiveRisk(session_id, "geo_outside_india", `Coordinates: ${latitude}, ${longitude}`);
  } else if (result.vpn_detected) {
    await updateLiveRisk(session_id, "vpn_detected", "VPN/proxy indicators found");
  } else {
    await updateLiveRisk(session_id, "geo_verified", `India confirmed: ${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
  }

  await logAuditEvent(session_id, "geo_verification", {
    ...result,
    compliance: "RBI V-CIP Section 3.2 — Geo-tagging with India boundary verification",
  });

  return NextResponse.json(result);
}
