import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

/**
 * AES-256-GCM field-level encryption for PII.
 *
 * Format: base64(iv:authTag:ciphertext)
 * - IV: 12 bytes (96-bit, recommended for GCM)
 * - Auth Tag: 16 bytes (128-bit, provides integrity)
 * - Ciphertext: variable length
 *
 * CERT-In compliant: AES-256 + authenticated encryption.
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getMasterKey(): Buffer {
  const hex = process.env.ENCRYPTION_MASTER_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error("ENCRYPTION_MASTER_KEY must be 64 hex chars (32 bytes)");
  }
  return Buffer.from(hex, "hex");
}

/**
 * Encrypt a plaintext string. Returns a base64 encoded payload.
 * Each encryption uses a unique random IV (nonce).
 */
export function encrypt(plaintext: string): string {
  const key = getMasterKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // Pack: iv + authTag + ciphertext
  const packed = Buffer.concat([iv, authTag, encrypted]);
  return packed.toString("base64");
}

/**
 * Decrypt a base64 encoded payload back to plaintext.
 * Throws on tampered data (GCM auth tag verification).
 */
export function decrypt(encoded: string): string {
  const key = getMasterKey();
  const packed = Buffer.from(encoded, "base64");

  if (packed.length < IV_LENGTH + TAG_LENGTH) {
    throw new Error("Invalid encrypted payload");
  }

  const iv = packed.subarray(0, IV_LENGTH);
  const authTag = packed.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const ciphertext = packed.subarray(IV_LENGTH + TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

/**
 * Encrypt a value only if it's a non-empty string.
 * Returns null for null/undefined/empty inputs.
 */
export function encryptField(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    return encrypt(value);
  } catch {
    console.warn("encryptField: ENCRYPTION_MASTER_KEY not configured, storing plaintext");
    return value;
  }
}

/**
 * Decrypt a value only if it looks like encrypted data (base64).
 * Returns the original string if decryption fails (for backward compatibility with unencrypted data).
 */
export function decryptField(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    return decrypt(value);
  } catch {
    // Return as-is if not encrypted (backward compat with existing unencrypted data)
    return value;
  }
}
