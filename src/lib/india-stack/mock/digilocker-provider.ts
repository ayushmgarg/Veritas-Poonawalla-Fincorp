import type { DigiLockerProvider, DigiLockerResult } from "../types";
import { getPersonaForPhone } from "@/lib/mock-data";

export class MockDigiLockerProvider implements DigiLockerProvider {
  async fetchDocuments(_sessionId: string, phone: string): Promise<DigiLockerResult> {
    await new Promise((r) => setTimeout(r, 2000));
    const persona = getPersonaForPhone(phone);
    return persona.digilocker as DigiLockerResult;
  }
}
