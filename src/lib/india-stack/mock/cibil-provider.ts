import type { CIBILProvider, CIBILResult } from "../types";
import { getPersonaForPhone } from "@/lib/mock-data";

export class MockCIBILProvider implements CIBILProvider {
  async checkScore(_sessionId: string, phone: string): Promise<CIBILResult> {
    await new Promise((r) => setTimeout(r, 1800));
    const persona = getPersonaForPhone(phone);
    return persona.cibil as CIBILResult;
  }
}
