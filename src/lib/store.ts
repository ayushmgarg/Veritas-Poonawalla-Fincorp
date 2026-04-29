import { create } from "zustand";
import {
  Session,
  CustomerData,
  FraudEvent,
  Verification,
  FinancialData,
  LLMDecision,
  LoanOffer,
  TranscriptEntry,
  LivenessCheck,
} from "@/types";

interface SessionState {
  session: Session | null;
  customerData: CustomerData | null;
  verifications: Verification[];
  financialData: FinancialData | null;
  fraudEvents: FraudEvent[];
  offers: LoanOffer[];
  llmDecision: LLMDecision | null;
  transcripts: TranscriptEntry[];
  livenessHistory: LivenessCheck[];

  currentXP: number;
  isLive: boolean;
  isSpoofDetected: boolean;
  isLoading: boolean;

  setSession: (session: Session) => void;
  setCustomerData: (data: CustomerData) => void;
  addVerification: (v: Verification) => void;
  setFinancialData: (data: FinancialData) => void;
  addFraudEvent: (event: FraudEvent) => void;
  setOffers: (offers: LoanOffer[]) => void;
  setLLMDecision: (decision: LLMDecision) => void;
  addTranscript: (entry: TranscriptEntry) => void;
  addLivenessCheck: (check: LivenessCheck) => void;
  addXP: (amount: number) => void;
  setIsLive: (live: boolean) => void;
  setIsSpoofDetected: (detected: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setFullState: (state: Partial<SessionState>) => void;
  reset: () => void;
}

const initialState = {
  session: null,
  customerData: null,
  verifications: [],
  financialData: null,
  fraudEvents: [],
  offers: [],
  llmDecision: null,
  transcripts: [],
  livenessHistory: [],
  currentXP: 0,
  isLive: false,
  isSpoofDetected: false,
  isLoading: false,
};

export const useSessionStore = create<SessionState>((set) => ({
  ...initialState,

  setSession: (session) => set({ session }),
  setCustomerData: (customerData) => set({ customerData }),
  addVerification: (v) =>
    set((s) => ({ verifications: [...s.verifications, v] })),
  setFinancialData: (financialData) => set({ financialData }),
  addFraudEvent: (event) =>
    set((s) => ({ fraudEvents: [...s.fraudEvents, event] })),
  setOffers: (offers) => set({ offers }),
  setLLMDecision: (llmDecision) => set({ llmDecision }),
  addTranscript: (entry) =>
    set((s) => ({ transcripts: [...s.transcripts, entry] })),
  addLivenessCheck: (check) =>
    set((s) => ({ livenessHistory: [...s.livenessHistory, check] })),
  addXP: (amount) => set((s) => ({ currentXP: s.currentXP + amount })),
  setIsLive: (isLive) => set({ isLive }),
  setIsSpoofDetected: (isSpoofDetected) => set({ isSpoofDetected }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setFullState: (state) => set(state),
  reset: () => set(initialState),
}));
