import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Play, CheckCircle, ArrowUpRight } from "lucide-react";
import { getSolidCardStyle, getSolidText, solidIsDark, CardGrain } from "@/components/WashCard";
import SEOMeta from "@/components/SEOMeta";
import { usePublicContent } from "@/hooks/usePublicContent";
import EcosystemOptIn from "@/components/EcosystemOptIn";
import { API_BASE, resolveMediaUrl } from "@/lib/api";
import { getEmbedUrl, getHiResThumbnail, getThumbnail, parseVideo, detectAspectRatio } from "@/lib/videoEmbed";

const VARIANT_TO_CONTEXT: Record<string, string> = {
  designers:  "designer",
  thumbnail:  "thumbnail-designer",
  writers:    "writer",
  social:     "social-manager",
  motion:     "motion-designer",
  ai:         "ai-creator",
  ugc:        "ugc-creator",
  editors:    "editor",
  meme:       "meme-designer",
};

export type FormVariant = "designers" | "thumbnail" | "writers" | "social" | "motion" | "ai" | "ugc" | "editors" | "meme";

export interface ResourceCard { id: string; title: string; desc: string; link: string; btnLabel: string; }
export interface Step { number: string; title: string; desc: string; }

export interface PoolPageData {
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
  seoTitle: string;
  seoDesc: string;
}

export interface PoolConfig {
  sectionKey: string;
  poolType: string;
  formVariant: FormVariant;
  defaults: PoolPageData;
}

const FI = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
});

function VideoPlayer({ url }: { url: string }) {
  const [playing, setPlaying] = useState(false);

  const parsed = url ? parseVideo(url) : { source: null, id: "" };
  const embedSrc = url ? getEmbedUrl(url, { autoplay: true }) : "";
  const thumbUrl = url ? getHiResThumbnail(url) : "";
  const ratio = url ? detectAspectRatio(url) : "16/9";
  const isVertical = ratio === "9/16";

  useEffect(() => {
    if (!url || !embedSrc) return;
    const t = setTimeout(() => setPlaying(true), 1500);
    return () => clearTimeout(t);
  }, [url, embedSrc]);

  const hasVideo = !!(url && embedSrc);

  return (
    <div style={{
      width: "100%",
      maxWidth: isVertical ? 380 : "100%",
      margin: "0 auto",
      aspectRatio: ratio,
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
          referrerPolicy="no-referrer"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: playing ? 0 : 1, transition: "opacity 0.6s ease" }}
          onError={(e) => {
            const el = e.currentTarget as HTMLImageElement;
            const fallback = getThumbnail(url);
            if (el.src !== fallback && fallback) {
              el.src = fallback;
            } else {
              el.style.display = "none";
            }
          }}
        />
      )}

      {!playing && (
        <div
          onClick={() => hasVideo && setPlaying(true)}
          style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: hasVideo ? "pointer" : "default", background: thumbUrl ? "rgba(10,10,10,0.3)" : "transparent", transition: "background 0.3s ease" }}
          className="group"
        >
          <div style={{ textAlign: "center", position: "relative" }}>
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
            }} className={hasVideo ? "group-hover:scale-110 group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]" : ""}>
              <Play size={30} color="#1E293B" fill="#1E293B" style={{ marginLeft: 5 }} />
            </div>
            {!url && <span style={{ fontSize: 11, fontWeight: 700, color: "#8A8A8A", letterSpacing: "0.18em", textTransform: "uppercase" }}>Demo Coming Soon</span>}
            {url && !embedSrc && <span style={{ fontSize: 11, fontWeight: 700, color: "#B4452F", letterSpacing: "0.12em", textTransform: "uppercase" }}>Unsupported URL</span>}
            {parsed.source === "drive" && !playing && (
              <span style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 8, letterSpacing: "0.06em" }}>
                Drive video — ensure "Anyone with link" access
              </span>
            )}
          </div>
        </div>
      )}

      {playing && embedSrc && (
        <iframe src={embedSrc} allow="autoplay; fullscreen" allowFullScreen
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none", zIndex: 1, backgroundColor: "#000" }} />
      )}
    </div>
  );
}

interface PoolFormProps { d: PoolPageData; formVariant: FormVariant; poolType: string; submitLabel: string; }

function PoolForm({ d, formVariant, poolType, submitLabel }: PoolFormProps) {
  const [base, setBase] = useState({ name: "", email: "", contact: "", notes: "" });
  const [extra, setExtra] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const successRef = useRef<HTMLDivElement>(null);

  const sb = (k: keyof typeof base, val: string) => setBase(p => ({ ...p, [k]: val }));
  const se = (k: string, val: string) => setExtra(p => ({ ...p, [k]: val }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const extraSummary = Object.entries(extra)
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n");
      const message = [base.notes, extraSummary].filter(Boolean).join("\n\n") || `Talent pool application for ${poolType}`;
      const res = await fetch(`${API_BASE}/forms/talent-pool`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...base, ...extra, message, type: `pool-${poolType}`, notifyEmail: d.formNotifyEmail }),
      });
      if (res.ok) {
        setSubmittedEmail(base.email);
        setStatus("sent");
        setTimeout(() => successRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
      } else {
        setStatus("error");
      }
    } catch { setStatus("error"); }
  }

  const successMessages: Record<string, string> = {
    designers:  "Design submission received — you're in the network.",
    thumbnail:  "Thumbnail submission received — we'll be in touch.",
    writers:    "Writing sample received — welcome to the network.",
    social:     "Profile received — you're part of the ecosystem.",
    motion:     "Reel received — welcome to the motion network.",
    ai:         "AI project received — we'll review and reach out.",
    ugc:        "Content received — you're part of the UGC network.",
    editors:    "Reel received — welcome to the video editor network.",
    meme:       "Memes received — you're part of the culture network.",
  };

  const inp = (label: string, val: string, onChange: (v: string) => void, type = "text", placeholder = "", required = true) => (
    <div className="tp-input-wrap">
      <label className="tp-label">{label}{!required && <span className="tp-label-opt"> (Optional)</span>}</label>
      <input type={type} value={val} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        required={required} className="gb-input tp-input" />
    </div>
  );

  const variantFields: Record<FormVariant, React.ReactNode> = {
    designers: (<>
      {inp("Behance / Dribbble", extra.portfolio ?? "", v => se("portfolio", v), "text", "https://behance.net/...")}
      {inp("Figma Portfolio", extra.figma ?? "", v => se("figma", v), "text", "https://figma.com/...", false)}
    </>),
    thumbnail: (<>
      {inp("Portfolio Link", extra.portfolio ?? "", v => se("portfolio", v), "text", "https://...")}
      {inp("Submission Link", extra.link ?? "", v => se("link", v), "text", "Google Drive / Dropbox with your thumbnail")}
    </>),
    writers: (<>
      {inp("Writing Niche / Topics", extra.niche ?? "", v => se("niche", v), "text", "e.g. Finance, Health, Creator Economy")}
      {inp("Writing Sample", extra.sample ?? "", v => se("sample", v), "text", "https://docs.google.com/...")}
      {inp("LinkedIn Profile", extra.linkedin ?? "", v => se("linkedin", v), "text", "https://linkedin.com/in/...", false)}
    </>),
    social: (<>
      {inp("Platforms Managed", extra.platforms ?? "", v => se("platforms", v), "text", "e.g. Instagram, LinkedIn, TikTok")}
      {inp("Portfolio / Case Study", extra.portfolio ?? "", v => se("portfolio", v), "text", "https://...")}
    </>),
    motion: (<>
      {inp("Tools Used", extra.tools ?? "", v => se("tools", v), "text", "e.g. After Effects, Rive, Cavalry")}
      {inp("Reel / Demo Link", extra.reel ?? "", v => se("reel", v), "text", "https://...")}
    </>),
    ai: (<>
      {inp("AI Tools Used", extra.tools ?? "", v => se("tools", v), "text", "e.g. n8n, Make, OpenAI, Zapier")}
      {inp("Automation Example", extra.example ?? "", v => se("example", v), "text", "https://...")}
      {inp("Loom Walkthrough", extra.loom ?? "", v => se("loom", v), "text", "https://loom.com/share/...", false)}
    </>),
    ugc: (<>
      {inp("Instagram / TikTok Handle", extra.social ?? "", v => se("social", v), "text", "@yourhandle")}
      {inp("Content Sample Link", extra.sample ?? "", v => se("sample", v), "text", "Drive / Dropbox / Link")}
      {inp("Brand Types / Niches", extra.niche ?? "", v => se("niche", v), "text", "e.g. Skincare, Tech, Food", false)}
    </>),
    editors: (<>
      {inp("Editing Software", extra.tools ?? "", v => se("tools", v), "text", "e.g. Premiere Pro, DaVinci, Final Cut")}
      {inp("Reel / Showreel Link", extra.reel ?? "", v => se("reel", v), "text", "https://...")}
      {inp("Sample Edit", extra.sample ?? "", v => se("sample", v), "text", "Drive / YouTube / Frame.io link", false)}
    </>),
    meme: (<>
      {inp("Instagram / X Handle", extra.social ?? "", v => se("social", v), "text", "@yourhandle")}
      {inp("Meme Portfolio Link", extra.portfolio ?? "", v => se("portfolio", v), "text", "Drive / page / IG profile")}
      {inp("Niches You Cover", extra.niche ?? "", v => se("niche", v), "text", "e.g. Finance, Pop culture", false)}
    </>),
  };

  if (status === "sent") return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} ref={successRef}>
      <div style={{ textAlign: "center", padding: "48px 24px 40px", background: "#FFFFFF", borderRadius: 16, border: "1px solid #E5E5E0" }}>
        <div style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(30,41,59,0.06)", border: "1px solid rgba(30,41,59,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <CheckCircle size={26} color="#1E293B" />
        </div>
        <h3 style={{ fontSize: 22, fontWeight: 800, color: "#0A0A0A", marginBottom: 10, letterSpacing: "-0.02em" }}>
          {successMessages[formVariant] ?? "Submission received — thank you."}
        </h3>
        <p style={{ fontSize: 15, color: "#5F5F5F", maxWidth: 420, margin: "0 auto", lineHeight: 1.65 }}>
          You're now part of the GrowitBuddy creator ecosystem. We'll reach out when new opportunities align with your craft.
        </p>
      </div>
      <div style={{ marginTop: 20 }}>
        <EcosystemOptIn
          context={VARIANT_TO_CONTEXT[formVariant] ?? "freelancer"}
          prefillEmail={submittedEmail}
        />
      </div>
    </motion.div>
  );

  return (
    <div ref={successRef} className="tp-form-container">
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div className="tp-form-grid">
          {inp("Full Name", base.name, v => sb("name", v), "text", "Your full name")}
          {inp("Email Address", base.email, v => sb("email", v), "email", "you@example.com")}
          {inp("Contact (WhatsApp / Telegram)", base.contact, v => sb("contact", v), "text", "@handle or number")}
          {variantFields[formVariant]}
        </div>
        <div className="tp-input-wrap">
          <label className="tp-label">Additional Notes <span className="tp-label-opt">(Optional)</span></label>
          <textarea value={base.notes} onChange={e => sb("notes", e.target.value)}
            placeholder="Anything specific you'd like us to know about your work or availability..." rows={4}
            className="gb-input tp-input" style={{ resize: "vertical" }} />
        </div>
        <div style={{ marginTop: 8, borderTop: "1px solid #E5E5E0", paddingTop: 24, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 18 }}>
          <p style={{ fontSize: 13, color: "#8A8A8A", maxWidth: 380, lineHeight: 1.6 }}>
            Your details are kept private and only used to match you with relevant creative opportunities.
          </p>
          <button type="submit" disabled={status === "sending"} className="gb-btn tp-submit-btn">
            {status === "sending" ? "Submitting Application…" : submitLabel}
            {status !== "sending" && <ArrowRight size={16} />}
          </button>
        </div>
        {status === "error" && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontSize: 14, color: "#D93025", padding: "12px 16px", background: "rgba(217,48,37,0.08)", borderRadius: 8, marginTop: 8 }}>
            Something went wrong. Please check your connection and try again.
          </motion.p>
        )}
      </form>
    </div>
  );
}

export default function TalentPoolPage({ config }: { config: PoolConfig }) {
  const d = usePublicContent<PoolPageData>(config.sectionKey, config.defaults);

  return (
    <div style={{ background: "#F8F8F6", minHeight: "100vh" }}>
      <SEOMeta title={d.seoTitle} description={d.seoDesc} robots="noindex,follow" />

      <style>{`
        .tp-page-wrapper {
          --tp-bg: #F8F8F6;
          --tp-card-bg: #FFFFFF;
          --tp-text: #0A0A0A;
          --tp-text-muted: #5F5F5F;
          --tp-border: #E5E5E0;
          font-family: 'Inter', sans-serif;
        }

        .tp-container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }
        .tp-container-sm { max-width: 820px; margin: 0 auto; padding: 0 24px; }
        .tp-container-xs { max-width: 660px; margin: 0 auto; padding: 0 24px; }

        /* Typography — site editorial scale */
        .tp-eyebrow {
          display: block;
          font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--gb-gold);
          margin-bottom: 18px;
        }

        .tp-hero-h1 {
          font-size: clamp(32px, 5vw, 60px);
          font-weight: 800; line-height: 1.08; letter-spacing: -0.04em;
          color: var(--tp-text); margin-bottom: 20px;
          text-wrap: balance;
        }

        .tp-hero-lead {
          font-size: clamp(16px, 2vw, 19px); color: var(--tp-text-muted); line-height: 1.7;
          max-width: 600px; margin: 0 auto 36px;
          text-wrap: pretty;
        }

        .tp-section-label {
          display: block; margin-bottom: 12px;
          font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase;
          color: #8A8A8A;
        }

        .tp-section-h2 {
          font-size: clamp(24px, 3vw, 40px);
          font-weight: 800; color: var(--tp-text);
          letter-spacing: -0.03em; line-height: 1.15;
          margin-bottom: 14px;
        }

        /* Sections */
        .tp-hero-section {
          padding: 116px 0 72px;
          position: relative;
          background: #FFFFFF;
          border-bottom: 1px solid var(--tp-border);
          overflow: hidden;
        }

        .tp-hero-glow {
          position: absolute; top: -20%; left: 50%; transform: translateX(-50%);
          width: 70vw; height: 520px; pointer-events: none;
          background: radial-gradient(ellipse at center, rgba(30,41,59,0.04) 0%, rgba(30,41,59,0) 60%);
          z-index: 0;
        }

        /* Steps */
        .tp-steps-grid {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;
          margin-top: 44px;
        }
        .tp-step-card {
          background: var(--tp-card-bg);
          border: 1px solid var(--tp-border);
          border-radius: 14px;
          padding: 26px 24px;
          position: relative;
          transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
          box-shadow: 0 1px 2px rgba(0,0,0,0.02);
        }
        .tp-step-card:hover {
          transform: translateY(-4px);
          border-color: #C8C8C0;
          box-shadow: 0 12px 28px rgba(0,0,0,0.06);
        }
        .tp-step-num {
          font-family: 'Menlo', 'Space Mono', monospace;
          font-size: 12px; font-weight: 700; color: var(--gb-authority);
          letter-spacing: 0.1em;
          display: flex; align-items: center; gap: 12px;
          margin-bottom: 20px;
        }
        .tp-step-num::after {
          content: ""; flex: 1; height: 1px; background: var(--tp-border);
        }

        /* Resources */
        .tp-res-grid {
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;
          margin-top: 40px;
        }
        .tp-res-card {
          background: var(--tp-card-bg);
          border: 1px solid var(--tp-border);
          border-radius: 14px;
          padding: 24px;
          display: flex; align-items: flex-start; justify-content: space-between; gap: 20px;
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
          box-shadow: 0 1px 2px rgba(0,0,0,0.02);
        }
        .tp-res-card:hover {
          transform: translateY(-3px);
          border-color: #C8C8C0;
          box-shadow: 0 12px 28px rgba(0,0,0,0.06);
        }
        .tp-res-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 9px 16px; border-radius: 8px;
          font-size: 13px; font-weight: 600;
          background: var(--tp-bg); color: var(--tp-text);
          border: 1px solid var(--tp-border);
          text-decoration: none; transition: all 0.2s ease;
          white-space: nowrap; flex-shrink: 0;
        }
        .tp-res-card:hover .tp-res-btn {
          background: var(--gb-accent); color: #fff; border-color: var(--gb-accent);
        }
        .tp-step-card.is-dark .tp-step-num { color: #D9C28E; }
        .tp-step-card.is-dark .tp-step-num::after { background: rgba(255,255,255,0.16); }
        .tp-res-card.is-dark .tp-res-btn { background: rgba(255,255,255,0.08); color: #fff; border-color: rgba(255,255,255,0.20); }
        .tp-res-card.is-dark:hover .tp-res-btn { background: var(--gb-accent); color: #fff; border-color: var(--gb-accent); }

        /* Form */
        .tp-form-wrapper {
          background: var(--tp-card-bg);
          border: 1px solid var(--tp-border);
          border-radius: 16px;
          padding: clamp(28px, 5vw, 48px);
          box-shadow: 0 8px 30px rgba(0,0,0,0.04);
          position: relative;
        }
        .tp-form-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 20px;
        }
        .tp-input-wrap {
          display: flex; flex-direction: column; gap: 8px;
        }
        .tp-label {
          font-size: 12px; font-weight: 700; color: #4A4A4A;
          letter-spacing: 0.06em; text-transform: uppercase;
        }
        .tp-label-opt {
          font-weight: 400; color: #8A8A8A; text-transform: none; letter-spacing: 0;
        }
        .tp-input {
          background: #FDFDFB !important;
          border: 1.5px solid #E5E5E0 !important;
          padding: 13px 16px !important;
          font-size: 15px !important;
          border-radius: 8px !important;
          transition: all 0.2s ease !important;
        }
        .tp-input:focus {
          background: #FFFFFF !important;
          border-color: var(--gb-accent) !important;
          box-shadow: 0 0 0 3px rgba(30,41,59,0.08) !important;
        }
        .tp-submit-btn {
          font-size: 15px !important; padding: 14px 30px !important; border-radius: 100px !important;
        }

        @media (max-width: 960px) {
          .tp-steps-grid { grid-template-columns: repeat(2, 1fr); }
          .tp-res-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .tp-hero-section { padding: 96px 0 56px; }
        }
        @media (max-width: 600px) {
          .tp-steps-grid { grid-template-columns: 1fr; }
          .tp-form-grid { grid-template-columns: 1fr; }
          .tp-res-card { flex-direction: column; gap: 16px; }
          .tp-res-btn { width: 100%; justify-content: center; }
          .tp-submit-btn { width: 100%; justify-content: center; }
        }
      `}</style>

      <div className="tp-page-wrapper">
        {/* ─── 01 HERO ─────────────────────────────────────── */}
        <section className="tp-hero-section">
          <div className="tp-hero-glow" />
          <div className="tp-container" style={{ position: "relative", zIndex: 10 }}>
            <div style={{ textAlign: "center", maxWidth: 820, margin: "0 auto" }}>
              <motion.div {...FI(0.1)}>
                <span className="tp-eyebrow">{d.eyebrow}</span>
              </motion.div>
              <motion.h1 {...FI(0.2)} className="tp-hero-h1">{d.headline}</motion.h1>
              <motion.p {...FI(0.3)} className="tp-hero-lead">{d.description}</motion.p>

              <motion.div {...FI(0.4)} style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", marginBottom: 48 }}>
                <a href="#submit" className="gb-btn">
                  {d.ctaPrimary} <ArrowRight size={16} />
                </a>
                <a href="#resources" className="gb-btn-outline" style={{ background: "#FFFFFF" }}>
                  {d.ctaSecondary}
                </a>
              </motion.div>
            </div>

            <motion.div {...FI(0.5)} style={{ maxWidth: 900, margin: "0 auto" }}>
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
          <div className="tp-container">
            <motion.div {...FI()} style={{ maxWidth: 600 }}>
              <span className="tp-section-label">The Process</span>
              <h2 className="tp-section-h2">{d.stepsTitle}</h2>
              {d.opportunityText && (
                <p style={{ fontSize: 17, color: "var(--tp-text-muted)", lineHeight: 1.6, marginTop: 14 }}>
                  {d.opportunityText}
                </p>
              )}
            </motion.div>

            <div className="tp-steps-grid">
              {(d.steps || []).map((step, i) => {
                const dark = solidIsDark(i);
                const P = getSolidText(dark);
                return (
                <motion.div key={i} {...FI(0.1 + i * 0.08)} className={`tp-step-card${dark ? " is-dark" : ""}`} style={getSolidCardStyle(dark, { borderRadius: 14 })}>
                  {!dark && <CardGrain />}
                  <div className="tp-step-num" style={{ position: "relative" }}>{step.number}</div>
                  <h3 style={{ position: "relative", fontSize: 17, fontWeight: 800, color: P.title, marginBottom: 10, letterSpacing: "-0.01em" }}>
                    {step.title}
                  </h3>
                  <p style={{ position: "relative", fontSize: 14, color: P.body, lineHeight: 1.6 }}>
                    {step.desc}
                  </p>
                </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─── 03 RESOURCES ────────────────────────────────── */}
        <section id="resources" style={{ padding: "80px 0", background: "var(--tp-bg)", borderTop: "1px solid var(--tp-border)" }}>
          <div className="tp-container-sm">
            <motion.div {...FI()} style={{ textAlign: "center", marginBottom: 12 }}>
              <span className="tp-section-label">Toolkit</span>
              <h2 className="tp-section-h2">{d.resourcesTitle}</h2>
              <p style={{ fontSize: 17, color: "var(--tp-text-muted)", lineHeight: 1.6, maxWidth: 560, margin: "14px auto 0" }}>
                {d.resourcesSubtext}
              </p>
            </motion.div>

            <div className="tp-res-grid">
              {(d.resources || []).map((r, i) => {
                const fallback = config.defaults.resources.find((dr) => dr.id === r.id);
                const link = resolveMediaUrl(r.link || fallback?.link || "");
                const btnLabel = r.btnLabel || fallback?.btnLabel || "Open";
                const dark = solidIsDark(i);
                const P = getSolidText(dark);
                return (
                  <motion.div key={r.id} {...FI(0.08 + i * 0.08)} className={`tp-res-card${dark ? " is-dark" : ""}`} style={getSolidCardStyle(dark, { borderRadius: 14 })}>
                    {!dark && <CardGrain />}
                    <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
                      <h3 style={{ fontSize: 16, fontWeight: 800, color: P.title, marginBottom: 6, letterSpacing: "-0.01em" }}>
                        {r.title}
                      </h3>
                      <p style={{ fontSize: 14, color: P.body, lineHeight: 1.6 }}>
                        {r.desc}
                      </p>
                    </div>
                    {link ? (
                      <a href={link} target="_blank" rel="noopener noreferrer" className="tp-res-btn" style={{ position: "relative" }}>
                        {btnLabel} <ArrowUpRight size={15} style={{ opacity: 0.6 }} />
                      </a>
                    ) : (
                      <span style={{ position: "relative", padding: "7px 14px", background: dark ? "rgba(255,255,255,0.10)" : "rgba(30,41,59,0.06)", color: dark ? "#D9C28E" : "var(--gb-authority)", borderRadius: 8, fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
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
          <div className="tp-container-xs">
            <motion.div {...FI()} style={{ textAlign: "center", marginBottom: 36 }}>
              <h2 className="tp-section-h2">{d.formTitle}</h2>
              <p style={{ fontSize: 17, color: "var(--tp-text-muted)", lineHeight: 1.6 }}>
                {d.formSubtext}
              </p>
            </motion.div>

            <motion.div {...FI(0.15)} className="tp-form-wrapper">
              <PoolForm d={d} formVariant={config.formVariant} poolType={config.poolType} submitLabel={d.ctaPrimary} />
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

          <div className="tp-container-sm" style={{ position: "relative", textAlign: "center" }}>
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
