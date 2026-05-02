import type { CKYCProvider, CKYCResult } from "../types";
import { getPersonaForPhone } from "@/lib/mock-data";

export class MockCKYCProvider implements CKYCProvider {
  async verify(_sessionId: string, phone: string): Promise<CKYCResult> {
    await new Promise((r) => setTimeout(r, 1000));
    const persona = getPersonaForPhone(phone);
    return persona.ckyc as CKYCResult;
  }
}
