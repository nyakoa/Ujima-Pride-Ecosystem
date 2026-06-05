import { pgTable, serial, text, numeric, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const loanTypeEnum = pgEnum("loan_type", [
  "business", "vendor", "agricultural", "education", "emergency", "asset_financing"
]);

export const loanProductsTable = pgTable("loan_products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: loanTypeEnum("type").notNull(),
  description: text("description"),
  minAmount: numeric("min_amount", { precision: 15, scale: 2 }).notNull(),
  maxAmount: numeric("max_amount", { precision: 15, scale: 2 }).notNull(),
  minTenureMonths: integer("min_tenure_months").notNull(),
  maxTenureMonths: integer("max_tenure_months").notNull(),
  interestRate: numeric("interest_rate", { precision: 5, scale: 2 }).notNull(),
  requirements: text("requirements"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertLoanProductSchema = createInsertSchema(loanProductsTable).omit({
  id: true, createdAt: true,
});
export type InsertLoanProduct = z.infer<typeof insertLoanProductSchema>;
export type LoanProduct = typeof loanProductsTable.$inferSelect;
