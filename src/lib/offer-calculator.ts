import { LOAN_PRODUCTS } from "@/constants/policy-rules";
import { LoanProduct, RiskTier, LoanOffer } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { speechScoreToRateAdjustment } from "./speech-analysis";

function calculateEMI(
  principal: number,
  annualRate: number,
  months: number
): number {
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) return principal / months;
  const factor = Math.pow(1 + monthlyRate, months);
  return Math.round((principal * monthlyRate * factor) / (factor - 1));
}

export function generateOffers(
  sessionId: string,
  requestedAmount: number,
  riskTier: RiskTier,
  monthlyIncome: number,
  speechAssessmentScore = 75
): LoanOffer[] {
  const maxEligibleByIncome = monthlyIncome * 60;
  const offers: LoanOffer[] = [];
  const speechRateAdjBps = speechScoreToRateAdjustment(speechAssessmentScore);
  const speechRateAdj = speechRateAdjBps / 100;

  for (const product of LOAN_PRODUCTS) {
    const amount = Math.min(
      requestedAmount,
      product.maxAmount,
      maxEligibleByIncome
    );

    if (amount < product.minAmount) continue;

    const baseRate = product.rateByTier[riskTier];
    const rate = Math.round((baseRate + speechRateAdj) * 100) / 100;
    const preferredTenure =
      product.tenureOptions[Math.floor(product.tenureOptions.length / 2)];
    const emi = calculateEMI(amount, rate, preferredTenure);
    const fee = Math.round(amount * (product.processingFee / 100));

    offers.push({
      id: uuidv4(),
      session_id: sessionId,
      product_name: product.name,
      eligible_amount: amount,
      interest_rate: rate,
      tenure_months: preferredTenure,
      emi,
      processing_fee: fee,
      is_selected: false,
      offer_status: "generated",
      created_at: new Date().toISOString(),
    });
  }

  return offers;
}

export function recalculateOffer(
  offer: LoanOffer,
  newTenure?: number,
  newAmount?: number
): LoanOffer {
  const amount = newAmount || offer.eligible_amount;
  const tenure = newTenure || offer.tenure_months;
  const emi = calculateEMI(amount, offer.interest_rate, tenure);

  const product = LOAN_PRODUCTS.find((p) => p.name === offer.product_name);
  const fee = product
    ? Math.round(amount * (product.processingFee / 100))
    : offer.processing_fee;

  return {
    ...offer,
    eligible_amount: amount,
    tenure_months: tenure,
    emi,
    processing_fee: fee,
    offer_status: "negotiated",
  };
}
