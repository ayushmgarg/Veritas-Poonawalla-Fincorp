import type { IndiaStackProvider } from "../types";
import { MockAadhaarProvider } from "./aadhaar-provider";
import { MockDigiLockerProvider } from "./digilocker-provider";
import { MockCKYCProvider } from "./ckyc-provider";
import { MockCIBILProvider } from "./cibil-provider";
import { MockAAProvider } from "./aa-provider";

export function createMockProvider(): IndiaStackProvider {
  return {
    aadhaar: new MockAadhaarProvider(),
    digilocker: new MockDigiLockerProvider(),
    ckyc: new MockCKYCProvider(),
    cibil: new MockCIBILProvider(),
    aa: new MockAAProvider(),
  };
}
