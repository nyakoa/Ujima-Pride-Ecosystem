import { Router } from "express";
import { db, loansTable, loanApplicationsTable, loanProductsTable, usersTable, aiAssessmentsTable } from "@workspace/db";
import { eq, count, sql, desc, and, gte } from "drizzle-orm";
import { authenticate, requireAdmin } from "../middlewares/auth";

const router = Router();

// GET /api/analytics/portfolio
router.get("/portfolio", authenticate, requireAdmin, async (_req, res) => {
  const loans = await db.select().from(loansTable);
  const applications = await db.select().from(loanApplicationsTable).where(eq(loanApplicationsTable.status, "disbursed"));

  const totalDisbursed = loans.reduce((s, l) => s + parseFloat(l.principalAmount || "0"), 0);
  const totalOutstanding = loans.filter(l => l.status === "active").reduce((s, l) => s + parseFloat(l.outstandingBalance || "0"), 0);
  const totalRepaid = loans.reduce((s, l) => s + parseFloat(l.totalRepaid || "0"), 0);
  const averageLoanSize = loans.length > 0 ? totalDisbursed / loans.length : 0;
  const averageTenure = loans.length > 0 ? loans.reduce((s, l) => s + l.tenureMonths, 0) / loans.length : 0;

  // Product breakdown via application join
  const allApps = await db.select().from(loanApplicationsTable);
  const products = await db.select().from(loanProductsTable);
  const productMap = new Map(products.map(p => [p.id, p]));

  const productGroups = new Map<string, { count: number; totalAmount: number }>();
  for (const app of allApps) {
    const product = productMap.get(app.loanProductId);
    const type = product?.type || "other";
    const existing = productGroups.get(type) || { count: 0, totalAmount: 0 };
    productGroups.set(type, {
      count: existing.count + 1,
      totalAmount: existing.totalAmount + parseFloat(app.requestedAmount || "0"),
    });
  }

  const productBreakdown = Array.from(productGroups.entries()).map(([productType, data]) => ({
    productType, count: data.count, totalAmount: data.totalAmount,
  }));

  res.json({ totalDisbursed, totalOutstanding, totalRepaid, averageLoanSize, averageTenure, productBreakdown });
});

// GET /api/analytics/risk-distribution
router.get("/risk-distribution", authenticate, requireAdmin, async (_req, res) => {
  const assessments = await db.select().from(aiAssessmentsTable);
  const distribution = { low: 0, medium: 0, high: 0, veryHigh: 0 };
  for (const a of assessments) {
    if (a.riskLevel === "low") distribution.low++;
    else if (a.riskLevel === "medium") distribution.medium++;
    else if (a.riskLevel === "high") distribution.high++;
    else if (a.riskLevel === "very_high") distribution.veryHigh++;
  }
  res.json(distribution);
});

// GET /api/analytics/lending-trends
router.get("/lending-trends", authenticate, requireAdmin, async (_req, res) => {
  const loans = await db.select().from(loansTable).orderBy(desc(loansTable.disbursedAt));
  const applications = await db.select().from(loanApplicationsTable).orderBy(desc(loanApplicationsTable.createdAt));

  const monthMap = new Map<string, { disbursed: number; repaid: number; applications: number }>();

  // Generate last 12 months
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthMap.set(key, { disbursed: 0, repaid: 0, applications: 0 });
  }

  for (const loan of loans) {
    const d = new Date(loan.disbursedAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (monthMap.has(key)) {
      const m = monthMap.get(key)!;
      m.disbursed += parseFloat(loan.principalAmount || "0");
      m.repaid += parseFloat(loan.totalRepaid || "0");
    }
  }

  for (const app of applications) {
    const d = new Date(app.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (monthMap.has(key)) {
      monthMap.get(key)!.applications++;
    }
  }

  const result = Array.from(monthMap.entries()).map(([month, data]) => ({
    month,
    disbursed: data.disbursed,
    repaid: data.repaid,
    applications: data.applications,
  }));

  res.json(result);
});

// GET /api/analytics/member-growth
router.get("/member-growth", authenticate, requireAdmin, async (_req, res) => {
  const users = await db.select().from(usersTable)
    .where(eq(usersTable.role, "applicant"))
    .orderBy(usersTable.createdAt);

  const monthMap = new Map<string, number>();

  // Last 12 months
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthMap.set(key, 0);
  }

  for (const user of users) {
    const d = new Date(user.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (monthMap.has(key)) {
      monthMap.set(key, (monthMap.get(key) || 0) + 1);
    }
  }

  let runningTotal = Math.max(0, users.length - Array.from(monthMap.values()).reduce((s, v) => s + v, 0));
  const result = Array.from(monthMap.entries()).map(([month, newMembers]) => {
    runningTotal += newMembers;
    return { month, newMembers, totalMembers: runningTotal };
  });

  res.json(result);
});

export default router;
