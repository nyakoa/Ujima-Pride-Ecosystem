import { Router } from "express";
import { db, aiAssessmentsTable, loanApplicationsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authenticate, requireAdmin, type AuthRequest } from "../middlewares/auth";
import { runAiPipeline } from "../lib/aiPipeline";

const router = Router();

function formatAssessment(a: any) {
  return {
    id: a.id,
    applicationId: a.applicationId,
    creditScore: a.creditScore ? parseFloat(a.creditScore) : 0,
    riskScore: a.riskScore ? parseFloat(a.riskScore) : 0,
    confidenceScore: a.confidenceScore ? parseFloat(a.confidenceScore) : 0,
    approvalProbability: a.approvalProbability ? parseFloat(a.approvalProbability) : 0,
    recommendedLimit: a.recommendedLimit ? parseFloat(a.recommendedLimit) : 0,
    riskLevel: a.riskLevel || "medium",
    scoutSummary: a.scoutSummary,
    guardianSummary: a.guardianSummary,
    hunterSummary: a.hunterSummary,
    loanTerms: a.loanTerms,
    repaymentPlan: a.repaymentPlan,
    completedAt: a.completedAt?.toISOString() || null,
    createdAt: a.createdAt.toISOString(),
  };
}

// GET /api/ai/assessments/:applicationId
router.get("/assessments/:applicationId", authenticate, async (req: AuthRequest, res) => {
  const applicationId = parseInt(req.params.applicationId);
  const [assessment] = await db.select().from(aiAssessmentsTable)
    .where(eq(aiAssessmentsTable.applicationId, applicationId))
    .limit(1);
  if (!assessment) {
    res.status(404).json({ error: "Assessment not found" });
    return;
  }
  res.json(formatAssessment(assessment));
});

// POST /api/ai/trigger/:applicationId
router.post("/trigger/:applicationId", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  const applicationId = parseInt(req.params.applicationId);
  const [app] = await db.select().from(loanApplicationsTable)
    .where(eq(loanApplicationsTable.id, applicationId))
    .limit(1);
  if (!app) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  runAiPipeline(applicationId).catch(console.error);
  res.json({ message: "AI pipeline triggered" });
});

export default router;
