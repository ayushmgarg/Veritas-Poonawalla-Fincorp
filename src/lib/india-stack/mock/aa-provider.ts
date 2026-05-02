import type { AAProvider, AAFinancialData } from "../types";
import { getPersonaForPhone } from "@/lib/mock-data";

export class MockAAProvider implements AAProvider {
  async fetchFinancialData(_sessionId: string, phone: string): Promise<AAFinancialData> {
    await new Promise((r) => setTimeout(r, 2500));
    const persona = getPersonaForPhone(phone);
    return persona.aa;
  }
}
