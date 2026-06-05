import { Router } from "express";
import { db, usersTable, membersTable, loanApplicationsTable, loansTable, loanProductsTable, aiAssessmentsTable } from "@workspace/db";
import { eq, desc, ilike, or, count, sql } from "drizzle-orm";
import { authenticate, requireAdmin, generateTokens, type AuthRequest } from "../middlewares/auth";
import { runAiPipeline } from "../lib/aiPipeline";

const router = Router();

function formatUser(u: any) {
  return {
    id: u.id, email: u.email, firstName: u.firstName, lastName: u.lastName,
    phone: u.phone, role: u.role, isActive: u.isActive, mfaEnabled: u.mfaEnabled,
    createdAt: u.createdAt.toISOString(),
  };
}

function formatApp(app: any, product?: any) {
  return {
    id: app.id, userId: app.userId, loanProductId: app.loanProductId,
    loanProduct: product ? {
      id: product.id, name: product.name, type: product.type,
      minAmount: parseFloat(product.minAmount || "0"),
      maxAmount: parseFloat(product.maxAmount || "0"),
      minTenureMonths: product.minTenureMonths,
      maxTenureMonths: product.maxTenureMonths,
      interestRate: parseFloat(product.interestRate || "0"),
      requirements: product.requirements, isActive: product.isActive,
      description: product.description,
    } : undefined,
    requestedAmount: parseFloat(app.requestedAmount || "0"),
    tenureMonths: app.tenureMonths, purpose: app.purpose, status: app.status,
    employmentStatus: app.employmentStatus,
    monthlyIncome: parseFloat(app.monthlyIncome || "0"),
    approvedAmount: app.approvedAmount ? parseFloat(app.approvedAmount) : null,
    approvedTenure: app.approvedTenure,
    adminNotes: app.adminNotes, rejectionReason: app.rejectionReason,
    pipelineStage: app.pipelineStage,
    createdAt: app.createdAt.toISOString(), updatedAt: app.updatedAt.toISOString(),
  };
}

function formatLoan(loan: any, product?: any, memberName?: string) {
  return {
    id: loan.id, userId: loan.userId, applicationId: loan.applicationId,
    loanProduct: product ? {
      id: product.id, name: product.name, type: product.type,
      minAmount: parseFloat(product.minAmount || "0"),
      maxAmount: parseFloat(product.maxAmount || "0"),
      minTenureMonths: product.minTenureMonths,
      maxTenureMonths: product.maxTenureMonths,
      interestRate: parseFloat(product.interestRate || "0"),
      requirements: product.requirements, isActive: product.isActive,
      description: product.description,
    } : undefined,
    principalAmount: parseFloat(loan.principalAmount || "0"),
    outstandingBalance: parseFloat(loan.outstandingBalance || "0"),
    interestRate: parseFloat(loan.interestRate || "0"),
    tenureMonths: loan.tenureMonths,
    monthlyInstalment: parseFloat(loan.monthlyInstalment || "0"),
    totalRepaid: parseFloat(loan.totalRepaid || "0"),
    nextPaymentDate: loan.nextPaymentDate?.toISOString() || null,
    maturityDate: loan.maturityDate?.toISOString() || null,
    status: loan.status, disbursedAt: loan.disbursedAt.toISOString(),
    memberName: memberName || null,
  };
}

// GET /api/admin/dashboard
router.get("/dashboard", authenticate, requireAdmin, async (_req, res) => {
  const [totalMembers] = await db.select({ count: count() }).from(usersTable).where(eq(usersTable.role, "applicant"));
  const [totalApps] = await db.select({ count: count() }).from(loanApplicationsTable);
  const [pendingApps] = await db.select({ count: count() }).from(loanApplicationsTable)
    .where(eq(loanApplicationsTable.status, "under_review"));
  const [approvedApps] = await db.select({ count: count() }).from(loanApplicationsTable)
    .where(eq(loanApplicationsTable.status, "approved"));
  const [activeLoansRow] = await db.select({ count: count() }).from(loansTable).where(eq(loansTable.status, "active"));
  const allLoans = await db.select().from(loansTable);
  const portfolioValue = allLoans.filter(l => l.status === "active").reduce((s, l) => s + parseFloat(l.outstandingBalance || "0"), 0);
  const defaulted = allLoans.filter(l => l.status === "defaulted").length;
  const defaultRate = allLoans.length > 0 ? (defaulted / allLoans.length) * 100 : 0;
  const approvalRate = (totalApps.count || 0) > 0 ? ((approvedApps.count || 0) / (totalApps.count || 1)) * 100 : 0;

  const recentApps = await db.select().from(loanApplicationsTable)
    .orderBy(desc(loanApplicationsTable.createdAt)).limit(10);
  const productIds = [...new Set(recentApps.map(a => a.loanProductId))];
  const products = await db.select().from(loanProductsTable);
  const productMap = new Map(products.map(p => [p.id, p]));

  const statusGroups = await db.select({
    status: loanApplicationsTable.status,
    count: count(),
  }).from(loanApplicationsTable).groupBy(loanApplicationsTable.status);

  res.json({
    totalMembers: totalMembers.count || 0,
    totalApplications: totalApps.count || 0,
    pendingApplications: pendingApps.count || 0,
    approvedLoans: approvedApps.count || 0,
    activeLoans: activeLoansRow.count || 0,
    portfolioValue,
    defaultRate,
    approvalRate,
    recentApplications: recentApps.map(a => formatApp(a, productMap.get(a.loanProductId))),
    applicationsByStatus: statusGroups.map(g => ({ status: g.status, count: g.count || 0 })),
  });
});

// GET /api/admin/loan-applications
router.get("/loan-applications", authenticate, requireAdmin, async (req, res) => {
  const status = req.query.status as string | undefined;
  const page = parseInt(req.query.page as string || "1");
  const limit = parseInt(req.query.limit as string || "20");
  const offset = (page - 1) * limit;

  let query = db.select().from(loanApplicationsTable);
  if (status) {
    const apps = await db.select().from(loanApplicationsTable)
      .where(eq(loanApplicationsTable.status, status as any))
      .orderBy(desc(loanApplicationsTable.createdAt))
      .limit(limit).offset(offset);
    const [totalRow] = await db.select({ count: count() }).from(loanApplicationsTable)
      .where(eq(loanApplicationsTable.status, status as any));
    const products = await db.select().from(loanProductsTable);
    const productMap = new Map(products.map(p => [p.id, p]));
    res.json({ data: apps.map(a => formatApp(a, productMap.get(a.loanProductId))), total: totalRow.count || 0, page, limit });
    return;
  }

  const apps = await db.select().from(loanApplicationsTable)
    .orderBy(desc(loanApplicationsTable.createdAt))
    .limit(limit).offset(offset);
  const [totalRow] = await db.select({ count: count() }).from(loanApplicationsTable);
  const products = await db.select().from(loanProductsTable);
  const productMap = new Map(products.map(p => [p.id, p]));
  res.json({ data: apps.map(a => formatApp(a, productMap.get(a.loanProductId))), total: totalRow.count || 0, page, limit });
});

// POST /api/admin/loan-applications/:id/review
router.post("/loan-applications/:id/review", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  const { decision, approvedAmount, approvedTenure, adminNotes, rejectionReason } = req.body;

  const [app] = await db.select().from(loanApplicationsTable).where(eq(loanApplicationsTable.id, id)).limit(1);
  if (!app) {
    res.status(404).json({ error: "Application not found" });
    return;
  }

  const newStatus = decision === "approved" ? "approved" : decision === "rejected" ? "rejected" : "additional_info_required";
  const [updated] = await db.update(loanApplicationsTable).set({
    status: newStatus,
    pipelineStage: "decision_issued",
    approvedAmount: approvedAmount?.toString(),
    approvedTenure,
    adminNotes,
    rejectionReason,
    reviewedBy: req.user!.id,
    reviewedAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(loanApplicationsTable.id, id)).returning();

  // If approved, create a loan record
  if (decision === "approved" && approvedAmount) {
    const [assessment] = await db.select().from(aiAssessmentsTable).where(eq(aiAssessmentsTable.applicationId, id)).limit(1);
    const [product] = await db.select().from(loanProductsTable).where(eq(loanProductsTable.id, app.loanProductId)).limit(1);
    const interestRate = parseFloat(product?.interestRate || "14");
    const tenure = approvedTenure || app.tenureMonths;
    const monthlyRate = interestRate / 100 / 12;
    const monthlyInstalment = monthlyRate > 0
      ? (approvedAmount * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / (Math.pow(1 + monthlyRate, tenure) - 1)
      : approvedAmount / tenure;
    const disbursedAt = new Date();
    const maturityDate = new Date(disbursedAt);
    maturityDate.setMonth(maturityDate.getMonth() + tenure);
    const nextPaymentDate = new Date(disbursedAt);
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

    await db.insert(loansTable).values({
      userId: app.userId,
      applicationId: id,
      principalAmount: approvedAmount.toString(),
      outstandingBalance: approvedAmount.toString(),
      interestRate: interestRate.toString(),
      tenureMonths: tenure,
      monthlyInstalment: monthlyInstalment.toFixed(2),
      totalRepaid: "0",
      nextPaymentDate,
      maturityDate,
      status: "active",
      disbursedAt,
    });
  }

  const [product] = await db.select().from(loanProductsTable).where(eq(loanProductsTable.id, updated.loanProductId)).limit(1);
  res.json(formatApp(updated, product));
});

// GET /api/admin/loans
router.get("/loans", authenticate, requireAdmin, async (_req, res) => {
  const loans = await db.select().from(loansTable).orderBy(desc(loansTable.createdAt));
  const products = await db.select().from(loanProductsTable);
  const productMap = new Map(products.map(p => [p.id, p]));
  const users = await db.select().from(usersTable);
  const userMap = new Map(users.map(u => [u.id, u]));

  const result = await Promise.all(loans.map(async (loan) => {
    const [app] = await db.select().from(loanApplicationsTable).where(eq(loanApplicationsTable.id, loan.applicationId)).limit(1);
    const product = app ? productMap.get(app.loanProductId) : undefined;
    const member = userMap.get(loan.userId);
    return formatLoan(loan, product, member ? `${member.firstName} ${member.lastName}` : undefined);
  }));

  res.json(result);
});

// GET /api/admin/members
router.get("/members", authenticate, requireAdmin, async (req, res) => {
  const page = parseInt(req.query.page as string || "1");
  const limit = parseInt(req.query.limit as string || "20");
  const search = req.query.search as string | undefined;
  const offset = (page - 1) * limit;

  let users;
  let total;
  if (search) {
    users = await db.select().from(usersTable)
      .where(or(
        ilike(usersTable.firstName, `%${search}%`),
        ilike(usersTable.lastName, `%${search}%`),
        ilike(usersTable.email, `%${search}%`),
      ))
      .orderBy(desc(usersTable.createdAt)).limit(limit).offset(offset);
    [{ count: total }] = await db.select({ count: count() }).from(usersTable).where(or(
      ilike(usersTable.firstName, `%${search}%`),
      ilike(usersTable.lastName, `%${search}%`),
      ilike(usersTable.email, `%${search}%`),
    ));
  } else {
    users = await db.select().from(usersTable)
      .orderBy(desc(usersTable.createdAt)).limit(limit).offset(offset);
    [{ count: total }] = await db.select({ count: count() }).from(usersTable);
  }

  const members = await db.select().from(membersTable);
  const memberMap = new Map(members.map(m => [m.userId, m]));

  const data = await Promise.all(users.map(async (u) => {
    const m = memberMap.get(u.id);
    const [appCount] = await db.select({ count: count() }).from(loanApplicationsTable).where(eq(loanApplicationsTable.userId, u.id));
    const [loanCount] = await db.select({ count: count() }).from(loansTable).where(eq(loansTable.userId, u.id));
    return {
      id: u.id, email: u.email, firstName: u.firstName, lastName: u.lastName,
      phone: u.phone, role: u.role, isActive: u.isActive,
      kycStatus: m?.kycStatus || "pending",
      totalApplications: appCount.count || 0,
      activeLoans: loanCount.count || 0,
      createdAt: u.createdAt.toISOString(),
    };
  }));

  res.json({ data, total: total || 0, page, limit });
});

// GET /api/admin/members/:id
router.get("/members/:id", authenticate, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!user) {
    res.status(404).json({ error: "Member not found" });
    return;
  }
  const [member] = await db.select().from(membersTable).where(eq(membersTable.userId, id)).limit(1);
  const [appCount] = await db.select({ count: count() }).from(loanApplicationsTable).where(eq(loanApplicationsTable.userId, id));
  const [loanCount] = await db.select({ count: count() }).from(loansTable).where(eq(loansTable.userId, id));
  res.json({
    id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName,
    phone: user.phone, role: user.role, isActive: user.isActive,
    kycStatus: member?.kycStatus || "pending",
    totalApplications: appCount.count || 0,
    activeLoans: loanCount.count || 0,
    createdAt: user.createdAt.toISOString(),
  });
});

// GET /api/admin/users
router.get("/users", authenticate, requireAdmin, async (_req, res) => {
  const users = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));
  res.json(users.map(formatUser));
});

// PATCH /api/admin/users/:id
router.patch("/users/:id", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  const { role, isActive } = req.body;
  const updates: any = {};
  if (role !== undefined) updates.role = role;
  if (isActive !== undefined) updates.isActive = isActive;
  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning();
  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(formatUser(updated));
});

// POST /api/admin/users/:id/deactivate
router.post("/users/:id/deactivate", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  await db.update(usersTable).set({ isActive: false }).where(eq(usersTable.id, id));
  res.json({ message: "User deactivated" });
});

export default router;
