import { Router, type Request, type Response, type NextFunction } from "express";
import { and, eq } from "drizzle-orm";
import { logger } from "../lib/logger";
import { db, leads, pageVariants, siteContent } from "@workspace/db";

const router = Router();

// ── Simple in-memory rate limiter ──
const rateLimitWindows = new Map<string, { count: number; resetAt: number }>();

function rateLimit(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim()
      || req.socket.remoteAddress
      || "unknown";
    const now = Date.now();
    const entry = rateLimitWindows.get(ip);
    if (!entry || entry.resetAt <= now) {
      rateLimitWindows.set(ip, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }
    if (entry.count >= maxRequests) {
      res.status(429).json({ error: "Too many requests. Please wait a moment and try again." });
      return;
    }
    entry.count++;
    next();
  };
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitWindows) {
    if (entry.resetAt <= now) rateLimitWindows.delete(ip);
  }
}, 10 * 60 * 1000).unref();

const formLimit = rateLimit(5, 60_000);
const newsletterLimit = rateLimit(20, 60_000);

// FROM address — override with EMAIL_FROM env var after verifying a custom
// domain in Resend. Default uses Resend's shared sender, which works out of
// the box but ONLY delivers to the email tied to your Resend account.
const FROM = process.env.EMAIL_FROM || "GrowitBuddy <onboarding@resend.dev>";

// ── Email routing ──
// Default to cs.growitbuddy@gmail.com so notifications work even if Render
// env vars haven't been set yet. Override via NOTIFY_EMAIL / CAREERS_EMAIL.
const GENERAL_EMAIL = process.env.NOTIFY_EMAIL || "cs.growitbuddy@gmail.com";
const CAREERS_EMAIL = process.env.CAREERS_EMAIL || GENERAL_EMAIL;

// Newsletter sources → careers/network bucket
const CAREERS_NEWSLETTER_SOURCES = new Set([
  "creator", "page-owner", "full-time", "internship", "freelancer",
  "editor", "designer", "thumbnail-designer", "writer", "ai-creator",
  "ugc-creator", "motion-designer", "social-manager",
]);

// Human-readable source page names for newsletter emails
const SOURCE_PAGE_LABELS: Record<string, string> = {
  "creator":            "Creator Network page  →  growitbuddy.com/creators",
  "page-owner":         "Distribution Network page  →  growitbuddy.com/join/page-owner",
  "full-time":          "Full-Time Jobs page  →  growitbuddy.com/full-time",
  "internship":         "Internship page  →  growitbuddy.com/internship",
  "freelancer":         "Freelancers page  →  growitbuddy.com/freelancers",
  "editor":             "Creator School / Editor track  →  growitbuddy.com/creator-school",
  "designer":           "Creator School / Designer track  →  growitbuddy.com/creator-school",
  "thumbnail-designer": "Creator School / Thumbnail Designer track  →  growitbuddy.com/creator-school",
  "writer":             "Creator School / Writer track  →  growitbuddy.com/creator-school",
  "ai-creator":         "Creator School / AI Creator track  →  growitbuddy.com/creator-school",
  "ugc-creator":        "Creator School / UGC Creator track  →  growitbuddy.com/creator-school",
  "motion-designer":    "Creator School / Motion Designer track  →  growitbuddy.com/creator-school",
  "social-manager":     "Creator School / Social Manager track  →  growitbuddy.com/creator-school",
  "Homepage CTA":       "Homepage hero CTA  →  growitbuddy.com/",
  "blog":               "Blog / Insights page  →  growitbuddy.com/insights",
  "Authority Audit":    "Authority Audit tool  →  growitbuddy.com/authority-audit",
  "contact":            "Contact page  →  growitbuddy.com/contact",
  "influencer":         "Influencer Directory  →  growitbuddy.com/influencers",
  "distribution":       "Distribution Network  →  growitbuddy.com/distribution",
  "resources":          "Resources page  →  growitbuddy.com/resources",
  "about":              "About page  →  growitbuddy.com/about",
  "website":            "General website signup",
};

function getSourceLabel(src: string): string {
  return SOURCE_PAGE_LABELS[src] ?? `${src}  →  growitbuddy.com`;
}

// ── Timestamp ──
function nowIST(): string {
  return new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  }) + " IST";
}

// ── Send email via Resend ──
async function sendEmail(to: string, subject: string, html: string, replyTo?: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    logger.error(
      { to, subject, from: FROM },
      "RESEND_API_KEY not set on the server — form notification email NOT sent. " +
      "Set RESEND_API_KEY in Render → Environment to enable email delivery.",
    );
    return;
  }
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(key);
    const result = await resend.emails.send({
      from: FROM, to, subject, html,
      ...(replyTo ? { replyTo } : {}),
    });
    if (result.error) {
      logger.error(
        { resendError: result.error, to, from: FROM, subject },
        "Resend rejected email. Common cause: when using the shared sender " +
        "(onboarding@resend.dev) Resend only delivers to the email address " +
        "that owns the Resend account. Fix: log in to resend.com with the " +
        "recipient's Gmail, OR verify a custom domain and set EMAIL_FROM.",
      );
    } else {
      logger.info({ resendId: result.data?.id, to, from: FROM, subject }, "Email sent via Resend");
    }
  } catch (err) {
    logger.error({ err, to, from: FROM, subject }, "Resend transport error");
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

async function saveLead(type: string, name: string | undefined, email: string, data: Record<string, unknown>) {
  try {
    await db.insert(leads).values({ type, name: name || null, email, data });
  } catch (err) {
    const code = err && typeof err === "object" && "code" in err && typeof err.code === "string"
      ? err.code
      : undefined;
    logger.error({ code }, "Failed to save lead to DB");
  }
}

// ── Email template helpers ──
function row(label: string, value: string | undefined) {
  if (!value) return "";
  return `<tr>
    <td style="padding:10px 0;color:#888;font-size:13px;width:170px;vertical-align:top;font-family:Inter,sans-serif;border-bottom:1px solid #f0f0f0">${escapeHtml(label)}</td>
    <td style="padding:10px 0;color:#0B0B0B;font-size:14px;vertical-align:top;font-family:Inter,sans-serif;border-bottom:1px solid #f0f0f0"><strong>${escapeHtml(value)}</strong></td>
  </tr>`;
}

function highlightRow(label: string, value: string | undefined, color = "#8B3A1A") {
  if (!value) return "";
  return `<tr>
    <td style="padding:10px 0;color:#888;font-size:13px;width:170px;vertical-align:top;font-family:Inter,sans-serif;border-bottom:1px solid #f0f0f0">${escapeHtml(label)}</td>
    <td style="padding:10px 0;font-size:14px;vertical-align:top;font-family:Inter,sans-serif;border-bottom:1px solid #f0f0f0"><strong style="color:${color}">${escapeHtml(value)}</strong></td>
  </tr>`;
}

const HTML_ESCAPES: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => HTML_ESCAPES[character] ?? character);
}

// Badge colours per category
const BADGE_COLORS: Record<string, string> = {
  "CONTACT":      "#1E3A5F",
  "CREATOR":      "#5B3A8B",
  "PAGE OWNER":   "#1A5C3A",
  "FREELANCER":   "#5C4A1A",
  "FULL-TIME":    "#1A3A5C",
  "INTERNSHIP":   "#5C1A3A",
  "NEWSLETTER":   "#2E5C1A",
};

function emailTemplate(
  category: string,
  title: string,
  tableRows: string,
  submittedFrom: string,
  submittedAt: string,
) {
  const badgeBg = BADGE_COLORS[category] ?? "#0B0B0B";
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#F7F7F5;font-family:Inter,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;border:1.5px solid rgba(11,11,11,0.08)">

  <!-- Header -->
  <tr><td style="background:#0B0B0B;padding:24px 36px;display:flex;align-items:center">
    <span style="font-size:20px;font-weight:800;color:#fff;letter-spacing:-0.03em">GrowitBuddy</span>
    <span style="display:inline-block;margin-left:12px;background:${badgeBg};color:#fff;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;padding:4px 12px;border-radius:100px">${category}</span>
  </td></tr>

  <!-- Source banner -->
  <tr><td style="background:#F0F4FF;padding:12px 36px;border-bottom:1px solid #E0E8FF">
    <span style="font-size:12px;color:#1E3A5F;font-weight:600;font-family:monospace">📍 FROM: ${submittedFrom}</span>
  </td></tr>

  <!-- Body -->
  <tr><td style="padding:28px 36px 8px">
    <p style="margin:0 0 20px;font-size:22px;font-weight:800;color:#0B0B0B;letter-spacing:-0.03em">${title}</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1.5px solid rgba(11,11,11,0.08)">
      ${tableRows}
    </table>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:20px 36px 32px;border-top:1px solid #f0f0f0;margin-top:8px">
    <p style="margin:0;font-size:12px;color:#aaa;font-family:Inter,sans-serif">
      Submitted at: <strong style="color:#888">${submittedAt}</strong><br/>
      Sent automatically from your GrowitBuddy website.
    </p>
  </td></tr>

</table>
</td></tr></table></body></html>`;
}

// ── CONTACT  →  growitbuddy@gmail.com ──────────────────────────────────────
router.post("/contact", formLimit, async (req, res) => {
  const { name, email, company, message } = req.body;
  if (!name || !email || !message) {
    res.status(400).json({ error: "name, email and message are required" });
    return;
  }
  if (!isValidEmail(email)) {
    res.status(400).json({ error: "Invalid email address" });
    return;
  }
  const ts = nowIST();
  logger.info({ name, email, company }, "Contact form submission");
  await saveLead("contact", name, email, { name, email, company, message });
  await sendEmail(
    GENERAL_EMAIL,
    `[CONTACT] ${name} — growitbuddy.com/contact`,
    emailTemplate(
      "CONTACT", "New Contact Form Submission",
      row("Name", name) +
      row("Email", email) +
      row("Company / Brand", company) +
      row("Message", message),
      "Contact page  →  growitbuddy.com/contact",
      ts,
    ),
    email,
  );
  res.json({ success: true, message: "Thank you! We will be in touch within 24 hours." });
});

// ── RESOURCE UNLOCK (email gate)  →  growitbuddy@gmail.com ──────────────────
// Gated resources require an email before the download/link is revealed.
// We capture the email as a lead and notify, then the frontend unlocks access.
router.post("/resource-unlock", newsletterLimit, async (req, res) => {
  const { email, resourceTitle, resourceType } = req.body;
  if (!email) {
    res.status(400).json({ error: "email is required" });
    return;
  }
  if (!isValidEmail(email)) {
    res.status(400).json({ error: "Invalid email address" });
    return;
  }
  const ts = nowIST();
  const title = typeof resourceTitle === "string" && resourceTitle.trim()
    ? resourceTitle.trim()
    : "(unspecified resource)";
  logger.info({ email, resourceTitle: title }, "Resource unlock (email gate) submission");
  await saveLead("resource", undefined, email, { email, resourceTitle: title, resourceType: resourceType || null });
  await sendEmail(
    GENERAL_EMAIL,
    `[RESOURCE] ${email} unlocked "${title}"`,
    emailTemplate(
      "RESOURCE", "Resource Unlocked (Email Gate)",
      highlightRow("Resource", title) +
      row("Email", email) +
      (resourceType ? row("Type", String(resourceType)) : ""),
      "Resources page  →  growitbuddy.com/resources",
      ts,
    ),
    email,
  );
  res.json({ success: true, message: "Thanks! Your resource is unlocked." });
});

// ── CREATOR / INFLUENCER NETWORK  →  careers.growitbuddy@gmail.com ─────────
router.post("/creators", formLimit, async (req, res) => {
  const { name, email, phone, niche, handle, monthlyViews, goals } = req.body;
  if (!name || !email || !niche) {
    res.status(400).json({ error: "name, email and niche are required" });
    return;
  }
  if (!isValidEmail(email)) {
    res.status(400).json({ error: "Invalid email address" });
    return;
  }
  const ts = nowIST();
  logger.info({ name, email, niche }, "Creator onboarding submission");
  await saveLead("creator", name, email, { name, email, phone, niche, handle, monthlyViews, goals });
  await sendEmail(
    CAREERS_EMAIL,
    `[CREATOR] ${name} — ${niche}`,
    emailTemplate(
      "CREATOR", "New Creator / Influencer Application",
      highlightRow("Niche / Topic", niche) +
      row("Name", name) +
      row("Email", email) +
      row("Phone", phone) +
      row("Social Handle", handle) +
      row("Monthly Views / Reach", monthlyViews) +
      row("Goals", goals),
      "Creator Network page  →  growitbuddy.com/creators",
      ts,
    ),
    email,
  );
  res.json({ success: true, message: "Welcome! We will review your application and reach out within 48 hours." });
});

// ── PAGE OWNER / DISTRIBUTION NETWORK  →  careers.growitbuddy@gmail.com ────
router.post("/page-owner", formLimit, async (req, res) => {
  const { name, email, phone, niche, monthlyViews, pageCount, pages } = req.body;
  if (!name || !email || !niche) {
    res.status(400).json({ error: "name, email and niche are required" });
    return;
  }
  if (!isValidEmail(email)) {
    res.status(400).json({ error: "Invalid email address" });
    return;
  }
  const ts = nowIST();
  logger.info({ name, email, niche, pageCount }, "Page owner application submission");
  const pagesArr: { name: string; link: string }[] = Array.isArray(pages) ? pages : [];
  const pagesText = pagesArr.map((p, i) => `${i + 1}. ${p.name || "(unnamed)"} — ${p.link || "(no link)"}`).join("<br/>");
  await saveLead("page-owner", name, email, { name, email, phone, niche, monthlyViews, pageCount, pages: pagesArr });
  await sendEmail(
    CAREERS_EMAIL,
    `[PAGE OWNER] ${name} — ${niche} (${pageCount ?? "?"} page${Number(pageCount) !== 1 ? "s" : ""})`,
    emailTemplate(
      "PAGE OWNER", "New Page Owner / Distribution Application",
      highlightRow("Niche", niche) +
      row("Name", name) +
      row("Email", email) +
      row("Phone", phone) +
      row("Monthly Views / Reach", monthlyViews) +
      row("Number of Pages", String(pageCount ?? "")) +
      (pagesText
        ? `<tr><td style="padding:10px 0;color:#888;font-size:13px;width:170px;vertical-align:top;font-family:Inter,sans-serif;border-bottom:1px solid #f0f0f0">Pages Listed</td>
           <td style="padding:10px 0;color:#0B0B0B;font-size:14px;vertical-align:top;font-family:Inter,sans-serif;border-bottom:1px solid #f0f0f0">${pagesText}</td></tr>`
        : ""),
      "Distribution Network page  →  growitbuddy.com/join/page-owner",
      ts,
    ),
    email,
  );
  res.json({ success: true, message: "Your application has been received. Our team will review and get back to you." });
});

// ── FREELANCER  →  growitbuddy@gmail.com ────────────────────────────────────
router.post("/freelancers", formLimit, async (req, res) => {
  const { name, email, phone, skills, portfolioUrl, experience, otherSkill } = req.body;
  if (!name || !email || !skills) {
    res.status(400).json({ error: "name, email and skills are required" });
    return;
  }
  if (!isValidEmail(email)) {
    res.status(400).json({ error: "Invalid email address" });
    return;
  }
  const ts = nowIST();
  const skillsList = Array.isArray(skills) ? skills.join(", ") : skills;
  logger.info({ name, email, skills: skillsList }, "Freelancer application submission");
  await saveLead("freelancer", name, email, { name, email, phone, skills: skillsList, otherSkill, experience, portfolioUrl });
  await sendEmail(
    GENERAL_EMAIL,
    `[FREELANCER] ${name} — ${skillsList}`,
    emailTemplate(
      "FREELANCER", "New Freelancer Application",
      highlightRow("Skills", skillsList) +
      row("Name", name) +
      row("Email", email) +
      row("Phone", phone) +
      (otherSkill ? row("Other Skill (specified)", otherSkill) : "") +
      row("Experience", experience) +
      row("Portfolio / Work URL", portfolioUrl),
      "Freelancers page  →  growitbuddy.com/freelancers",
      ts,
    ),
    email,
  );
  res.json({ success: true, message: "Application received! We review applications weekly and will be in touch." });
});

// ── FULL-TIME  →  careers.growitbuddy@gmail.com ─────────────────────────────
router.post("/full-time", formLimit, async (req, res) => {
  const { name, email, phone, role, experience, linkedinUrl, coverNote, otherRole } = req.body;
  if (!name || !email || !role) {
    res.status(400).json({ error: "name, email and role are required" });
    return;
  }
  if (!isValidEmail(email)) {
    res.status(400).json({ error: "Invalid email address" });
    return;
  }
  const ts = nowIST();
  const roleDisplay = role === "Other" && otherRole ? `Other — ${otherRole}` : role;
  logger.info({ name, email, role: roleDisplay }, "Full-time application submission");
  await saveLead("full-time", name, email, { name, email, phone, role: roleDisplay, experience, linkedinUrl, coverNote });
  await sendEmail(
    CAREERS_EMAIL,
    `[FULL-TIME] ${name} — ${roleDisplay}`,
    emailTemplate(
      "FULL-TIME", "New Full-Time Job Application",
      highlightRow("Role Applied For", roleDisplay) +
      row("Name", name) +
      row("Email", email) +
      row("Phone", phone) +
      row("Experience", experience) +
      row("LinkedIn / Portfolio", linkedinUrl) +
      row("Cover Note", coverNote),
      "Full-Time Jobs page  →  growitbuddy.com/full-time",
      ts,
    ),
    email,
  );
  res.json({ success: true, message: "Application received! We will review and respond within 7 business days." });
});

// ── INTERNSHIP  →  careers.growitbuddy@gmail.com ────────────────────────────
router.post("/internship", formLimit, async (req, res) => {
  const { name, email, phone, role, experience, portfolioUrl, whyJoin } = req.body;
  if (!name || !email || !role) {
    res.status(400).json({ error: "name, email and role are required" });
    return;
  }
  if (!isValidEmail(email)) {
    res.status(400).json({ error: "Invalid email address" });
    return;
  }
  const ts = nowIST();
  logger.info({ name, email, role }, "Internship application submission");
  await saveLead("internship", name, email, { name, email, phone: phone || null, role, experience, portfolioUrl: portfolioUrl || null, whyJoin: whyJoin || null });
  await sendEmail(
    CAREERS_EMAIL,
    `[INTERNSHIP] ${name} — ${role}`,
    emailTemplate(
      "INTERNSHIP", "New Internship Application",
      highlightRow("Role Applying For", role) +
      row("Name", name) +
      row("Email", email) +
      (phone ? row("Phone", phone) : "") +
      row("Experience Level", experience) +
      (portfolioUrl ? row("Portfolio / Work Link", portfolioUrl) : "") +
      (whyJoin ? row("Why They Want to Join", whyJoin) : ""),
      "Internship page  →  growitbuddy.com/internship",
      ts,
    ),
    email,
  );
  res.json({ success: true, message: "Your application has been received. We will review and get back to you." });
});

// ── TALENT POOL  →  careers.growitbuddy@gmail.com ───────────────────────────
const POOL_LABELS: Record<string, string> = {
  "pool-designers":           "Graphic Designers",
  "pool-thumbnail-designers": "Thumbnail Designers",
  "pool-writers":             "Writers",
  "pool-social-managers":     "Social Media Managers",
  "pool-motion-designers":    "Motion Designers",
  "pool-ai-creators":         "AI Creators",
  "pool-ugc-creators":        "UGC Creators",
  "pool-meme-designers":      "Meme Designers",
  "pool-editors":             "Video Editors",
};

const SAFE_VARIANT_SLUG = /^[a-z0-9][a-z0-9-]{0,79}$/;

const POOL_BADGE_COLORS: Record<string, string> = {
  "pool-designers":           "#7c3aed",
  "pool-thumbnail-designers": "#be185d",
  "pool-writers":             "#065f46",
  "pool-social-managers":     "#0e7490",
  "pool-motion-designers":    "#92400e",
  "pool-ai-creators":         "#991b1b",
  "pool-ugc-creators":        "#1e40af",
  "pool-meme-designers":      "#374151",
  "pool-editors":             "#0f766e",
};

type TalentPoolFieldType = "text" | "email" | "url" | "textarea";

interface TalentPoolField {
  key: string;
  label: string;
  placeholder: string;
  type: TalentPoolFieldType;
  required: boolean;
  enabled: boolean;
}

const POOL_FIELD_KEY = /^[A-Za-z][A-Za-z0-9_-]{0,63}$/;
const CUSTOM_POOL_FIELD_KEY = /^custom_[A-Za-z0-9_-]{1,56}$/;

const POOL_SPECIFIC_LEGACY_FIELDS: Record<string, Array<Omit<TalentPoolField, "enabled">>> = {
  "pool-designers": [
    { key: "portfolio", label: "Behance / Dribbble", placeholder: "https://behance.net/...", type: "text", required: true },
    { key: "figma", label: "Figma Portfolio", placeholder: "https://figma.com/...", type: "text", required: false },
  ],
  "pool-thumbnail-designers": [
    { key: "portfolio", label: "Portfolio Link", placeholder: "https://...", type: "text", required: true },
    { key: "link", label: "Submission Link", placeholder: "Google Drive / Dropbox with your thumbnail", type: "text", required: true },
  ],
  "pool-writers": [
    { key: "niche", label: "Writing Niche / Topics", placeholder: "e.g. Finance, Health, Creator Economy", type: "text", required: true },
    { key: "sample", label: "Writing Sample", placeholder: "https://docs.google.com/...", type: "text", required: true },
    { key: "linkedin", label: "LinkedIn Profile", placeholder: "https://linkedin.com/in/...", type: "text", required: false },
  ],
  "pool-social-managers": [
    { key: "platforms", label: "Platforms Managed", placeholder: "e.g. Instagram, LinkedIn, TikTok", type: "text", required: true },
    { key: "portfolio", label: "Portfolio / Case Study", placeholder: "https://...", type: "text", required: true },
  ],
  "pool-motion-designers": [
    { key: "tools", label: "Tools Used", placeholder: "e.g. After Effects, Rive, Cavalry", type: "text", required: true },
    { key: "reel", label: "Reel / Demo Link", placeholder: "https://...", type: "text", required: true },
  ],
  "pool-ai-creators": [
    { key: "tools", label: "AI Tools Used", placeholder: "e.g. n8n, Make, OpenAI, Zapier", type: "text", required: true },
    { key: "example", label: "Automation Example", placeholder: "https://...", type: "text", required: true },
    { key: "loom", label: "Loom Walkthrough", placeholder: "https://loom.com/share/...", type: "text", required: false },
  ],
  "pool-ugc-creators": [
    { key: "social", label: "Instagram / TikTok Handle", placeholder: "@yourhandle", type: "text", required: true },
    { key: "sample", label: "Content Sample Link", placeholder: "Drive / Dropbox / Link", type: "text", required: true },
    { key: "niche", label: "Brand Types / Niches", placeholder: "e.g. Skincare, Tech, Food", type: "text", required: false },
  ],
  "pool-editors": [
    { key: "tools", label: "Editing Software", placeholder: "e.g. Premiere Pro, DaVinci, Final Cut", type: "text", required: true },
    { key: "reel", label: "Reel / Showreel Link", placeholder: "https://...", type: "text", required: true },
    { key: "sample", label: "Sample Edit", placeholder: "Drive / YouTube / Frame.io link", type: "text", required: false },
  ],
  "pool-meme-designers": [
    { key: "social", label: "Instagram / X Handle", placeholder: "@yourhandle", type: "text", required: true },
    { key: "portfolio", label: "Meme Portfolio Link", placeholder: "Drive / page / IG profile", type: "text", required: true },
    { key: "niche", label: "Niches You Cover", placeholder: "e.g. Finance, Pop culture", type: "text", required: false },
  ],
};

function legacyPoolFields(poolType: string): TalentPoolField[] {
  const common: TalentPoolField[] = [
    { key: "name", label: "Full Name", placeholder: "Your full name", type: "text", required: true, enabled: true },
    { key: "email", label: "Email Address", placeholder: "you@example.com", type: "email", required: true, enabled: true },
    { key: "contact", label: "Contact (WhatsApp / Telegram)", placeholder: "@handle or number", type: "text", required: true, enabled: true },
    { key: "notes", label: "Additional Notes", placeholder: "Anything specific you'd like us to know about your work or availability...", type: "textarea", required: false, enabled: true },
  ];
  const extras = (POOL_SPECIFIC_LEGACY_FIELDS[poolType] ?? []).map(field => ({ ...field, enabled: true }));
  return [...common, ...extras];
}

function isAllowedPoolFieldKey(key: string, poolType: string): boolean {
  if (!POOL_FIELD_KEY.test(key)) return false;
  if (["name", "email", "contact", "notes"].includes(key)) return true;
  if (CUSTOM_POOL_FIELD_KEY.test(key)) return true;
  return (POOL_SPECIFIC_LEGACY_FIELDS[poolType] ?? []).some(field => field.key === key);
}

function readPoolFormFields(content: Record<string, unknown> | null, poolType: string): TalentPoolField[] {
  if (!content || !Object.prototype.hasOwnProperty.call(content, "formFields")) {
    return legacyPoolFields(poolType);
  }

  const rawFields = content.formFields;
  if (!Array.isArray(rawFields) || rawFields.length > 50) {
    throw new Error("Saved talent pool form settings are invalid.");
  }

  const seen = new Set<string>();
  const fields = rawFields.map((raw): TalentPoolField => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      throw new Error("Saved talent pool form settings are invalid.");
    }
    const candidate = raw as Record<string, unknown>;
    const key = candidate.key;
    const label = candidate.label;
    const placeholder = candidate.placeholder;
    const type = candidate.type;
    const required = candidate.required;
    const enabled = candidate.enabled;
    if (
      typeof key !== "string" ||
      !isAllowedPoolFieldKey(key, poolType) ||
      seen.has(key) ||
      typeof label !== "string" || !label.trim() || label.length > 120 ||
      typeof placeholder !== "string" || placeholder.length > 240 ||
      !["text", "email", "url", "textarea"].includes(String(type)) ||
      typeof required !== "boolean" ||
      typeof enabled !== "boolean" ||
      (key === "name" && type !== "text") ||
      (key === "email" && type !== "email")
    ) {
      throw new Error("Saved talent pool form settings are invalid.");
    }
    seen.add(key);
    return { key, label: label.trim(), placeholder, type: type as TalentPoolFieldType, required, enabled };
  });

  for (const key of ["name", "email"] as const) {
    const existing = fields.find(field => field.key === key);
    if (existing) {
      existing.enabled = true;
      existing.required = true;
    } else {
      fields.unshift({
        key,
        label: key === "name" ? "Full Name" : "Email Address",
        placeholder: key === "name" ? "Your full name" : "you@example.com",
        type: key === "name" ? "text" : "email",
        required: true,
        enabled: true,
      });
    }
  }
  return fields;
}

function isValidPoolUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return (parsed.protocol === "http:" || parsed.protocol === "https:") && !!parsed.hostname;
  } catch {
    return false;
  }
}

router.post("/talent-pool", formLimit, async (req, res) => {
  const body = req.body && typeof req.body === "object" && !Array.isArray(req.body)
    ? req.body as Record<string, unknown>
    : {};
  const type = body.type;
  if (typeof type !== "string" || !Object.prototype.hasOwnProperty.call(POOL_LABELS, type)) {
    res.status(400).json({ error: "A valid talent pool type is required." });
    return;
  }

  const poolType = type;
  const poolLabel = POOL_LABELS[poolType];
  const badgeBg = POOL_BADGE_COLORS[poolType];
  let contentSection = poolType;
  if (Object.prototype.hasOwnProperty.call(body, "variantSlug")) {
    const variantSlug = body.variantSlug;
    if (typeof variantSlug !== "string" || !SAFE_VARIANT_SLUG.test(variantSlug)) {
      res.status(400).json({ error: "A valid variant slug is required." });
      return;
    }

    let variants: { sourceKey: string }[];
    try {
      variants = await db
        .select({ sourceKey: pageVariants.sourceKey })
        .from(pageVariants)
        .where(and(
          eq(pageVariants.slug, variantSlug),
          eq(pageVariants.isLive, true),
        ))
        .limit(1);
    } catch (err) {
      req.log.error({ err, poolType }, "Talent pool variant could not be loaded");
      res.status(503).json({ error: "This form is temporarily unavailable. Please try again shortly." });
      return;
    }

    if (!variants[0] || variants[0].sourceKey !== poolType) {
      res.status(404).json({ error: "This talent pool variant was not found." });
      return;
    }
    contentSection = `${poolType}__v__${variantSlug}`;
  }

  let poolContent: Record<string, unknown> | null = null;
  try {
    const rows = await db
      .select({ data: siteContent.data })
      .from(siteContent)
      .where(eq(siteContent.section, contentSection))
      .limit(1);
    if (rows.length > 0) {
      const data: unknown = rows[0].data;
      if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new Error("Saved talent pool content is invalid.");
      }
      poolContent = data as Record<string, unknown>;
    }
  } catch (err) {
    req.log.error({ err, poolType }, "Talent pool form configuration could not be loaded");
    res.status(503).json({ error: "This form is temporarily unavailable. Please try again shortly." });
    return;
  }

  let fields: TalentPoolField[];
  try {
    fields = readPoolFormFields(poolContent, poolType);
  } catch (err) {
    req.log.error({ err, poolType }, "Talent pool form configuration is invalid");
    res.status(503).json({ error: "This form is temporarily unavailable. Please try again shortly." });
    return;
  }

  const submittedValues = new Map<string, string>();
  for (const field of fields) {
    if (!field.enabled && field.key !== "name" && field.key !== "email") continue;
    const rawValue = Object.prototype.hasOwnProperty.call(body, field.key) ? body[field.key] : undefined;
    if (rawValue !== undefined && rawValue !== null && typeof rawValue !== "string") {
      res.status(400).json({ error: `Enter a valid value for ${field.label}.`, field: field.key });
      return;
    }
    const value = typeof rawValue === "string" ? rawValue.trim() : "";
    if (field.required && !value) {
      res.status(400).json({ error: `${field.label} is required.`, field: field.key });
      return;
    }
    if (value && field.type === "email" && !isValidEmail(value)) {
      res.status(400).json({ error: `Enter a valid email address for ${field.label}.`, field: field.key });
      return;
    }
    if (value && field.type === "url" && !isValidPoolUrl(value)) {
      res.status(400).json({ error: `Enter a valid URL for ${field.label}.`, field: field.key });
      return;
    }
    if (value) submittedValues.set(field.key, value);
  }

  const name = submittedValues.get("name");
  const email = submittedValues.get("email");
  if (!name || !email) {
    res.status(400).json({ error: "name and email are required" });
    return;
  }
  const ts = nowIST();

  const enabledFields = fields.filter(field => field.enabled);
  const extraFields: Record<string, unknown> = Object.create(null);
  for (const field of enabledFields) {
    if (["name", "email", "contact", "notes"].includes(field.key)) continue;
    const value = submittedValues.get(field.key);
    if (value) extraFields[field.key] = value;
  }

  const extraSummary = enabledFields
    .filter(field => !["name", "email", "contact", "notes"].includes(field.key))
    .map(field => {
      const value = submittedValues.get(field.key);
      return value ? `${field.label}: ${value}` : "";
    })
    .filter(Boolean)
    .join("\n");
  const message = [submittedValues.get("notes"), extraSummary].filter(Boolean).join("\n\n")
    || `Talent pool application for ${poolLabel}`;
  const leadData: Record<string, unknown> = {
    name,
    email,
    contact: submittedValues.get("contact") ?? null,
    ...extraFields,
    message,
  };

  req.log.info({ poolType }, "Talent pool application submission");
  await saveLead(poolType, name, email, leadData);

  const extraRows = enabledFields
    .filter(field => !["name", "email", "contact", "notes"].includes(field.key))
    .map(field => {
      const value = submittedValues.get(field.key);
      return value ? row(field.label, value) : "";
    })
    .join("");
  const nameLabel = fields.find(field => field.key === "name")?.label ?? "Name";
  const emailLabel = fields.find(field => field.key === "email")?.label ?? "Email";
  const contactLabel = fields.find(field => field.key === "contact")?.label ?? "Phone / Contact";
  const notesLabel = fields.find(field => field.key === "notes")?.label ?? "Notes / Message";
  const notifyEmail = typeof poolContent?.formNotifyEmail === "string" && isValidEmail(poolContent.formNotifyEmail.trim())
    ? poolContent.formNotifyEmail.trim()
    : CAREERS_EMAIL;

  await sendEmail(
    notifyEmail,
    `[TALENT POOL – ${poolLabel.toUpperCase()}] Application`,
    `<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#F7F7F5;font-family:Inter,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;border:1.5px solid rgba(11,11,11,0.08)">
  <tr><td style="background:#0B0B0B;padding:24px 36px">
    <span style="font-size:20px;font-weight:800;color:#fff;letter-spacing:-0.03em">GrowitBuddy</span>
    <span style="display:inline-block;margin-left:12px;background:${badgeBg};color:#fff;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;padding:4px 12px;border-radius:100px">TALENT POOL</span>
  </td></tr>
  <tr><td style="background:#F0F4FF;padding:12px 36px;border-bottom:1px solid #E0E8FF">
    <span style="font-size:12px;color:#1E3A5F;font-weight:600;font-family:monospace">📍 FROM: ${poolLabel} Pool  →  growitbuddy.com</span>
  </td></tr>
  <tr><td style="padding:28px 36px 8px">
    <p style="margin:0 0 20px;font-size:22px;font-weight:800;color:#0B0B0B;letter-spacing:-0.03em">New ${poolLabel} Application</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1.5px solid rgba(11,11,11,0.08)">
      ${highlightRow("Pool", poolLabel, badgeBg)}
      ${row(nameLabel, name)}
      ${row(emailLabel, email)}
      ${row(contactLabel, submittedValues.get("contact"))}
      ${extraRows}
      ${row(notesLabel, submittedValues.get("notes"))}
    </table>
  </td></tr>
  <tr><td style="padding:20px 36px 32px;border-top:1px solid #f0f0f0;margin-top:8px">
    <p style="margin:0;font-size:12px;color:#aaa;font-family:Inter,sans-serif">
      Submitted at: <strong style="color:#888">${ts}</strong><br/>
      Sent automatically from your GrowitBuddy website.
    </p>
  </td></tr>
</table>
</td></tr></table></body></html>`,
    email,
  );
  res.json({ success: true, message: "You're in the network! We'll reach out when opportunities open up." });
});

// ── NEWSLETTER  →  careers or general based on source ───────────────────────
router.post("/newsletter", newsletterLimit, async (req, res) => {
  const { email, source, tags } = req.body;
  if (!email) {
    res.status(400).json({ error: "email is required" });
    return;
  }
  if (!isValidEmail(email)) {
    res.status(400).json({ error: "Invalid email address" });
    return;
  }
  const ts = nowIST();
  const src = source || "website";
  const tagStr = Array.isArray(tags) ? tags.join(", ") : (tags || "");
  const toEmail = CAREERS_NEWSLETTER_SOURCES.has(src) ? CAREERS_EMAIL : GENERAL_EMAIL;
  const bucket = CAREERS_NEWSLETTER_SOURCES.has(src) ? "Careers / Network" : "General";
  const sourceLabel = getSourceLabel(src);
  logger.info({ email, source: src, tags: tagStr, toEmail, bucket }, "Ecosystem opt-in signup");
  await saveLead("newsletter", undefined, email, { email, source: src, tags: tagStr });
  await sendEmail(
    toEmail,
    `[NEWSLETTER] ${email} — ${src}`,
    emailTemplate(
      "NEWSLETTER", "New Newsletter / Ecosystem Signup",
      highlightRow("Subscribed From", sourceLabel, "#1A5C3A") +
      row("Email Address", email) +
      row("Bucket (inbox)", bucket) +
      row("Source Tag", src) +
      (tagStr ? row("Interest Tags", tagStr) : ""),
      sourceLabel,
      ts,
    ),
  );
  res.json({ success: true });
});

export default router;
