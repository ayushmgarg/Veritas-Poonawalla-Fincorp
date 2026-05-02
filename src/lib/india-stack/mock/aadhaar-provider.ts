import type { AadhaarProvider, AadhaarVerifyResult } from "../types";
import { getPersonaForPhone } from "@/lib/mock-data";

export class MockAadhaarProvider implements AadhaarProvider {
  async verify(_sessionId: string, phone: string): Promise<AadhaarVerifyResult> {
    await new Promise((r) => setTimeout(r, 1500));
    const persona = getPersonaForPhone(phone);
    return persona.aadhaar as AadhaarVerifyResult;
  }
}
