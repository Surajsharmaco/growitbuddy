import { pgTable, uuid, text, jsonb, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { actsMembershipCheckouts } from "./acts-memberships";

export const actsCrmRecords = pgTable("acts_crm_records", {
  id: uuid("id").primaryKey(),
  submissionKey: uuid("submission_key").notNull().unique(),
  checkoutId: uuid("checkout_id").unique().references(() => actsMembershipCheckouts.id),
  application: jsonb("application").$type<Record<string, unknown>>().notNull(),
  stage: text("stage").notNull().default("new"),
  notes: text("notes").notNull().default(""),
  followUpAt: timestamp("follow_up_at", { withTimezone: true }),
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const actsAdminSessions = pgTable("acts_admin_sessions", {
  tokenHash: text("token_hash").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const actsCrmSettings = pgTable("acts_crm_settings", {
  id: integer("id").primaryKey(),
  workbookId: text("workbook_id").notNull().default(""),
  lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
  lastSyncError: text("last_sync_error").notNull().default(""),
});