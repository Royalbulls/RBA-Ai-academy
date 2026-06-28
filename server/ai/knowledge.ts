import { KnowledgeDoc } from "./types";

// Standard Knowledge Database - SOPs, Training manuals, Policy documents
const KNOWLEDGE_BASE: KnowledgeDoc[] = [
  {
    id: "sop_personal_loan",
    title: "SOP: Personal Loan Disbursal & Verification",
    type: "SOP",
    category: "Loans",
    content: `
Personal Loan Eligibility and Verification Guidelines:
1. Minimum Age: 21 years at the time of application. Max Age: 60 years at maturity.
2. Minimum Monthly Net Salary: INR 25,000 (Metros) / INR 20,000 (Non-Metros).
3. Employment Type: Salaried with minimum 1 year continuous service with current employer, or Self-employed with audited financials for 2 years.
4. Essential Documents Required:
   - Identity Proof (Aadhaar Card, PAN Card, passport, or Voter ID).
   - Address Proof (Utility bills, rental agreement, or Aadhaar).
   - Income Proof: Salary slips for the last 3 months, Form 16, and bank statements for the last 6 months showing salary credit.
5. Minimum Credit Score (CIBIL): 700+. Scores between 650-700 require special credit risk team approvals with a higher interest rate premium of +1.5%.
6. Maximum Loan-to-Income (LTI) ratio: Total monthly EMIs (including existing loans) must not exceed 50% of the net monthly income.
    `.trim()
  },
  {
    id: "sop_business_loan",
    title: "SOP: Business Loan Evaluation Guidelines",
    type: "SOP",
    category: "Loans",
    content: `
Business Loan Credit Assessment Policy:
1. Business Vintage: Minimum 3 years of active operations under the same business entity name.
2. Minimum Annual Turnover: INR 15 Lakhs as per verified GST returns.
3. Profitability: Positive net profit and stable cash flow for the last two financial years (FY24 & FY25).
4. Essential Documents Required:
   - GST Registration certificate and 12-month GST filing returns (GSTR-3B).
   - 12 months corporate bank account statements.
   - Audited Balance Sheet and Profit & Loss Statement by a certified CA for 2 financial years.
   - Owner's KYC (PAN, Aadhaar) and Company PAN.
5. Security/Collateral: Unsecured up to INR 50 Lakhs. Secured business funding requires physical assets / property valuation with an LTV (Loan-to-Value) maximum of 70%.
    `.trim()
  },
  {
    id: "policy_commission_wallet",
    title: "RBA Advisor Commission and Wallet Policy",
    type: "Policy",
    category: "Wallet",
    content: `
RBA Advisor Commission Structure:
1. Personal Loans: 1.5% to 2.5% of the total disbursed loan amount, paid within 15 days of successful disbursal.
2. Business Loans: 2.0% to 3.5% of disbursed loan amount, depending on vintage and funding type.
3. Home Loans / LAP: 0.5% to 1.2% of disbursed loan amount.
4. Wallet Balance Rules:
   - Earned commissions are instantly credited to the Advisor's virtual wallet as 'Pending' status.
   - Upon final verification from the funding bank, the balance shifts to 'Withdrawable'.
   - Minimum withdrawal amount: INR 1,000.
   - TDS of 5% is mandatory under Section 194H of the Income Tax Act.
    `.trim()
  },
  {
    id: "manual_handling_objections",
    title: "Academy Training Manual: Overcoming Sales Objections",
    type: "Manual",
    category: "Academy",
    content: `
Sales objection handling framework for RBA Advisors:
1. Objection: "Interest rates are too high compared to local co-operative banks."
   - Technique (Empathize & Differentiate): Acknowledge their concern. Empathize with the need for cost-efficiency. Explain that RBA partners with 15+ top-tier nationalized banks and NBFCs, guaranteeing instant single-window processing, zero collateral requirements, and flexible tenure terms that local co-operative banks cannot match.
2. Objection: "Is there any hidden processing fee or upfront charges?"
   - Technique (Transparency & Trust): Clarify that RBA is an authorized strategic partner of verified banks. There are absolutely ZERO upfront charges, and the official processing fee of 1-2% is deducted directly during loan disbursal by the respective bank. Warn the client against unverified agents asking for advance security cash.
3. Objection: "I don't have all files like Form 16 or GST returns."
   - Technique (Solution-oriented alternative): Suggest alternative customized lending programs (bank statement banking, surrogate programs based on credit card limit or car vintage) to process their loan.
    `.trim()
  },
  {
    id: "sop_insurance_advisory",
    title: "SOP: General & Health Insurance Product Guidelines",
    type: "SOP",
    category: "Insurance",
    content: `
Health and General Insurance Advisory Guidelines:
1. Partners: RBA offers plans from top 5 certified insurers.
2. Key Health Insurance Metrics:
   - Co-payment: Check if the policy has co-pay for senior citizens. Recommend plans with 0% co-payment.
   - Waiting Period: Pre-existing diseases (PED) have a wait time of 2 to 4 years. Recommend plans with short 2-year PED waits or PED cover riders.
   - Claim Settlement Ratio: Only recommend insurers with a CSR above 95% over the past 3 consecutive years.
3. Commissions: Motor Insurance pays up to 15% OD commission. Health Insurance pays 15% to 25% on fresh policies, and 10% on renewals.
    `.trim()
  }
];

export class KnowledgeEngine {
  /**
   * Search knowledge base using simple query-matching keyword score (mock semantic vector search).
   */
  static search(query: string, maxResults: number = 2): KnowledgeDoc[] {
    if (!query) return [];

    const normalizedQuery = query.toLowerCase();
    const scoredDocs = KNOWLEDGE_BASE.map(doc => {
      let score = 0;
      
      // Keywords matches
      const keywords = normalizedQuery.split(/\s+/);
      keywords.forEach(keyword => {
        if (keyword.length < 3) return; // Skip small helper words
        
        // Exact term match weight
        if (doc.title.toLowerCase().includes(keyword)) {
          score += 10;
        }
        if (doc.category.toLowerCase().includes(keyword)) {
          score += 5;
        }
        if (doc.content.toLowerCase().includes(keyword)) {
          score += 2;
        }
      });

      // Special bonus for category matches
      if (normalizedQuery.includes("loan") && doc.category.toLowerCase() === "loans") {
        score += 8;
      }
      if (normalizedQuery.includes("commission") || normalizedQuery.includes("wallet") || normalizedQuery.includes("earning")) {
        if (doc.category.toLowerCase() === "wallet") score += 8;
      }
      if (normalizedQuery.includes("objection") || normalizedQuery.includes("academy") || normalizedQuery.includes("learn") || normalizedQuery.includes("sell")) {
        if (doc.category.toLowerCase() === "academy") score += 8;
      }

      return { doc, score };
    });

    // Filter documents that matched and sort them
    return scoredDocs
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
      .map(item => item.doc);
  }

  /**
   * Get all knowledge document list metadata for inspection
   */
  static getAllMetadata() {
    return KNOWLEDGE_BASE.map(d => ({
      id: d.id,
      title: d.title,
      type: d.type,
      category: d.category
    }));
  }
}
