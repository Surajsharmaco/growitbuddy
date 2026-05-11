import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import SEOMeta from "@/components/SEOMeta";
import { usePublicContent } from "@/hooks/usePublicContent";

interface TeamMember { name: string; role: string; photo: string; }
interface Value { title: string; description: string; }

interface AboutData {
  founderName: string;
  founderRole: string;
  founderBio: string;
  founderPhoto: string;
  founderLinkedin: string;
  founderTwitter: string;
  founderInstagram: string;
  missionHeadline: string;
  missionBody: string;
  team: TeamMember[];
  values: Value[];
}

const DEFAULTS: AboutData = {
  founderName: "Suraj Sharma",
  founderRole: "Founder & CEO",
  founderBio: "We build content and distribution systems that help founders and creators become the most recognized voices in their space.",
  founderPhoto: "",
  founderLinkedin: "",
  founderTwitter: "",
  founderInstagram: "",
  missionHeadline: "Expertise deserves to be heard.",
  missionBody: "Most founders and creators we work with are genuinely exceptional at what they do. The problem is never the expertise - it's the communication system around it. We fix that by building content and distribution systems that consistently put the right message in front of the right people.",
  team: [],
  values: [
    { title: "Signal over noise", description: "We build for impact, not visibility. Every piece of content is designed to build credibility and attract the right opportunities." },
    { title: "Systems, not one-offs", description: "We don't run campaigns. We build infrastructure - repeatable systems that compound and create leverage over time." },
    { title: "Radical clarity", description: "Our clients always know what's working, what isn't, and what's next. Honest, clear communication is the foundation of any great partnership." },
  ],
};

const STATS = [
  { value: "700M+", label: "Views Generated" },
  { value: "200+", label: "Founders & Brands" },
  { value: "90K+", label: "Content Assets" },
];

export default function About() {
  const data = usePublicContent<AboutData>("about", DEFAULTS);

  const founderSocials = [
    { label: "LinkedIn", href: data.founderLinkedin },
    { label: "Twitter", href: data.founderTwitter },
    { label: "Instagram", href: data.founderInstagram },
  ].filter((s) => s.href);

  return (
    <div style={{ background: "#F8F8F6", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @media (max-width: 520px) {
          .about-stats-strip {
            grid-template-columns: 1fr !important;
            border-radius: 12px !important;
          }
          .about-stats-strip > div {
            border-right: none !important;
            border-bottom: 1px solid #E5E5E0 !important;
          }
          .about-stats-strip > div:last-child {
            border-bottom: none !important;
          }
        }
      `}</style>
      <SEOMeta
        title="About GrowitBuddy | Authority Systems Company for Founders & Creators"
        description="GrowitBuddy is a content authority and distribution systems company. Founded by Suraj Sharma, we help founders and creators become the most recognized voices in their space."
        schema={[
          {
            "@type": "Person",
            "@id": "https://growitbuddy.com/#suraj-sharma",
            "name": "Suraj Sharma",
            "jobTitle": "Founder & CEO",
            "description": "Suraj Sharma is the founder of GrowitBuddy, a content authority and distribution systems company helping founders and creators build inbound growth.",
            "worksFor": { "@id": "https://growitbuddy.com/#organization" },
            "url": "https://growitbuddy.com/about"
          },
          {
            "@type": "AboutPage",
            "name": "About GrowitBuddy",
            "url": "https://growitbuddy.com/about",
            "description": "GrowitBuddy builds authority systems for founders and creators who are serious about growth.",
            "publisher": { "@id": "https://growitbuddy.com/#organization" }
          }
        ] as Record<string, unknown>[]}
      />

      {/* ── Hero ── */}
      <section style={{ paddingTop: 120, paddingBottom: 0, paddingLeft: 24, paddingRight: 24, background: "#FFFFFF" }}>
        <div className="max-w-[1100px] mx-auto">
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#8A8A8A", marginBottom: 20 }}>About</p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            style={{ fontWeight: 800, fontSize: "clamp(28px, 6.5vw, 80px)", letterSpacing: "-0.04em", lineHeight: "1.08", color: "#0A0A0A", maxWidth: "20ch", marginBottom: 24 }}
          >
            We build authority systems for founders and creators who are serious about growth.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ fontSize: "clamp(15px, 4.5vw, 18px)", color: "#5F5F5F", lineHeight: "1.75", maxWidth: "55ch", marginBottom: 56 }}
          >
            A team of strategists, writers, and editors who believe deep expertise deserves a much wider audience.
          </motion.p>

          {/* Stats strip */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="about-stats-strip"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              borderTop: "1px solid #E5E5E0",
              borderLeft: "1px solid #E5E5E0",
              borderRadius: "12px 12px 0 0",
              overflow: "hidden",
              maxWidth: 640,
            }}
          >
            {STATS.map((s, i) => (
              <div key={i} style={{
                padding: "28px 24px",
                borderRight: "1px solid #E5E5E0",
                borderBottom: "none",
              }}>
                <p style={{ fontWeight: 800, fontSize: "clamp(20px, 3vw, 38px)", letterSpacing: "-0.04em", color: "#0A0A0A", lineHeight: 1, marginBottom: 6 }}>{s.value}</p>
                <p style={{ fontSize: 12, fontWeight: 500, color: "#8A8A8A", lineHeight: 1.3 }}>{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Mission ── */}
      <section style={{ padding: "80px 24px", background: "#F8F8F6", borderBottom: "1px solid #E5E5E0" }}>
        <div className="max-w-[1100px] mx-auto" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 380px), 1fr))", gap: 48, alignItems: "center" }}>

          {/* Left - dark authority card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{
              background: "#1E293B",
              borderRadius: 24,
              padding: "48px 40px",
              display: "flex",
              flexDirection: "column",
              gap: 32,
            }}
          >
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 20 }}>
                The work speaks.
              </p>
              <p style={{
                fontSize: "clamp(20px, 2.5vw, 28px)",
                fontWeight: 800,
                letterSpacing: "-0.04em",
                lineHeight: "1.2",
                color: "#FFFFFF",
              }}>
                "Content without distribution<br />is invisible."
              </p>
            </div>

            {/* Mini stats */}
            <div style={{ display: "flex", flexDirection: "column", gap: 0, borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 28 }}>
              {STATS.map((s, i) => (
                <div key={i} style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  padding: "10px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.07)",
                }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.5)" }}>{s.label}</span>
                  <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em", color: "#C2A878" }}>{s.value}</span>
                </div>
              ))}
            </div>

            <Link href="/work">
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                fontSize: 13, fontWeight: 700, color: "#FFFFFF",
                opacity: 0.7, cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
              }} className="hover:opacity-100 transition-opacity">
                See our work <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          </motion.div>

          {/* Right - mission copy */}
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#8A8A8A", marginBottom: 16 }}>Mission</p>
            <h2 style={{ fontWeight: 800, fontSize: "clamp(22px, 4vw, 48px)", letterSpacing: "-0.04em", lineHeight: "1.1", color: "#0A0A0A", marginBottom: 20 }}>
              {data.missionHeadline}
            </h2>
            <p style={{ fontSize: 16, color: "#5F5F5F", lineHeight: "1.8", marginBottom: 32 }}>
              {data.missionBody}
            </p>
            <Link href="/services">
              <span className="gb-btn" style={{ fontSize: 14 }}>
                See our services
                <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Founder / Origin ── */}
      <section style={{ padding: "100px 24px", background: "#EFEFEA", borderBottom: "1px solid rgba(10,10,10,0.05)" }}>
        <div className="max-w-[1100px] mx-auto">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: 64, alignItems: "start" }}>

            {/* Left - founder card (sticky) */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              style={{ position: "sticky", top: 120 }}
            >
              <div style={{
                width: "100%", maxWidth: 220, aspectRatio: "1",
                borderRadius: 20, background: "#0A0A0A",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 24, position: "relative", overflow: "hidden",
              }}>
                {data.founderPhoto ? (
                  <img
                    src={data.founderPhoto}
                    alt={data.founderName}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  <>
                    <span style={{ fontSize: 80, fontWeight: 800, color: "rgba(255,255,255,0.06)", letterSpacing: "-0.05em", lineHeight: 1, position: "absolute", bottom: -8, right: 12, userSelect: "none" }}>
                      {data.founderName.charAt(0)}
                    </span>
                    <span style={{ fontSize: 52, fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.04em", lineHeight: 1, position: "relative", zIndex: 1 }}>
                      {data.founderName.charAt(0)}
                    </span>
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 4, background: "var(--gb-accent)" }} />
                  </>
                )}
              </div>

              <h3 style={{ fontWeight: 800, fontSize: 20, letterSpacing: "-0.03em", color: "#0A0A0A", marginBottom: 4 }}>
                {data.founderName}
              </h3>
              <p style={{ fontSize: 13, fontWeight: 500, color: "var(--gb-accent)", marginBottom: 16, letterSpacing: "0.01em" }}>
                {data.founderRole}
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
                {["Content Strategy", "Distribution", "Authority Systems"].map((tag) => (
                  <span key={tag} style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 100, background: "rgba(10,10,10,0.06)", color: "#5F5F5F", letterSpacing: "0.01em" }}>{tag}</span>
                ))}
              </div>

              {founderSocials.length > 0 && (
                <div style={{ display: "flex", gap: 16 }}>
                  {founderSocials.map((s) => (
                    <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 13, fontWeight: 600, color: "#8A8A8A", textDecoration: "none" }}
                      className="hover:opacity-60 transition-opacity"
                    >
                      {s.label} ↗
                    </a>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Right - origin story */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, delay: 0.1 }}
            >
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#8A8A8A", marginBottom: 32 }}>
                The Origin
              </p>

              <div style={{ fontSize: 96, lineHeight: 0.8, fontWeight: 800, color: "var(--gb-accent)", opacity: 0.25, marginBottom: 16, fontFamily: "Georgia, serif", userSelect: "none" }}>
                "
              </div>

              <p style={{ fontWeight: 800, fontSize: "clamp(22px, 3vw, 40px)", letterSpacing: "-0.04em", lineHeight: "1.15", color: "#0A0A0A", marginBottom: 28 }}>
                I built GrowitBuddy after seeing a pattern - the best people weren't the most visible.
              </p>

              <p style={{ fontWeight: 500, fontSize: "clamp(16px, 1.8vw, 20px)", letterSpacing: "-0.01em", lineHeight: "1.6", color: "#5F5F5F", marginBottom: 28, fontStyle: "italic" }}>
                Louder voices were winning.<br />Not better ones.
              </p>

              <p style={{ fontWeight: 800, fontSize: "clamp(19px, 2.2vw, 30px)", letterSpacing: "-0.035em", lineHeight: "1.25", color: "#0A0A0A", marginBottom: 44 }}>
                Authority isn't given.<br />
                It's built - with the right{" "}
                <span style={{ borderBottom: "3px solid var(--gb-accent)", paddingBottom: 2 }}>system</span>.
              </p>

              <div style={{ borderTop: "1.5px solid rgba(10,10,10,0.08)", paddingTop: 36, display: "grid", gridTemplateColumns: "auto 1fr", gap: "0 20px", alignItems: "start" }}>
                <div style={{ width: 3, height: "100%", minHeight: 60, background: "var(--gb-accent)", borderRadius: 100, opacity: 0.5 }} />
                <p style={{ fontSize: 16, color: "#5F5F5F", lineHeight: "1.85", fontWeight: 400 }}>
                  {data.founderBio}
                </p>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── Values ── */}
      {data.values.length > 0 && (
        <section style={{ padding: "96px 24px", background: "#FFFFFF" }}>
          <div className="max-w-[1100px] mx-auto">
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 56 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#8A8A8A" }}>Values</p>
              <h2 style={{ fontWeight: 800, fontSize: "clamp(22px, 4vw, 52px)", letterSpacing: "-0.04em", lineHeight: 1.05, color: "#0A0A0A", maxWidth: "14ch" }}>How we operate.</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
              {data.values.map((v, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  style={{
                    background: "#F8F8F6",
                    border: "1.5px solid #E5E5E0",
                    borderRadius: 16,
                    padding: "36px 32px",
                  }}
                >
                  {/* Gold rule + number */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                    <div style={{ width: 28, height: 2, background: "#C2A878", borderRadius: 2 }} />
                    <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", color: "#C2A878" }}>{String(i + 1).padStart(2, "0")}</span>
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.03em", color: "#0A0A0A", marginBottom: 12 }}>{v.title}</h3>
                  <p style={{ fontSize: 15, color: "#5F5F5F", lineHeight: "1.75" }}>{v.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Team ── */}
      {data.team.length > 0 && (
        <section style={{ padding: "80px 24px", background: "#F8F8F6" }}>
          <div className="max-w-[1100px] mx-auto">
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#8A8A8A", marginBottom: 16 }}>Team</p>
            <h2 style={{ fontWeight: 800, fontSize: "clamp(22px, 4vw, 48px)", letterSpacing: "-0.04em", lineHeight: 1.1, color: "#0A0A0A", marginBottom: 48 }}>The people behind the work.</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 24 }}>
              {data.team.map((m, i) => (
                <div key={i} style={{ textAlign: "center" }}>
                  <div style={{ width: 80, height: 80, borderRadius: "50%", overflow: "hidden", margin: "0 auto 14px", background: "#E8E8E5", border: "2px solid #E5E5E0" }}>
                    {m.photo ? (
                      <img src={m.photo} alt={m.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, color: "#0A0A0A" }}>
                        {m.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <h4 style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.02em", color: "#0A0A0A", marginBottom: 4 }}>{m.name}</h4>
                  <p style={{ fontSize: 13, color: "#8A8A8A" }}>{m.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section style={{ padding: "96px 24px", background: "#1E293B" }}>
        <div className="max-w-[720px] mx-auto" style={{ textAlign: "center" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 20 }}>
            Work with us
          </p>
          <h2 style={{ fontWeight: 800, fontSize: "clamp(24px, 5vw, 60px)", letterSpacing: "-0.04em", color: "#FFFFFF", lineHeight: 1.05, marginBottom: 20 }}>
            Ready to build your<br />authority system?
          </h2>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.6)", lineHeight: "1.75", marginBottom: 40, maxWidth: "44ch", margin: "0 auto 40px" }}>
            Book a free strategy call. We'll map out your positioning, your content gaps, and exactly what to build first.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/contact">
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "var(--gb-accent)", color: "#fff",
                fontWeight: 700, fontSize: 14, borderRadius: 100,
                padding: "14px 28px", cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
              }} className="hover:opacity-90 transition-opacity">
                Book a free call
                <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
            <Link href="/services">
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                border: "1.5px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.8)",
                fontWeight: 700, fontSize: 14, borderRadius: 100,
                padding: "14px 28px", cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
              }} className="hover:border-white hover:text-white transition-colors">
                Explore services
              </span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
