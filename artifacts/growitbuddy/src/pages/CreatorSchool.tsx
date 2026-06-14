import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Play, CheckCircle } from "lucide-react";
import SEOMeta from "@/components/SEOMeta";
import { usePublicContent } from "@/hooks/usePublicContent";

import { API_BASE } from "@/lib/api";

import { CREATOR_SCHOOL_DEFAULTS as DEFAULTS, type CreatorSchoolData as PageData } from "@/lib/creatorSchoolDefaults";

const FI = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
});

function VideoPlayer({ url }: { url: string }) {
  const [playing, setPlaying] = useState(false);

  const getYtId = (raw: string) => raw.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/)?.[1] ?? null;

  const embed = (raw: string) => {
    const ytId = getYtId(raw);
    if (ytId) return `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&mute=0`;
    const loom = raw.match(/loom\.com\/share\/([^?]+)/);
    if (loom) return `https://www.loom.com/embed/${loom[1]}?autoplay=1`;
    const vimeo = raw.match(/vimeo\.com\/(\d+)/);
    if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1`;
    return raw;
  };

  // Auto-start after 1.5 s once url is available
  useEffect(() => {
    if (!url) return;
    const t = setTimeout(() => setPlaying(true), 1500);
    return () => clearTimeout(t);
  }, [url]);

  const ytId = url ? getYtId(url) : null;
  const thumbUrl = ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : null;
  const hasVideo = !!url;

  return (
    <div style={{
      width: "100%",
      aspectRatio: "16/9",
      borderRadius: 24,
      overflow: "hidden",
      position: "relative",
      boxShadow: hasVideo
        ? "0 30px 80px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.1)"
        : "0 2px 4px rgba(139,111,61,0.05), 0 30px 60px rgba(139,111,61,0.12)",
      background: hasVideo
        ? "#0F172A"
        : "linear-gradient(145deg, #FFFFFF 0%, #FAF5EB 50%, #F0E6D2 100%)",
      border: hasVideo ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(194,168,120,0.3)",
      transform: "translateZ(0)",
    }}>
      {!hasVideo && !playing && (
        <span aria-hidden style={{
          position: "absolute", top: "-40%", left: "50%", transform: "translateX(-50%)",
          width: "80%", height: "90%", pointerEvents: "none",
          background: "radial-gradient(ellipse at center, rgba(194,168,120,0.25) 0%, rgba(194,168,120,0) 70%)",
        }} />
      )}
      {thumbUrl && (
        <img
          src={thumbUrl}
          alt="Video thumbnail"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: playing ? 0 : 1, transition: "opacity 0.6s ease" }}
        />
      )}
      {!playing && (
        <div
          onClick={() => url && setPlaying(true)}
          style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: url ? "pointer" : "default", background: thumbUrl ? "rgba(10,10,10,0.3)" : "transparent", transition: "background 0.3s ease" }}
          className="group"
        >
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: 84, height: 84, borderRadius: "50%",
              background: hasVideo
                ? "rgba(255,255,255,0.95)"
                : "linear-gradient(135deg, #FFFFFF 0%, #F8F1E3 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
              boxShadow: hasVideo
                ? "0 12px 40px rgba(0,0,0,0.4)"
                : "0 12px 36px rgba(139,111,61,0.25)",
              border: hasVideo ? "none" : "1px solid rgba(194,168,120,0.5)",
              transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease",
            }} className={hasVideo ? "group-hover:scale-110" : ""}>
              <Play size={32} color={hasVideo ? "#1E293B" : "#8B6F3D"} fill={hasVideo ? "#1E293B" : "#8B6F3D"} style={{ marginLeft: 6 }} />
            </div>
            {!url && <span style={{ fontSize: 11, fontWeight: 700, color: "#8B6F3D", letterSpacing: "0.2em", textTransform: "uppercase" }}>Demo Coming Soon</span>}
          </div>
        </div>
      )}
      {playing && url && (
        <iframe src={embed(url)} allow="autoplay; fullscreen" allowFullScreen
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none", zIndex: 1, backgroundColor: "#000" }} />
      )}
    </div>
  );
}

function Form({ d }: { d: PageData }) {
  const [v, setV] = useState({ name: "", email: "", contact: "", portfolio: "", link: "", notes: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const successRef = useRef<HTMLDivElement>(null);
  const s = (k: keyof typeof v, val: string) => setV(p => ({ ...p, [k]: val }));

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setStatus("sending");
    try {
      const message = [
        v.notes,
        v.portfolio && `Portfolio: ${v.portfolio}`,
        v.link && `Submission link: ${v.link}`,
      ].filter(Boolean).join("\n") || "Video editor talent pool application";
      const res = await fetch(`${API_BASE}/forms/talent-pool`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: v.name, email: v.email, contact: v.contact, portfolio: v.portfolio, reel: v.link, message, type: "pool-editors", notifyEmail: d.formNotifyEmail }),
      });
      if (res.ok) {
        setStatus("sent");
        setTimeout(() => successRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
      } else {
        setStatus("error");
      }
    } catch { setStatus("error"); }
  }

  if (status === "sent") return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} ref={successRef}>
      <div style={{ textAlign: "center", padding: "56px 24px 44px" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(194,168,120,0.12)", border: "1px solid rgba(194,168,120,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
          <CheckCircle size={28} color="#8B6F3D" />
        </div>
        <h3 style={{ fontSize: 22, fontWeight: 800, color: "#0A0A0A", marginBottom: 12, letterSpacing: "-0.02em" }}>Edit received - thank you.</h3>
        <p style={{ fontSize: 16, color: "#5F5F5F", maxWidth: 420, margin: "0 auto", lineHeight: 1.6 }}>
          You're now part of the GrowitBuddy network. We'll be in touch as new projects come in.
        </p>
      </div>
    </motion.div>
  );

  const field = (label: string, k: keyof typeof v, type = "text", placeholder = "", required = true) => (
    <div className="cs-input-wrap">
      <label className="cs-label">{label}{!required && <span className="cs-label-opt"> (Optional)</span>}</label>
      <input type={type} value={v[k]} onChange={e => s(k, e.target.value)} placeholder={placeholder}
        required={required} className="gb-input cs-input" />
    </div>
  );

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div className="cs-form-grid">
        {field("Full Name",           "name",      "text",  "Your full name")}
        {field("Email Address",       "email",     "email", "you@example.com")}
        {field("WhatsApp / Telegram", "contact",   "text",  "@handle or number")}
        {field("Portfolio Link",      "portfolio", "text",  "https://...")}
      </div>
      {field("Submission Link", "link", "text", "Google Drive / Dropbox / WeTransfer link to your edit")}
      <div className="cs-input-wrap">
        <label className="cs-label">Notes <span className="cs-label-opt">(Optional)</span></label>
        <textarea value={v.notes} onChange={e => s("notes", e.target.value)}
          placeholder="Anything you'd like us to know..." rows={4}
          className="gb-input cs-input" style={{ resize: "vertical" }} />
      </div>
      <div style={{ marginTop: 8, borderTop: "1px solid #EAEAE4", paddingTop: 28, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
        <p style={{ fontSize: 13, color: "#8A8A8A", maxWidth: 380, lineHeight: 1.6 }}>
          Your details are kept private and only used to match you with relevant creative opportunities.
        </p>
        <button type="submit" disabled={status === "sending"} className="gb-btn cs-submit-btn">
          {status === "sending" ? "Submitting…" : "Submit Your Edit"}
          {status !== "sending" && <ArrowRight size={16} />}
        </button>
      </div>
      {status === "error" && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontSize: 14, color: "#D93025", padding: "12px 16px", background: "rgba(217,48,37,0.08)", borderRadius: 8, marginTop: 4 }}>
          Something went wrong. Please try again.
        </motion.p>
      )}
    </form>
  );
}

export default function CreatorSchool() {
  const d = usePublicContent<PageData>("creator-school", DEFAULTS);

  return (
    <div style={{ background: "#F8F8F6", minHeight: "100vh" }}>
      <SEOMeta title={d.seoTitle} description={d.seoDesc} robots="noindex,follow" />

      <style>{`
        .cs-page-wrapper {
          --tp-bg: #F8F8F6;
          --tp-card-bg: #FFFFFF;
          --tp-text: #0A0A0A;
          --tp-text-muted: #5F5F5F;
          --tp-gold: #C2A878;
          --tp-gold-dark: #8B6F3D;
          --tp-border: #E5E5E0;
          font-family: 'Inter', sans-serif;
        }

        .cs-container { max-width: 1200px; margin: 0 auto; padding: 0 40px; }
        .cs-container-sm { max-width: 840px; margin: 0 auto; padding: 0 40px; }
        .cs-container-xs { max-width: 680px; margin: 0 auto; padding: 0 40px; }

        .cs-eyebrow {
          display: inline-flex; align-items: center; gap: 10px;
          padding: 8px 18px 8px 14px;
          border: 1px solid rgba(194,168,120,0.4);
          background: rgba(194,168,120,0.08);
          border-radius: 100px;
          font-size: 12px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase;
          color: var(--tp-gold-dark);
          margin-bottom: 32px;
          backdrop-filter: blur(8px);
        }
        .cs-eyebrow::before {
          content: ""; width: 6px; height: 6px; border-radius: 50%;
          background: var(--tp-gold); box-shadow: 0 0 0 3px rgba(194,168,120,0.2);
        }

        .cs-hero-h1 {
          font-size: clamp(40px, 6vw, 76px);
          font-weight: 800; line-height: 1.05; letter-spacing: -0.03em;
          color: var(--tp-text); margin-bottom: 28px;
          text-wrap: balance;
        }
        .cs-hero-lead {
          font-size: clamp(18px, 2vw, 22px); color: var(--tp-text-muted); line-height: 1.6;
          max-width: 640px; margin: 0 auto 48px;
          text-wrap: pretty;
        }
        .cs-section-h2 {
          font-size: clamp(28px, 4vw, 48px);
          font-weight: 800; color: var(--tp-text);
          letter-spacing: -0.03em; line-height: 1.1;
          margin-bottom: 16px;
        }

        .cs-hero-section {
          padding: 140px 0 80px;
          position: relative;
          background: linear-gradient(180deg, #FAF9F6 0%, var(--tp-bg) 100%);
          border-bottom: 1px solid var(--tp-border);
          overflow: hidden;
        }
        .cs-hero-glow {
          position: absolute; top: -20%; left: 50%; transform: translateX(-50%);
          width: 80vw; height: 600px; pointer-events: none;
          background: radial-gradient(ellipse at center, rgba(194,168,120,0.15) 0%, rgba(194,168,120,0) 60%);
          z-index: 0;
        }

        .cs-steps-grid {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px;
          margin-top: 64px;
        }
        .cs-step-card {
          background: var(--tp-card-bg);
          border: 1px solid var(--tp-border);
          border-radius: 20px;
          padding: 32px 28px;
          position: relative;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 4px 12px rgba(0,0,0,0.02);
          overflow: hidden;
          z-index: 1;
        }
        .cs-step-card::before {
          content: ""; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(194,168,120,0.05) 0%, transparent 100%);
          opacity: 0; transition: opacity 0.4s ease; z-index: -1;
        }
        .cs-step-card:hover {
          transform: translateY(-6px);
          border-color: rgba(194,168,120,0.4);
          box-shadow: 0 20px 40px rgba(139,111,61,0.08);
        }
        .cs-step-card:hover::before { opacity: 1; }
        .cs-step-num {
          font-family: 'Menlo', 'Space Mono', monospace;
          font-size: 13px; font-weight: 700; color: var(--tp-gold-dark);
          letter-spacing: 0.1em;
          display: flex; align-items: center; gap: 12px;
          margin-bottom: 24px;
        }
        .cs-step-num::after {
          content: ""; flex: 1; height: 1px; background: rgba(194,168,120,0.3);
        }

        .cs-res-grid {
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;
          margin-top: 48px;
        }
        .cs-res-card {
          background: var(--tp-card-bg);
          border: 1px solid var(--tp-border);
          border-radius: 20px;
          padding: 28px;
          display: flex; align-items: flex-start; justify-content: space-between; gap: 24px;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(0,0,0,0.02);
        }
        .cs-res-card:hover {
          transform: translateY(-4px);
          border-color: var(--tp-gold);
          box-shadow: 0 16px 32px rgba(139,111,61,0.08);
        }
        .cs-res-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 10px 18px; border-radius: 100px;
          font-size: 13px; font-weight: 600;
          background: #F8F8F6; color: var(--tp-text);
          border: 1px solid var(--tp-border);
          text-decoration: none; transition: all 0.2s ease;
          white-space: nowrap; flex-shrink: 0;
        }
        .cs-res-card:hover .cs-res-btn {
          background: var(--gb-accent); color: #fff; border-color: var(--gb-accent);
        }

        .cs-form-wrapper {
          background: var(--tp-card-bg);
          border: 1px solid var(--tp-border);
          border-radius: 24px;
          padding: clamp(32px, 6vw, 64px);
          box-shadow: 0 8px 30px rgba(0,0,0,0.04), 0 40px 80px rgba(139,111,61,0.06);
          position: relative;
        }
        .cs-form-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 24px;
        }
        .cs-input-wrap {
          display: flex; flex-direction: column; gap: 8px;
        }
        .cs-label {
          font-size: 12px; font-weight: 700; color: #4A4A4A;
          letter-spacing: 0.08em; text-transform: uppercase;
        }
        .cs-label-opt {
          font-weight: 400; color: #8A8A8A; text-transform: none; letter-spacing: 0;
        }
        .cs-input {
          background: #FDFDFB !important;
          border: 1.5px solid #E5E5E0 !important;
          padding: 14px 18px !important;
          font-size: 15px !important;
          border-radius: 12px !important;
          box-shadow: 0 1px 2px rgba(0,0,0,0.02) !important;
          transition: all 0.2s ease !important;
        }
        .cs-input:focus {
          background: #FFFFFF !important;
          border-color: var(--gb-accent) !important;
          box-shadow: 0 0 0 4px rgba(30,41,59,0.08) !important;
        }
        .cs-submit-btn {
          font-size: 16px !important; padding: 16px 36px !important; border-radius: 100px !important;
        }

        @media (max-width: 960px) {
          .cs-steps-grid { grid-template-columns: repeat(2, 1fr); }
          .cs-res-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .cs-container, .cs-container-sm, .cs-container-xs { padding: 0 24px; }
          .cs-hero-section { padding: 100px 0 60px; }
        }
        @media (max-width: 600px) {
          .cs-steps-grid { grid-template-columns: 1fr; }
          .cs-form-grid { grid-template-columns: 1fr; }
          .cs-res-card { flex-direction: column; gap: 16px; }
          .cs-res-btn { width: 100%; justify-content: center; }
          .cs-submit-btn { width: 100%; justify-content: center; }
        }
      `}</style>

      <div className="cs-page-wrapper">
        {/* ─── 01 HERO ─────────────────────────────────────── */}
        <section className="cs-hero-section">
          <div className="cs-hero-glow" />
          <div className="cs-container" style={{ position: "relative", zIndex: 10 }}>
            <div style={{ textAlign: "center", maxWidth: 880, margin: "0 auto" }}>
              <motion.div {...FI(0.1)}>
                <span className="cs-eyebrow">{d.eyebrow}</span>
              </motion.div>
              <motion.h1 {...FI(0.2)} className="cs-hero-h1">{d.headline}</motion.h1>
              <motion.p {...FI(0.3)} className="cs-hero-lead">{d.description}</motion.p>

              <motion.div {...FI(0.4)} style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center", marginBottom: 64 }}>
                <a href="#submit" className="gb-btn" style={{ fontSize: 16, padding: "16px 36px" }}>
                  {d.ctaPrimary} <ArrowRight size={18} />
                </a>
                <a href="#resources" className="gb-btn-outline" style={{ fontSize: 16, padding: "16px 36px", background: "#FFFFFF" }}>
                  {d.ctaSecondary}
                </a>
              </motion.div>
            </div>

            <motion.div {...FI(0.5)} id="video" style={{ maxWidth: 960, margin: "0 auto" }}>
              <VideoPlayer url={d.videoUrl} />
              {d.heroTrustText && (
                <div style={{ textAlign: "center", marginTop: 32 }}>
                  <p style={{ fontSize: 14, color: "#8A8A8A", fontWeight: 500, letterSpacing: "0.02em" }}>
                    {d.heroTrustText}
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </section>

        {/* ─── 02 HOW IT WORKS ─────────────────────────────── */}
        <section style={{ padding: "120px 0", background: "#FFFFFF", position: "relative" }}>
          <div className="cs-container">
            <motion.div {...FI()} style={{ maxWidth: 600 }}>
              <span style={{ color: "var(--tp-gold-dark)", fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 12 }}>
                The Process
              </span>
              <h2 className="cs-section-h2">{d.stepsTitle}</h2>
              {d.opportunityText && (
                <p style={{ fontSize: 18, color: "var(--tp-text-muted)", lineHeight: 1.6, marginTop: 16 }}>
                  {d.opportunityText}
                </p>
              )}
            </motion.div>

            <div className="cs-steps-grid">
              {(d.steps || []).map((step, i) => (
                <motion.div key={i} {...FI(0.1 + i * 0.1)} className="cs-step-card">
                  <div className="cs-step-num">{step.number}</div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--tp-text)", marginBottom: 12, letterSpacing: "-0.01em" }}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize: 15, color: "var(--tp-text-muted)", lineHeight: 1.6 }}>
                    {step.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── 03 RESOURCES ────────────────────────────────── */}
        <section id="resources" style={{ padding: "120px 0", background: "linear-gradient(180deg, var(--tp-bg) 0%, #FFFFFF 100%)", borderTop: "1px solid var(--tp-border)" }}>
          <div className="cs-container-sm">
            <motion.div {...FI()} style={{ textAlign: "center", marginBottom: 64 }}>
              <span style={{ color: "var(--tp-gold-dark)", fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 12 }}>
                Toolkit
              </span>
              <h2 className="cs-section-h2">{d.resourcesTitle}</h2>
              <p style={{ fontSize: 18, color: "var(--tp-text-muted)", lineHeight: 1.6, maxWidth: 600, margin: "16px auto 0" }}>
                {d.resourcesSubtext}
              </p>
            </motion.div>

            <div className="cs-res-grid">
              {(d.resources || []).map((r, i) => {
                const fallback = DEFAULTS.resources.find((dr) => dr.id === r.id);
                const link = r.link || fallback?.link || "";
                const btnLabel = r.btnLabel || fallback?.btnLabel || "Open";
                return (
                  <motion.div key={r.id} {...FI(0.1 + i * 0.1)} className="cs-res-card">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: 17, fontWeight: 800, color: "var(--tp-text)", marginBottom: 8, letterSpacing: "-0.01em" }}>
                        {r.title}
                      </h3>
                      <p style={{ fontSize: 14, color: "var(--tp-text-muted)", lineHeight: 1.6 }}>
                        {r.desc}
                      </p>
                    </div>
                    {link ? (
                      <a href={link} target="_blank" rel="noopener noreferrer" className="cs-res-btn">
                        {btnLabel} <ArrowUpRight size={16} style={{ opacity: 0.6 }} />
                      </a>
                    ) : (
                      <span style={{ padding: "8px 16px", background: "rgba(194,168,120,0.1)", color: "var(--tp-gold-dark)", borderRadius: 100, fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                        Soon
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─── 04 SUBMISSION FORM ──────────────────────────── */}
        <section id="submit" style={{ padding: "120px 0", background: "linear-gradient(180deg, #FFFFFF 0%, #FAF9F6 100%)", position: "relative" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "50%", background: "linear-gradient(180deg, rgba(194,168,120,0.03) 0%, transparent 100%)", pointerEvents: "none" }} />

          <div className="cs-container-xs" style={{ position: "relative" }}>
            <motion.div {...FI()} style={{ textAlign: "center", marginBottom: 48 }}>
              <h2 className="cs-section-h2" style={{ fontSize: "clamp(32px, 5vw, 56px)" }}>{d.formTitle}</h2>
              <p style={{ fontSize: 18, color: "var(--tp-text-muted)", lineHeight: 1.6 }}>
                {d.formSubtext}
              </p>
            </motion.div>

            <motion.div {...FI(0.2)} className="cs-form-wrapper">
              <Form d={d} />
            </motion.div>

            {d.formDisclaimer && (
              <motion.p {...FI(0.3)} style={{ fontSize: 14, color: "#8A8A8A", textAlign: "center", lineHeight: 1.6, maxWidth: 500, margin: "32px auto 0" }}>
                {d.formDisclaimer}
              </motion.p>
            )}
          </div>
        </section>

        {/* ─── 05 FINAL CTA ────────────────────────────────── */}
        <section style={{ padding: "140px 0", background: "var(--gb-accent)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at top right, rgba(194,168,120,0.15) 0%, transparent 60%)" }} />
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at bottom left, rgba(194,168,120,0.08) 0%, transparent 50%)" }} />

          <div className="cs-container-sm" style={{ position: "relative", textAlign: "center" }}>
            <motion.div {...FI()}>
              <span style={{ display: "inline-block", color: "var(--tp-gold)", fontSize: 13, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 24 }}>
                Join the Network
              </span>
              <h2 style={{ fontSize: "clamp(36px, 5vw, 64px)", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.02em", marginBottom: 24, lineHeight: 1.1 }}>
                {d.finalHeadline}
              </h2>
              <p style={{ fontSize: 20, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, maxWidth: 540, margin: "0 auto 48px" }}>
                {d.finalSubtext}
              </p>
              <a href="#submit" className="gb-btn" style={{ background: "#FFFFFF", color: "var(--gb-accent)", fontSize: 16, padding: "18px 40px" }}>
                {d.finalCtaPrimary} <ArrowRight size={18} />
              </a>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  );
}
