import { pgTable, text, jsonb, timestamp, serial, boolean, integer } from "drizzle-orm/pg-core";

export const siteContent = pgTable("site_content", {
  section: text("section").primaryKey(),
  data: jsonb("data").notNull().$type<Record<string, unknown>>(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type SiteContent = typeof siteContent.$inferSelect;
export type InsertSiteContent = typeof siteContent.$inferInsert;

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  name: text("name"),
  email: text("email").notNull(),
  data: jsonb("data").notNull().$type<Record<string, unknown>>(),
  status: text("status").notNull().default("new"),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

export const certificates = pgTable("certificates", {
  id: serial("id").primaryKey(),
  certificateId: text("certificate_id").notNull().unique(),
  name: text("name").notNull(),
  email: text("email"),
  role: text("role").notNull(),
  issueDate: text("issue_date").notNull(),
  status: text("status").notNull().default("verified"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Certificate = typeof certificates.$inferSelect;
export type InsertCertificate = typeof certificates.$inferInsert;

export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  permissions: text("permissions").array().notNull().default([]),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = typeof teamMembers.$inferInsert;

export const portfolioItems = pgTable("portfolio_items", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  youtubeUrl: text("youtube_url").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type PortfolioItem = typeof portfolioItems.$inferSelect;
export type InsertPortfolioItem = typeof portfolioItems.$inferInsert;

export const revokedTokens = pgTable("revoked_tokens", {
  token: text("token").primaryKey(),
  revokedAt: timestamp("revoked_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export type RevokedToken = typeof revokedTokens.$inferSelect;

export const adminActionLogs = pgTable("admin_action_logs", {
  id: serial("id").primaryKey(),
  action: text("action").notNull(),
  detail: text("detail").notNull(),
  ok: boolean("ok").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AdminActionLog = typeof adminActionLogs.$inferSelect;

export const clientLogos = pgTable("client_logos", {
  id: serial("id").primaryKey(),
  imageUrl: text("image_url").notNull(),
  altText: text("alt_text").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  link: text("link").default(""),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ClientLogo = typeof clientLogos.$inferSelect;
export type InsertClientLogo = typeof clientLogos.$inferInsert;

export const mediaFiles = pgTable("media_files", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  mimetype: text("mimetype").notNull(),
  size: integer("size").notNull(),
  data: text("data").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export type MediaFile = typeof mediaFiles.$inferSelect;
export type InsertMediaFile = typeof mediaFiles.$inferInsert;
