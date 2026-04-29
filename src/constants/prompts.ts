export const RISK_CLASSIFICATION_PROMPT = `You are VERITAS, an RBI-compliant AI credit analyst for Poonawalla Fincorp.

Analyze the customer data and conversation transcript below. Perform a structured risk assessment.

CUSTOMER DATA:
- Name: {name}
- Age: {age}
- CIBIL Score: {cibil_score}
- Monthly Income: INR {income}
- Existing Loans: {existing_loans}
- Delinquency Count: {delinquency_count}
- Loan Amount Requested: INR {loan_amount}
- Loan Purpose: {loan_purpose}
- Digital Trust Score: {digital_trust_score}/100
- Shadow NLP Score: {shadow_nlp_score}/100
- Fraud Events: {fraud_events}

CONVERSATION TRANSCRIPT:
{transcript}

Respond ONLY with valid JSON matching this exact structure:
{
  "risk_tier": 1,
  "confidence": 0.94,
  "reasoning": "Brief explanation of risk assessment",
  "rbi_citations": [{"clause": "Section 3.1", "relevance": "KYC verification completed per RBI Master Direction"}],
  "persona": "Low-risk salaried professional",
  "recommended_products": ["Personal Loan", "Home Renovation Loan"],
  "flags": [],
  "shadow_nlp_analysis": "Customer demonstrated strong financial literacy and consistent responses"
}

Rules:
- risk_tier must be 1 (low risk), 2 (medium risk), or 3 (high risk)
- confidence must be between 0.0 and 1.0
- Include at least 2 RBI citations from: Master Direction on KYC (Section 3.1, 5.1, 7.2, 9), PMLA Section 12, DPDP Act 2023 Section 8/11
- Shadow NLP analysis should assess: vocabulary richness, financial literacy, hesitation patterns, consistency
- recommended_products must be from: "Personal Loan", "Home Renovation Loan", "Business Loan"`;

export const SHADOW_NLP_PROMPT = `Analyze this loan applicant's conversation for creditworthiness signals.

TRANSCRIPT:
{transcript}

Score each dimension 0-100 and provide an overall shadow NLP credit score.

Respond ONLY with valid JSON:
{
  "overall_score": 78,
  "vocabulary_richness": 82,
  "financial_literacy": 75,
  "consistency_score": 80,
  "hesitation_index": 15,
  "confidence_level": 77,
  "coercion_risk": 5,
  "analysis": "Brief one-sentence summary"
}`;

export const NER_EXTRACTION_PROMPT = `Extract named entities from this loan application conversation snippet.

TEXT: {text}

Respond ONLY with valid JSON:
{
  "entities": [
    {"type": "loan_amount", "value": "1500000", "raw": "15 lakhs"},
    {"type": "loan_purpose", "value": "home renovation", "raw": "home renovation"},
    {"type": "employer", "value": "TCS", "raw": "TCS"},
    {"type": "income", "value": "85000", "raw": "85 thousand"},
    {"type": "consent", "value": "yes", "raw": "I agree"}
  ]
}

Entity types: loan_amount, loan_purpose, employer, income, consent, name, age, address, pan, duration.
Only include entities that are clearly stated. Return empty array if none found.`;

export const AGENT_CONVERSATION_PROMPTS: Record<number, string> = {
  0: "Welcome to Poonawalla Fincorp. I am VERITAS, your AI loan advisor. This session is encrypted and RBI V-CIP compliant. I will guide you through a quick loan application that takes about 7 minutes. Before we begin, I need to verify your camera and microphone are working. Can you see and hear me clearly?",

  1: "I need your verbal consent to proceed with KYC verification. This session is being recorded for audit purposes, in compliance with RBI guidelines. Do you consent to proceed with video KYC and data verification?",

  2: "I am now running continuous liveness verification. Please look directly at the camera. I will monitor for any anomalies throughout our session.",

  3: "I will now verify your identity using Aadhaar face authentication. Please look directly at the camera and hold still for 3 seconds.",

  4: "Next, I will pull your PAN and Driving License from DigiLocker. You will see an authorization prompt. Please approve it to continue.",

  5: "I will now access your financial data through the Account Aggregator framework. This requires your consent to pull your bank transaction data. Shall I proceed?",

  6: "I have completed the risk assessment. Let me prepare your personalized loan offers based on your verified profile.",

  7: "Based on your profile, here are your eligible loan products. You can accept an offer or ask me to adjust the terms.",
};
