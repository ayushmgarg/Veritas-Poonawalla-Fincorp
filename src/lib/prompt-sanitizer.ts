/**
 * Sanitize user-provided text before passing to LLM prompts.
 * Prevents prompt injection attacks where a customer's speech transcript
 * could contain instructions that override the system prompt.
 *
 * OWASP LLM01: Prompt Injection
 */

const INJECTION_PATTERNS = [
  // Direct instruction overrides
  /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|rules?)/i,
  /disregard\s+(all\s+)?(previous|above|prior)/i,
  /forget\s+(everything|all|your)\s+(instructions?|rules?|training)/i,
  // Role manipulation
  /you\s+are\s+now\s+a/i,
  /pretend\s+(to\s+be|you\s+are)/i,
  /act\s+as\s+(if|a|an)/i,
  /new\s+system\s+prompt/i,
  /system\s*:\s*/i,
  // Output manipulation
  /output\s+the\s+(system|initial)\s+prompt/i,
  /reveal\s+(your|the)\s+(instructions?|prompt|system)/i,
  /what\s+(are|is)\s+your\s+(instructions?|system\s+prompt)/i,
  // Delimiter exploitation
  /```\s*system/i,
  /\[INST\]/i,
  /<\|im_start\|>/i,
  /<<SYS>>/i,
  // Data exfiltration
  /print\s+(all|your|the)\s+(data|information|context)/i,
  /dump\s+(the|all)\s+(database|records|data)/i,
];

/** Characters that could break prompt structure */
const DANGEROUS_CHARS = /[{}<>|\\`]/g;

export interface SanitizeResult {
  text: string;
  injectionDetected: boolean;
  patternsMatched: string[];
}

/**
 * Sanitize user transcript text before LLM classification.
 * - Detects injection attempts
 * - Strips dangerous characters
 * - Truncates to max length
 */
export function sanitizeForLLM(
  input: string,
  maxLength: number = 5000
): SanitizeResult {
  const patternsMatched: string[] = [];

  // Check for injection patterns
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      patternsMatched.push(pattern.source.slice(0, 40));
    }
  }

  // Strip dangerous characters that could break prompt delimiters
  let sanitized = input.replace(DANGEROUS_CHARS, "");

  // Collapse excessive whitespace
  sanitized = sanitized.replace(/\s{3,}/g, "  ");

  // Truncate
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength) + "...[truncated]";
  }

  return {
    text: sanitized,
    injectionDetected: patternsMatched.length > 0,
    patternsMatched,
  };
}
