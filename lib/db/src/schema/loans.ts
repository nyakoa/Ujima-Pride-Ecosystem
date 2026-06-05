import { pgTable, serial, integer, numeric, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { loanApplicationsTable } from "./loanApplications";

export const loanStatusEnum = pgEnum("loan_status", ["active", "closed", "defaulted", "written_off"]);

export const loansTable = pgTable("loans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  applicationId: integer("application_id").notNull().references(() => loanApplicationsTable.id),
  principalAmount: numeric("principal_amount", { precision: 15, scale: 2 }).notNull(),
  outstandingBalance: numeric("outstanding_balance", { precision: 15, scale: 2 }).notNull(),
  interestRate: numeric("interest_rate", { precision: 5, scale: 2 }).notNull(),
  tenureMonths: integer("tenure_months").notNull(),
  monthlyInstalment: numeric("monthly_instalment", { precision: 15, scale: 2 }).notNull(),
  totalRepaid: numeric("total_repaid", { precision: 15, scale: 2 }).notNull().default("0"),
  nextPaymentDate: timestamp("next_payment_date"),
  maturityDate: timestamp("maturity_date"),
  status: loanStatusEnum("status").notNull().default("active"),
  disbursedAt: timestamp("disbursed_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertLoanSchema = createInsertSchema(loansTable).omit({
  id: true, createdAt: true, updatedAt: true,
});
export type InsertLoan = z.infer<typeof insertLoanSchema>;
export type Loan = typeof loansTable.$inferSelect;
