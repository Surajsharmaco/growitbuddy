import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  Home as HomeIcon, Layout as LayoutIcon, Users, FileText, Briefcase,
  Mail, Settings as SettingsIcon, Search, Inbox, Image as ImageIcon,
  Shield, Database, Send, ChevronRight, ChevronDown, ExternalLink,
  Globe, Lock, BookOpen, Sparkles, AlertTriangle, CheckCircle2,
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
  { path: "/insights",      name: "Blog / Insights",       what: "All blog posts. Each post has its own /insights/:slug URL." },
  { path: "/about",         name: "About",                 what: "Founder story, team, mission." },
  { path: "/contact",       name: "Contact",               what: "Contact form — submissions land in your inbox + Admin Leads." },
  { path: "/creators",      name: "Creator Network",       what: "Sign-up form for content creators wanting to join your network." },
  { path: "/career",        name: "Career",                what: "Full-time + internship + freelancer job applications in one tabbed page." },
  { path: "/influencers",   name: "Influencer Directory",  what: "Browse all influencers. Each has a profile at /influencers/:slug." },
  { path: "/distribution",  name: "Distribution Network",  what: "Information about page-owner / distribution partnership." },
  { path: "/join/page-owner", name: "Page Owner Apply",    what: "Application form for Instagram/social page owners." },
  { path: "/authority-audit", name: "Authority Audit",     what: "Free audit lead-magnet tool." },
  { path: "/resources",     name: "Resources",             what: "Free templates, playbooks, guides for visitors." },
  { path: "/creator-school",  name: "Creator School",      what: "Onboarding hub with VSL, guidelines, FAQ." },
  { path: "/designers-pool", name: "Talent Pools (9 pages)", what: "Designers, Thumbnail Designers, Writers, Social Managers, Motion, AI, UGC, Meme, Video Editors — each has its own landing page + form." },
  { path: "/verify",        name: "Certificate Verify",    what: "Public certificate verification page." },
  { path: "/privacy",       name: "Privacy & Terms",       what: "Legal pages." },
];

interface AdminPage { url: string; name: string; what: string; }
const ADMIN_PAGES: AdminPage[] = [
  { url: "/admin",                     name: "Dashboard",         what: "Overview of recent leads, content sections, quick links." },
  { url: "/admin/home",                name: "Home page editor",  what: "Edit hero text, stats, services preview, testimonials on the homepage." },
  { url: "/admin/about",               name: "About editor",      what: "Edit founder story, team, mission text on /about." },
  { url: "/admin/services",            name: "Services editor",   what: "Edit services list and descriptions." },
  { url: "/admin/work",                name: "Work editor",       what: "Edit Work page hero, sections, case study cards." },
  { url: "/admin/portfolio",           name: "Portfolio items",   what: "Add/edit/hide individual case studies shown on /work." },
  { url: "/admin/logos",               name: "Client Logos",      what: "Upload & re-order client logos shown on the Work page." },
  { url: "/admin/framework",           name: "Framework editor",  what: "Edit the 4-step methodology page." },
  { url: "/admin/blog",                name: "Blog / Insights",   what: "Add, edit, delete blog posts. Supports rich text + cover image." },
  { url: "/admin/influencers",         name: "Influencers DB",    what: "Add/edit influencer profiles shown in directory." },
  { url: "/admin/influencer-explore",  name: "Influencer page",   what: "Edit the /influencers landing page (hero, filters)." },
  { url: "/admin/distribution-network", name: "Distribution page", what: "Edit /distribution landing page content." },
  { url: "/admin/distribution-pages",  name: "Page-Owner content", what: "Edit /join/page-owner application page." },
  { url: "/admin/join-network",        name: "Join Network",      what: "Edit /join landing page (path-choosing screen)." },
  { url: "/admin/contact",             name: "Contact page",      what: "Edit /contact page text, form labels." },
  { url: "/admin/career",              name: "Career page",       what: "Edit /career page (full-time, internship, freelancer tabs)." },
  { url: "/admin/authority-audit",     name: "Authority Audit",   what: "Edit the audit tool's content & questions." },
  { url: "/admin/resources",           name: "Resources",         what: "Add/edit/delete resource cards on /resources." },
  { url: "/admin/editors-pool",        name: "Creator School",    what: "Edit Creator School hub content." },
  { url: "/admin/pool-designers",      name: "Talent Pool editors (9)", what: "9 separate editors for each talent pool landing page (designers, writers, motion, etc)." },
  { url: "/admin/leads",               name: "Leads (CRM)",       what: "ALL form submissions — contact, newsletter, creator, page-owner, freelancer, full-time, internship. Searchable + exportable." },
  { url: "/admin/talent-pool-leads",   name: "Talent Pool Leads", what: "Separate inbox just for talent-pool applications, grouped by pool type." },
  { url: "/admin/certificates",        name: "Certificates",      what: "Issue & manage certificates verifiable at /verify/:id." },
  { url: "/admin/media",               name: "Media Library",     what: "Upload & manage images. Used by any image picker in admin." },
  { url: "/admin/team",                name: "Team Members",      what: "Create login accounts for team members (limited access)." },
  { url: "/admin/seo",                 name: "SEO settings",      what: "Per-page title, description, OG image, canonical URL. Per-page schema overrides." },
  { url: "/admin/navbar",              name: "Navbar editor",     what: "Edit navigation menu items, links, order." },
  { url: "/admin/footer",              name: "Footer editor",     what: "Edit footer columns, links, social handles." },
  { url: "/admin/settings",            name: "Site Settings",     what: "Logo, favicon, brand colors, contact info, social links — site-wide." },
  { url: "/admin/page-visibility",     name: "Page Visibility",   what: "Hide/show pages from public (returns 404 to visitors when hidden)." },
  { url: "/admin/optimize",            name: "Optimizer",         what: "Image optimization & performance tools." },
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
          }}>Complete Site Guide · v1.0</p>
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

      {/* ── 5. CRM / LEADS ───────────────────────────────────────────────── */}
      <Section id="crm" eyebrow="05" title="CRM — managing every lead">
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

      {/* ── 6. TALENT POOL SYSTEM ────────────────────────────────────────── */}
      <Section id="talent" eyebrow="06" title="Talent Pool — 9 specialized landing pages">
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

      {/* ── 7. SEO ───────────────────────────────────────────────────────── */}
      <Section id="seo" eyebrow="07" title="SEO — how each page is found on Google">
        <p style={{ fontSize: 16, color: C.text2, lineHeight: 1.7, marginTop: 0 }}>
          Every page on the site has SEO metadata: a <strong>title</strong> (what shows in
          the Google search result), a <strong>description</strong> (the snippet under the
          title), an <strong>OG image</strong> (the preview when shared on WhatsApp / X /
          LinkedIn), and an optional <strong>canonical URL</strong>.
        </p>

        <Card>
          <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 12px", color: C.text, display: "flex", alignItems: "center", gap: 8 }}>
            <Search size={18} color={C.accent} /> Two ways SEO is controlled
          </h3>
          <ol style={{ margin: 0, paddingLeft: 22, fontSize: 15, lineHeight: 1.9, color: C.text2 }}>
            <li><strong>Default (in code):</strong> Every page ships with a sensible default title + description.</li>
            <li><strong>Override (in admin):</strong> Go to <code style={{ background: C.bg2, padding: "2px 6px", borderRadius: 4, fontSize: 13 }}>/admin/seo</code> → pick any page → set custom title, description, OG image, and canonical URL. Your override takes priority and is live on Google within minutes.</li>
          </ol>
        </Card>

        <h3 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginTop: 36, marginBottom: 16 }}>
          How to optimize a page for Google
        </h3>
        <Steps items={[
          "Go to /admin/seo and select the page you want to optimize.",
          "Set a Title — 50-60 characters, include your main keyword + brand (e.g. 'Creator Network — Join GrowitBuddy').",
          "Set a Description — 140-160 characters, sell the click (what will the visitor get?).",
          "Upload an OG Image — 1200x630 px works best. This is the preview when someone shares the page on social media.",
          "Save. Test by sharing the URL on WhatsApp — you should see the new preview within 1-2 minutes.",
          "For Google: it usually re-indexes within a few hours to days. You can speed it up via Google Search Console → URL Inspection → Request Indexing.",
        ]} />

        <h3 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginTop: 48, marginBottom: 16 }}>
          Sitemap & robots
        </h3>
        <p style={{ fontSize: 15, color: C.text2, lineHeight: 1.7 }}>
          The site auto-generates a sitemap at <code style={{ background: C.bg2, padding: "2px 6px", borderRadius: 4, fontSize: 13 }}>/sitemap.xml</code> — submit this to Google Search Console. Hidden pages (Page Visibility → off) are automatically excluded from the sitemap.
        </p>
      </Section>

      {/* ── 8. EMAIL ─────────────────────────────────────────────────────── */}
      <Section id="email" eyebrow="08" title="Email Notifications — every lead lands in your inbox">
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

      {/* ── 9. MEDIA ─────────────────────────────────────────────────────── */}
      <Section id="media" eyebrow="09" title="Media Library — managing images">
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

      {/* ── 10. TECH STACK ───────────────────────────────────────────────── */}
      <Section id="tech" eyebrow="10" title="Tech behind the scenes (you don't need to touch this)">
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

      {/* ── 11. FAQ ──────────────────────────────────────────────────────── */}
      <Section id="faq" eyebrow="11" title="Frequently asked questions">
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
              a: "Open /admin/blog → 'Add New Post' → fill in title, slug, cover image, body (rich text), tags → Save. It appears at /insights immediately, with its own URL /insights/your-slug.",
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
