import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ExternalLink, Play, CheckCircle } from "lucide-react";
import SEOMeta from "@/components/SEOMeta";
import { usePublicContent } from "@/hooks/usePublicContent";

import { API_BASE } from "@/lib/api";

import { CREATOR_SCHOOL_DEFAULTS as DEFAULTS, type CreatorSchoolData as PageData } from "@/lib/creatorSchoolDefaults";

const FI = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay },
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

  return (
    <div style={{ width: "100%", aspectRatio: "16/9", borderRadius: 20, overflow: "hidden", position: "relative", boxShadow: "0 32px 80px rgba(0,0,0,0.28)", background: "#0F172A" }}>
      {thumbUrl && (
        <img
          src={thumbUrl}
          alt="Video thumbnail"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: playing ? 0 : 1, transition: "opacity 0.4s" }}
        />
      )}
      {!playing && (
        <div
          onClick={() => url && setPlaying(true)}
          style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: url ? "pointer" : "default", background: thumbUrl ? "rgba(0,0,0,0.25)" : "transparent" }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: 80, height: 80, borderRadius: "50%",
              background: url ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 14px",
              boxShadow: url ? "0 12px 48px rgba(0,0,0,0.35)" : "none",
              transition: "transform 0.2s",
            }}>
              <Play size={32} color={url ? "#1E293B" : "#ffffff30"} fill={url ? "#1E293B" : "#ffffff30"} style={{ marginLeft: 6 }} />
            </div>
            {!url && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em" }}>DEMO VIDEO COMING SOON</span>}
          </div>
        </div>
      )}
      {playing && url && (
        <iframe src={embed(url)} allow="autoplay; fullscreen" allowFullScreen
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none", zIndex: 1 }} />
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
    <div ref={successRef} style={{ textAlign: "center", padding: "56px 24px" }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
        <CheckCircle size={26} color="#16a34a" />
      </div>
      <p style={{ fontSize: 18, fontWeight: 700, color: "#0A0A0A", marginBottom: 8 }}>Edit received - thank you.</p>
      <p style={{ fontSize: 14, color: "#5F5F5F", maxWidth: 380, margin: "0 auto", lineHeight: 1.65 }}>
        You're now part of the GrowitBuddy network. We'll be in touch as new projects come in.
      </p>
    </div>
  );

  const field = (label: string, k: keyof typeof v, type = "text", placeholder = "", required = true) => (
    <div>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#8A8A8A", marginBottom: 7, textTransform: "uppercase" }}>{label}</label>
      <input type={type} value={v[k]} onChange={e => s(k, e.target.value)} placeholder={placeholder}
        required={required} className="gb-input" style={{ width: "100%" }} />
    </div>
  );

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="csp-form-grid">
        {field("Full Name",           "name",      "text",  "Your full name")}
        {field("Email Address",       "email",     "email", "you@example.com")}
        {field("WhatsApp / Telegram", "contact",   "text",  "@handle or number")}
        {field("Portfolio Link",      "portfolio", "text",  "https://...")}
      </div>
      {field("Submission Link", "link", "text", "Google Drive / Dropbox / WeTransfer link to your edit")}
      <div>
        <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#8A8A8A", marginBottom: 7, textTransform: "uppercase" }}>Notes (optional)</label>
        <textarea value={v.notes} onChange={e => s("notes", e.target.value)}
          placeholder="Anything you'd like us to know..." rows={3}
          className="gb-input" style={{ width: "100%", resize: "vertical" }} />
      </div>
      <div>
        <button type="submit" disabled={status === "sending"} className="gb-btn" style={{ fontSize: 15, padding: "14px 32px" }}>
          {status === "sending" ? "Submitting…" : "Submit Your Edit"}
          {status !== "sending" && <ArrowRight size={15} style={{ marginLeft: 8, display: "inline" }} />}
        </button>
      </div>
      {status === "error" && <p style={{ fontSize: 13, color: "#dc2626" }}>Something went wrong. Please try again.</p>}
    </form>
  );
}

export default function CreatorSchool() {
  const d = usePublicContent<PageData>("creator-school", DEFAULTS);

  return (
    <div style={{ background: "var(--gb-bg)", minHeight: "100vh" }}>
      <SEOMeta title={d.seoTitle} description={d.seoDesc} robots="noindex,follow" />

      <style>{`
        .csp-wrap    { max-width: 1080px; margin: 0 auto; padding: 0 32px; }
        .csp-wrap-md { max-width: 820px;  margin: 0 auto; padding: 0 32px; }
        .csp-wrap-sm { max-width: 680px;  margin: 0 auto; padding: 0 32px; }
        .csp-pad     { padding: 96px 0; }
        .csp-steps   { display: grid; grid-template-columns: repeat(4,1fr); }
        .csp-cards   { display: grid; grid-template-columns: repeat(2,1fr); gap: 14px; }
        .csp-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .csp-btns    { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; }

        .csp-step-item { padding: 0 28px; border-left: 1px solid #E5E5E0; text-align: center; }
        .csp-step-item:first-child { border-left: none; }

        @media (max-width: 900px) {
          .csp-steps   { grid-template-columns: repeat(2,1fr); }
          .csp-step-item { border-left: none; border-top: 1px solid #E5E5E0; padding: 24px 16px; }
          .csp-step-item:nth-child(-n+2) { border-top: none; }
          .csp-cards   { grid-template-columns: 1fr; }
          .csp-pad     { padding: 72px 0; }
        }
        @media (max-width: 600px) {
          .csp-steps   { grid-template-columns: 1fr; }
          .csp-step-item { border-top: 1px solid #E5E5E0 !important; padding: 20px 0 !important; }
          .csp-step-item:first-child { border-top: none !important; }
          .csp-form-grid { grid-template-columns: 1fr; }
          .csp-wrap, .csp-wrap-md, .csp-wrap-sm { padding: 0 20px; }
          .csp-pad     { padding: 52px 0; }
          .csp-btns a  { width: 100%; max-width: 280px; justify-content: center; text-align: center; }
        }
      `}</style>

      {/* ─── 01 HERO - centered stacked ──────────────────── */}
      <section style={{ paddingTop: 80, paddingBottom: 0 }}>
        <div className="csp-wrap-md">

          {/* Text block - centered */}
          <motion.div {...FI()} style={{ textAlign: "center", marginBottom: 44 }}>
            <span className="gb-eyebrow" style={{ marginBottom: 20, display: "block" }}>{d.eyebrow}</span>
            <h1 style={{
              fontSize: "clamp(28px, 5vw, 64px)",
              fontWeight: 900, lineHeight: 1.04,
              letterSpacing: "-0.035em", color: "#0A0A0A", marginBottom: 20,
            }}>
              {d.headline}
            </h1>
            <p style={{ fontSize: "clamp(15px, 4.5vw, 18px)", color: "#5F5F5F", lineHeight: 1.65, maxWidth: 540, margin: "0 auto" }}>
              {d.description}
            </p>
          </motion.div>
        </div>

        {/* Video - immediately below text, large and cinematic */}
        <motion.div {...FI(0.1)} id="video" style={{ maxWidth: 940, margin: "0 auto", padding: "0 24px" }}>
          <VideoPlayer url={d.videoUrl} />
        </motion.div>

        {/* Opportunity note + CTAs - below video */}
        <div className="csp-wrap-md">
          {d.opportunityText && (
            <motion.div {...FI(0.18)} style={{ textAlign: "center", padding: "28px 0 8px", borderTop: "none" }}>
              <p style={{ fontSize: 14, color: "#8A8A8A", lineHeight: 1.65, maxWidth: 480, margin: "0 auto" }}>
                {d.opportunityText}
              </p>
            </motion.div>
          )}
          <motion.div {...FI(0.22)} style={{ paddingTop: 28, paddingBottom: 72 }}>
            <div className="csp-btns">
              <a href="#submit"    className="gb-btn"         style={{ fontSize: 15, padding: "14px 28px" }}>
                {d.ctaPrimary} <ArrowRight size={14} style={{ marginLeft: 7, display: "inline" }} />
              </a>
              <a href="#resources" className="gb-btn-outline" style={{ fontSize: 15, padding: "14px 28px" }}>
                {d.ctaSecondary}
              </a>
            </div>
            {d.heroTrustText && (
              <p style={{ textAlign: "center", fontSize: 13, color: "#8A8A8A", marginTop: 20, lineHeight: 1.65 }}>
                {d.heroTrustText}
              </p>
            )}
          </motion.div>
        </div>
      </section>

      {/* ─── 02 HOW IT WORKS ─────────────────────────────── */}
      <section style={{ borderTop: "1px solid #E5E5E0", background: "var(--gb-bg2)" }}>
        <div className="csp-wrap" style={{ paddingTop: 60, paddingBottom: 60 }}>
          <motion.div {...FI()} style={{ marginBottom: 44, textAlign: "center" }}>
            <h2 style={{ fontSize: "clamp(22px, 2.5vw, 36px)", fontWeight: 800, color: "#0A0A0A", letterSpacing: "-0.02em" }}>
              {d.stepsTitle}
            </h2>
          </motion.div>
          <div className="csp-steps">
            {(d.steps || []).map((step, i) => (
              <motion.div key={i} {...FI(i * 0.07)} className="csp-step-item">
                <span style={{ display: "block", fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", color: "#C2A878", marginBottom: 10 }}>{step.number}</span>
                <span style={{ display: "block", fontSize: 15, fontWeight: 700, color: "#0A0A0A", marginBottom: 6 }}>{step.title}</span>
                <span style={{ display: "block", fontSize: 13, color: "#8A8A8A", lineHeight: 1.6 }}>{step.desc}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 03 RESOURCES ────────────────────────────────── */}
      <section id="resources" className="csp-pad">
        <div className="csp-wrap-md">
          <motion.div {...FI()} style={{ marginBottom: 40 }}>
            <span className="gb-eyebrow" style={{ marginBottom: 14, display: "block" }}>RESOURCES</span>
            <h2 style={{ fontSize: "clamp(18px, 2.8vw, 38px)", fontWeight: 800, color: "#0A0A0A", letterSpacing: "-0.02em", marginBottom: 10 }}>
              {d.resourcesTitle}
            </h2>
            <p style={{ fontSize: 16, color: "#5F5F5F" }}>{d.resourcesSubtext}</p>
          </motion.div>
          <div className="csp-cards">
            {(d.resources || []).map((r, i) => {
              // Fallback: if saved link is empty, use the default Drive link for this resource id
              const fallback = DEFAULTS.resources.find((dr) => dr.id === r.id);
              const link = r.link || fallback?.link || "";
              const btnLabel = r.btnLabel || fallback?.btnLabel || "Open";
              return (
                <motion.div key={r.id} {...FI(i * 0.06)}
                  style={{ background: "white", border: "1px solid #E5E5E0", borderRadius: 14, padding: "22px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0A0A0A", marginBottom: 4 }}>{r.title}</h3>
                    <p style={{ fontSize: 13, color: "#8A8A8A", lineHeight: 1.5 }}>{r.desc}</p>
                  </div>
                  {link ? (
                    <a href={link} target="_blank" rel="noopener noreferrer"
                      style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#1E293B", padding: "9px 16px", border: "1px solid #D4D4CE", borderRadius: 8, textDecoration: "none", whiteSpace: "nowrap", transition: "all 0.15s" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#1E293B"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "#1E293B"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#1E293B"; e.currentTarget.style.borderColor = "#D4D4CE"; }}>
                      <ExternalLink size={13} /> {btnLabel}
                    </a>
                  ) : (
                    <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, color: "#C2A878", letterSpacing: "0.06em" }}>SOON</span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── 04 SUBMISSION FORM ──────────────────────────── */}
      <section id="submit" className="csp-pad" style={{ background: "var(--gb-bg2)", borderTop: "1px solid #E5E5E0" }}>
        <div className="csp-wrap-sm">
          <motion.div {...FI()} style={{ marginBottom: 36 }}>
            <span className="gb-eyebrow" style={{ marginBottom: 14, display: "block" }}>SUBMISSION</span>
            <h2 style={{ fontSize: "clamp(18px, 2.8vw, 38px)", fontWeight: 800, color: "#0A0A0A", letterSpacing: "-0.02em", marginBottom: 10 }}>
              {d.formTitle}
            </h2>
            <p style={{ fontSize: 16, color: "#5F5F5F" }}>{d.formSubtext}</p>
          </motion.div>
          <motion.div {...FI(0.08)} style={{ background: "white", border: "1px solid #E5E5E0", borderRadius: 18, padding: "clamp(24px,5vw,44px)" }}>
            <Form d={d} />
          </motion.div>
          {d.formDisclaimer && (
            <motion.p {...FI(0.14)} style={{ fontSize: 13, color: "#8A8A8A", textAlign: "center", marginTop: 20, lineHeight: 1.65 }}>
              {d.formDisclaimer}
            </motion.p>
          )}
        </div>
      </section>

      {/* ─── 05 FINAL CTA ────────────────────────────────── */}
      <section className="csp-pad" style={{ background: "#F8F8F6" }}>
        <div style={{ maxWidth: 880, margin: "0 auto", padding: "0 20px" }}>
          <motion.div
            {...FI()}
            style={{
              position: "relative",
              background: "#EFEFEA",
              border: "1px solid rgba(30,41,59,0.10)",
              borderRadius: 24,
              padding: "clamp(40px, 6vw, 72px) clamp(24px, 5vw, 56px)",
              textAlign: "center",
              overflow: "hidden",
              boxShadow: "0 1px 0 rgba(255,255,255,0.6) inset, 0 24px 60px -32px rgba(30,41,59,0.25)",
            }}
          >
            {/* decorative dotted grid corners — palette only */}
            <span aria-hidden style={{
              position: "absolute", top: 20, left: 20, width: 72, height: 72, opacity: 0.35,
              backgroundImage: "radial-gradient(circle, rgba(30,41,59,0.35) 1px, transparent 1px)",
              backgroundSize: "8px 8px",
              maskImage: "radial-gradient(circle at top left, black, transparent 70%)",
              WebkitMaskImage: "radial-gradient(circle at top left, black, transparent 70%)",
              pointerEvents: "none",
            }} />
            <span aria-hidden style={{
              position: "absolute", bottom: 20, right: 20, width: 72, height: 72, opacity: 0.35,
              backgroundImage: "radial-gradient(circle, rgba(30,41,59,0.35) 1px, transparent 1px)",
              backgroundSize: "8px 8px",
              maskImage: "radial-gradient(circle at bottom right, black, transparent 70%)",
              WebkitMaskImage: "radial-gradient(circle at bottom right, black, transparent 70%)",
              pointerEvents: "none",
            }} />
            {/* gold accent line */}
            <span aria-hidden style={{
              position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
              width: 64, height: 3, background: "var(--gb-gold)", borderRadius: "0 0 6px 6px",
            }} />

            <div style={{ position: "relative", maxWidth: 560, margin: "0 auto" }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase",
                color: "var(--gb-gold)", marginBottom: 20,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--gb-gold)" }} />
                Get started
              </span>
              <h2 style={{ fontSize: "clamp(24px, 4vw, 46px)", fontWeight: 800, color: "#0A0A0A", letterSpacing: "-0.04em", marginBottom: 16, lineHeight: 1.08 }}>
                {d.finalHeadline}
              </h2>
              <p style={{ fontSize: 16, color: "#5F5F5F", lineHeight: 1.7, marginBottom: 36, maxWidth: "44ch", margin: "0 auto 36px" }}>
                {d.finalSubtext}
              </p>
              <div className="csp-btns" style={{ display: "flex", justifyContent: "center" }}>
                <a href="#submit" className="gb-btn">
                  {d.finalCtaPrimary} <ArrowRight size={16} />
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
