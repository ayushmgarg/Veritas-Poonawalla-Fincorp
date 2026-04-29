import CryptoJS from "crypto-js";

export function computeHash(data: string, previousHash: string): string {
  return CryptoJS.SHA256(previousHash + data).toString();
}

export function computeAudioHash(audioData: string): string {
  return CryptoJS.SHA256(audioData).toString();
}

export function verifyChain(
  entries: { hash: string; previous_hash: string; event_data: Record<string, unknown> }[]
): { valid: boolean; brokenAt: number | null } {
  for (let i = 1; i < entries.length; i++) {
    const expectedPrev = entries[i - 1].hash;
    if (entries[i].previous_hash !== expectedPrev) {
      return { valid: false, brokenAt: i };
    }
  }
  return { valid: true, brokenAt: null };
}
