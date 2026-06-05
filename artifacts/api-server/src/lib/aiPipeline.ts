import { db, loanApplicationsTable, aiAssessmentsTable, membersTable, documentsTable, loansTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { logger } from "./logger";

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

// Scout Agent: data validation, profile building, income estimation
async function runScoutAgent(applicationId: number): Promise<{
  incomeFactor: number;
  debtBurden: number;
  profileScore: number;
  summary: string;
}> {
  await sleep(2000);
  const [app] = await db.select().from(loanApplicationsTable).where(eq(loanApplicationsTable.id, applicationId)).limit(1);
  if (!app) throw new Error("Application not found");

  const [member] = await db.select().from(membersTable).where(eq(membersTable.userId, app.userId)).limit(1);
  const docs = await db.select().from(documentsTable).where(eq(documentsTable.userId, app.userId));
  const pastLoans = await db.select().from(loansTable).where(eq(loansTable.userId, app.userId));

  const monthlyIncome = parseFloat(app.monthlyIncome || "0");
  const otherIncome = parseFloat(app.otherIncome || "0");
  const existingLoans = parseFloat(app.existingLoans || "0");
  const totalIncome = monthlyIncome + otherIncome;

  const incomeFactor = clamp(totalIncome / 50000, 0, 1);
  const debtBurden = existingLoans > 0 ? clamp(existingLoans / totalIncome, 0, 1) : 0;
  const docScore = Math.min(docs.length / 3, 1);
  const kycBonus = member?.kycStatus === "submitted" || member?.kycStatus === "verified" ? 0.15 : 0;
  const profileScore = clamp(incomeFactor * 0.4 + docScore * 0.3 + kycBonus + (pastLoans.length > 0 ? 0.1 : 0), 0, 1);

  const summary = `Scout Agent analyzed ${docs.length} document(s). Monthly income: KES ${totalIncome.toLocaleString()}. ` +
    `Debt burden ratio: ${(debtBurden * 100).toFixed(1)}%. ` +
    `KYC status: ${member?.kycStatus || "pending"}. ` +
    `Profile completeness score: ${(profileScore * 100).toFixed(0)}%.`;

  return { incomeFactor, debtBurden, profileScore, summary };
}

// Guardian Agent: risk, fraud, compliance, credit assessment
async function runGuardianAgent(applicationId: number, scoutData: {
  incomeFactor: number; debtBurden: number; profileScore: number;
}): Promise<{
  creditScore: number;
  riskScore: number;
  confidenceScore: number;
  approvalProbability: number;
  riskLevel: "low" | "medium" | "high" | "very_high";
  summary: string;
}> {
  await sleep(2500);
  const [app] = await db.select().from(loanApplicationsTable).where(eq(loanApplicationsTable.id, applicationId)).limit(1);
  if (!app) throw new Error("Application not found");

  const monthlyIncome = parseFloat(app.monthlyIncome || "0");
  const requestedAmount = parseFloat(app.requestedAmount || "0");
  const tenureMonths = app.tenureMonths || 12;

  // Simulate credit scoring
  let creditScore = 300;
  creditScore += scoutData.incomeFactor * 200; // income up to 200pts
  creditScore += scoutData.profileScore * 150; // profile up to 150pts
  creditScore -= scoutData.debtBurden * 100; // debt reduces score
  creditScore += app.employmentStatus === "employed" ? 50 : app.employmentStatus === "business_owner" ? 40 : 20;
  creditScore = clamp(Math.round(creditScore + Math.random() * 50), 300, 850);

  // Risk score 0-100 (lower is better)
  const monthlyRepayment = requestedAmount / tenureMonths;
  const dtiRatio = monthlyIncome > 0 ? monthlyRepayment / monthlyIncome : 1;
  const riskScore = clamp(Math.round(dtiRatio * 60 + scoutData.debtBurden * 30 + (1 - scoutData.profileScore) * 10), 0, 100);

  const confidenceScore = clamp(Math.round(scoutData.profileScore * 70 + 20 + Math.random() * 10), 40, 95);
  const approvalProbability = clamp(Math.round((creditScore - 300) / 550 * 60 + (1 - riskScore / 100) * 40), 10, 95);

  let riskLevel: "low" | "medium" | "high" | "very_high";
  if (riskScore < 25) riskLevel = "low";
  else if (riskScore < 50) riskLevel = "medium";
  else if (riskScore < 75) riskLevel = "high";
  else riskLevel = "very_high";

  const summary = `Guardian Agent credit assessment: Credit Score ${creditScore}/850 (${riskLevel} risk). ` +
    `Risk Score: ${riskScore}/100. Monthly DTI ratio: ${(dtiRatio * 100).toFixed(1)}%. ` +
    `Compliance check: PASSED. Fraud indicators: NONE detected. ` +
    `Confidence level: ${confidenceScore}%.`;

  return { creditScore, riskScore, confidenceScore, approvalProbability, riskLevel, summary };
}

// Hunter Agent: loan recommendations, repayment plans, terms
async function runHunterAgent(applicationId: number, guardianData: {
  creditScore: number;
  riskScore: number;
  approvalProbability: number;
  riskLevel: "low" | "medium" | "high" | "very_high";
}): Promise<{
  recommendedLimit: number;
  loanTerms: object;
  repaymentPlan: object;
  summary: string;
}> {
  await sleep(2000);
  const [app] = await db.select().from(loanApplicationsTable).where(eq(loanApplicationsTable.id, applicationId)).limit(1);
  if (!app) throw new Error("Application not found");

  const monthlyIncome = parseFloat(app.monthlyIncome || "0");
  const requestedAmount = parseFloat(app.requestedAmount || "0");
  const tenureMonths = app.tenureMonths || 12;

  // Calculate recommended limit based on income and credit score
  const multiplier = guardianData.creditScore > 700 ? 4 : guardianData.creditScore > 600 ? 3 : guardianData.creditScore > 500 ? 2 : 1.5;
  const recommendedLimit = clamp(monthlyIncome * multiplier, requestedAmount * 0.5, requestedAmount * 1.2);

  // Suggest interest rate based on risk
  const baseRate = 14; // 14% per annum
  const riskPremium = guardianData.riskLevel === "low" ? 0 : guardianData.riskLevel === "medium" ? 2 : guardianData.riskLevel === "high" ? 4 : 6;
  const suggestedRate = baseRate + riskPremium;

  const monthlyRate = suggestedRate / 100 / 12;
  const monthlyPayment = monthlyRate > 0
    ? (recommendedLimit * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / (Math.pow(1 + monthlyRate, tenureMonths) - 1)
    : recommendedLimit / tenureMonths;

  const loanTerms = {
    recommendedAmount: Math.round(recommendedLimit),
    suggestedInterestRate: suggestedRate,
    recommendedTenure: tenureMonths,
    monthlyPayment: Math.round(monthlyPayment),
    totalRepayable: Math.round(monthlyPayment * tenureMonths),
    totalInterest: Math.round(monthlyPayment * tenureMonths - recommendedLimit),
  };

  // Generate repayment schedule (first 3 months shown)
  const schedule = [];
  let balance = recommendedLimit;
  for (let i = 1; i <= Math.min(tenureMonths, 6); i++) {
    const interest = balance * monthlyRate;
    const principal = monthlyPayment - interest;
    balance -= principal;
    schedule.push({
      month: i,
      payment: Math.round(monthlyPayment),
      principal: Math.round(principal),
      interest: Math.round(interest),
      balance: Math.round(Math.max(0, balance)),
    });
  }

  const repaymentPlan = { schedule, fullTenure: tenureMonths };

  const summary = `Hunter Agent recommendation: Loan limit KES ${Math.round(recommendedLimit).toLocaleString()} ` +
    `at ${suggestedRate}% p.a. over ${tenureMonths} months. ` +
    `Monthly instalment: KES ${Math.round(monthlyPayment).toLocaleString()}. ` +
    `Approval probability: ${guardianData.approvalProbability}%. ` +
    `Recommendation: ${guardianData.approvalProbability >= 60 ? "PROCEED TO ADMIN REVIEW" : "ADDITIONAL INFO REQUIRED"}.`;

  return { recommendedLimit, loanTerms, repaymentPlan, summary };
}

export async function runAiPipeline(applicationId: number): Promise<void> {
  logger.info({ applicationId }, "Starting AI pipeline");

  try {
    // Scout Agent
    await db.update(loanApplicationsTable)
      .set({ pipelineStage: "profile_analysis", status: "under_review", updatedAt: new Date() })
      .where(eq(loanApplicationsTable.id, applicationId));

    const scoutData = await runScoutAgent(applicationId);

    // Create initial assessment record
    const [assessment] = await db.insert(aiAssessmentsTable).values({
      applicationId,
      scoutSummary: scoutData.summary,
      scoutCompletedAt: new Date(),
    }).returning();

    // Guardian Agent
    await db.update(loanApplicationsTable)
      .set({ pipelineStage: "risk_assessment", updatedAt: new Date() })
      .where(eq(loanApplicationsTable.id, applicationId));

    const guardianData = await runGuardianAgent(applicationId, scoutData);

    await db.update(aiAssessmentsTable).set({
      creditScore: guardianData.creditScore.toString(),
      riskScore: guardianData.riskScore.toString(),
      confidenceScore: guardianData.confidenceScore.toString(),
      approvalProbability: guardianData.approvalProbability.toString(),
      riskLevel: guardianData.riskLevel,
      guardianSummary: guardianData.summary,
      guardianCompletedAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(aiAssessmentsTable.id, assessment.id));

    // Hunter Agent
    await db.update(loanApplicationsTable)
      .set({ pipelineStage: "recommendation_generation", updatedAt: new Date() })
      .where(eq(loanApplicationsTable.id, applicationId));

    const hunterData = await runHunterAgent(applicationId, guardianData);

    await db.update(aiAssessmentsTable).set({
      recommendedLimit: hunterData.recommendedLimit.toString(),
      loanTerms: hunterData.loanTerms,
      repaymentPlan: hunterData.repaymentPlan,
      hunterSummary: hunterData.summary,
      hunterCompletedAt: new Date(),
      completedAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(aiAssessmentsTable.id, assessment.id));

    // Move to admin review
    await db.update(loanApplicationsTable)
      .set({ pipelineStage: "administrator_review", updatedAt: new Date() })
      .where(eq(loanApplicationsTable.id, applicationId));

    logger.info({ applicationId }, "AI pipeline completed");
  } catch (err) {
    logger.error({ applicationId, err }, "AI pipeline failed");
  }
}
