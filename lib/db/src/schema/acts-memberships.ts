import { pgTable, uuid, text, jsonb, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

// Checkout drafts let signed webhooks recover applications even if a browser closes.
// Only captured payments create a member record; payment never grants approval.
export const actsMembershipCheckouts = pgTable("acts_membership_checkouts", {
  id: uuid("id").primaryKey(),
  orderId: text("order_id").notNull().unique(),
  tokenHash: text("token_hash").notNull().unique(),
  keyId: text("key_id").notNull(),
  application: jsonb("application").$type<Record<string, unknown>>().notNull(),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull(),
  paymentStatus: text("payment_status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const actsMembers = pgTable("acts_members", {
  id: uuid("id").primaryKey(),
  checkoutId: uuid("checkout_id").notNull().unique().references(() => actsMembershipCheckouts.id),
  paymentId: text("payment_id").notNull().unique(),
  application: jsonb("application").$type<Record<string, unknown>>().notNull(),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull(),
  paymentStatus: text("payment_status").notNull().default("successful"),
  reviewStatus: text("review_status").notNull().default("pending_review"),
  paidAt: timestamp("paid_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertActsCheckoutSchema = createInsertSchema(actsMembershipCheckouts);
export const insertActsMemberSchema = createInsertSchema(actsMembers);
export type ActsCheckout = typeof actsMembershipCheckouts.$inferSelect;
export type ActsMember = typeof actsMembers.$inferSelect;