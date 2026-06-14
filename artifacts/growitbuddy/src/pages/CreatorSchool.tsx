import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Play, CheckCircle } from "lucide-react";
import SEOMeta from "@/components/SEOMeta";
import { usePublicContent } from "@/hooks/usePublicContent";

import { API_BASE } from "@/lib/api";

import { CREATOR_SCHOOL_DEFAULTS as DEFAULTS, type CreatorSchoolData as PageData } from "@/lib/creatorSchoolDefaults";

const FI = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
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
      borderRadius: 16,
      overflow: "hidden",
      position: "relative",
      boxShadow: hasVideo
        ? "0 24px 60px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.08)"
        : "0 2px 4px rgba(0,0,0,0.04), 0 24px 50px rgba(30,41,59,0.08)",
      background: hasVideo
        ? "#0F172A"
        : "linear-gradient(145deg, #FFFFFF 0%, #F5F5F2 100%)",
      border: hasVideo ? "1px solid rgba(255,255,255,0.1)" : "1px solid var(--gb-border, #E5E5E0)",
      transform: "translateZ(0)",
    }}>
      {!hasVideo && !playing && (
        <span aria-hidden style={{
          position: "absolute", top: "-40%", left: "50%", transform: "translateX(-50%)",
          width: "80%", height: "90%", pointerEvents: "none",
          background: "radial-gradient(ellipse at center, rgba(30,41,59,0.08) 0%, rgba(30,41,59,0) 70%)",
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
              width: 76, height: 76, borderRadius: "50%",
              background: hasVideo ? "rgba(255,255,255,0.95)" : "#FFFFFF",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
              boxShadow: hasVideo
                ? "0 12px 40px rgba(0,0,0,0.4)"
                : "0 10px 30px rgba(30,41,59,0.18)",
              border: hasVideo ? "none" : "1px solid var(--gb-border, #E5E5E0)",
              transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease",
            }} className={hasVideo ? "group-hover:scale-110" : ""}>
              <Play size={30} color="#1E293B" fill="#1E293B" style={{ marginLeft: 5 }} />
            </div>
            {!url && <span style={{ fontSize: 11, fontWeight: 700, color: "#8A8A8A", letterSpacing: "0.18em", textTransform: "uppercase" }}>Demo Coming Soon</span>}
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
      <div style={{ textAlign: "center", padding: "48px 24px 40px" }}>
        <div style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(30,41,59,0.06)", border: "1px solid rgba(30,41,59,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <CheckCircle size={26} color="#1E293B" />
        </div>
        <h3 style={{ fontSize: 22, fontWeight: 800, color: "#0A0A0A", marginBottom: 10, letterSpacing: "-0.02em" }}>Edit received - thank you.</h3>
        <p style={{ fontSize: 15, color: "#5F5F5F", maxWidth: 420, margin: "0 auto", lineHeight: 1.65 }}>
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
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
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
      <div style={{ marginTop: 8, borderTop: "1px solid #E5E5E0", paddingTop: 24, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 18 }}>
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
          --tp-border: #E5E5E0;
          font-family: 'Inter', sans-serif;
        }

        .cs-container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }
        .cs-container-sm { max-width: 820px; margin: 0 auto; padding: 0 24px; }
        .cs-container-xs { max-width: 660px; margin: 0 auto; padding: 0 24px; }

        .cs-eyebrow {
          display: block;
          font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--gb-gold);
          margin-bottom: 18px;
        }

        .cs-hero-h1 {
          font-size: clamp(32px, 5vw, 60px);
          font-weight: 800; line-height: 1.08; letter-spacing: -0.04em;
          color: var(--tp-text); margin-bottom: 20px;
          text-wrap: balance;
        }
        .cs-hero-lead {
          font-size: clamp(16px, 2vw, 19px); color: var(--tp-text-muted); line-height: 1.7;
          max-width: 600px; margin: 0 auto 36px;
          text-wrap: pretty;
        }
        .cs-section-label {
          display: block; margin-bottom: 12px;
          font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase;
          color: #8A8A8A;
        }
        .cs-section-h2 {
          font-size: clamp(24px, 3vw, 40px);
          font-weight: 800; color: var(--tp-text);
          letter-spacing: -0.03em; line-height: 1.15;
          margin-bottom: 14px;
        }

        .cs-hero-section {
          padding: 116px 0 72px;
          position: relative;
          background: #FFFFFF;
          border-bottom: 1px solid var(--tp-border);
          overflow: hidden;
        }
        .cs-hero-glow {
          position: absolute; top: -20%; left: 50%; transform: translateX(-50%);
          width: 70vw; height: 520px; pointer-events: none;
          background: radial-gradient(ellipse at center, rgba(30,41,59,0.04) 0%, rgba(30,41,59,0) 60%);
          z-index: 0;
        }

        .cs-steps-grid {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;
          margin-top: 44px;
        }
        .cs-step-card {
          background: var(--tp-card-bg);
          border: 1px solid var(--tp-border);
          border-radius: 14px;
          padding: 26px 24px;
          position: relative;
          transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
          box-shadow: 0 1px 2px rgba(0,0,0,0.02);
        }
        .cs-step-card:hover {
          transform: translateY(-4px);
          border-color: #C8C8C0;
          box-shadow: 0 12px 28px rgba(0,0,0,0.06);
        }
        .cs-step-num {
          font-family: 'Menlo', 'Space Mono', monospace;
          font-size: 12px; font-weight: 700; color: var(--gb-authority);
          letter-spacing: 0.1em;
          display: flex; align-items: center; gap: 12px;
          margin-bottom: 20px;
        }
        .cs-step-num::after {
          content: ""; flex: 1; height: 1px; background: var(--tp-border);
        }

        .cs-res-grid {
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;
          margin-top: 40px;
        }
        .cs-res-card {
          background: var(--tp-card-bg);
          border: 1px solid var(--tp-border);
          border-radius: 14px;
          padding: 24px;
          display: flex; align-items: flex-start; justify-content: space-between; gap: 20px;
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
          box-shadow: 0 1px 2px rgba(0,0,0,0.02);
        }
        .cs-res-card:hover {
          transform: translateY(-3px);
          border-color: #C8C8C0;
          box-shadow: 0 12px 28px rgba(0,0,0,0.06);
        }
        .cs-res-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 9px 16px; border-radius: 8px;
          font-size: 13px; font-weight: 600;
          background: var(--tp-bg); color: var(--tp-text);
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
          border-radius: 16px;
          padding: clamp(28px, 5vw, 48px);
          box-shadow: 0 8px 30px rgba(0,0,0,0.04);
          position: relative;
        }
        .cs-form-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 20px;
        }
        .cs-input-wrap {
          display: flex; flex-direction: column; gap: 8px;
        }
        .cs-label {
          font-size: 12px; font-weight: 700; color: #4A4A4A;
          letter-spacing: 0.06em; text-transform: uppercase;
        }
        .cs-label-opt {
          font-weight: 400; color: #8A8A8A; text-transform: none; letter-spacing: 0;
        }
        .cs-input {
          background: #FDFDFB !important;
          border: 1.5px solid #E5E5E0 !important;
          padding: 13px 16px !important;
          font-size: 15px !important;
          border-radius: 8px !important;
          transition: all 0.2s ease !important;
        }
        .cs-input:focus {
          background: #FFFFFF !important;
          border-color: var(--gb-accent) !important;
          box-shadow: 0 0 0 3px rgba(30,41,59,0.08) !important;
        }
        .cs-submit-btn {
          font-size: 15px !important; padding: 14px 30px !important; border-radius: 100px !important;
        }

        @media (max-width: 960px) {
          .cs-steps-grid { grid-template-columns: repeat(2, 1fr); }
          .cs-res-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .cs-hero-section { padding: 96px 0 56px; }
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
            <div style={{ textAlign: "center", maxWidth: 820, margin: "0 auto" }}>
              <motion.div {...FI(0.1)}>
                <span className="cs-eyebrow">{d.eyebrow}</span>
              </motion.div>
              <motion.h1 {...FI(0.2)} className="cs-hero-h1">{d.headline}</motion.h1>
              <motion.p {...FI(0.3)} className="cs-hero-lead">{d.description}</motion.p>

              <motion.div {...FI(0.4)} style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", marginBottom: 48 }}>
                <a href="#submit" className="gb-btn">
                  {d.ctaPrimary} <ArrowRight size={16} />
                </a>
                <a href="#resources" className="gb-btn-outline" style={{ background: "#FFFFFF" }}>
                  {d.ctaSecondary}
                </a>
              </motion.div>
            </div>

            <motion.div {...FI(0.5)} id="video" style={{ maxWidth: 900, margin: "0 auto" }}>
              <VideoPlayer url={d.videoUrl} />
              {d.heroTrustText && (
                <div style={{ textAlign: "center", marginTop: 24 }}>
                  <p style={{ fontSize: 14, color: "#8A8A8A", fontWeight: 500, letterSpacing: "0.02em" }}>
                    {d.heroTrustText}
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </section>

        {/* ─── 02 HOW IT WORKS ─────────────────────────────── */}
        <section style={{ padding: "80px 0", background: "#FFFFFF", position: "relative" }}>
          <div className="cs-container">
            <motion.div {...FI()} style={{ maxWidth: 600 }}>
              <span className="cs-section-label">The Process</span>
              <h2 className="cs-section-h2">{d.stepsTitle}</h2>
              {d.opportunityText && (
                <p style={{ fontSize: 17, color: "var(--tp-text-muted)", lineHeight: 1.6, marginTop: 14 }}>
                  {d.opportunityText}
                </p>
              )}
            </motion.div>

            <div className="cs-steps-grid">
              {(d.steps || []).map((step, i) => (
                <motion.div key={i} {...FI(0.1 + i * 0.08)} className="cs-step-card">
                  <div className="cs-step-num">{step.number}</div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: "var(--tp-text)", marginBottom: 10, letterSpacing: "-0.01em" }}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize: 14, color: "var(--tp-text-muted)", lineHeight: 1.6 }}>
                    {step.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── 03 RESOURCES ────────────────────────────────── */}
        <section id="resources" style={{ padding: "80px 0", background: "var(--tp-bg)", borderTop: "1px solid var(--tp-border)" }}>
          <div className="cs-container-sm">
            <motion.div {...FI()} style={{ textAlign: "center", marginBottom: 12 }}>
              <span className="cs-section-label">Toolkit</span>
              <h2 className="cs-section-h2">{d.resourcesTitle}</h2>
              <p style={{ fontSize: 17, color: "var(--tp-text-muted)", lineHeight: 1.6, maxWidth: 560, margin: "14px auto 0" }}>
                {d.resourcesSubtext}
              </p>
            </motion.div>

            <div className="cs-res-grid">
              {(d.resources || []).map((r, i) => {
                const fallback = DEFAULTS.resources.find((dr) => dr.id === r.id);
                const link = r.link || fallback?.link || "";
                const btnLabel = r.btnLabel || fallback?.btnLabel || "Open";
                return (
                  <motion.div key={r.id} {...FI(0.08 + i * 0.08)} className="cs-res-card">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--tp-text)", marginBottom: 6, letterSpacing: "-0.01em" }}>
                        {r.title}
                      </h3>
                      <p style={{ fontSize: 14, color: "var(--tp-text-muted)", lineHeight: 1.6 }}>
                        {r.desc}
                      </p>
                    </div>
                    {link ? (
                      <a href={link} target="_blank" rel="noopener noreferrer" className="cs-res-btn">
                        {btnLabel} <ArrowUpRight size={15} style={{ opacity: 0.6 }} />
                      </a>
                    ) : (
                      <span style={{ padding: "7px 14px", background: "rgba(30,41,59,0.06)", color: "var(--gb-authority)", borderRadius: 8, fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
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
        <section id="submit" style={{ padding: "80px 0", background: "#FFFFFF", borderTop: "1px solid var(--tp-border)" }}>
          <div className="cs-container-xs">
            <motion.div {...FI()} style={{ textAlign: "center", marginBottom: 36 }}>
              <h2 className="cs-section-h2">{d.formTitle}</h2>
              <p style={{ fontSize: 17, color: "var(--tp-text-muted)", lineHeight: 1.6 }}>
                {d.formSubtext}
              </p>
            </motion.div>

            <motion.div {...FI(0.15)} className="cs-form-wrapper">
              <Form d={d} />
            </motion.div>

            {d.formDisclaimer && (
              <motion.p {...FI(0.2)} style={{ fontSize: 13, color: "#8A8A8A", textAlign: "center", lineHeight: 1.6, maxWidth: 500, margin: "24px auto 0" }}>
                {d.formDisclaimer}
              </motion.p>
            )}
          </div>
        </section>

        {/* ─── 05 FINAL CTA ────────────────────────────────── */}
        <section style={{ padding: "96px 0", background: "var(--gb-accent)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at top right, rgba(255,255,255,0.06) 0%, transparent 60%)" }} />

          <div className="cs-container-sm" style={{ position: "relative", textAlign: "center" }}>
            <motion.div {...FI()}>
              <span style={{ display: "inline-block", color: "var(--gb-gold)", fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 18 }}>
                Join the Network
              </span>
              <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.03em", marginBottom: 18, lineHeight: 1.12 }}>
                {d.finalHeadline}
              </h2>
              <p style={{ fontSize: 18, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, maxWidth: 520, margin: "0 auto 36px" }}>
                {d.finalSubtext}
              </p>
              <a href="#submit" className="gb-btn" style={{ background: "#FFFFFF", color: "var(--gb-accent)" }}>
                {d.finalCtaPrimary} <ArrowRight size={16} />
              </a>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  );
}
