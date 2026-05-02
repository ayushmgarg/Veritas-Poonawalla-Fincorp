import { describe, it, expect } from "vitest";
import { verifyGeolocation } from "../geo-verifier";

const validInput = {
  latitude: 12.9716, // Bangalore
  longitude: 77.5946,
  accuracy: 50,
  ip: "203.0.113.42",
  headers: { "x-forwarded-for": "203.0.113.42" },
};

describe("verifyGeolocation", () => {
  it("confirms India location for valid Bangalore coordinates", () => {
    const result = verifyGeolocation(validInput);
    expect(result.is_in_india).toBe(true);
    expect(result.risk_flags).toHaveLength(0);
    expect(result.vpn_detected).toBe(false);
  });

  it("confirms India for Mumbai coordinates", () => {
    const result = verifyGeolocation({ ...validInput, latitude: 19.076, longitude: 72.8777 });
    expect(result.is_in_india).toBe(true);
  });

  it("confirms India for Delhi coordinates", () => {
    const result = verifyGeolocation({ ...validInput, latitude: 28.6139, longitude: 77.209 });
    expect(result.is_in_india).toBe(true);
  });

  it("rejects coordinates outside India (London)", () => {
    const result = verifyGeolocation({ ...validInput, latitude: 51.5074, longitude: -0.1278 });
    expect(result.is_in_india).toBe(false);
    expect(result.risk_flags).toContain("GPS_OUTSIDE_INDIA");
  });

  it("rejects coordinates outside India (New York)", () => {
    const result = verifyGeolocation({ ...validInput, latitude: 40.7128, longitude: -74.006 });
    expect(result.is_in_india).toBe(false);
  });

  it("flags null island coordinates (0, 0)", () => {
    const result = verifyGeolocation({ ...validInput, latitude: 0, longitude: 0 });
    expect(result.risk_flags).toContain("NULL_ISLAND_COORDINATES");
  });

  it("flags low GPS accuracy (>1000m)", () => {
    const result = verifyGeolocation({ ...validInput, accuracy: 5000 });
    expect(result.risk_flags).toContain("LOW_GPS_ACCURACY");
  });

  it("detects VPN via 'via' header", () => {
    const result = verifyGeolocation({
      ...validInput,
      headers: { "x-forwarded-for": "203.0.113.42", via: "1.1 proxy.example.com" },
    });
    expect(result.vpn_detected).toBe(true);
    expect(result.is_in_india).toBe(false); // VPN makes it non-compliant
    expect(result.risk_flags).toContain("VPN_PROXY_DETECTED");
  });

  it("detects VPN via multiple forwarded IPs", () => {
    const result = verifyGeolocation({
      ...validInput,
      headers: { "x-forwarded-for": "1.1.1.1, 2.2.2.2, 3.3.3.3" },
    });
    expect(result.vpn_detected).toBe(true);
  });

  it("includes timestamp in result", () => {
    const result = verifyGeolocation(validInput);
    expect(result.verified_at).toBeDefined();
    expect(new Date(result.verified_at).getTime()).toBeGreaterThan(0);
  });

  it("handles edge case at India boundary (Kanyakumari)", () => {
    const result = verifyGeolocation({ ...validInput, latitude: 8.0883, longitude: 77.5385 });
    expect(result.is_in_india).toBe(true);
  });

  it("handles edge case at India boundary (Kashmir)", () => {
    const result = verifyGeolocation({ ...validInput, latitude: 36.5, longitude: 75.0 });
    expect(result.is_in_india).toBe(true);
  });
});
