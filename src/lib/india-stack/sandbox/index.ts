import type { IndiaStackProvider } from "../types";
import { MockAadhaarProvider } from "../mock/aadhaar-provider";
import { MockDigiLockerProvider } from "../mock/digilocker-provider";
import { MockCKYCProvider } from "../mock/ckyc-provider";
import { MockCIBILProvider } from "../mock/cibil-provider";
import { SetuAAProvider } from "./aa-provider";

/**
 * Sandbox provider — uses real Setu AA sandbox for financial data,
 * falls back to mock for services without public sandbox APIs.
 *
 * Upgrade path: swap individual providers as more sandboxes become available
 * (e.g., UIDAI sandbox for Aadhaar, DigiLocker staging).
 */
export function createSandboxProvider(): IndiaStackProvider {
  return {
    aadhaar: new MockAadhaarProvider(), // No public UIDAI sandbox
    digilocker: new MockDigiLockerProvider(), // DigiLocker staging requires MeitY approval
    ckyc: new MockCKYCProvider(), // CERSAI sandbox requires FI license
    cibil: new MockCIBILProvider(), // TransUnion sandbox requires bureau membership
    aa: new SetuAAProvider(), // Setu FIU sandbox is publicly available
  };
}
