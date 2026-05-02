import type { AAProvider, AAFinancialData } from "../types";

/**
 * Setu AA Sandbox Integration
 *
 * Uses Setu FIU sandbox APIs to simulate Account Aggregator flow.
 * In sandbox mode, Setu returns synthetic financial data for test users.
 *
 * Flow: Create consent → Wait for approval → Fetch FI data
 * Sandbox auto-approves consents after a short delay.
 */
export class SetuAAProvider implements AAProvider {
  private baseUrl: string;
  private clientId: string;
  private clientSecret: string;

  constructor() {
    this.baseUrl = process.env.SETU_AA_BASE_URL || "https://fiu-sandbox.setu.co";
    this.clientId = process.env.SETU_CLIENT_ID || "";
    this.clientSecret = process.env.SETU_CLIENT_SECRET || "";
  }

  private async getAccessToken(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/v2/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientID: this.clientId,
        secret: this.clientSecret,
      }),
    });

    if (!response.ok) {
      throw new Error(`Setu auth failed: ${response.status}`);
    }

    const data = await response.json();
    return data.accessToken;
  }

  private async createConsent(token: string, phone: string): Promise<string> {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

    const response = await fetch(`${this.baseUrl}/v2/consents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-product-instance-id": this.clientId,
      },
      body: JSON.stringify({
        consentDuration: { unit: "MONTH", value: 6 },
        dataRange: {
          from: sixMonthsAgo.toISOString(),
          to: now.toISOString(),
        },
        context: [{ key: "accounttype", value: "SAVINGS" }],
        Customer: { id: `${phone}@onemoney` },
        FIDataRange: {
          from: sixMonthsAgo.toISOString(),
          to: now.toISOString(),
        },
        Purpose: { code: "101", text: "Loan Processing" },
        fiTypes: ["DEPOSIT"],
        redirectUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      }),
    });

    if (!response.ok) {
      throw new Error(`Setu consent creation failed: ${response.status}`);
    }

    const data = await response.json();
    return data.id;
  }

  private async pollConsentStatus(token: string, consentId: string): Promise<boolean> {
    const maxAttempts = 10;
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, 2000));

      const response = await fetch(`${this.baseUrl}/v2/consents/${consentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) continue;

      const data = await response.json();
      if (data.status === "ACTIVE") return true;
      if (data.status === "REJECTED" || data.status === "EXPIRED") return false;
    }
    return false;
  }

  private async fetchFIData(token: string, consentId: string): Promise<AAFinancialData> {
    const response = await fetch(`${this.baseUrl}/v2/data/fetch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ consentId, format: "json" }),
    });

    if (!response.ok) {
      throw new Error(`Setu data fetch failed: ${response.status}`);
    }

    const data = await response.json();
    return this.transformSetuData(data);
  }

  private transformSetuData(raw: Record<string, unknown>): AAFinancialData {
    // Setu sandbox returns structured FI data; transform to our schema
    const accounts = (raw.fIData as Array<Record<string, unknown>>) || [];
    const transactions = accounts.flatMap(
      (a) => (a.transactions as Array<Record<string, unknown>>) || []
    );

    const deposits = transactions.filter((t) => t.type === "CREDIT");
    const withdrawals = transactions.filter((t) => t.type === "DEBIT");

    const totalIncome = deposits.reduce((s, t) => s + Number(t.amount || 0), 0);
    const totalExpenses = withdrawals.reduce((s, t) => s + Number(t.amount || 0), 0);
    const months = 6;

    const merchantSet = new Set(transactions.map((t) => t.narration as string));

    return {
      fip_name: (accounts[0]?.fipId as string) || "Sandbox FIP",
      months_data: months,
      avg_balance: Math.round(totalIncome / months - totalExpenses / months),
      monthly_income: Math.round(totalIncome / months),
      monthly_expenses: Math.round(totalExpenses / months),
      transaction_count: transactions.length,
      unique_merchants: merchantSet.size,
      income_regularity: this.computeRegularity(deposits, months),
      salary_dates: this.extractSalaryDates(deposits),
      top_categories: this.categorizeTransactions(transactions),
    };
  }

  private computeRegularity(
    deposits: Array<Record<string, unknown>>,
    months: number
  ): number {
    // Simple heuristic: if there's at least 1 deposit per month, score is high
    const monthsWithDeposits = new Set(
      deposits.map((d) => new Date(d.transactionTimestamp as string).getMonth())
    ).size;
    return Math.round((monthsWithDeposits / months) * 100);
  }

  private extractSalaryDates(deposits: Array<Record<string, unknown>>): string[] {
    // Find the most common day-of-month for large deposits
    return deposits
      .filter((d) => Number(d.amount || 0) > 20000)
      .slice(0, 6)
      .map((d) => {
        const day = new Date(d.transactionTimestamp as string).getDate();
        return day.toString().padStart(2, "0");
      });
  }

  private categorizeTransactions(
    transactions: Array<Record<string, unknown>>
  ): Array<{ category: string; amount: number }> {
    const categories: Record<string, number> = {};
    for (const t of transactions) {
      const narration = (t.narration as string) || "Other";
      const category = this.inferCategory(narration);
      categories[category] = (categories[category] || 0) + Number(t.amount || 0);
    }

    return Object.entries(categories)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4)
      .map(([category, amount]) => ({ category, amount: Math.round(amount) }));
  }

  private inferCategory(narration: string): string {
    const lower = narration.toLowerCase();
    if (lower.includes("salary") || lower.includes("employer")) return "Salary";
    if (lower.includes("upi")) return "UPI Transfer";
    if (lower.includes("bill") || lower.includes("utility")) return "Bills & Utilities";
    if (lower.includes("food") || lower.includes("swiggy") || lower.includes("zomato"))
      return "Food & Dining";
    if (lower.includes("amazon") || lower.includes("flipkart")) return "Shopping";
    return "Other";
  }

  async fetchFinancialData(_sessionId: string, phone: string): Promise<AAFinancialData> {
    const token = await this.getAccessToken();
    const consentId = await this.createConsent(token, phone);
    const approved = await this.pollConsentStatus(token, consentId);

    if (!approved) {
      throw new Error("AA consent not approved within timeout");
    }

    return this.fetchFIData(token, consentId);
  }
}
