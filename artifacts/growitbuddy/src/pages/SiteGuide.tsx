import { motion } from "framer-motion";
import { Link } from "wouter";
import { Home as HomeIcon, Lock, BookOpen } from "lucide-react";
import SEOMeta from "@/components/SEOMeta";
import { usePublicContent } from "@/hooks/usePublicContent";
import { SITE_GUIDE_DEFAULTS, type SiteGuideData } from "@/lib/siteGuideDefaults";

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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SiteGuide() {
  const data = usePublicContent<SiteGuideData>("site-guide", SITE_GUIDE_DEFAULTS);
  const sections = data.sections ?? [];
  const toc = sections.map((s, i) => ({ id: slugify(s.heading) || `section-${i + 1}`, label: s.heading }));

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
          }}>{data.hero.badge}</p>
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
            {data.hero.title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            style={{ fontSize: 18, color: C.text2, lineHeight: 1.7, maxWidth: "56ch", margin: 0 }}
          >
            {data.hero.lede}
          </motion.p>

          {/* Quick links — derived from section headings */}
          <div style={{ marginTop: 40, display: "flex", flexWrap: "wrap", gap: 10 }}>
            {toc.map((t) => (
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
                <BookOpen size={14} /> {t.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTIONS ─────────────────────────────────────────────────────── */}
      {sections.map((s, i) => (
        <Section
          key={toc[i].id}
          id={toc[i].id}
          eyebrow={String(i + 1).padStart(2, "0")}
          title={s.heading}
        >
          <p style={{ fontSize: 16, lineHeight: 1.8, color: C.text2, marginTop: 0, whiteSpace: "pre-line" }}>
            {s.body}
          </p>
        </Section>
      ))}

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
