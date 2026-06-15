import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import SEOMeta from "@/components/SEOMeta";
import { getWashCardStyle, CardGrain, WashIconChip } from "@/components/WashCard";
import { usePublicContent } from "@/hooks/usePublicContent";

import { ABOUT_DEFAULTS as DEFAULTS, type AboutData } from "@/lib/aboutDefaults";

export default function About() {
  const data = usePublicContent<AboutData>("about", DEFAULTS);

  const founderSocials = [
    { label: "LinkedIn", href: data.founderLinkedin },
    { label: "Twitter", href: data.founderTwitter },
    { label: "Instagram", href: data.founderInstagram },
  ].filter((s) => s.href);

  const CARD_SURFACE =
    "radial-gradient(135% 120% at 100% 0%, rgba(194,168,120,0.12) 0%, rgba(194,168,120,0) 48%), linear-gradient(168deg, #FFFFFF 0%, #FAF6EE 100%)";

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
            We build authority systems for founders and creators.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ fontSize: "clamp(15px, 4.5vw, 18px)", color: "#5F5F5F", lineHeight: "1.75", maxWidth: "55ch", marginBottom: 56 }}
          >
            Content, positioning, and distribution designed to compound attention into inbound demand.
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
            {(data.stats || []).map((s, i) => (
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
              background: "#171F2D",
              backgroundImage: "var(--gb-grain)",
              backgroundSize: "150px 150px",
              backgroundRepeat: "repeat",
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
              {(data.stats || []).map((s, i) => (
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
      <section style={{ padding: "100px 24px", backgroundColor: "#EFEFEA", borderBottom: "1px solid rgba(10,10,10,0.05)", backgroundImage: "radial-gradient(120% 75% at 50% -8%, rgba(194,168,120,0.08) 0%, rgba(194,168,120,0) 58%)", backgroundSize: "100% 100%" }}>
        <style>{`
          .about-origin-grid { display: grid; grid-template-columns: 300px 1fr; align-items: stretch; }
          .about-origin-side { padding: 48px 38px; }
          .about-origin-main { padding: 56px 56px; }
          @media (max-width: 820px) {
            .about-origin-grid { grid-template-columns: 1fr; }
            .about-origin-side { padding: 40px 32px; }
            .about-origin-main { padding: 40px 32px; }
          }
        `}</style>
        <div className="max-w-[1080px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{
              position: "relative",
              overflow: "hidden",
              borderRadius: 24,
              border: "1px solid rgba(10,10,10,0.06)",
              background: CARD_SURFACE,
              boxShadow: "0 26px 64px -30px rgba(30,41,59,0.3)",
            }}
          >
            <div aria-hidden="true" style={{ position: "absolute", inset: 0, backgroundImage: "var(--gb-grain)", backgroundSize: "150px 150px", backgroundRepeat: "repeat", opacity: 0.6, pointerEvents: "none", zIndex: 0 }} />
            <div aria-hidden="true" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, #C2A878 0%, rgba(194,168,120,0.15) 55%, rgba(194,168,120,0) 100%)", pointerEvents: "none", zIndex: 3 }} />

            <div className="about-origin-grid" style={{ position: "relative", zIndex: 1 }}>

              {/* Left - founder identity (navy panel) */}
              <div className="about-origin-side" style={{ position: "relative", overflow: "hidden", background: "#171F2D", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div aria-hidden="true" style={{ position: "absolute", inset: 0, backgroundImage: "var(--gb-grain)", backgroundSize: "150px 150px", backgroundRepeat: "repeat", opacity: 0.5, pointerEvents: "none" }} />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{
                    width: 92, height: 92, borderRadius: 20, overflow: "hidden",
                    marginBottom: 26, display: "flex", alignItems: "center", justifyContent: "center",
                    background: "rgba(194,168,120,0.12)", border: "1px solid rgba(194,168,120,0.32)",
                    position: "relative",
                  }}>
                    <span style={{ fontSize: 40, fontWeight: 800, color: "#C2A878", letterSpacing: "-0.04em", lineHeight: 1, userSelect: "none" }}>
                      {data.founderName.charAt(0)}
                    </span>
                    {data.founderPhoto && (
                      <img
                        src={data.founderPhoto}
                        alt={data.founderName}
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                      />
                    )}
                  </div>

                  <p style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#C2A878", marginBottom: 14 }}>
                    Founder
                  </p>
                  <h3 style={{ fontWeight: 800, fontSize: 22, letterSpacing: "-0.03em", color: "#FFFFFF", marginBottom: 6 }}>
                    {data.founderName}
                  </h3>
                  <p style={{ fontSize: 13.5, fontWeight: 500, color: "rgba(255,255,255,0.6)", marginBottom: 24, letterSpacing: "0.01em" }}>
                    {data.founderRole}
                  </p>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: founderSocials.length > 0 ? 26 : 0 }}>
                    {["Content Strategy", "Distribution", "Authority Systems"].map((tag) => (
                      <span key={tag} style={{ fontSize: 11, fontWeight: 500, padding: "5px 11px", borderRadius: 100, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.78)", border: "1px solid rgba(255,255,255,0.12)", letterSpacing: "0.01em" }}>{tag}</span>
                    ))}
                  </div>

                  {founderSocials.length > 0 && (
                    <div style={{ display: "flex", gap: 18, paddingTop: 22, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                      {founderSocials.map((s) => (
                        <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: 12.5, fontWeight: 600, color: "#C2A878", textDecoration: "none" }}
                          className="hover:opacity-70 transition-opacity"
                        >
                          {s.label} ↗
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right - origin story */}
              <div className="about-origin-main">
                <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 28 }}>
                  <span aria-hidden="true" style={{ fontFamily: "Georgia, serif", fontSize: 44, fontWeight: 800, lineHeight: 0, color: "#C2A878", transform: "translateY(7px)", userSelect: "none" }}>&ldquo;</span>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#9A7B43", margin: 0 }}>
                    The Origin
                  </p>
                </div>

                <p style={{ fontWeight: 800, fontSize: "clamp(22px, 3vw, 38px)", letterSpacing: "-0.04em", lineHeight: "1.18", color: "#0A0A0A", marginBottom: 24 }}>
                  I built GrowitBuddy after seeing a pattern — the best people weren't the most visible.
                </p>

                <p style={{ fontWeight: 500, fontSize: "clamp(15px, 1.8vw, 19px)", letterSpacing: "-0.01em", lineHeight: "1.6", color: "#6A6A64", marginBottom: 28, fontStyle: "italic" }}>
                  Louder voices were winning. Not better ones.
                </p>

                <p style={{ fontWeight: 800, fontSize: "clamp(18px, 2.2vw, 28px)", letterSpacing: "-0.035em", lineHeight: "1.3", color: "#1E293B", marginBottom: 36 }}>
                  Authority isn't given. It's built — with the right{" "}
                  <span style={{ borderBottom: "3px solid #C2A878", paddingBottom: 2 }}>system</span>.
                </p>

                <div style={{ borderTop: "1px solid rgba(10,10,10,0.08)", paddingTop: 32, display: "grid", gridTemplateColumns: "auto 1fr", gap: "0 20px", alignItems: "start" }}>
                  <div style={{ width: 3, alignSelf: "stretch", minHeight: 48, background: "linear-gradient(180deg, #C2A878 0%, rgba(194,168,120,0.2) 100%)", borderRadius: 100 }} />
                  <div>
                    <p style={{ fontSize: 15.5, color: "#4A4A45", lineHeight: "1.85", fontWeight: 400, marginBottom: 16 }}>
                      {data.founderBio}
                    </p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#0A0A0A", letterSpacing: "-0.01em", margin: 0 }}>
                      {data.founderName}
                      <span style={{ fontWeight: 500, color: "#8A8A8A" }}> · {data.founderRole}</span>
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
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
              {(data.values || []).map((v, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  style={getWashCardStyle(i, { padding: "32px 30px" })}
                >
                  <CardGrain />
                  <WashIconChip index={i} label={String(i + 1).padStart(2, "0")} style={{ marginBottom: 22 }} />
                  <h3 style={{ position: "relative", fontSize: 21, fontWeight: 800, letterSpacing: "-0.03em", color: "#0F1822", marginBottom: 10 }}>{v.title}</h3>
                  <p style={{ position: "relative", fontSize: 14.5, color: "#374151", lineHeight: "1.7", fontWeight: 500 }}>{v.description}</p>
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
              {(data.team || []).map((m, i) => (
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
      <section style={{ padding: "96px 24px", background: "#171F2D", backgroundImage: "var(--gb-grain)", backgroundSize: "150px 150px", backgroundRepeat: "repeat" }}>
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
              <span className="gb-btn">
                Book a free call
                <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
            <Link href="/services">
              <span className="gb-btn-outline" style={{
                color: "rgba(255,255,255,0.85)",
                borderColor: "rgba(255,255,255,0.25)",
              }}>
                Explore services
              </span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
