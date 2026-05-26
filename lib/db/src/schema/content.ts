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
  remark: text("remark"),
  isHidden: boolean("is_hidden").notNull().default(false),
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

export type CaseStudyData = {
  clientName?: string;
  clientLogoUrl?: string;
  coverImageUrl?: string;
  heroImageUrl?: string;
  galleryImages?: string[];
  metrics?: Array<{ value: string; label: string }>;
  stack?: string[];
  testimonial?: { quote: string; author: string };
  overview?: string;
  challenge?: string;
  approach?: string;
  approachBullets?: string[];
  solution?: string;
  videoUrl?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Block-based editor data model for Case Study pages (Wix/Elementor-style).
// A case study can EITHER have legacy `case_study` JSONB (old hardcoded layout)
// OR a `blocks` array (new generic block renderer). The frontend prefers
// `blocks` when present and falls back to `case_study` otherwise.
// ─────────────────────────────────────────────────────────────────────────────
export type BlockStyle = {
  padding?: string;        // e.g. "32px 0"
  margin?: string;
  bg?: string;             // background color (hex / css color)
  color?: string;          // text color
  align?: "left" | "center" | "right";
  maxWidth?: number;       // px — clamp the block content width
};

export type BlockType =
  | "heading"        // { level: 1|2|3, text, eyebrow? }
  | "paragraph"      // { html } (rich text — will be TipTap-edited in Phase 2)
  | "image"          // { src, alt, caption?, width: 'full'|'wide'|'normal' }
  | "video"          // { url } (uses videoEmbed util)
  | "metricsGrid"    // { items: Array<{ value, label }> }
  | "bulletList"     // { items: string[], style: 'check'|'dot' }
  | "testimonial"    // { quote, author, role? }
  | "tagList"        // { label?, items: string[] }
  | "gallery"        // { images: string[], columns: 2|3 }
  | "divider"        // {}
  | "spacer"         // { size: 'sm'|'md'|'lg'|'xl' }
  | "button"         // { label, href, variant: 'primary'|'secondary' }
  | "columns";       // { columns: Block[][], gap?: number } — Phase 4

export type Block = {
  id: string;                              // stable client-generated UUID
  type: BlockType;
  props: Record<string, unknown>;
  style?: BlockStyle;
};

export const portfolioItems = pgTable("portfolio_items", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  youtubeUrl: text("youtube_url").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  isHidden: boolean("is_hidden").notNull().default(false),
  customThumbnailUrl: text("custom_thumbnail_url"),
  caseStudy: jsonb("case_study").$type<CaseStudyData>(),
  // NEW (Phase 1 of inline-editor work): generic block-based content.
  // When non-null, the public Case Study page renders these blocks instead
  // of the legacy hardcoded layout. Excluded categories ("Video Editing",
  // "Video Editing Global") MUST NOT receive blocks (admin UI enforces).
  blocks: jsonb("blocks").$type<Block[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type PortfolioItem = typeof portfolioItems.$inferSelect;
export type InsertPortfolioItem = typeof portfolioItems.$inferInsert;

export const portfolioShares = pgTable("portfolio_shares", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull().default(""),
  hiddenCategories: text("hidden_categories").array().notNull().default([]),
  hiddenItemIds: integer("hidden_item_ids").array().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type PortfolioShare = typeof portfolioShares.$inferSelect;
export type InsertPortfolioShare = typeof portfolioShares.$inferInsert;

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

// Page Variants — duplicate any source page (home/about/services/etc) at a
// new URL with its own content. Variant content lives in site_content under
// the namespaced key `${sourceKey}__v__${slug}` (see variantContentKey()).
export const pageVariants = pgTable("page_variants", {
  id: serial("id").primaryKey(),
  sourceKey: text("source_key").notNull(),
  slug: text("slug").notNull().unique(),
  label: text("label").notNull().default(""),
  isLive: boolean("is_live").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type PageVariant = typeof pageVariants.$inferSelect;
export type InsertPageVariant = typeof pageVariants.$inferInsert;

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
