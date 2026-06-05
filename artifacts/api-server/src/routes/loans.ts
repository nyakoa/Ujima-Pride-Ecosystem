import { Router } from "express";
import { db, loanProductsTable, loanApplicationsTable, loansTable, usersTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { authenticate, type AuthRequest } from "../middlewares/auth";
import { runAiPipeline } from "../lib/aiPipeline";

const router = Router();

function formatProduct(p: any) {
  return {
    id: p.id,
    name: p.name,
    type: p.type,
    description: p.description,
    minAmount: parseFloat(p.minAmount || "0"),
    maxAmount: parseFloat(p.maxAmount || "0"),
    minTenureMonths: p.minTenureMonths,
    maxTenureMonths: p.maxTenureMonths,
    interestRate: parseFloat(p.interestRate || "0"),
    requirements: p.requirements,
    isActive: p.isActive,
  };
}

function formatApp(app: any, product?: any) {
  return {
    id: app.id,
    userId: app.userId,
    loanProductId: app.loanProductId,
    loanProduct: product ? formatProduct(product) : undefined,
    requestedAmount: parseFloat(app.requestedAmount || "0"),
    tenureMonths: app.tenureMonths,
    purpose: app.purpose,
    status: app.status,
    employmentStatus: app.employmentStatus,
    monthlyIncome: parseFloat(app.monthlyIncome || "0"),
    approvedAmount: app.approvedAmount ? parseFloat(app.approvedAmount) : null,
    approvedTenure: app.approvedTenure,
    adminNotes: app.adminNotes,
    rejectionReason: app.rejectionReason,
    pipelineStage: app.pipelineStage,
    createdAt: app.createdAt.toISOString(),
    updatedAt: app.updatedAt.toISOString(),
  };
}

function formatLoan(loan: any, product?: any, memberName?: string) {
  return {
    id: loan.id,
    userId: loan.userId,
    applicationId: loan.applicationId,
    loanProduct: product ? formatProduct(product) : undefined,
    principalAmount: parseFloat(loan.principalAmount || "0"),
    outstandingBalance: parseFloat(loan.outstandingBalance || "0"),
    interestRate: parseFloat(loan.interestRate || "0"),
    tenureMonths: loan.tenureMonths,
    monthlyInstalment: parseFloat(loan.monthlyInstalment || "0"),
    totalRepaid: parseFloat(loan.totalRepaid || "0"),
    nextPaymentDate: loan.nextPaymentDate?.toISOString() || null,
    maturityDate: loan.maturityDate?.toISOString() || null,
    status: loan.status,
    disbursedAt: loan.disbursedAt.toISOString(),
    memberName: memberName || null,
  };
}

// GET /api/loan-products
router.get("/loan-products", async (_req, res) => {
  const products = await db.select().from(loanProductsTable).where(eq(loanProductsTable.isActive, true));
  res.json(products.map(formatProduct));
});

// GET /api/loan-products/:id
router.get("/loan-products/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [product] = await db.select().from(loanProductsTable).where(eq(loanProductsTable.id, id)).limit(1);
  if (!product) {
    res.status(404).json({ error: "Loan product not found" });
    return;
  }
  res.json(formatProduct(product));
});

// GET /api/loan-applications
router.get("/loan-applications", authenticate, async (req: AuthRequest, res) => {
  const applications = await db.select().from(loanApplicationsTable)
    .where(eq(loanApplicationsTable.userId, req.user!.id))
    .orderBy(desc(loanApplicationsTable.createdAt));

  const productIds = [...new Set(applications.map(a => a.loanProductId))];
  const products = productIds.length > 0
    ? await db.select().from(loanProductsTable)
    : [];
  const productMap = new Map(products.map(p => [p.id, p]));

  res.json(applications.map(a => formatApp(a, productMap.get(a.loanProductId))));
});

// POST /api/loan-applications
router.post("/loan-applications", authenticate, async (req: AuthRequest, res) => {
  const {
    loanProductId, requestedAmount, tenureMonths, purpose,
    employmentStatus, employerName, monthlyIncome, otherIncome,
    existingLoans, businessName, businessType, businessRevenue, collateralDescription
  } = req.body;

  if (!loanProductId || !requestedAmount || !tenureMonths || !purpose || !monthlyIncome) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const [product] = await db.select().from(loanProductsTable).where(eq(loanProductsTable.id, loanProductId)).limit(1);
  if (!product) {
    res.status(400).json({ error: "Invalid loan product" });
    return;
  }

  const [application] = await db.insert(loanApplicationsTable).values({
    userId: req.user!.id,
    loanProductId,
    requestedAmount: requestedAmount.toString(),
    tenureMonths,
    purpose,
    employmentStatus,
    employerName,
    monthlyIncome: monthlyIncome.toString(),
    otherIncome: otherIncome?.toString(),
    existingLoans: existingLoans?.toString(),
    businessName,
    businessType,
    businessRevenue: businessRevenue?.toString(),
    collateralDescription,
    status: "submitted",
    pipelineStage: "application_received",
  }).returning();

  // Trigger AI pipeline asynchronously
  runAiPipeline(application.id).catch(console.error);

  res.status(201).json(formatApp(application, product));
});

// GET /api/loan-applications/:id
router.get("/loan-applications/:id", authenticate, async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  const [app] = await db.select().from(loanApplicationsTable)
    .where(and(eq(loanApplicationsTable.id, id), eq(loanApplicationsTable.userId, req.user!.id)))
    .limit(1);
  if (!app) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  const [product] = await db.select().from(loanProductsTable).where(eq(loanProductsTable.id, app.loanProductId)).limit(1);
  res.json(formatApp(app, product));
});

// GET /api/loan-applications/:id/status
router.get("/loan-applications/:id/status", authenticate, async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  const [app] = await db.select().from(loanApplicationsTable)
    .where(and(eq(loanApplicationsTable.id, id), eq(loanApplicationsTable.userId, req.user!.id)))
    .limit(1);
  if (!app) {
    res.status(404).json({ error: "Application not found" });
    return;
  }

  const stageOrder = [
    "application_received", "profile_analysis", "risk_assessment",
    "recommendation_generation", "administrator_review", "decision_issued"
  ];
  const currentIdx = stageOrder.indexOf(app.pipelineStage || "application_received");

  const stages = [
    { name: "application_received", label: "Application Received", labelSw: "Maombi Yamepokelewa" },
    { name: "profile_analysis", label: "Profile Analysis", labelSw: "Uchambuzi wa Wasifu" },
    { name: "risk_assessment", label: "Risk Assessment", labelSw: "Tathmini ya Hatari" },
    { name: "recommendation_generation", label: "Recommendation Generation", labelSw: "Uzalishaji wa Mapendekezo" },
    { name: "administrator_review", label: "Administrator Review", labelSw: "Mapitio ya Msimamizi" },
    { name: "decision_issued", label: "Decision Issued", labelSw: "Uamuzi Umetolewa" },
  ].map((s, i) => ({
    ...s,
    status: i < currentIdx ? "completed" : i === currentIdx ? "in_progress" : "pending",
    completedAt: i < currentIdx ? new Date().toISOString() : null,
  }));

  res.json({
    applicationId: app.id,
    currentStage: app.pipelineStage || "application_received",
    stages,
  });
});

// GET /api/loans
router.get("/loans", authenticate, async (req: AuthRequest, res) => {
  const loans = await db.select().from(loansTable)
    .where(eq(loansTable.userId, req.user!.id))
    .orderBy(desc(loansTable.createdAt));

  const appIds = [...new Set(loans.map(l => l.applicationId))];
  const products: any[] = [];
  const productMap = new Map<number, any>();

  for (const loan of loans) {
    const [app] = await db.select().from(loanApplicationsTable).where(eq(loanApplicationsTable.id, loan.applicationId)).limit(1);
    if (app) {
      const [p] = await db.select().from(loanProductsTable).where(eq(loanProductsTable.id, app.loanProductId)).limit(1);
      if (p) productMap.set(loan.id, p);
    }
  }

  res.json(loans.map(l => formatLoan(l, productMap.get(l.id))));
});

// GET /api/loans/:id
router.get("/loans/:id", authenticate, async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  const [loan] = await db.select().from(loansTable)
    .where(and(eq(loansTable.id, id), eq(loansTable.userId, req.user!.id)))
    .limit(1);
  if (!loan) {
    res.status(404).json({ error: "Loan not found" });
    return;
  }
  const [app] = await db.select().from(loanApplicationsTable).where(eq(loanApplicationsTable.id, loan.applicationId)).limit(1);
  let product;
  if (app) {
    [product] = await db.select().from(loanProductsTable).where(eq(loanProductsTable.id, app.loanProductId)).limit(1);
  }
  res.json(formatLoan(loan, product));
});

export default router;
