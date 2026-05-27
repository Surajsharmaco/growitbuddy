import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  Home as HomeIcon, Layout as LayoutIcon, Users, FileText, Briefcase,
  Mail, Settings as SettingsIcon, Search, Inbox, Image as ImageIcon,
  Shield, Database, Send, ChevronRight, ChevronDown, ExternalLink,
  Globe, Lock, BookOpen, Sparkles, AlertTriangle, CheckCircle2,
  Copy as CopyIcon, Download,
} from "lucide-react";
import SEOMeta from "@/components/SEOMeta";

// ── Color tokens (matching site design system) ────────────────────────────────
const C = {
  bg: "#F8F8F6",
  bg2: "#EFEFEA",
  card: "#FFFFFF",
  border: "#E5E5E0",
  text: "#0A0A0A",
  text2: "#5F5F5F",
  muted: "#8A8A8A",
  authority: "#1E293B",
  accent: "#8B3A1A",
  accentHover: "#A34722",
  gold: "#C2A878",
};

// ── Section data ──────────────────────────────────────────────────────────────
const TOC = [
  { id: "intro",      label: "Introduction",        icon: BookOpen },
  { id: "structure",  label: "Website Structure",   icon: LayoutIcon },
  { id: "pages",      label: "Public Pages",        icon: Globe },
  { id: "admin",      label: "Admin Panel",         icon: Lock },
  { id: "variants",   label: "Page Variants",       icon: CopyIcon },
  { id: "resources",  label: "Resources Library",   icon: Download },
  { id: "power",      label: "Power Features",      icon: Sparkles },
  { id: "crm",        label: "CRM / Leads",         icon: Inbox },
  { id: "talent",     label: "Talent Pool System",  icon: Users },
  { id: "seo",        label: "SEO Management",      icon: Search },
  { id: "email",      label: "Email Notifications", icon: Mail },
  { id: "media",      label: "Media & Images",      icon: ImageIcon },
  { id: "tech",       label: "Tech Stack (basic)",  icon: Database },
  { id: "faq",        label: "FAQ",                 icon: Sparkles },
];

interface Page { path: string; name: string; what: string; }
const PUBLIC_PAGES: Page[] = [
  { path: "/",              name: "Home",                  what: "Landing page — hero, stats, services preview, framework, testimonials. Main CTA to attract leads." },
  { path: "/services",      name: "Services",              what: "Detailed services offered (content production, distribution, authority building)." },
  { path: "/work",          name: "Work / Portfolio",      what: "Case studies and client logos. Showcases past work." },
  { path: "/framework",     name: "Framework",             what: "Your 4-step methodology: Positioning → Production → Distribution → Inbound Demand." },
  { path: "/blog",          name: "Blog / Insights",       what: "All blog posts listing page." },
  { path: "/blog/:slug",    name: "Blog Post",             what: "Individual blog post page — auto-generated for every post you publish in /admin/blog." },
  { path: "/portfolio",     name: "Portfolio",             what: "Full portfolio grid — all case studies / project work." },
  { path: "/portfolio/:category", name: "Portfolio Category", what: "Filtered portfolio view by category (auto-routed from category tags)." },
  { path: "/portfolio/shared/:slug", name: "Shared Portfolio", what: "Private, trackable portfolio link generated from /admin/portfolio-shares — share with one prospect at a time." },
  { path: "/about",         name: "About",                 what: "Founder story, team, mission." },
  { path: "/contact",       name: "Contact",               what: "Contact form — submissions land in your inbox + Admin Leads." },
  { path: "/creators",      name: "Creator Network",       what: "Sign-up form for content creators wanting to join your network." },
  { path: "/career",        name: "Career",                what: "Full-time + internship + freelancer job applications in one tabbed page." },
  { path: "/influencers",   name: "Influencer Directory",  what: "Browse all influencers. Each has a profile at /influencers/:slug." },
  { path: "/distribution",  name: "Distribution Network",  what: "Information about page-owner / distribution partnership." },
  { path: "/join/page-owner", name: "Page Owner Apply",    what: "Application form for Instagram/social page owners." },
  { path: "/authority-audit", name: "Authority Audit",     what: "Free audit lead-magnet tool." },
  { path: "/resources",     name: "Resources",             what: "Free resource library — unlimited eBooks, PDFs, Drive links, Notion templates, videos, toolkits and more. Featured strip, category filter, FAQ section, AI Quick-Answer block, rich JSON-LD." },
  { path: "/:slug",         name: "Page Variants (catch-all)", what: "Any published page variant lives at its own URL slug (e.g. /home-v2, /services-bold). Created from Admin → Page Variants. Used for A/B tests or campaign-specific landing pages." },
  { path: "/creator-school",  name: "Creator School",      what: "Onboarding hub with VSL, guidelines, FAQ." },
  { path: "/designers-pool", name: "Talent Pools (9 pages)", what: "Each pool has its own URL: /designers-pool · /thumbnail-designers · /writers-pool · /social-media-managers · /motion-designers · /ai-creators · /ugc-creators · /meme-designers · /video-editors. Each has landing page + dedicated form." },
  { path: "/verify",        name: "Certificate Verify",    what: "Public certificate verification page." },
  { path: "/guide",         name: "Site Guide (this page)", what: "The team onboarding guide you're reading right now. Bookmark and share with every new member." },
  { path: "/seo-guide",     name: "SEO Strategy Guide",    what: "Standalone internal SEO playbook — how to optimise each page, write meta titles, structure keywords, etc." },
  { path: "/privacy",       name: "Privacy & Terms",       what: "Legal pages." },
];

interface AdminPage { url: string; name: string; what: string; }
const ADMIN_PAGES: AdminPage[] = [
  { url: "/admin",                     name: "Dashboard",         what: "At-a-glance home screen: stat cards (total blog posts, influencers, total leads, sections saved), a horizontal bar chart of 'Leads by Type', a 'Recent Saves' timeline, and a status grid of every editable section on the site." },
  { url: "/admin/home",                name: "Home page editor",  what: "Edit hero text, stats, services preview, testimonials on the homepage." },
  { url: "/admin/about",               name: "About editor",      what: "Edit founder story, team, mission text on /about." },
  { url: "/admin/services",            name: "Services editor",   what: "Edit services list and descriptions." },
  { url: "/admin/work",                name: "Work editor",       what: "Edit Work page hero, sections, case study cards." },
  { url: "/admin/portfolio",           name: "Portfolio items",   what: "Add/edit/hide individual case studies shown on /work." },
  { url: "/admin/logos",               name: "Client Logos",      what: "Upload & re-order client logos shown on the Work page." },
  { url: "/admin/framework",           name: "Framework editor",  what: "Edit the 4-step methodology page." },
  { url: "/admin/blog",                name: "Blog / Insights",   what: "Add, edit, delete blog posts (rich text + cover image) PLUS a full SEO suite: live SEO Score ring (0-100), Yoast-style checks (keyword density, title/meta inclusion, paragraph length), Search-Intent detector (Informational / Commercial / Transactional), Power-Word analysis on titles, and an Internal-Link Suggester that recommends other posts to link to based on content similarity." },
  { url: "/admin/influencers",         name: "Influencers DB",    what: "Add/edit influencer profiles shown in directory." },
  { url: "/admin/influencer-explore",  name: "Influencer page",   what: "Edit the /influencers landing page (hero, filters)." },
  { url: "/admin/distribution-network", name: "Distribution page", what: "Edit /distribution landing page content." },
  { url: "/admin/distribution-pages",  name: "Page-Owner content", what: "Edit /join/page-owner application page." },
  { url: "/admin/join-network",        name: "Join Network",      what: "Edit /join landing page (path-choosing screen)." },
  { url: "/admin/contact",             name: "Contact page",      what: "Edit /contact page text, form labels." },
  { url: "/admin/career",              name: "Career page",       what: "Unified editor for /career — manages full-time, internship and freelancer tabs in one place. The freelancer form now includes a 'Clipping' skill option alongside the existing creative skills. (Legacy URLs /admin/freelancers and /admin/full-time redirect here.)" },
  { url: "/admin/authority-audit",     name: "Authority Audit",   what: "Edit the audit tool's content & questions." },
  { url: "/admin/resources",           name: "Resources",         what: "Add unlimited resources of any format (eBook, PDF, Drive, Notion, video, template, toolkit, course, sheet, Figma, audio, link). Per-resource: primary + secondary CTA buttons, corner badges, cover image, file format/size, gated/featured toggles, keywords + AI summary. Page-level: FAQs (auto-FAQPage schema), AI Quick-Answer, AI keywords, primary entity, related topics, audience, geo, factual claims — all baked into JSON-LD." },
  { url: "/admin/page-variants",       name: "Page Variants",     what: "Create alternate versions of any page (Home, Services, etc.) at custom URLs (e.g. /home-v2). Each variant has its own editable content, separate SEO, and can be published or kept as draft. Useful for A/B tests, campaign landers, or experimenting without breaking the live page." },
  { url: "/admin/editors-pool",        name: "Creator School",    what: "Edit Creator School hub content." },
  { url: "/admin/pool-designers",      name: "Talent Pool editors (9)", what: "9 separate editors, one per pool: /admin/pool-designers · /pool-thumbnail-designers · /pool-writers · /pool-social-managers · /pool-motion-designers · /pool-ai-creators · /pool-ugc-creators · /pool-meme-designers · /pool-editors." },
  { url: "/admin/portfolio-shares",    name: "Portfolio Share Links", what: "Generate unique, trackable shared-portfolio URLs (live at /portfolio/shared/:slug) to send to individual prospects. See open counts and revoke any link any time." },
  { url: "/admin/leads",               name: "Leads (CRM)",       what: "ALL form submissions — contact, newsletter, creator, page-owner, freelancer, full-time, internship. Searchable + exportable." },
  { url: "/admin/talent-pool-leads",   name: "Talent Pool Leads", what: "Separate inbox just for talent-pool applications, grouped by pool type." },
  { url: "/admin/certificates",        name: "Certificates",      what: "Issue & manage certificates verifiable at /verify/:id." },
  { url: "/admin/media",               name: "Media Library",     what: "Drag-and-drop multi-file uploader, search by filename, full-screen lightbox preview, one-click 'Copy URL' for cross-linking the image into any other editor. Every image picker in the admin reads from here." },
  { url: "/admin/team",                name: "Team Members",      what: "Create login accounts for team members. Role-based: 'super' admins see everything; 'member' accounts can be limited to specific sections only (e.g. just Leads, or just Blog) so a writer can publish without ever seeing leads or settings." },
  { url: "/admin/seo",                 name: "SEO settings",      what: "Full control centre: GLOBAL master 'Site Indexing' toggle (kill-switch that adds noindex,nofollow site-wide and empties sitemap), then per-page — indexing on/off, follow on/off, include-in-sitemap on/off, title, description, canonical URL, custom Facebook/OG (title + description + image), custom Twitter card (type + title + description + image), and a JSON-LD editor with live validation. Live SERP / Twitter / Facebook preview cards update as you type. Auto-warns if title or description is too long/short." },
  { url: "/admin/navbar",              name: "Navbar editor",     what: "Edit navigation menu items, links, order." },
  { url: "/admin/footer",              name: "Footer editor",     what: "Edit footer columns, links, social handles." },
  { url: "/admin/settings",            name: "Site Settings",     what: "Site-wide: logo, favicon, contact info, social links, PLUS design controls — primary + accent color pickers with preset palettes (Midnight, Forest, etc.), global font-scale slider (80%–130%), custom-cursor toggle and page-intro animation toggle, with a live theme-preview card." },
  { url: "/admin/page-visibility",     name: "Page Visibility",   what: "Hide any page from the public with one of two modes: 'Maintenance' (shows a maintenance screen) or 'Coming Soon' (shows a teaser screen). Each mode has its own editable headline + message. Hidden pages are automatically removed from sitemap.xml." },
  { url: "/admin/optimize",            name: "Optimizer",         what: "Performance toggles + one-click warm-up. Keep DB warm, cache stable public reads (60s/5min), long-cache images, clear caches, run VACUUM ANALYZE. All safe — defaults are OFF, never deletes content." },
];

// ── Step-list component ───────────────────────────────────────────────────────
function Steps({ items }: { items: string[] }) {
  return (
    <ol style={{ counterReset: "step", listStyle: "none", padding: 0, margin: 0 }}>
      {items.map((text, i) => (
        <li
          key={i}
          style={{
            display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 0",
            borderBottom: i === items.length - 1 ? "none" : `1px solid ${C.border}`,
          }}
        >
          <span
            style={{
              flexShrink: 0, width: 28, height: 28, borderRadius: 8,
              background: C.authority, color: "#fff", display: "flex",
              alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums",
            }}
          >{i + 1}</span>
          <span style={{ fontSize: 15, lineHeight: 1.65, color: C.text2, paddingTop: 3 }}>{text}</span>
        </li>
      ))}
    </ol>
  );
}

// ── Collapsible FAQ item ──────────────────────────────────────────────────────
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: `1px solid ${C.border}` }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", padding: "20px 0", display: "flex",
          alignItems: "center", justifyContent: "space-between",
          background: "transparent", border: "none", cursor: "pointer",
          textAlign: "left", fontSize: 16, fontWeight: 600, color: C.text,
        }}
      >
        <span>{q}</span>
        {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
      </button>
      {open && (
        <p style={{ paddingBottom: 20, fontSize: 15, lineHeight: 1.7, color: C.text2, margin: 0 }}>
          {a}
        </p>
      )}
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ id, eyebrow, title, children }: {
  id: string; eyebrow?: string; title: string; children: React.ReactNode;
}) {
  return (
    <section id={id} style={{ padding: "72px 24px", borderTop: `1px solid ${C.border}`, scrollMarginTop: 80 }}>
      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        {eyebrow && (
          <p style={{
            fontSize: 11, fontWeight: 700, letterSpacing: "0.2em",
            textTransform: "uppercase", color: C.accent, marginBottom: 12,
          }}>{eyebrow}</p>
        )}
        <h2 style={{
          fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 800,
          letterSpacing: "-0.03em", lineHeight: 1.15, color: C.text,
          marginBottom: 28, marginTop: 0,
        }}>{title}</h2>
        {children}
      </div>
    </section>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
function Card({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <div style={{
      background: accent ? "#FFF8F1" : C.card,
      border: `1px solid ${accent ? "#F0D9C0" : C.border}`,
      borderRadius: 12, padding: 24, marginBottom: 18,
    }}>
      {children}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SiteGuide() {
  return (
    <div style={{ background: C.bg, fontFamily: "'Inter', sans-serif", color: C.text }}>
      <SEOMeta
        title="Site Guide — How GrowitBuddy Works"
        description="Complete beginner-friendly guide to the GrowitBuddy website: pages, admin panel, CRM, SEO, talent pools, and email system."
      />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{ padding: "140px 24px 80px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 920, margin: "0 auto" }}>
          <p style={{
            fontSize: 11, fontWeight: 700, letterSpacing: "0.2em",
            textTransform: "uppercase", color: C.accent, marginBottom: 16,
          }}>Complete Site Guide · v1.4</p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            style={{
              fontWeight: 800, fontSize: "clamp(32px, 7vw, 72px)",
              letterSpacing: "-0.04em", lineHeight: 1.08, color: C.text,
              marginBottom: 24, marginTop: 0,
            }}
          >
            Understand the entire GrowitBuddy website — in 10 minutes.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            style={{ fontSize: 18, color: C.text2, lineHeight: 1.7, maxWidth: "56ch", margin: 0 }}
          >
            A complete, beginner-friendly walkthrough of every public page, every admin tool,
            the CRM, SEO controls, talent-pool system, and how lead emails work. No technical
            knowledge required.
          </motion.p>

          {/* Quick links */}
          <div style={{ marginTop: 40, display: "flex", flexWrap: "wrap", gap: 10 }}>
            {TOC.map((t) => (
              <a
                key={t.id}
                href={`#${t.id}`}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "9px 14px", background: C.card, border: `1px solid ${C.border}`,
                  borderRadius: 100, fontSize: 13, fontWeight: 600, color: C.text2,
                  textDecoration: "none",
                }}
              >
                <t.icon size={14} /> {t.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── 1. INTRO ─────────────────────────────────────────────────────── */}
      <Section id="intro" eyebrow="01" title="What is this website?">
        <p style={{ fontSize: 17, lineHeight: 1.8, color: C.text2, marginTop: 0 }}>
          GrowitBuddy is a <strong style={{ color: C.text }}>premium content authority &amp;
          marketing agency website</strong> with a full self-serve admin panel. Almost every
          word, image, and section visible on the public site can be edited from the admin
          panel — no developer needed for day-to-day content updates.
        </p>
        <Card>
          <p style={{ margin: 0, fontSize: 15, color: C.text2, lineHeight: 1.7 }}>
            <strong style={{ color: C.text }}>Two sides of the website:</strong>
          </p>
          <ul style={{ marginTop: 12, marginBottom: 0, paddingLeft: 22, fontSize: 15, lineHeight: 1.9, color: C.text2 }}>
            <li><strong>Public site</strong> — what your visitors see (home, services, blog, talent pools, contact forms, etc.)</li>
            <li><strong>Admin panel</strong> at <code style={{ background: C.bg2, padding: "2px 8px", borderRadius: 4, fontSize: 13 }}>/admin</code> — password-protected control center to edit content, view leads, manage SEO.</li>
          </ul>
        </Card>
      </Section>

      {/* ── 2. STRUCTURE ─────────────────────────────────────────────────── */}
      <Section id="structure" eyebrow="02" title="How the website is structured">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
          {[
            { icon: Globe,     title: "Frontend",  text: "The visible website (Vercel). React + Vite. What visitors see." },
            { icon: Database,  title: "API server", text: "The brain (Render). Saves leads, handles login, sends emails." },
            { icon: Shield,    title: "Database",   text: "Postgres (Neon). Stores all content, leads, influencers, blog posts." },
          ].map((b) => (
            <div key={b.title} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: C.bg2, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                <b.icon size={18} color={C.authority} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 6px", color: C.text }}>{b.title}</h3>
              <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.6, margin: 0 }}>{b.text}</p>
            </div>
          ))}
        </div>
        <p style={{ marginTop: 26, fontSize: 15, color: C.text2, lineHeight: 1.7 }}>
          You don't need to touch any of these directly. Everything flows through the admin
          panel. The 3 services talk to each other automatically.
        </p>
      </Section>

      {/* ── 3. PUBLIC PAGES ──────────────────────────────────────────────── */}
      <Section id="pages" eyebrow="03" title="All the public pages, explained">
        <p style={{ fontSize: 16, color: C.text2, lineHeight: 1.7, marginTop: 0 }}>
          Every page below is editable from the admin panel. Click any page name to open it
          in a new tab.
        </p>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", marginTop: 24 }}>
          {PUBLIC_PAGES.map((p, i) => (
            <div
              key={p.path}
              style={{
                padding: "16px 20px",
                borderBottom: i === PUBLIC_PAGES.length - 1 ? "none" : `1px solid ${C.border}`,
                display: "grid", gridTemplateColumns: "180px 1fr", gap: 16, alignItems: "start",
              }}
            >
              <div>
                <a
                  href={p.path}
                  target="_blank"
                  rel="noopener"
                  style={{
                    fontSize: 14, fontWeight: 700, color: C.authority,
                    textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4,
                  }}
                >
                  {p.name} <ExternalLink size={11} />
                </a>
                <div style={{ fontSize: 12, color: C.muted, fontFamily: "ui-monospace, monospace", marginTop: 3 }}>{p.path}</div>
              </div>
              <div style={{ fontSize: 14, color: C.text2, lineHeight: 1.6 }}>{p.what}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── 4. ADMIN PANEL ───────────────────────────────────────────────── */}
      <Section id="admin" eyebrow="04" title="The Admin Panel — your control center">
        <p style={{ fontSize: 16, color: C.text2, lineHeight: 1.7, marginTop: 0 }}>
          Open <code style={{ background: C.bg2, padding: "2px 8px", borderRadius: 4, fontSize: 13 }}>/admin</code> and
          login with your admin password. You'll land on the dashboard.
        </p>

        <h3 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginTop: 36, marginBottom: 16 }}>
          How to edit any page's content
        </h3>
        <Steps items={[
          "Log into /admin with your admin password.",
          "From the left sidebar, click the page you want to edit (e.g. 'Home' or 'About').",
          "You'll see a form with all the editable fields — headings, paragraphs, images, lists.",
          "Make your changes. Use the image picker (paste a URL or upload from Media Library) for any image field.",
          "Click 'Save' at the bottom. Changes appear on the public site within seconds — no rebuild needed.",
          "Open the public page in a new tab to verify (you may need to hard-refresh: Ctrl+Shift+R / Cmd+Shift+R).",
        ]} />

        <h3 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginTop: 48, marginBottom: 16 }}>
          Every admin page — complete list
        </h3>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
          {ADMIN_PAGES.map((p, i) => (
            <div
              key={p.url}
              style={{
                padding: "14px 20px",
                borderBottom: i === ADMIN_PAGES.length - 1 ? "none" : `1px solid ${C.border}`,
                display: "grid", gridTemplateColumns: "210px 1fr", gap: 16, alignItems: "start",
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{p.name}</div>
                <div style={{ fontSize: 12, color: C.muted, fontFamily: "ui-monospace, monospace", marginTop: 3 }}>{p.url}</div>
              </div>
              <div style={{ fontSize: 14, color: C.text2, lineHeight: 1.6 }}>{p.what}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── 5. PAGE VARIANTS ─────────────────────────────────────────────── */}
      <Section id="variants" eyebrow="05" title="Page Variants — A/B test any page without breaking the live one">
        <p style={{ fontSize: 16, color: C.text2, lineHeight: 1.7, marginTop: 0 }}>
          Page Variants let you create <strong style={{ color: C.text }}>alternate versions of any page</strong> —
          Home, Services, Resources, etc. — and publish each one at its own URL.
          The original page stays untouched. Perfect for A/B testing copy, running
          campaign-specific landing pages, or trying a bold redesign without risking
          the live page.
        </p>

        <Card>
          <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 12px", color: C.text, display: "flex", alignItems: "center", gap: 8 }}>
            <CopyIcon size={18} color={C.accent} /> How a variant works
          </h3>
          <ul style={{ margin: 0, paddingLeft: 22, fontSize: 15, lineHeight: 1.9, color: C.text2 }}>
            <li>Lives at its own URL slug (e.g. <code style={{ background: C.bg2, padding: "2px 6px", borderRadius: 4, fontSize: 13 }}>/home-v2</code>, <code style={{ background: C.bg2, padding: "2px 6px", borderRadius: 4, fontSize: 13 }}>/services-bold</code>).</li>
            <li>Has its <strong>own editable content</strong>, fully isolated from the original page.</li>
            <li>Has its <strong>own SEO</strong> (title, description, OG image, canonical, schema).</li>
            <li>Can be <strong>draft</strong> (only you see it via admin) or <strong>published</strong> (live to the public).</li>
            <li>Shows a small gold <strong>"Variant"</strong> banner at the top so you never confuse it with the original.</li>
            <li>All published variants appear in the admin sidebar under the <strong>"Published Variants"</strong> group for one-click access.</li>
          </ul>
        </Card>

        <h3 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginTop: 36, marginBottom: 16 }}>
          How to create a new variant
        </h3>
        <Steps items={[
          "Go to /admin/page-variants → click 'Add Variant'.",
          "Pick the base page you want to clone (e.g. 'Home').",
          "Give it a URL slug — keep it short and descriptive (e.g. 'home-launch', 'services-q1').",
          "Optionally set a label (only visible in admin) to remember what you're testing.",
          "Save as draft first — the variant URL becomes editable but is not yet public.",
          "Open the variant URL (e.g. /home-launch) — you'll see the original content as a starting point with a gold 'Variant' banner at the top.",
          "Edit the content from its dedicated admin editor — changes apply only to the variant.",
          "Toggle 'Published' when you're happy — the public can now reach it directly via the URL.",
        ]} />

        <div style={{ background: "#FEF5EC", border: "1px solid #F0D9C0", borderRadius: 12, padding: 24, marginTop: 28 }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 12px", color: C.accent, display: "flex", alignItems: "center", gap: 8 }}>
            <AlertTriangle size={18} /> A few things to know
          </h3>
          <ul style={{ margin: 0, paddingLeft: 22, fontSize: 15, lineHeight: 1.9, color: C.text2 }}>
            <li>The original page at its real URL (e.g. <code style={{ background: "#fff", padding: "2px 6px", borderRadius: 4, fontSize: 13 }}>/</code>) is <strong>never affected</strong> by any variant.</li>
            <li>Don't use a slug that already exists as a real page (e.g. <code style={{ background: "#fff", padding: "2px 6px", borderRadius: 4, fontSize: 13 }}>/contact</code>) — the real page always wins.</li>
            <li>To send traffic to a variant: paste its URL directly into ads / emails / posts. Nothing on the main site links to variants automatically.</li>
            <li>Delete a variant from <code style={{ background: "#fff", padding: "2px 6px", borderRadius: 4, fontSize: 13 }}>/admin/page-variants</code> when the test is over — the URL will then 404.</li>
          </ul>
        </div>
      </Section>

      {/* ── 6. RESOURCES LIBRARY ─────────────────────────────────────────── */}
      <Section id="resources" eyebrow="06" title="Resources Library — unlimited free downloads with tagda SEO">
        <p style={{ fontSize: 16, color: C.text2, lineHeight: 1.7, marginTop: 0 }}>
          The <code style={{ background: C.bg2, padding: "2px 8px", borderRadius: 4, fontSize: 13 }}>/resources</code> page is a
          full self-serve content library — add unlimited resources of any format and
          each one is automatically optimised for Google + AI search (ChatGPT, Perplexity,
          Google AI Overviews) through rich structured data.
        </p>

        <Card>
          <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 12px", color: C.text, display: "flex", alignItems: "center", gap: 8 }}>
            <Download size={18} color={C.accent} /> 13 resource formats you can add
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
            {[
              "eBook", "PDF", "Google Drive", "Notion", "Video",
              "Template", "Toolkit", "Guide", "Course",
              "Spreadsheet", "Figma File", "Audio", "External Link",
            ].map((f) => (
              <div key={f} style={{ padding: "8px 12px", background: C.bg2, borderRadius: 6, fontSize: 13, color: C.text, textAlign: "center" }}>{f}</div>
            ))}
          </div>
        </Card>

        <h3 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginTop: 36, marginBottom: 16 }}>
          How to add a new resource
        </h3>
        <Steps items={[
          "Open /admin/resources and click 'Add resource'.",
          "Pick the resource type (eBook, PDF, Drive, Notion, etc.) — this sets the icon, badge label and default CTA text.",
          "Fill in Title, Short Description (the card preview), and a Long Description (used in structured data + AI citations).",
          "Paste the Primary Link — your Drive / Notion / file URL. This becomes the main 'Download' or 'Open' button.",
          "Optional: add a Secondary Link + Label (e.g. 'Preview', 'Watch walkthrough') — a second outlined button appears on the card.",
          "Add a Corner Badge (e.g. 'New', 'Most popular', 'Updated') for emphasis.",
          "Optional: cover image, file format, file size, author, published date — used both visually and in structured data.",
          "Toggle 'Featured' to surface the resource in the featured strip at the top of the page.",
          "Toggle 'Gated' if access requires an email (shows an 'Email required' badge).",
          "Fill the per-resource Keywords + AI Summary — these go straight into the page's JSON-LD so LLMs cite this resource correctly.",
          "Reorder with the up/down arrows, duplicate with the copy icon, delete with the trash icon. Save when done.",
        ]} />

        <h3 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginTop: 48, marginBottom: 16 }}>
          The page-level SEO controls (GEO / AEO / AIO / AISEO)
        </h3>
        <p style={{ fontSize: 15, color: C.text2, lineHeight: 1.7 }}>
          Below the resources list in the admin, there are two SEO blocks. <strong style={{ color: C.text }}>SEO Basics</strong> covers
          page title, meta description, canonical URL, OG image — the standard stuff. The
          <strong style={{ color: C.text }}> SEO Advanced (AI / GEO / AEO / AISEO)</strong> block is what makes the page rank in AI
          answers and Google's AI Overviews:
        </p>
        <Card>
          <ul style={{ margin: 0, paddingLeft: 22, fontSize: 15, lineHeight: 1.9, color: C.text2 }}>
            <li><strong>AI Quick-Answer Summary</strong> — 2-3 sentences answering "what is this page?". Shown as a visible gold-accent block at the top of the page AND fed to JSON-LD <code style={{ background: C.bg2, padding: "1px 6px", borderRadius: 4, fontSize: 13 }}>abstract</code> for LLM citation.</li>
            <li><strong>AI Target Keywords</strong> — comma-separated. Drives the page's JSON-LD <code style={{ background: C.bg2, padding: "1px 6px", borderRadius: 4, fontSize: 13 }}>keywords</code>.</li>
            <li><strong>Primary Entity + Related Topics</strong> — entity SEO + topical authority signals. Help Google understand exactly what the page is about.</li>
            <li><strong>Audience</strong> — fed to <code style={{ background: C.bg2, padding: "1px 6px", borderRadius: 4, fontSize: 13 }}>schema:Audience</code> so Google knows who the page is for.</li>
            <li><strong>Geo Location + Language</strong> — Generative Engine Optimization signals for regional / multilingual ranking.</li>
            <li><strong>Factual Claims</strong> — one verifiable fact per line. Rendered as a bullet list under the Quick Answer block (great for AEO / People-Also-Ask) and used by AI assistants as a citation source.</li>
            <li><strong>FAQs section</strong> (separate card above) — Q&amp;A pairs that emit as <code style={{ background: C.bg2, padding: "1px 6px", borderRadius: 4, fontSize: 13 }}>FAQPage</code> schema, the same kind Google uses for People-Also-Ask boxes.</li>
          </ul>
        </Card>

        <p style={{ fontSize: 15, color: C.text2, lineHeight: 1.7, marginTop: 20 }}>
          All of the above is auto-injected into a structured-data graph that includes a
          <code style={{ background: C.bg2, padding: "2px 6px", borderRadius: 4, fontSize: 13 }}>CollectionPage</code>, an
          <code style={{ background: C.bg2, padding: "2px 6px", borderRadius: 4, fontSize: 13 }}>ItemList</code> of
          <code style={{ background: C.bg2, padding: "2px 6px", borderRadius: 4, fontSize: 13 }}>DigitalDocument</code> nodes (one per
          resource, with format / date / author / keywords / license), a
          <code style={{ background: C.bg2, padding: "2px 6px", borderRadius: 4, fontSize: 13 }}>FAQPage</code>, and a
          <code style={{ background: C.bg2, padding: "2px 6px", borderRadius: 4, fontSize: 13 }}>BreadcrumbList</code> — no
          developer work required, just fill in the form.
        </p>
      </Section>

      {/* ── 7. POWER FEATURES ────────────────────────────────────────────── */}
      <Section id="power" eyebrow="07" title="Power features — Blog SEO Suite, Roles & Portfolio Shares">
        <p style={{ fontSize: 16, color: C.text2, lineHeight: 1.7, marginTop: 0 }}>
          A few high-value tools tucked inside the admin that most teams miss on day one.
          Take 5 minutes here — these save hours later.
        </p>

        <Card>
          <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 12px", color: C.text, display: "flex", alignItems: "center", gap: 8 }}>
            <Search size={18} color={C.accent} /> Blog SEO Suite (built into /admin/blog)
          </h3>
          <p style={{ margin: "0 0 12px", fontSize: 15, color: C.text2, lineHeight: 1.7 }}>
            Open any blog post in the admin and the right rail shows a live SEO analysis as
            you type — no plugin required:
          </p>
          <ul style={{ margin: 0, paddingLeft: 22, fontSize: 15, lineHeight: 1.9, color: C.text2 }}>
            <li><strong>SEO Score Ring</strong> — a 0-100 ring chart updating live. Aim for 80+ before publishing.</li>
            <li><strong>Yoast-style checks</strong> — keyword density, keyword in title/meta/H1, paragraph length, internal-link count, image alt-text coverage. Each check turns green / yellow / red.</li>
            <li><strong>Search-Intent Detector</strong> — auto-classifies the post as <em>Informational</em>, <em>Commercial</em>, or <em>Transactional</em> based on title + body. Helps you align CTAs to intent.</li>
            <li><strong>Power-Word Analysis</strong> — flags titles missing high-conversion words ("ultimate", "proven", "free", "step-by-step", etc.).</li>
            <li><strong>Internal-Link Suggester</strong> — analyses your existing posts and recommends 3-5 related ones to link to from the current draft. One-click insert.</li>
          </ul>
        </Card>

        <Card>
          <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 12px", color: C.text, display: "flex", alignItems: "center", gap: 8 }}>
            <Users size={18} color={C.accent} /> Role-based team permissions (/admin/team)
          </h3>
          <p style={{ margin: "0 0 12px", fontSize: 15, color: C.text2, lineHeight: 1.7 }}>
            You can hand out admin access without giving everyone the keys to the kingdom:
          </p>
          <ul style={{ margin: 0, paddingLeft: 22, fontSize: 15, lineHeight: 1.9, color: C.text2 }}>
            <li><strong>Super admin</strong> — full access (you).</li>
            <li><strong>Member</strong> — pick exactly which sections they can edit (e.g. only Blog, only Leads, only Talent Pool Leads).</li>
            <li>Hidden sections simply don't appear in their sidebar — they can't even browse to the URL.</li>
            <li>Perfect for: a writer who needs Blog access only, a sales person who only needs the CRM, a designer who only needs Media Library.</li>
          </ul>
        </Card>

        <Card>
          <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 12px", color: C.text, display: "flex", alignItems: "center", gap: 8 }}>
            <Briefcase size={18} color={C.accent} /> Portfolio Share Links (/admin/portfolio-shares)
          </h3>
          <p style={{ margin: "0 0 12px", fontSize: 15, color: C.text2, lineHeight: 1.7 }}>
            Instead of sending your public /portfolio link to every prospect, generate a
            private, trackable link for each one:
          </p>
          <ul style={{ margin: 0, paddingLeft: 22, fontSize: 15, lineHeight: 1.9, color: C.text2 }}>
            <li>Generate a unique slug per prospect — link lives at <code style={{ background: C.bg2, padding: "1px 6px", borderRadius: 4, fontSize: 13 }}>/portfolio/shared/:slug</code>.</li>
            <li>Optionally filter which case studies show up (so you can curate per client).</li>
            <li>See open count + last-opened date — know exactly when a prospect is engaging.</li>
            <li>Revoke any link any time — the URL instantly 404s.</li>
          </ul>
        </Card>

        <Card>
          <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 12px", color: C.text, display: "flex", alignItems: "center", gap: 8 }}>
            <SettingsIcon size={18} color={C.accent} /> Site Optimizer (/admin/optimize)
          </h3>
          <p style={{ margin: "0 0 12px", fontSize: 15, color: C.text2, lineHeight: 1.7 }}>
            Safe performance toggles for the whole site. All defaults are OFF — nothing
            here ever deletes content:
          </p>
          <ul style={{ margin: 0, paddingLeft: 22, fontSize: 15, lineHeight: 1.9, color: C.text2 }}>
            <li><strong>Database Keep-Alive</strong> — pings Neon every few minutes so the database never goes idle (no cold starts).</li>
            <li><strong>Public-read cache</strong> — 60-second / 5-minute caching of public content reads (massive speed boost, safe defaults).</li>
            <li><strong>Long-cache images</strong> — instructs browsers + CDN to hold image responses for 30 days.</li>
            <li><strong>Clear caches</strong> — one-click flush after a content change if a viewer still sees an old version.</li>
            <li><strong>VACUUM ANALYZE</strong> — one-click DB maintenance, runs in the background.</li>
          </ul>
        </Card>
      </Section>

      {/* ── 8. CRM / LEADS ───────────────────────────────────────────────── */}
      <Section id="crm" eyebrow="08" title="CRM — managing every lead">
        <p style={{ fontSize: 16, color: C.text2, lineHeight: 1.7, marginTop: 0 }}>
          Every form on the public site (contact, newsletter, talent pool, career, etc.)
          saves automatically into a single database called <strong style={{ color: C.text }}>Leads</strong>.
          There's no separate CRM tool — your CRM IS the admin panel.
        </p>

        <Card>
          <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 12px", color: C.text, display: "flex", alignItems: "center", gap: 8 }}>
            <Inbox size={18} color={C.accent} /> Where leads go
          </h3>
          <ul style={{ margin: 0, paddingLeft: 22, fontSize: 15, lineHeight: 1.9, color: C.text2 }}>
            <li><strong>General leads</strong> → <code style={{ background: C.bg2, padding: "2px 6px", borderRadius: 4, fontSize: 13 }}>/admin/leads</code> (contact, career, page-owner, newsletter, creator)</li>
            <li><strong>Talent-pool applications</strong> → <code style={{ background: C.bg2, padding: "2px 6px", borderRadius: 4, fontSize: 13 }}>/admin/talent-pool-leads</code> (separated by pool: designers, writers, motion, etc.)</li>
            <li>You also receive an <strong>email notification</strong> for every submission (see "Email Notifications" section).</li>
          </ul>
        </Card>

        <h3 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginTop: 36, marginBottom: 16 }}>
          How to handle a new lead (recommended workflow)
        </h3>
        <Steps items={[
          "You get an email notification — open it to see the lead details.",
          "Optional: log into /admin/leads to see full context, all fields, and previous leads from same email.",
          "Reply directly from your email client (the notification email's 'Reply-To' is set to the lead's email — just hit Reply).",
          "After contact: mark the lead as 'Contacted' or 'Converted' (status column in the Leads table).",
          "Export to CSV anytime if you want to push leads into Notion / Sheets / external CRM.",
        ]} />

        <h3 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginTop: 48, marginBottom: 16 }}>
          Filtering & searching leads
        </h3>
        <p style={{ fontSize: 15, color: C.text2, lineHeight: 1.7 }}>
          The leads page has filters at the top: by <strong>type</strong> (contact / newsletter
          / freelancer / etc.), by <strong>date range</strong>, and a <strong>search box</strong>
          (matches name, email, message). Use these to find anything fast.
        </p>
      </Section>

      {/* ── 9. TALENT POOL SYSTEM ────────────────────────────────────────── */}
      <Section id="talent" eyebrow="09" title="Talent Pool — 9 specialized landing pages">
        <p style={{ fontSize: 16, color: C.text2, lineHeight: 1.7, marginTop: 0 }}>
          Talent pools are dedicated landing pages for each creative speciality. Each has its
          own URL, its own editable content, its own application form, and submissions go to a
          dedicated inbox grouped by pool type.
        </p>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", marginTop: 24 }}>
          {[
            ["Designers",            "/designers-pool",         "/admin/pool-designers"],
            ["Thumbnail Designers",  "/thumbnail-designers",    "/admin/pool-thumbnail-designers"],
            ["Writers",              "/writers-pool",           "/admin/pool-writers"],
            ["Social Media Managers", "/social-media-managers", "/admin/pool-social-managers"],
            ["Motion Designers",     "/motion-designers",       "/admin/pool-motion-designers"],
            ["AI Creators",          "/ai-creators",            "/admin/pool-ai-creators"],
            ["UGC Creators",         "/ugc-creators",           "/admin/pool-ugc-creators"],
            ["Meme Designers",       "/meme-designers",         "/admin/pool-meme-designers"],
            ["Video Editors",        "/video-editors",          "/admin/pool-editors"],
          ].map(([name, pub, adm], i, arr) => (
            <div key={pub} style={{
              padding: "14px 20px",
              borderBottom: i === arr.length - 1 ? "none" : `1px solid ${C.border}`,
              display: "grid", gridTemplateColumns: "1fr 180px 200px", gap: 16, alignItems: "center",
            }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{name}</div>
              <a href={pub} target="_blank" rel="noopener" style={{ fontSize: 12, fontFamily: "ui-monospace, monospace", color: C.authority, textDecoration: "none" }}>
                Public: {pub}
              </a>
              <div style={{ fontSize: 12, fontFamily: "ui-monospace, monospace", color: C.muted }}>
                Edit: {adm}
              </div>
            </div>
          ))}
        </div>

        <h3 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginTop: 40, marginBottom: 16 }}>
          How to update a talent-pool page
        </h3>
        <Steps items={[
          "Open the matching admin page (e.g. /admin/pool-writers for the Writers Pool).",
          "Edit the hero text, perks, requirements, and FAQ as you wish.",
          "Toggle 'Page Visibility' if you want to temporarily hide the pool from the public.",
          "Save. Public page updates immediately.",
          "All submissions from any pool's form land in /admin/talent-pool-leads, grouped by pool name.",
        ]} />
      </Section>

      {/* ── 10. SEO ──────────────────────────────────────────────────────── */}
      <Section id="seo" eyebrow="10" title="SEO — the complete, beginner-friendly playbook">
        <p style={{ fontSize: 17, lineHeight: 1.8, color: C.text2, marginTop: 0 }}>
          SEO simply means: <strong style={{ color: C.text }}>making sure your pages show up
          when people search on Google</strong>. You don't need any technical skill — every
          control lives in <code style={{ background: C.bg2, padding: "2px 6px", borderRadius: 4, fontSize: 13 }}>/admin/seo</code> as
          plain text fields. This section walks through every single one of them, in order,
          with concrete examples.
        </p>

        {/* ── A. The vocabulary ── */}
        <h3 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginTop: 44, marginBottom: 12 }}>
          A. The 6 words you'll see everywhere — explained in 1 line each
        </h3>
        <Card>
          <ul style={{ margin: 0, paddingLeft: 22, fontSize: 15, lineHeight: 2, color: C.text2 }}>
            <li><strong>Title</strong> — the big blue clickable line in a Google result. ~50–60 characters.</li>
            <li><strong>Meta Description</strong> — the small grey paragraph under the title. ~140–160 characters.</li>
            <li><strong>Canonical URL</strong> — the "official" web address of this page. Stops Google from treating duplicates as separate pages.</li>
            <li><strong>OG Image</strong> — the preview picture shown when the link is shared on WhatsApp / Facebook / LinkedIn / X. Size: 1200 × 630 px.</li>
            <li><strong>Robots / Indexing</strong> — instruction to Google: "show this page in search results, or hide it?".</li>
            <li><strong>JSON-LD (Schema)</strong> — a small hidden snippet that tells Google <em>what</em> the page is (an article, a FAQ, a product, etc.). Helps you get rich results.</li>
          </ul>
        </Card>

        {/* ── B. Two layers of control ── */}
        <h3 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginTop: 44, marginBottom: 12 }}>
          B. How SEO is controlled — two layers
        </h3>
        <Card>
          <h4 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 8px", color: C.text }}>1. The Global Site-Indexing master switch</h4>
          <p style={{ margin: 0, fontSize: 15, color: C.text2, lineHeight: 1.7 }}>
            At the very top of <code style={{ background: C.bg2, padding: "2px 6px", borderRadius: 4, fontSize: 13 }}>/admin/seo</code> there
            is one big green/red toggle: <strong>"Allow Google &amp; other search engines to
            index this entire site"</strong>. When this is OFF, the whole site is hidden
            from Google (a <code style={{ background: C.bg2, padding: "1px 6px", borderRadius: 4, fontSize: 13 }}>noindex, nofollow</code> tag
            is added to every page and the sitemap is emptied). Use it when the site is
            in pre-launch / private mode. Keep it ON in production.
          </p>
        </Card>
        <Card>
          <h4 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 8px", color: C.text }}>2. Per-page settings (one row per page)</h4>
          <p style={{ margin: 0, fontSize: 15, color: C.text2, lineHeight: 1.7 }}>
            Below the global switch is the page list. Click any page (Home, Services, a
            specific blog post, etc.) to open its full SEO form. Whatever you set here
            <strong> overrides</strong> the default that ships with the page. Save once and
            it's live on Google within a few hours.
          </p>
        </Card>

        {/* ── C. Every field, top to bottom ── */}
        <h3 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginTop: 44, marginBottom: 12 }}>
          C. Every field inside a per-page SEO form — top to bottom
        </h3>

        <Card accent>
          <h4 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 8px", color: C.text }}>1) Indexability toggles (3 switches)</h4>
          <ul style={{ margin: 0, paddingLeft: 22, fontSize: 15, lineHeight: 1.9, color: C.text2 }}>
            <li><strong>Allow Search Engine Indexing</strong> — ON = page can appear in Google results. OFF = page is hidden from Google (<code style={{ background: "#fff", padding: "1px 6px", borderRadius: 4, fontSize: 13 }}>noindex</code>).</li>
            <li><strong>Allow Search Engine Following</strong> — ON = Google can follow the links on this page. OFF = links are ignored (<code style={{ background: "#fff", padding: "1px 6px", borderRadius: 4, fontSize: 13 }}>nofollow</code>). Almost always keep ON.</li>
            <li><strong>Include in Sitemap</strong> — ON = page is listed in <code style={{ background: "#fff", padding: "1px 6px", borderRadius: 4, fontSize: 13 }}>/sitemap.xml</code> so Google can find it quickly. OFF = it still works but Google has to discover it on its own.</li>
          </ul>
        </Card>

        <Card>
          <h4 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 8px", color: C.text }}>2) Title</h4>
          <p style={{ margin: "0 0 8px", fontSize: 15, color: C.text2, lineHeight: 1.7 }}>
            Aim for <strong>50–60 characters</strong>. Put the main keyword first, then a
            small benefit, then your brand.
          </p>
          <div style={{ background: C.bg2, padding: 14, borderRadius: 8, fontSize: 14, color: C.text2, lineHeight: 1.7 }}>
            <strong style={{ color: C.text }}>Bad:</strong> "Home"<br/>
            <strong style={{ color: C.text }}>Good:</strong> "Content &amp; Distribution Agency for Founders — GrowitBuddy"
          </div>
          <p style={{ margin: "10px 0 0", fontSize: 14, color: C.muted, lineHeight: 1.7 }}>
            If too long, Google chops the end with "…". The admin warns you in red when you exceed 60 chars.
          </p>
        </Card>

        <Card>
          <h4 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 8px", color: C.text }}>3) Meta Description</h4>
          <p style={{ margin: "0 0 8px", fontSize: 15, color: C.text2, lineHeight: 1.7 }}>
            <strong>140–160 characters.</strong> Treat it like an ad — sell the click. Mention
            who the page is for, the benefit, and a verb (Learn / Join / Download / Book).
          </p>
          <div style={{ background: C.bg2, padding: 14, borderRadius: 8, fontSize: 14, color: C.text2, lineHeight: 1.7 }}>
            <strong style={{ color: C.text }}>Good:</strong> "Authority, content and distribution systems for founders and modern brands. Book a free strategy call and see what a 90-day plan looks like."
          </div>
        </Card>

        <Card>
          <h4 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 8px", color: C.text }}>4) Canonical URL</h4>
          <p style={{ margin: 0, fontSize: 15, color: C.text2, lineHeight: 1.7 }}>
            Usually leave blank — the page's own URL is used automatically. Only fill it
            when the same content lives at two URLs and you want Google to treat one as
            the official one. Use the full URL with <code style={{ background: C.bg2, padding: "1px 6px", borderRadius: 4, fontSize: 13 }}>https://</code>.
          </p>
        </Card>

        <Card>
          <h4 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 8px", color: C.text }}>5) Facebook / OG preview (when shared on WhatsApp, LinkedIn, FB)</h4>
          <ul style={{ margin: 0, paddingLeft: 22, fontSize: 15, lineHeight: 1.9, color: C.text2 }}>
            <li><strong>OG Title</strong> — usually same as the SEO title. Override if you want a snappier social headline.</li>
            <li><strong>OG Description</strong> — same as meta description by default. Override for social-only tone.</li>
            <li><strong>OG Image</strong> — <strong>1200 × 630 px</strong> JPG/PNG, &lt; 1 MB. This is what people SEE in their feed — invest 10 minutes on it.</li>
          </ul>
        </Card>

        <Card>
          <h4 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 8px", color: C.text }}>6) Twitter / X preview</h4>
          <ul style={{ margin: 0, paddingLeft: 22, fontSize: 15, lineHeight: 1.9, color: C.text2 }}>
            <li><strong>Twitter Card Type</strong> — pick <em>Summary Large Image</em> 99% of the time (the big image card). Use <em>Summary</em> only for short profile-style pages.</li>
            <li><strong>Twitter Title / Description / Image</strong> — separate fields if you want a different feel on X vs LinkedIn. Otherwise leave blank and the OG values are used.</li>
          </ul>
        </Card>

        <Card>
          <h4 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 8px", color: C.text }}>7) JSON-LD (Custom Schema)</h4>
          <p style={{ margin: "0 0 8px", fontSize: 15, color: C.text2, lineHeight: 1.7 }}>
            This is the "tell Google what the page IS" snippet. Most pages already inject
            sensible schema automatically (Organization on home, Article on blog,
            CollectionPage on Resources, BreadcrumbList on every page). Only paste a
            custom JSON-LD object here if you want to add or override one. The editor:
          </p>
          <ul style={{ margin: 0, paddingLeft: 22, fontSize: 15, lineHeight: 1.9, color: C.text2 }}>
            <li>Live-validates the JSON syntax as you type (red border = broken).</li>
            <li>Accepts any valid <code style={{ background: C.bg2, padding: "1px 6px", borderRadius: 4, fontSize: 13 }}>https://schema.org</code> type — Product, Event, LocalBusiness, Course, Recipe, etc.</li>
            <li>If you don't know JSON, leave this empty — the auto-generated schema is already good.</li>
          </ul>
        </Card>

        <Card>
          <h4 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 8px", color: C.text }}>8) Live preview cards (right side of the form)</h4>
          <p style={{ margin: 0, fontSize: 15, color: C.text2, lineHeight: 1.7 }}>
            As you type, three preview cards on the right update in real time:
          </p>
          <ul style={{ margin: "8px 0 0", paddingLeft: 22, fontSize: 15, lineHeight: 1.9, color: C.text2 }}>
            <li><strong>Google SERP card</strong> — exactly how your title + URL + description will look on Google.</li>
            <li><strong>Twitter card</strong> — your headline + image as the timeline will render it.</li>
            <li><strong>Facebook / LinkedIn / WhatsApp card</strong> — same preview those platforms use.</li>
          </ul>
        </Card>

        {/* ── D. Step-by-step workflow ── */}
        <h3 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginTop: 44, marginBottom: 12 }}>
          D. Step-by-step: optimise any single page in 5 minutes
        </h3>
        <Steps items={[
          "Open /admin/seo and click the page you want to optimise (e.g. 'Home').",
          "Confirm the 3 indexability switches are ON (Indexing, Following, Sitemap).",
          "Write a Title (50–60 chars). Keyword first, benefit, brand. Watch the character counter.",
          "Write a Meta Description (140–160 chars). Treat it like an ad — sell the click.",
          "Leave the Canonical empty unless you have a duplicate-content reason to set it.",
          "Upload an OG Image at 1200×630 px. Use a clear headline + brand logo overlay.",
          "Pick Twitter Card Type = 'Summary Large Image'. Leave Twitter fields blank to reuse OG.",
          "Glance at the 3 live preview cards on the right — make sure the title isn't truncated and the image looks crisp.",
          "Click Save. The change is live on your site within seconds.",
          "Re-share the URL on WhatsApp to yourself — the new preview should appear within 1–2 minutes.",
          "Optional but recommended: open Google Search Console → URL Inspection → paste the URL → click 'Request Indexing' so Google re-crawls within hours instead of days.",
        ]} />

        {/* ── E. Sitemap & robots ── */}
        <h3 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginTop: 44, marginBottom: 12 }}>
          E. Sitemap, robots.txt &amp; Google Search Console
        </h3>
        <Card>
          <ul style={{ margin: 0, paddingLeft: 22, fontSize: 15, lineHeight: 1.9, color: C.text2 }}>
            <li><strong>Sitemap</strong> — auto-generated live at <code style={{ background: C.bg2, padding: "1px 6px", borderRadius: 4, fontSize: 13 }}>/sitemap.xml</code>. It always reflects your current pages. Hidden pages (Page Visibility off, or Include-in-Sitemap off) are automatically excluded.</li>
            <li><strong>robots.txt</strong> — auto-generated at <code style={{ background: C.bg2, padding: "1px 6px", borderRadius: 4, fontSize: 13 }}>/robots.txt</code> and points Google to the sitemap. If the global Site-Indexing master switch is OFF, robots.txt blocks every crawler.</li>
            <li><strong>Google Search Console setup</strong> — go to <code style={{ background: C.bg2, padding: "1px 6px", borderRadius: 4, fontSize: 13 }}>search.google.com/search-console</code>, add your domain, verify it (DNS record is easiest), then in 'Sitemaps' submit <code style={{ background: C.bg2, padding: "1px 6px", borderRadius: 4, fontSize: 13 }}>https://yourdomain.com/sitemap.xml</code>. Within a few days Google will index everything.</li>
            <li><strong>Forcing a re-index</strong> — for any single URL: Search Console → URL Inspection → paste the URL → 'Request Indexing'. Usually live in Google within a few hours.</li>
          </ul>
        </Card>

        {/* ── F. Beyond the basics ── */}
        <h3 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginTop: 44, marginBottom: 12 }}>
          F. Beyond the basics — AI Search, Blog SEO, Resources GEO/AEO
        </h3>
        <Card>
          <ul style={{ margin: 0, paddingLeft: 22, fontSize: 15, lineHeight: 1.9, color: C.text2 }}>
            <li><strong>Blog posts</strong> have a full live SEO Suite right inside <code style={{ background: C.bg2, padding: "1px 6px", borderRadius: 4, fontSize: 13 }}>/admin/blog</code> — score ring (aim 80+), Yoast-style checks, search-intent detector, power-word analysis, internal-link suggester. See the 'Power Features' section above.</li>
            <li><strong>Resources page</strong> has its own GEO / AEO / AISEO controls (AI Quick-Answer, AI keywords, primary entity, audience, geo location, factual claims, FAQs). See the 'Resources Library' section above.</li>
            <li><strong>Page Variants</strong> each get their own independent SEO — perfect for A/B testing meta titles.</li>
            <li><strong>WhatsApp / iMessage preview</strong> = same as OG. There's nothing extra to configure for those platforms.</li>
          </ul>
        </Card>

        {/* ── G. Mistakes to avoid ── */}
        <h3 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginTop: 44, marginBottom: 12 }}>
          G. Common mistakes to avoid
        </h3>
        <div style={{ background: "#FEF5EC", border: "1px solid #F0D9C0", borderRadius: 12, padding: 24 }}>
          <ul style={{ margin: 0, paddingLeft: 22, fontSize: 15, lineHeight: 1.9, color: C.text2 }}>
            <li>Turning the global Site-Indexing switch OFF and forgetting about it after launch — your site disappears from Google.</li>
            <li>Using the same Title and Description on every page — Google sees this as "thin / duplicate" content.</li>
            <li>Uploading a tiny OG image (e.g. 400×400) — looks blurry on LinkedIn and stretched on Facebook. Always 1200×630.</li>
            <li>Putting the brand name first in every Title — wastes precious characters. Keyword first, brand last.</li>
            <li>Pasting random JSON-LD copied from another website — Search Console will throw schema errors. Leave the JSON-LD box empty unless you know exactly what you're adding.</li>
            <li>Hiding a page via Page Visibility but expecting it to still rank — Google treats it as 404 and drops it.</li>
          </ul>
        </div>
      </Section>

      {/* ── 11. EMAIL ────────────────────────────────────────────────────── */}
      <Section id="email" eyebrow="11" title="Email Notifications — every lead lands in your inbox">
        <Card>
          <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 12px", color: C.text, display: "flex", alignItems: "center", gap: 8 }}>
            <Send size={18} color={C.accent} /> How it works
          </h3>
          <p style={{ margin: 0, fontSize: 15, color: C.text2, lineHeight: 1.7 }}>
            When anyone submits any form on the public site, the API server uses{" "}
            <strong>Resend</strong> (an email delivery service) to send a beautifully formatted
            notification email to your inbox. The email contains every field the user filled in,
            and the 'Reply-To' header is set to the user's email — so you can reply directly.
          </p>
        </Card>

        <h3 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginTop: 36, marginBottom: 16 }}>
          Where do the emails go?
        </h3>
        <p style={{ fontSize: 15, color: C.text2, lineHeight: 1.7 }}>
          By default, both general and career emails go to{" "}
          <code style={{ background: C.bg2, padding: "2px 6px", borderRadius: 4, fontSize: 13 }}>cs.growitbuddy@gmail.com</code>.
          These are controlled by 2 environment variables on the server: <code style={{ background: C.bg2, padding: "2px 6px", borderRadius: 4, fontSize: 13 }}>NOTIFY_EMAIL</code> (general)
          and <code style={{ background: C.bg2, padding: "2px 6px", borderRadius: 4, fontSize: 13 }}>CAREERS_EMAIL</code> (talent / jobs).
        </p>

        <div style={{ background: "#FEF5EC", border: "1px solid #F0D9C0", borderRadius: 12, padding: 24, marginTop: 28 }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 12px", color: C.accent, display: "flex", alignItems: "center", gap: 8 }}>
            <AlertTriangle size={18} /> If emails aren't arriving — checklist
          </h3>
          <ol style={{ margin: 0, paddingLeft: 22, fontSize: 15, lineHeight: 1.9, color: C.text2 }}>
            <li>Check Gmail <strong>Promotions</strong> and <strong>Spam</strong> folders first — emails from <code style={{ background: "#fff", padding: "2px 6px", borderRadius: 4, fontSize: 13 }}>onboarding@resend.dev</code> often land there.</li>
            <li>Verify that <code style={{ background: "#fff", padding: "2px 6px", borderRadius: 4, fontSize: 13 }}>RESEND_API_KEY</code> is set on the Render dashboard (Settings → Environment).</li>
            <li>If using the default <code style={{ background: "#fff", padding: "2px 6px", borderRadius: 4, fontSize: 13 }}>onboarding@resend.dev</code> sender, your Resend account email MUST match <code style={{ background: "#fff", padding: "2px 6px", borderRadius: 4, fontSize: 13 }}>cs.growitbuddy@gmail.com</code> — otherwise Resend rejects the email silently.</li>
            <li>For production reliability, verify your own domain in Resend and set <code style={{ background: "#fff", padding: "2px 6px", borderRadius: 4, fontSize: 13 }}>EMAIL_FROM</code> to e.g. <code style={{ background: "#fff", padding: "2px 6px", borderRadius: 4, fontSize: 13 }}>notifications@growitbuddy.com</code>.</li>
          </ol>
        </div>

        <h3 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginTop: 36, marginBottom: 16 }}>
          Forms that send emails (all 8 of them)
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
          {[
            "Contact form", "Newsletter signup", "Creator onboarding",
            "Page-owner application", "Freelancer application",
            "Full-time application", "Internship application",
            "Talent Pool (all 9 types)",
          ].map((f) => (
            <div key={f} style={{
              padding: "12px 14px", background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 8, display: "flex", alignItems: "center", gap: 8,
              fontSize: 14, color: C.text,
            }}>
              <CheckCircle2 size={16} color={C.gold} /> {f}
            </div>
          ))}
        </div>
      </Section>

      {/* ── 12. MEDIA ────────────────────────────────────────────────────── */}
      <Section id="media" eyebrow="12" title="Media Library — managing images">
        <p style={{ fontSize: 16, color: C.text2, lineHeight: 1.7, marginTop: 0 }}>
          The Media Library at <code style={{ background: C.bg2, padding: "2px 8px", borderRadius: 4, fontSize: 13 }}>/admin/media</code> is your central image storage.
          Every image picker in the admin panel can either:
        </p>
        <ul style={{ fontSize: 15, lineHeight: 1.9, color: C.text2, paddingLeft: 22 }}>
          <li>Upload a new image directly (saved to Cloudinary, permanent CDN URL).</li>
          <li>Pick from already-uploaded images in the library.</li>
          <li>Paste any external URL (Unsplash, etc.) — works instantly but you don't control the source.</li>
        </ul>

        <Card>
          <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 12px", color: C.text, display: "flex", alignItems: "center", gap: 8 }}>
            <ImageIcon size={18} color={C.accent} /> Built-in image cropper
          </h3>
          <p style={{ margin: 0, fontSize: 15, color: C.text2, lineHeight: 1.7 }}>
            When you upload an image to a field that needs a specific aspect ratio (square logo,
            16:9 hero, etc.), a crop modal appears automatically so you can frame it correctly
            before saving.
          </p>
        </Card>
      </Section>

      {/* ── 13. TECH STACK ───────────────────────────────────────────────── */}
      <Section id="tech" eyebrow="13" title="Tech behind the scenes (you don't need to touch this)">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
          {[
            ["Frontend",   "React 19 + Vite 7 + Tailwind v4. Hosted on Vercel (free, global CDN, auto-deploy from GitHub)."],
            ["API Server", "Express 5 on Node 22. Hosted on Render (free plan, may cold-start after 15min idle)."],
            ["Database",   "PostgreSQL on Neon (free, serverless). Drizzle ORM for queries."],
            ["Emails",     "Resend (free tier, 3000 emails/month)."],
            ["Images",     "Cloudinary (free tier, plenty for this scale)."],
            ["Source code", "GitHub: Surajsharmaco/growitbuddy. Every push to main auto-deploys."],
          ].map(([t, d]) => (
            <div key={t} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.authority, marginBottom: 6 }}>{t}</div>
              <div style={{ fontSize: 13.5, color: C.text2, lineHeight: 1.6 }}>{d}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── 14. FAQ ──────────────────────────────────────────────────────── */}
      <Section id="faq" eyebrow="14" title="Frequently asked questions">
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "4px 24px" }}>
          {[
            {
              q: "I edited content in admin but the public site still shows the old version. Why?",
              a: "Hard-refresh the page: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac). The CDN caches aggressively but admin saves are live within seconds — your browser is just showing a stale copy.",
            },
            {
              q: "Can I add new pages without a developer?",
              a: "You can edit any existing page's content fully. Creating brand-new pages (with new layouts, new URLs) requires a developer because it involves writing React components.",
            },
            {
              q: "How do I add a team member who can edit content but not delete things?",
              a: "Go to /admin/team and create a team member account. They get a separate login and limited permissions.",
            },
            {
              q: "Can I hide a page from the public temporarily?",
              a: "Yes. Go to /admin/page-visibility and toggle off any page. Visitors will get a 404, and the page is removed from the sitemap.",
            },
            {
              q: "How do I add a new blog post?",
              a: "Open /admin/blog → 'Add New Post' → fill in title, slug, cover image, body (rich text), tags → Save. It appears at /blog immediately, with its own URL /blog/your-slug.",
            },
            {
              q: "Where do form submissions go if Resend isn't set up?",
              a: "They are STILL saved to the database (/admin/leads). You just won't get an email notification. So nothing is lost — you'll just need to manually check the admin panel.",
            },
            {
              q: "How do I change my admin password?",
              a: "The admin password is stored as an environment variable (ADMIN_PASSWORD) on the Render dashboard. Update it there and the change is live on next deploy (or instantly, depending on settings).",
            },
            {
              q: "Can I export all leads to a CSV?",
              a: "Yes — open /admin/leads → click the 'Export CSV' button at the top. Same for talent-pool leads.",
            },
            {
              q: "What happens if the Render free plan goes down?",
              a: "The first request after 15 minutes of inactivity takes ~30 seconds to wake up (cold start). After that, it's instant. Upgrade to Render's paid plan ($7/mo) to eliminate cold starts.",
            },
            {
              q: "How do I issue a certificate to a creator?",
              a: "Go to /admin/certificates → 'Add New' → fill in name, course, date, image (optional) → Save. They get a unique URL at /verify/:id that they can share publicly.",
            },
            {
              q: "What is a Page Variant and when should I use one?",
              a: "A variant is a separate, fully-editable copy of any page (Home, Services, Resources, etc.) at its own URL like /home-v2. Use it to A/B test new copy, run campaign-specific landers, or try a redesign without touching the live page. Create one at /admin/page-variants. Once published, it appears in the admin sidebar under 'Published Variants'.",
            },
            {
              q: "How do I add a free eBook / Drive link / Notion template to the Resources page?",
              a: "Open /admin/resources → 'Add resource' → pick the type (PDF, Drive, Notion, video…) → paste your link in 'Primary Link' → fill title and short description → save. The card becomes live and clickable immediately. You can also add a secondary preview button and a corner badge like 'New' or 'Most popular'.",
            },
            {
              q: "What is the AI / GEO / AEO / AISEO block in Resources admin for?",
              a: "Those fields control how Google's AI Overviews, ChatGPT, and Perplexity describe and cite your Resources page. Fill in the AI Quick-Answer Summary, AI keywords, primary entity, audience, geo location, and factual claims. The page automatically renders a Quick-Answer block at the top AND injects everything into JSON-LD structured data — no developer needed.",
            },
            {
              q: "Where does the Resources link live in the navigation?",
              a: "It's in the Navbar 'More' dropdown (alongside Blog, Authority Audit and Contact) and also in the footer.",
            },
            {
              q: "How do I send a personal portfolio to a specific prospect?",
              a: "Go to /admin/portfolio-shares → 'Generate Link' → pick which case studies to include (optional) → copy the unique URL. The prospect sees a clean private page at /portfolio/shared/:slug. You can see open counts and revoke the link any time.",
            },
            {
              q: "Can I give a writer access to ONLY the blog (not leads, settings, etc.)?",
              a: "Yes. /admin/team → create a 'member' account → tick only 'Blog' in the permissions. Everything else stays hidden in their sidebar — they cannot even open the URL.",
            },
            {
              q: "How do I get a 90+ SEO score on a blog post?",
              a: "Open /admin/blog → edit any post → check the SEO Score ring on the right. Address each red/yellow check: include your target keyword in title + meta + first paragraph, keep paragraphs short, add 2-3 internal links (use the Internal-Link Suggester), make sure every image has alt text. Score updates live as you type.",
            },
            {
              q: "The site feels slow first thing in the morning. What can I do?",
              a: "That's a Render free-plan cold start. Go to /admin/optimize and turn ON 'Database Keep-Alive' and the 'Public-read cache' — both are safe defaults and instantly improve perceived speed. For a permanent fix, upgrade Render to the $7/mo plan.",
            },
          ].map((f) => (
            <FAQItem key={f.q} q={f.q} a={f.a} />
          ))}
        </div>
      </Section>

      {/* ── FOOTER CTA ───────────────────────────────────────────────────── */}
      <section style={{ padding: "80px 24px 100px", background: C.authority, color: "#fff" }}>
        <div style={{ maxWidth: 920, margin: "0 auto", textAlign: "center" }}>
          <p style={{
            fontSize: 11, fontWeight: 700, letterSpacing: "0.2em",
            textTransform: "uppercase", color: C.gold, marginBottom: 16,
          }}>Need more help?</p>
          <h2 style={{
            fontSize: "clamp(26px, 5vw, 38px)", fontWeight: 800,
            letterSpacing: "-0.03em", lineHeight: 1.2, marginBottom: 20, marginTop: 0,
          }}>
            Open the admin panel and start editing.
          </h2>
          <p style={{ fontSize: 16, color: "#cbd5e1", lineHeight: 1.7, maxWidth: "52ch", margin: "0 auto 32px" }}>
            Most things are 2-3 clicks away. This guide always lives at <code style={{ background: "rgba(255,255,255,0.1)", padding: "2px 8px", borderRadius: 4, fontSize: 14 }}>/guide</code> — bookmark it.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/admin"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "14px 24px", background: C.accent, color: "#fff",
                borderRadius: 6, fontSize: 15, fontWeight: 600,
                textDecoration: "none",
              }}
            >
              <Lock size={16} /> Open Admin Panel
            </Link>
            <Link
              href="/"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "14px 24px", background: "transparent", color: "#fff",
                border: "1px solid rgba(255,255,255,0.3)", borderRadius: 6,
                fontSize: 15, fontWeight: 600, textDecoration: "none",
              }}
            >
              <HomeIcon size={16} /> Back to Home
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
