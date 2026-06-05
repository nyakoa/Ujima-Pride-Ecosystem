import { pgTable, serial, integer, text, numeric, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const kycStatusEnum = pgEnum("kyc_status", ["pending", "submitted", "verified", "rejected"]);

export const membersTable = pgTable("members", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  dateOfBirth: text("date_of_birth"),
  gender: text("gender"),
  county: text("county"),
  subCounty: text("sub_county"),
  ward: text("ward"),
  physicalAddress: text("physical_address"),
  employmentStatus: text("employment_status"),
  employerName: text("employer_name"),
  monthlyIncome: numeric("monthly_income", { precision: 15, scale: 2 }),
  otherIncome: numeric("other_income", { precision: 15, scale: 2 }),
  nextOfKinName: text("next_of_kin_name"),
  nextOfKinPhone: text("next_of_kin_phone"),
  nextOfKinRelationship: text("next_of_kin_relationship"),
  kycStatus: kycStatusEnum("kyc_status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertMemberSchema = createInsertSchema(membersTable).omit({
  id: true, createdAt: true, updatedAt: true,
});
export type InsertMember = z.infer<typeof insertMemberSchema>;
export type Member = typeof membersTable.$inferSelect;
