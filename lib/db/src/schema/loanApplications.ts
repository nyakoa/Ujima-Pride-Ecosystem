import { pgTable, serial, integer, text, numeric, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { loanProductsTable } from "./loanProducts";

export const applicationStatusEnum = pgEnum("application_status", [
  "submitted", "under_review", "additional_info_required", "approved", "rejected", "disbursed"
]);

export const pipelineStageEnum = pgEnum("pipeline_stage", [
  "application_received", "profile_analysis", "risk_assessment",
  "recommendation_generation", "administrator_review", "decision_issued"
]);

export const loanApplicationsTable = pgTable("loan_applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  loanProductId: integer("loan_product_id").notNull().references(() => loanProductsTable.id),
  requestedAmount: numeric("requested_amount", { precision: 15, scale: 2 }).notNull(),
  tenureMonths: integer("tenure_months").notNull(),
  purpose: text("purpose").notNull(),
  employmentStatus: text("employment_status").notNull(),
  employerName: text("employer_name"),
  monthlyIncome: numeric("monthly_income", { precision: 15, scale: 2 }).notNull(),
  otherIncome: numeric("other_income", { precision: 15, scale: 2 }),
  existingLoans: numeric("existing_loans", { precision: 15, scale: 2 }),
  businessName: text("business_name"),
  businessType: text("business_type"),
  businessRevenue: numeric("business_revenue", { precision: 15, scale: 2 }),
  collateralDescription: text("collateral_description"),
  status: applicationStatusEnum("status").notNull().default("submitted"),
  pipelineStage: pipelineStageEnum("pipeline_stage").default("application_received"),
  approvedAmount: numeric("approved_amount", { precision: 15, scale: 2 }),
  approvedTenure: integer("approved_tenure"),
  adminNotes: text("admin_notes"),
  rejectionReason: text("rejection_reason"),
  reviewedBy: integer("reviewed_by").references(() => usersTable.id),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertLoanApplicationSchema = createInsertSchema(loanApplicationsTable).omit({
  id: true, createdAt: true, updatedAt: true,
});
export type InsertLoanApplication = z.infer<typeof insertLoanApplicationSchema>;
export type LoanApplication = typeof loanApplicationsTable.$inferSelect;
