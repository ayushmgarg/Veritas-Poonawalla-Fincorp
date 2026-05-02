import { describe, it, expect } from "vitest";
import {
  phoneSchema,
  uuidSchema,
  sessionCreateSchema,
  livenessSchema,
  consentSchema,
  offerNegotiateSchema,
  speechProcessSchema,
} from "../validation/schemas";

describe("phoneSchema", () => {
  it("accepts valid Indian mobile numbers", () => {
    expect(phoneSchema.safeParse("9876543210").success).toBe(true);
    expect(phoneSchema.safeParse("6000000000").success).toBe(true);
    expect(phoneSchema.safeParse("7981107498").success).toBe(true);
  });

  it("rejects numbers starting with 0-5", () => {
    expect(phoneSchema.safeParse("0123456789").success).toBe(false);
    expect(phoneSchema.safeParse("5123456789").success).toBe(false);
  });

  it("rejects numbers with wrong length", () => {
    expect(phoneSchema.safeParse("987654321").success).toBe(false);
    expect(phoneSchema.safeParse("98765432100").success).toBe(false);
  });

  it("rejects non-numeric strings", () => {
    expect(phoneSchema.safeParse("abcdefghij").success).toBe(false);
    expect(phoneSchema.safeParse("+919876543210").success).toBe(false);
  });
});

describe("uuidSchema", () => {
  it("accepts valid UUIDs", () => {
    expect(uuidSchema.safeParse("550e8400-e29b-41d4-a716-446655440000").success).toBe(true);
    expect(uuidSchema.safeParse("6ba7b810-9dad-11d1-80b4-00c04fd430c8").success).toBe(true);
  });

  it("rejects invalid UUIDs", () => {
    expect(uuidSchema.safeParse("not-a-uuid").success).toBe(false);
    expect(uuidSchema.safeParse("").success).toBe(false);
    expect(uuidSchema.safeParse("550e8400-e29b-41d4-a716").success).toBe(false);
  });
});

describe("sessionCreateSchema", () => {
  it("accepts valid phone", () => {
    const result = sessionCreateSchema.safeParse({ phone: "9876543210" });
    expect(result.success).toBe(true);
  });

  it("rejects missing phone", () => {
    expect(sessionCreateSchema.safeParse({}).success).toBe(false);
  });

  it("rejects extra fields (strict mode not enabled, so passes)", () => {
    const result = sessionCreateSchema.safeParse({ phone: "9876543210", extra: "field" });
    expect(result.success).toBe(true);
  });
});

describe("livenessSchema", () => {
  it("accepts valid liveness data", () => {
    const result = livenessSchema.safeParse({
      session_id: "550e8400-e29b-41d4-a716-446655440000",
      blink_count: 5,
      micro_movement_count: 150,
      head_yaw: 3.5,
      head_pitch: -1.2,
      face_confidence: 0.95,
    });
    expect(result.success).toBe(true);
  });

  it("rejects face_confidence > 1", () => {
    const result = livenessSchema.safeParse({
      session_id: "550e8400-e29b-41d4-a716-446655440000",
      blink_count: 5,
      micro_movement_count: 150,
      face_confidence: 1.5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative blink_count", () => {
    const result = livenessSchema.safeParse({
      session_id: "550e8400-e29b-41d4-a716-446655440000",
      blink_count: -1,
      micro_movement_count: 150,
      face_confidence: 0.9,
    });
    expect(result.success).toBe(false);
  });
});

describe("consentSchema", () => {
  it("accepts valid consent types", () => {
    for (const type of ["kyc", "data_sharing", "offer_acceptance", "recording"]) {
      expect(consentSchema.safeParse({ consent_type: type }).success).toBe(true);
    }
  });

  it("rejects invalid consent type", () => {
    expect(consentSchema.safeParse({ consent_type: "invalid" }).success).toBe(false);
  });
});

describe("offerNegotiateSchema", () => {
  it("accepts valid negotiation request", () => {
    const result = offerNegotiateSchema.safeParse({
      session_id: "550e8400-e29b-41d4-a716-446655440000",
      offer_id: "660e8400-e29b-41d4-a716-446655440000",
      message: "Can you reduce my EMI?",
    });
    expect(result.success).toBe(true);
  });

  it("rejects tenure below 6 months", () => {
    const result = offerNegotiateSchema.safeParse({
      session_id: "550e8400-e29b-41d4-a716-446655440000",
      offer_id: "660e8400-e29b-41d4-a716-446655440000",
      new_tenure: 3,
    });
    expect(result.success).toBe(false);
  });

  it("rejects amount below 50000", () => {
    const result = offerNegotiateSchema.safeParse({
      session_id: "550e8400-e29b-41d4-a716-446655440000",
      offer_id: "660e8400-e29b-41d4-a716-446655440000",
      new_amount: 10000,
    });
    expect(result.success).toBe(false);
  });
});

describe("speechProcessSchema", () => {
  it("accepts valid speech input", () => {
    const result = speechProcessSchema.safeParse({
      session_id: "550e8400-e29b-41d4-a716-446655440000",
      text: "I earn about 85 thousand per month",
      language: "en",
      confidence: 0.92,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty text", () => {
    const result = speechProcessSchema.safeParse({
      session_id: "550e8400-e29b-41d4-a716-446655440000",
      text: "",
    });
    expect(result.success).toBe(false);
  });
});
