import { describe, it, expect } from "vitest";
import { encrypt, decrypt, encryptField, decryptField } from "../encryption";

describe("encryption", () => {
  describe("encrypt/decrypt", () => {
    it("round-trips plaintext correctly", () => {
      const plaintext = "Priya Sharma";
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it("produces different ciphertext for same plaintext (random IV)", () => {
      const plaintext = "ABCD1234EFGH";
      const enc1 = encrypt(plaintext);
      const enc2 = encrypt(plaintext);
      expect(enc1).not.toBe(enc2);
    });

    it("handles empty string", () => {
      const encrypted = encrypt("");
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe("");
    });

    it("handles unicode characters", () => {
      const plaintext = "प्रिया शर्मा 🇮🇳";
      const encrypted = encrypt(plaintext);
      expect(decrypt(encrypted)).toBe(plaintext);
    });

    it("handles long strings", () => {
      const plaintext = "A".repeat(10000);
      const encrypted = encrypt(plaintext);
      expect(decrypt(encrypted)).toBe(plaintext);
    });

    it("detects tampered ciphertext", () => {
      const encrypted = encrypt("sensitive data");
      // Tamper with the middle of the base64 string
      const tampered =
        encrypted.slice(0, 20) + "X" + encrypted.slice(21);
      expect(() => decrypt(tampered)).toThrow();
    });

    it("throws on invalid base64 payload", () => {
      expect(() => decrypt("not-valid-base64!!!")).toThrow();
    });

    it("throws on too-short payload", () => {
      // Less than IV + Tag (28 bytes = 12 + 16)
      const short = Buffer.from("short").toString("base64");
      expect(() => decrypt(short)).toThrow("Invalid encrypted payload");
    });
  });

  describe("encryptField/decryptField", () => {
    it("returns null for null input", () => {
      expect(encryptField(null)).toBeNull();
      expect(encryptField(undefined)).toBeNull();
      expect(encryptField("")).toBeNull();
    });

    it("encrypts non-empty strings", () => {
      const result = encryptField("ABCDE1234F");
      expect(result).not.toBeNull();
      expect(result).not.toBe("ABCDE1234F");
    });

    it("decryptField returns null for null/empty", () => {
      expect(decryptField(null)).toBeNull();
      expect(decryptField(undefined)).toBeNull();
    });

    it("decryptField returns original for unencrypted data (backward compat)", () => {
      // Plain text that's not a valid encrypted payload
      expect(decryptField("plain text name")).toBe("plain text name");
    });

    it("decryptField correctly decrypts encrypted data", () => {
      const encrypted = encryptField("Rahul Verma");
      const decrypted = decryptField(encrypted);
      expect(decrypted).toBe("Rahul Verma");
    });
  });
});
