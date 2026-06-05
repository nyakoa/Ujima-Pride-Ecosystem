import { Router } from "express";
import { db, usersTable, membersTable, loanApplicationsTable, loansTable, loanProductsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { authenticate, type AuthRequest } from "../middlewares/auth";

const router = Router();

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

// GET /api/members/kyc
router.get("/kyc", authenticate, async (req: AuthRequest, res) => {
  const [member] = await db.select().from(membersTable).where(eq(membersTable.userId, req.user!.id)).limit(1);
  if (!member) {
    res.status(404).json({ error: "Member profile not found" });
    return;
  }
  res.json({
    id: member.id,
    userId: member.userId,
    dateOfBirth: member.dateOfBirth,
    gender: member.gender,
    county: member.county,
    subCounty: member.subCounty,
    ward: member.ward,
    physicalAddress: member.physicalAddress,
    employmentStatus: member.employmentStatus,
    employerName: member.employerName,
    monthlyIncome: member.monthlyIncome ? parseFloat(member.monthlyIncome) : null,
    otherIncome: member.otherIncome ? parseFloat(member.otherIncome) : null,
    nextOfKinName: member.nextOfKinName,
    nextOfKinPhone: member.nextOfKinPhone,
    nextOfKinRelationship: member.nextOfKinRelationship,
    status: member.kycStatus,
    createdAt: member.createdAt.toISOString(),
  });
});

// POST /api/members/kyc
router.post("/kyc", authenticate, async (req: AuthRequest, res) => {
  const { dateOfBirth, gender, county, subCounty, ward, physicalAddress,
    employmentStatus, employerName, monthlyIncome, otherIncome,
    nextOfKinName, nextOfKinPhone, nextOfKinRelationship } = req.body;

  const [existing] = await db.select().from(membersTable).where(eq(membersTable.userId, req.user!.id)).limit(1);

  const values = {
    dateOfBirth, gender, county, subCounty, ward, physicalAddress,
    employmentStatus, employerName,
    monthlyIncome: monthlyIncome?.toString(),
    otherIncome: otherIncome?.toString(),
    nextOfKinName, nextOfKinPhone, nextOfKinRelationship,
    kycStatus: "submitted" as const,
    updatedAt: new Date(),
  };

  let member;
  if (existing) {
    [member] = await db.update(membersTable).set(values).where(eq(membersTable.userId, req.user!.id)).returning();
  } else {
    [member] = await db.insert(membersTable).values({ userId: req.user!.id, ...values }).returning();
  }

  res.json({
    id: member.id,
    userId: member.userId,
    dateOfBirth: member.dateOfBirth,
    gender: member.gender,
    county: member.county,
    subCounty: member.subCounty,
    ward: member.ward,
    physicalAddress: member.physicalAddress,
    employmentStatus: member.employmentStatus,
    employerName: member.employerName,
    monthlyIncome: member.monthlyIncome ? parseFloat(member.monthlyIncome) : null,
    otherIncome: member.otherIncome ? parseFloat(member.otherIncome) : null,
    nextOfKinName: member.nextOfKinName,
    nextOfKinPhone: member.nextOfKinPhone,
    nextOfKinRelationship: member.nextOfKinRelationship,
    status: member.kycStatus,
    createdAt: member.createdAt.toISOString(),
  });
});

// GET /api/members/dashboard
router.get("/dashboard", authenticate, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const [member] = await db.select().from(membersTable).where(eq(membersTable.userId, userId)).limit(1);
  const applications = await db.select().from(loanApplicationsTable).where(eq(loanApplicationsTable.userId, userId)).orderBy(desc(loanApplicationsTable.createdAt));
  const loans = await db.select().from(loansTable).where(eq(loansTable.userId, userId));

  const totalBorrowed = loans.reduce((s, l) => s + parseFloat(l.principalAmount || "0"), 0);
  const outstandingBalance = loans.filter(l => l.status === "active").reduce((s, l) => s + parseFloat(l.outstandingBalance || "0"), 0);

  // Fetch products for recent applications
  const productIds = [...new Set(applications.slice(0, 5).map(a => a.loanProductId))];
  const products = productIds.length > 0 ? await db.select().from(loanProductsTable).where(
    productIds.length === 1
      ? eq(loanProductsTable.id, productIds[0])
      : eq(loanProductsTable.id, productIds[0])
  ) : [];
  const productMap = new Map(products.map(p => [p.id, p]));

  res.json({
    totalApplications: applications.length,
    activeLoans: loans.filter(l => l.status === "active").length,
    totalBorrowed,
    outstandingBalance,
    kycStatus: member?.kycStatus || "pending",
    recentApplications: applications.slice(0, 5).map(a => formatApp(a, productMap.get(a.loanProductId))),
    activeLoansDetail: loans.filter(l => l.status === "active").slice(0, 3).map(l => formatLoan(l)),
  });
});

export default router;
