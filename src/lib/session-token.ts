import { createHmac, timingSafeEqual } from "crypto";

/**
 * HMAC-SHA256 session token signing.
 * Prevents session ID forgery/enumeration attacks.
 *
 * Usage: After creating a session, sign the ID and return the signed token.
 * On subsequent requests, verify the token matches before processing.
 */

function getSigningSecret(): string {
  const secret = process.env.SESSION_SIGNING_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SIGNING_SECRET must be at least 32 characters");
  }
  return secret;
}

/**
 * Sign a session ID with HMAC-SHA256.
 * Returns: `sessionId.signature`
 */
export function signSessionId(sessionId: string): string {
  const secret = getSigningSecret();
  const signature = createHmac("sha256", secret)
    .update(sessionId)
    .digest("hex");
  return `${sessionId}.${signature}`;
}

/**
 * Verify a signed session token.
 * Returns the session ID if valid, null if tampered.
 */
export function verifySessionToken(token: string): string | null {
  const lastDot = token.lastIndexOf(".");
  if (lastDot === -1) return null;

  const sessionId = token.slice(0, lastDot);
  const providedSig = token.slice(lastDot + 1);

  if (!sessionId || !providedSig) return null;

  const secret = getSigningSecret();
  const expectedSig = createHmac("sha256", secret)
    .update(sessionId)
    .digest("hex");

  // Timing-safe comparison to prevent timing attacks
  const provided = Buffer.from(providedSig, "hex");
  const expected = Buffer.from(expectedSig, "hex");

  if (provided.length !== expected.length) return null;
  if (!timingSafeEqual(provided, expected)) return null;

  return sessionId;
}
