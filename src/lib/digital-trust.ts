interface AAData {
  avg_balance: number;
  monthly_income: number;
  monthly_expenses: number;
  transaction_count: number;
  unique_merchants: number;
  income_regularity: number;
}

interface TrustScoreBreakdown {
  overall: number;
  transaction_frequency: number;
  merchant_diversity: number;
  income_stability: number;
  savings_ratio: number;
  balance_health: number;
}

export function computeDigitalTrustScore(data: AAData): TrustScoreBreakdown {
  const txFreq = Math.min(100, (data.transaction_count / 300) * 100);
  const merchantDiv = Math.min(100, (data.unique_merchants / 50) * 100);
  const incomeStab = data.income_regularity;

  const savingsRatio =
    data.monthly_income > 0
      ? Math.min(
          100,
          ((data.monthly_income - data.monthly_expenses) /
            data.monthly_income) *
            100 *
            2
        )
      : 0;

  const balanceHealth = Math.min(
    100,
    (data.avg_balance / (data.monthly_expenses || 1)) * 25
  );

  const overall = Math.round(
    txFreq * 0.15 +
      merchantDiv * 0.15 +
      incomeStab * 0.3 +
      savingsRatio * 0.2 +
      balanceHealth * 0.2
  );

  return {
    overall: Math.min(100, Math.max(0, overall)),
    transaction_frequency: Math.round(txFreq),
    merchant_diversity: Math.round(merchantDiv),
    income_stability: Math.round(incomeStab),
    savings_ratio: Math.round(savingsRatio),
    balance_health: Math.round(balanceHealth),
  };
}
