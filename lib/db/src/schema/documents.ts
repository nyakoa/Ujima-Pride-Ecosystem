import { pgTable, serial, integer, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { loanApplicationsTable } from "./loanApplications";

export const documentTypeEnum = pgEnum("document_type", [
  "national_id", "passport", "kra_pin", "payslip", "bank_statement",
  "business_certificate", "title_deed", "other"
]);

export const documentStatusEnum = pgEnum("document_status", ["uploaded", "verified", "rejected"]);

export const documentsTable = pgTable("documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  applicationId: integer("application_id").references(() => loanApplicationsTable.id),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  documentType: documentTypeEnum("document_type").notNull(),
  filePath: text("file_path").notNull(),
  status: documentStatusEnum("status").notNull().default("uploaded"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDocumentSchema = createInsertSchema(documentsTable).omit({
  id: true, createdAt: true,
});
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documentsTable.$inferSelect;
