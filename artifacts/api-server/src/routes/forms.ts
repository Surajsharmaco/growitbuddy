import { Router, type Request, type Response, type NextFunction } from "express";
import { logger } from "../lib/logger";
import { db, leads } from "@workspace/db";

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

const FROM = "GrowitBuddy <onboarding@resend.dev>";

// ── Email routing ──
const GENERAL_EMAIL = process.env.NOTIFY_EMAIL || "hello@growitbuddy.com";
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
    logger.warn("RESEND_API_KEY not set — skipping email notification");
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
      logger.error({ resendError: result.error, to, subject }, "Resend rejected email");
    } else {
      logger.info({ resendId: result.data?.id, to, subject }, "Email sent via Resend");
    }
  } catch (err) {
    logger.error(err, "Resend error");
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
    logger.error(err, "Failed to save lead to DB");
  }
}

// ── Email template helpers ──
function row(label: string, value: string | undefined) {
  if (!value) return "";
  return `<tr>
    <td style="padding:10px 0;color:#888;font-size:13px;width:170px;vertical-align:top;font-family:Inter,sans-serif;border-bottom:1px solid #f0f0f0">${label}</td>
    <td style="padding:10px 0;color:#0B0B0B;font-size:14px;vertical-align:top;font-family:Inter,sans-serif;border-bottom:1px solid #f0f0f0"><strong>${value}</strong></td>
  </tr>`;
}

function highlightRow(label: string, value: string | undefined, color = "#8B3A1A") {
  if (!value) return "";
  return `<tr>
    <td style="padding:10px 0;color:#888;font-size:13px;width:170px;vertical-align:top;font-family:Inter,sans-serif;border-bottom:1px solid #f0f0f0">${label}</td>
    <td style="padding:10px 0;font-size:14px;vertical-align:top;font-family:Inter,sans-serif;border-bottom:1px solid #f0f0f0"><strong style="color:${color}">${value}</strong></td>
  </tr>`;
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
