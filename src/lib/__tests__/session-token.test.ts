import { describe, it, expect } from "vitest";
import { signSessionId, verifySessionToken } from "../session-token";

describe("session-token", () => {
  const sessionId = "550e8400-e29b-41d4-a716-446655440000";

  describe("signSessionId", () => {
    it("produces a signed token with sessionId.signature format", () => {
      const token = signSessionId(sessionId);
      expect(token).toContain(sessionId);
      expect(token.split(".")).toHaveLength(2); // format: uuid.signature
    });

    it("produces consistent signatures for same input", () => {
      const token1 = signSessionId(sessionId);
      const token2 = signSessionId(sessionId);
      expect(token1).toBe(token2);
    });

    it("produces different signatures for different inputs", () => {
      const token1 = signSessionId(sessionId);
      const token2 = signSessionId("660e8400-e29b-41d4-a716-446655440000");
      expect(token1).not.toBe(token2);
    });
  });

  describe("verifySessionToken", () => {
    it("verifies a correctly signed token", () => {
      const token = signSessionId(sessionId);
      const result = verifySessionToken(token);
      expect(result).toBe(sessionId);
    });

    it("returns null for tampered signature", () => {
      const token = signSessionId(sessionId);
      const tampered = token.slice(0, -4) + "dead";
      expect(verifySessionToken(tampered)).toBeNull();
    });

    it("returns null for missing signature", () => {
      expect(verifySessionToken(sessionId)).toBeNull();
    });

    it("returns null for empty string", () => {
      expect(verifySessionToken("")).toBeNull();
    });

    it("returns null for wrong session ID with valid format", () => {
      const token = signSessionId(sessionId);
      // Replace session ID portion
      const parts = token.split(".");
      parts[0] = "660e8400-e29b-41d4-a716-446655440000";
      expect(verifySessionToken(parts.join("."))).toBeNull();
    });
  });
});
