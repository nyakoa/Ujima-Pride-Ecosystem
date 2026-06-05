import { pgTable, serial, integer, numeric, text, timestamp, pgEnum, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { loanApplicationsTable } from "./loanApplications";

export const riskLevelEnum = pgEnum("risk_level", ["low", "medium", "high", "very_high"]);

export const aiAssessmentsTable = pgTable("ai_assessments", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull().references(() => loanApplicationsTable.id),
  creditScore: numeric("credit_score", { precision: 5, scale: 2 }),
  riskScore: numeric("risk_score", { precision: 5, scale: 2 }),
  confidenceScore: numeric("confidence_score", { precision: 5, scale: 2 }),
  approvalProbability: numeric("approval_probability", { precision: 5, scale: 2 }),
  recommendedLimit: numeric("recommended_limit", { precision: 15, scale: 2 }),
  riskLevel: riskLevelEnum("risk_level"),
  scoutSummary: text("scout_summary"),
  guardianSummary: text("guardian_summary"),
  hunterSummary: text("hunter_summary"),
  loanTerms: json("loan_terms"),
  repaymentPlan: json("repayment_plan"),
  scoutCompletedAt: timestamp("scout_completed_at"),
  guardianCompletedAt: timestamp("guardian_completed_at"),
  hunterCompletedAt: timestamp("hunter_completed_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAiAssessmentSchema = createInsertSchema(aiAssessmentsTable).omit({
  id: true, createdAt: true, updatedAt: true,
});
export type InsertAiAssessment = z.infer<typeof insertAiAssessmentSchema>;
export type AiAssessment = typeof aiAssessmentsTable.$inferSelect;
