import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ExternalLink, Play, CheckCircle } from "lucide-react";
import SEOMeta from "@/components/SEOMeta";
import { usePublicContent } from "@/hooks/usePublicContent";

import { API_BASE } from "@/lib/api";

interface ResourceCard { id: string; title: string; desc: string; link: string; btnLabel: string; }
interface Step { number: string; title: string; desc: string; }

interface PageData {
  eyebrow: string;
  headline: string;
  description: string;
  opportunityText: string;
  ctaPrimary: string;
  ctaSecondary: string;
  videoUrl: string;
  heroTrustText: string;
  stepsTitle: string;
  steps: Step[];
  resourcesTitle: string;
  resourcesSubtext: string;
  resources: ResourceCard[];
  formTitle: string;
  formSubtext: string;
  formDisclaimer: string;
  formNotifyEmail: string;
  finalHeadline: string;
  finalSubtext: string;
  finalCtaPrimary: string;
  finalCtaSecondary: string;
  seoTitle: string;
  seoDesc: string;
}

const DEFAULTS: PageData = {
  eyebrow: "VIDEO EDITORS NETWORK",
  headline: "Join our growing network of video editors.",
  description: "Watch the demo, understand the workflow, submit your edit, and become part of the GrowitBuddy ecosystem.",
  opportunityText: "As new projects come in, we regularly collaborate with creators and freelancers from within our network.",
  ctaPrimary: "Submit Your Work",
  ctaSecondary: "View Resources",
  videoUrl: "",
  heroTrustText: "We are continuously building long-term creative relationships inside the GrowitBuddy ecosystem.",
  stepsTitle: "How it works.",
  steps: [
    { number: "01", title: "Watch Demo",         desc: "Get familiar with our style and workflow." },
    { number: "02", title: "Access Resources",   desc: "Download raw files and editing guidelines." },
    { number: "03", title: "Submit Your Work",   desc: "Share your completed edit for review." },
    { number: "04", title: "Join the Network",   desc: "Get added to our growing editor ecosystem." },
  ],
  resourcesTitle: "Resources & Guidelines",
  resourcesSubtext: "Everything you need to complete and submit your edit.",
  resources: [
    { id: "1", title: "Editing Guidelines", desc: "Style, pacing, and technical standards for submissions.", link: "", btnLabel: "Open" },
    { id: "2", title: "Raw Footage",        desc: "Source video files for the current project.", link: "", btnLabel: "Download" },
    { id: "3", title: "Brand Assets",       desc: "Logos, fonts, colours, and visual identity files.", link: "", btnLabel: "Download" },
    { id: "4", title: "Submission Rules",   desc: "How to name, export, and share your completed edit.", link: "", btnLabel: "Open" },
  ],
  formTitle: "Submit Your Edit",
  formSubtext: "Fill in your details and share a link to your completed work.",
  formDisclaimer: "Submitting your work adds you to our internal network. We reach out when a project is a good fit.",
  formNotifyEmail: "",
  finalHeadline: "Ready to become part of the network?",
  finalSubtext: "Submit your edit and join the growing GrowitBuddy creator ecosystem.",
  finalCtaPrimary: "Submit Your Edit",
  finalCtaSecondary: "Watch Demo",
  seoTitle: "Video Editors Network - GrowitBuddy",
  seoDesc: "Join the GrowitBuddy editors network. Watch the demo, download resources, and submit your work to become part of our ecosystem.",
};

const FI = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay },
});

function VideoPlayer({ url }: { url: string }) {
  const [playing, setPlaying] = useState(false);
  const embed = (raw: string) => {
    const yt = raw.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
    if (yt) return `https://www.youtube.com/embed/${yt[1]}?autoplay=1&rel=0`;
    const loom = raw.match(/loom\.com\/share\/([^?]+)/);
    if (loom) return `https://www.loom.com/embed/${loom[1]}?autoplay=1`;
    const vimeo = raw.match(/vimeo\.com\/(\d+)/);
    if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1`;
    return raw;
  };
  return (
    <div style={{ width: "100%", aspectRatio: "16/9", borderRadius: 20, overflow: "hidden", background: "#0F172A", position: "relative", boxShadow: "0 32px 80px rgba(0,0,0,0.28)" }}>
      {!playing && (
        <div
          onClick={() => url && setPlaying(true)}
          style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: url ? "pointer" : "default" }}
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
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }} />
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
      const res = await fetch(`${API_BASE}/forms/contact`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...v, type: "talent-pool-submission", notifyEmail: d.formNotifyEmail }),
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
        {field("Portfolio Link",      "portfolio", "url",   "https://...")}
      </div>
      {field("Submission Link", "link", "url", "Google Drive / Dropbox / WeTransfer link to your edit")}
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
            {d.steps.map((step, i) => (
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
            {d.resources.map((r, i) => (
              <motion.div key={r.id} {...FI(i * 0.06)}
                style={{ background: "white", border: "1px solid #E5E5E0", borderRadius: 14, padding: "22px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0A0A0A", marginBottom: 4 }}>{r.title}</h3>
                  <p style={{ fontSize: 13, color: "#8A8A8A", lineHeight: 1.5 }}>{r.desc}</p>
                </div>
                {r.link ? (
                  <a href={r.link} target="_blank" rel="noopener noreferrer"
                    style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#1E293B", padding: "9px 16px", border: "1px solid #D4D4CE", borderRadius: 8, textDecoration: "none", whiteSpace: "nowrap" }}>
                    <ExternalLink size={13} /> {r.btnLabel || "Open"}
                  </a>
                ) : (
                  <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, color: "#C2A878", letterSpacing: "0.06em" }}>SOON</span>
                )}
              </motion.div>
            ))}
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
      <section className="csp-pad">
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 20px", textAlign: "center" }}>
          <motion.div {...FI()}>
            <h2 style={{ fontSize: "clamp(20px, 3.5vw, 46px)", fontWeight: 800, color: "#0A0A0A", letterSpacing: "-0.03em", marginBottom: 16 }}>
              {d.finalHeadline}
            </h2>
            <p style={{ fontSize: 16, color: "#5F5F5F", lineHeight: 1.65, marginBottom: 36 }}>{d.finalSubtext}</p>
            <div className="csp-btns">
              <a href="#submit" className="gb-btn" style={{ fontSize: 15, padding: "14px 28px" }}>
                {d.finalCtaPrimary} <ArrowRight size={14} style={{ marginLeft: 7, display: "inline" }} />
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
