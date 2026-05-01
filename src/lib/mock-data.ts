export const MOCK_PERSONAS = {
  priya: {
    customer: {
      full_name: "Priya Sharma",
      aadhaar_last4: "7842",
      pan: "ABCPS1234A",
      dob: "1992-03-15",
      age_estimated: 34,
      age_declared: 34,
      gender: "Female",
      address: "B-204, Prestige Lakeside, Whitefield, Bangalore 560066",
      employer: "Tata Consultancy Services",
      income_declared: 85000,
      loan_purpose: "Home Renovation",
      loan_amount_requested: 1500000,
      email: "priya.sharma@email.com",
    },
    aadhaar: {
      match_score: 98.4,
      age_estimated: 34,
      uidai_reference: "UIDAI-REF-2026-88214779",
      face_quality: "HIGH",
      liveness_server: "PASS",
    },
    digilocker: {
      pan: {
        number: "ABCPS1234A",
        name: "PRIYA SHARMA",
        fathers_name: "RAJESH SHARMA",
        dob: "15/03/1992",
        status: "ACTIVE",
        verified: true,
      },
      dl: {
        number: "KA-0120202200001234",
        name: "PRIYA SHARMA",
        dob: "15/03/1992",
        validity: "2032-03-14",
        address: "B-204, Prestige Lakeside, Whitefield, Bangalore 560066",
        verified: true,
      },
    },
    ckyc: {
      kin: "KIN-88214779",
      name: "PRIYA SHARMA",
      name_match: true,
      address_match: true,
      pan_match: true,
      status: "VERIFIED",
    },
    cibil: {
      score: 762,
      band: "GOOD",
      existing_loans: 1,
      delinquency_count: 0,
      oldest_account: "2018-06-01",
      total_outstanding: 320000,
      monthly_emi: 8500,
    },
    aa: {
      fip_name: "HDFC Bank",
      months_data: 6,
      avg_balance: 145000,
      monthly_income: 87000,
      monthly_expenses: 42000,
      transaction_count: 234,
      unique_merchants: 47,
      income_regularity: 94,
      salary_dates: ["01", "01", "01", "01", "01", "01"],
      top_categories: [
        { category: "Salary", amount: 522000 },
        { category: "UPI Transfer", amount: 185000 },
        { category: "Shopping", amount: 72000 },
        { category: "Bills & Utilities", amount: 48000 },
      ],
    },
  },

  rahul: {
    customer: {
      full_name: "Rahul Verma",
      aadhaar_last4: "3156",
      pan: "BVKPV5678B",
      dob: "1998-08-22",
      age_estimated: 28,
      age_declared: 28,
      gender: "Male",
      address: "42, Sector 15, Noida, Uttar Pradesh 201301",
      employer: "Freelance Web Developer",
      income_declared: 45000,
      loan_purpose: "Personal Loan",
      loan_amount_requested: 500000,
      email: "rahul.verma@email.com",
    },
    aadhaar: {
      match_score: 96.1,
      age_estimated: 28,
      uidai_reference: "UIDAI-REF-2026-55672341",
      face_quality: "MEDIUM",
      liveness_server: "PASS",
    },
    digilocker: {
      pan: {
        number: "BVKPV5678B",
        name: "RAHUL VERMA",
        fathers_name: "SURESH VERMA",
        dob: "22/08/1998",
        status: "ACTIVE",
        verified: true,
      },
      dl: {
        number: "UP-5020201900005678",
        name: "RAHUL VERMA",
        dob: "22/08/1998",
        validity: "2039-08-21",
        address: "42, Sector 15, Noida, Uttar Pradesh 201301",
        verified: true,
      },
    },
    ckyc: {
      kin: "KIN-55672341",
      name: "RAHUL VERMA",
      name_match: true,
      address_match: true,
      pan_match: true,
      status: "VERIFIED",
    },
    cibil: {
      score: 680,
      band: "FAIR",
      existing_loans: 2,
      delinquency_count: 1,
      oldest_account: "2021-01-15",
      total_outstanding: 180000,
      monthly_emi: 12000,
    },
    aa: {
      fip_name: "ICICI Bank",
      months_data: 6,
      avg_balance: 38000,
      monthly_income: 47000,
      monthly_expenses: 35000,
      transaction_count: 156,
      unique_merchants: 28,
      income_regularity: 62,
      salary_dates: ["05", "08", "03", "12", "07", "04"],
      top_categories: [
        { category: "Freelance Income", amount: 282000 },
        { category: "UPI Transfer", amount: 120000 },
        { category: "Food & Dining", amount: 54000 },
        { category: "Shopping", amount: 36000 },
      ],
    },
  },
};

export type PersonaKey = keyof typeof MOCK_PERSONAS;

export function getPersona(key: PersonaKey) {
  return MOCK_PERSONAS[key];
}

export function getDefaultPersona() {
  return MOCK_PERSONAS.priya;
}

export function getPersonaForPhone(phone: string) {
  const lastDigit = parseInt(phone.slice(-1), 10);
  return lastDigit % 2 === 0 ? MOCK_PERSONAS.rahul : MOCK_PERSONAS.priya;
}
