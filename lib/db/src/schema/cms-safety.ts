import { pgTable, text, jsonb, timestamp, index, boolean } from "drizzle-orm/pg-core";

export const cmsRevisions = pgTable("cms_revisions", {
  id: text("id").primaryKey(),
  section: text("section").notNull(),
  postId: text("post_id").notNull(),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  post: jsonb("post").notNull().$type<Record<string, unknown>>(),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("cms_revisions_post_idx").on(t.section, t.postId, t.createdAt)]);

export const cmsBackups = pgTable("cms_backups", {
  id: text("id").primaryKey(),
  snapshot: jsonb("snapshot").notNull().$type<Record<string, unknown>>(),
  checksum: text("checksum").notNull(),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("cms_backups_created_idx").on(t.createdAt)]);

export type CmsRevision = typeof cmsRevisions.$inferSelect;
export type CmsBackup = typeof cmsBackups.$inferSelect;

export const cmsBackupKeys = pgTable("cms_backup_keys", {
  id: text("id").primaryKey(),
  secretHash: text("secret_hash").notNull().unique(),
  revoked: boolean("revoked").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});
