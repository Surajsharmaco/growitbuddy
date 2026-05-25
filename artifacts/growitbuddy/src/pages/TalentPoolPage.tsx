import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ExternalLink, Play, CheckCircle } from "lucide-react";
import SEOMeta from "@/components/SEOMeta";
import { usePublicContent } from "@/hooks/usePublicContent";
import EcosystemOptIn from "@/components/EcosystemOptIn";
import { API_BASE } from "@/lib/api";
import { getEmbedUrl, getHiResThumbnail, getThumbnail, parseVideo } from "@/lib/videoEmbed";

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
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay },
});

function VideoPlayer({ url }: { url: string }) {
  const [playing, setPlaying] = useState(false);

  // Use the shared, robust video parser (handles YouTube, Vimeo, Drive incl. open?id= format)
  const parsed = url ? parseVideo(url) : { source: null, id: "" };
  const baseEmbed = url ? getEmbedUrl(url) : "";
  // Add autoplay where the provider supports it. Drive ignores ?autoplay so we add it harmlessly.
  const embedSrc = baseEmbed
    ? baseEmbed + (baseEmbed.includes("?") ? "&autoplay=1" : "?autoplay=1")
    : "";
  const thumbUrl = url ? getHiResThumbnail(url) : "";

  // Auto-start after 1.5s — but only for providers that support autoplay via URL.
  // Drive ignores it, so we still let the user click play inside Drive's own iframe.
  useEffect(() => {
    if (!url || !embedSrc) return;
    const t = setTimeout(() => setPlaying(true), 1500);
    return () => clearTimeout(t);
  }, [url, embedSrc]);

  return (
    <div style={{ width: "100%", aspectRatio: "16/9", borderRadius: 16, overflow: "hidden", position: "relative", boxShadow: "0 24px 64px rgba(0,0,0,0.22)", background: "#0F172A" }}>
      {/* Thumbnail — always visible until iframe loads */}
      {thumbUrl && (
        <img
          src={thumbUrl}
          alt="Video thumbnail"
          referrerPolicy="no-referrer"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: playing ? 0 : 1, transition: "opacity 0.4s" }}
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

      {/* Play button overlay — shown before autoplay kicks in */}
      {!playing && (
        <div
          onClick={() => url && embedSrc && setPlaying(true)}
          style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: url && embedSrc ? "pointer" : "default", background: thumbUrl ? "rgba(0,0,0,0.25)" : "transparent" }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: url && embedSrc ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.06)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 12px",
              boxShadow: url && embedSrc ? "0 8px 32px rgba(0,0,0,0.3)" : "none",
              transition: "transform 0.15s",
            }}>
              <Play size={28} color={url && embedSrc ? "#1E293B" : "#ffffff20"} fill={url && embedSrc ? "#1E293B" : "#ffffff20"} style={{ marginLeft: 5 }} />
            </div>
            {!url && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.18)", letterSpacing: "0.12em", textTransform: "uppercase" }}>Demo video coming soon</span>}
            {url && !embedSrc && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em", textTransform: "uppercase" }}>Unsupported video URL</span>}
            {parsed.source === "drive" && !playing && (
              <span style={{ display: "block", fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 6, letterSpacing: "0.06em" }}>
                Drive video — make sure it's shared "Anyone with link"
              </span>
            )}
          </div>
        </div>
      )}

      {/* Iframe — shown once playing */}
      {playing && embedSrc && (
        <iframe src={embedSrc} allow="autoplay; fullscreen" allowFullScreen
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none", zIndex: 1 }} />
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
    <div>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#8A8A8A", marginBottom: 7, textTransform: "uppercase" }}>{label}</label>
      <input type={type} value={val} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        required={required} className="gb-input" style={{ width: "100%" }} />
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
      {inp("Writing Sample (Google Docs)", extra.sample ?? "", v => se("sample", v), "text", "https://docs.google.com/...")}
      {inp("LinkedIn Profile", extra.linkedin ?? "", v => se("linkedin", v), "text", "https://linkedin.com/in/...", false)}
    </>),
    social: (<>
      {inp("Platforms Managed", extra.platforms ?? "", v => se("platforms", v), "text", "e.g. Instagram, LinkedIn, TikTok")}
      {inp("Portfolio / Case Study Link", extra.portfolio ?? "", v => se("portfolio", v), "text", "https://...")}
    </>),
    motion: (<>
      {inp("Tools Used", extra.tools ?? "", v => se("tools", v), "text", "e.g. After Effects, Rive, Cavalry")}
      {inp("Reel / Demo Link", extra.reel ?? "", v => se("reel", v), "text", "https://...")}
    </>),
    ai: (<>
      {inp("AI Tools Used", extra.tools ?? "", v => se("tools", v), "text", "e.g. n8n, Make, OpenAI, Zapier")}
      {inp("Automation Example Link", extra.example ?? "", v => se("example", v), "text", "https://...")}
      {inp("Loom Walkthrough", extra.loom ?? "", v => se("loom", v), "text", "https://loom.com/share/...", false)}
    </>),
    ugc: (<>
      {inp("Instagram / TikTok Handle", extra.social ?? "", v => se("social", v), "text", "@yourhandle")}
      {inp("Content Sample Link", extra.sample ?? "", v => se("sample", v), "text", "Drive / Dropbox / Link")}
      {inp("Brand Types / Niches", extra.niche ?? "", v => se("niche", v), "text", "e.g. Skincare, Tech, Food", false)}
    </>),
    editors: (<>
      {inp("Editing Software", extra.tools ?? "", v => se("tools", v), "text", "e.g. Premiere Pro, DaVinci, Final Cut, CapCut")}
      {inp("Reel / Showreel Link", extra.reel ?? "", v => se("reel", v), "text", "https://...")}
      {inp("Sample Edit (Long-form or Shorts)", extra.sample ?? "", v => se("sample", v), "text", "Drive / YouTube / Frame.io link", false)}
    </>),
    meme: (<>
      {inp("Instagram / X Handle", extra.social ?? "", v => se("social", v), "text", "@yourhandle")}
      {inp("Meme Portfolio Link", extra.portfolio ?? "", v => se("portfolio", v), "text", "Drive / page / IG profile")}
      {inp("Niches You Cover", extra.niche ?? "", v => se("niche", v), "text", "e.g. Finance, Tech, Pop culture", false)}
    </>),
  };

  if (status === "sent") return (
    <div ref={successRef}>
      <div style={{ textAlign: "center", padding: "40px 24px 32px" }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(139,58,26,0.08)", border: "1.5px solid rgba(139,58,26,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <CheckCircle size={24} color="var(--gb-accent)" />
        </div>
        <p style={{ fontSize: 17, fontWeight: 800, color: "#0A0A0A", marginBottom: 8, letterSpacing: "-0.02em" }}>{successMessages[formVariant] ?? "Submission received — thank you."}</p>
        <p style={{ fontSize: 14, color: "#5F5F5F", maxWidth: 360, margin: "0 auto", lineHeight: 1.65 }}>
          You're now part of the GrowitBuddy creator ecosystem. We'll reach out when new opportunities come in.
        </p>
      </div>
      <EcosystemOptIn
        context={VARIANT_TO_CONTEXT[formVariant] ?? "freelancer"}
        prefillEmail={submittedEmail}
      />
    </div>
  );

  return (
    <div ref={successRef}>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div className="tp-form-grid">
          {inp("Full Name", base.name, v => sb("name", v), "text", "Your full name")}
          {inp("Email Address", base.email, v => sb("email", v), "email", "you@example.com")}
          {inp("WhatsApp / Telegram", base.contact, v => sb("contact", v), "text", "@handle or number")}
          {variantFields[formVariant]}
        </div>
        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#8A8A8A", marginBottom: 7, textTransform: "uppercase" }}>Notes <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span></label>
          <textarea value={base.notes} onChange={e => sb("notes", e.target.value)}
            placeholder="Anything you'd like us to know..." rows={3}
            className="gb-input" style={{ width: "100%", resize: "vertical" }} />
        </div>
        <button type="submit" disabled={status === "sending"} className="gb-btn" style={{ fontSize: 15, padding: "14px 32px", display: "inline-flex", alignItems: "center", gap: 8 }}>
          {status === "sending" ? "Submitting…" : submitLabel}
          {status !== "sending" && <ArrowRight size={15} />}
        </button>
        {status === "error" && <p style={{ fontSize: 13, color: "#dc2626" }}>Something went wrong. Please try again.</p>}
      </form>
    </div>
  );
}

export default function TalentPoolPage({ config }: { config: PoolConfig }) {
  const d = usePublicContent<PoolPageData>(config.sectionKey, config.defaults);

  return (
    <div style={{ background: "var(--gb-bg)", minHeight: "100vh" }}>
      <SEOMeta title={d.seoTitle} description={d.seoDesc} robots="noindex,follow" />

      <style>{`
        .tp-wrap    { max-width: 1080px; margin: 0 auto; padding: 0 32px; }
        .tp-wrap-md { max-width: 800px;  margin: 0 auto; padding: 0 32px; }
        .tp-wrap-sm { max-width: 640px;  margin: 0 auto; padding: 0 32px; }
        .tp-pad     { padding: 96px 0; }
        .tp-steps   { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; }
        .tp-cards   { display: grid; grid-template-columns: repeat(2,1fr); gap: 14px; }
        .tp-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .tp-btns    { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; }

        /* Hero eyebrow — gold pill with dot */
        .tp-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 7px 14px 7px 12px;
          border: 1px solid rgba(194,168,120,0.35);
          background: rgba(194,168,120,0.08);
          border-radius: 100px;
          font-size: 11px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase;
          color: #8B6F3D;
          margin-bottom: 22px;
        }
        .tp-eyebrow::before {
          content: ""; width: 6px; height: 6px; border-radius: 50%;
          background: #C2A878; box-shadow: 0 0 0 3px rgba(194,168,120,0.18);
        }

        /* Hero headline — balanced line breaks */
        .tp-h1 {
          font-size: clamp(30px, 4.6vw, 56px);
          font-weight: 900; line-height: 1.05; letter-spacing: -0.04em;
          color: #0A0A0A; margin-bottom: 22px;
          text-wrap: balance; -webkit-text-wrap: balance;
        }
        .tp-h1-accent { color: #8B6F3D; }
        .tp-lead {
          font-size: 18px; color: #4A4A4A; line-height: 1.65;
          max-width: 540px; margin: 0 auto 36px;
          text-wrap: pretty; -webkit-text-wrap: pretty;
        }

        /* Step cards */
        .tp-step {
          position: relative;
          background: #FFFFFF;
          border: 1px solid #EAEAE4;
          border-radius: 14px;
          padding: 24px 22px 22px;
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
        }
        .tp-step:hover {
          transform: translateY(-3px);
          box-shadow: 0 14px 36px rgba(10,10,10,0.06);
          border-color: rgba(194,168,120,0.45);
        }
        .tp-step-num {
          display: inline-flex; align-items: center; justify-content: center;
          width: 36px; height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #FAF6EE 0%, #F0E6CF 100%);
          color: #8B6F3D;
          font-size: 14px; font-weight: 800; letter-spacing: 0.02em;
          margin-bottom: 16px;
          font-family: 'Inter', sans-serif;
        }

        /* Resource cards */
        .tp-res {
          background: #FFFFFF;
          border: 1px solid #EAEAE4;
          border-radius: 14px;
          padding: 20px 22px;
          display: flex; align-items: center; justify-content: space-between; gap: 16px;
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .tp-res:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(10,10,10,0.05);
          border-color: rgba(194,168,120,0.4);
        }

        /* Section heading */
        .tp-h2 {
          font-size: clamp(24px, 3.4vw, 40px);
          font-weight: 800; color: #0A0A0A;
          letter-spacing: -0.035em; line-height: 1.12;
          text-wrap: balance; -webkit-text-wrap: balance;
        }
        .tp-section-eyebrow {
          display: inline-block;
          font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase;
          color: #8B6F3D; margin-bottom: 14px;
        }

        @media (max-width: 960px) {
          .tp-steps   { grid-template-columns: repeat(2,1fr); }
          .tp-cards   { grid-template-columns: 1fr; }
          .tp-pad     { padding: 72px 0; }
        }
        @media (max-width: 600px) {
          .tp-steps   { grid-template-columns: 1fr; }
          .tp-form-grid { grid-template-columns: 1fr; }
          .tp-wrap, .tp-wrap-md, .tp-wrap-sm { padding: 0 20px; }
          .tp-pad     { padding: 56px 0; }
          .tp-btns a  { width: 100%; max-width: 280px; justify-content: center; text-align: center; }
          .tp-lead    { font-size: 16px; }
        }
      `}</style>

      {/* ─── 01 HERO ─────────────────────────────────────── */}
      <section style={{ paddingTop: 96, paddingBottom: 0, background: "#FFFFFF", borderBottom: "1px solid #E5E5E0", position: "relative", overflow: "hidden" }}>
        {/* Soft gold radial glow */}
        <span aria-hidden style={{
          position: "absolute", top: -160, left: "50%", transform: "translateX(-50%)",
          width: 720, height: 320, pointerEvents: "none",
          background: "radial-gradient(ellipse at center, rgba(194,168,120,0.14) 0%, rgba(194,168,120,0) 65%)",
        }} />
        <div className="tp-wrap-md" style={{ position: "relative" }}>
          <motion.div {...FI()} style={{ textAlign: "center", paddingBottom: 56 }}>
            <span className="tp-eyebrow">{d.eyebrow}</span>
            <h1 className="tp-h1">{d.headline}</h1>
            <p className="tp-lead">{d.description}</p>
            <div className="tp-btns">
              <a href="#submit" className="gb-btn" style={{ fontSize: 14, padding: "14px 28px", display: "inline-flex", alignItems: "center", gap: 7 }}>
                {d.ctaPrimary} <ArrowRight size={14} />
              </a>
              <a href="#resources" className="gb-btn-outline" style={{ fontSize: 14, padding: "14px 28px" }}>
                {d.ctaSecondary}
              </a>
            </div>
            {d.heroTrustText && (
              <p style={{ fontSize: 12.5, color: "#7A7A7A", marginTop: 22, lineHeight: 1.7, maxWidth: 480, margin: "22px auto 0" }}>
                {d.heroTrustText}
              </p>
            )}
          </motion.div>
        </div>

        <motion.div {...FI(0.08)} style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px 0" }}>
          <VideoPlayer url={d.videoUrl} />
        </motion.div>

        {d.opportunityText && (
          <div className="tp-wrap-md">
            <motion.p {...FI(0.12)} style={{ fontSize: 13, color: "#8A8A8A", textAlign: "center", padding: "28px 0 0", lineHeight: 1.7, maxWidth: 460, margin: "0 auto" }}>
              {d.opportunityText}
            </motion.p>
          </div>
        )}
        <div style={{ height: 52 }} />
      </section>

      {/* ─── 02 HOW IT WORKS ─────────────────────────────── */}
      <section style={{ borderTop: "1px solid #E5E5E0" }} className="tp-pad">
        <div className="tp-wrap">
          <motion.div {...FI()} style={{ marginBottom: 56, textAlign: "center" }}>
            <span className="tp-section-eyebrow">Process</span>
            <h2 className="tp-h2">{d.stepsTitle}</h2>
          </motion.div>
          <div className="tp-steps">
            {(d.steps || []).map((step, i) => (
              <motion.div key={i} {...FI(i * 0.08)} className="tp-step">
                <div className="tp-step-num">{step.number}</div>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#0A0A0A", marginBottom: 8, letterSpacing: "-0.01em" }}>{step.title}</p>
                <p style={{ fontSize: 13.5, color: "#6B6B6B", lineHeight: 1.6 }}>{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 03 RESOURCES ────────────────────────────────── */}
      <section id="resources" className="tp-pad" style={{ background: "#FFFFFF", borderTop: "1px solid #E5E5E0" }}>
        <div className="tp-wrap-md">
          <motion.div {...FI()} style={{ marginBottom: 40 }}>
            <span className="tp-section-eyebrow">Resources</span>
            <h2 className="tp-h2" style={{ marginBottom: 12 }}>{d.resourcesTitle}</h2>
            <p style={{ fontSize: 16, color: "#5F5F5F", lineHeight: 1.65, maxWidth: 600 }}>{d.resourcesSubtext}</p>
          </motion.div>
          <div className="tp-cards">
            {(d.resources || []).map((r, i) => {
              // Fallback: if saved link is empty, use default Drive link from pool config
              const fallback = config.defaults.resources.find((dr) => dr.id === r.id);
              const link = r.link || fallback?.link || "";
              const btnLabel = r.btnLabel || fallback?.btnLabel || "Open";
              return (
                <motion.div key={r.id} {...FI(i * 0.06)} className="tp-res">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: 14.5, fontWeight: 700, color: "#0A0A0A", marginBottom: 4, letterSpacing: "-0.01em" }}>{r.title}</h3>
                    <p style={{ fontSize: 12.5, color: "#7A7A7A", lineHeight: 1.55 }}>{r.desc}</p>
                  </div>
                  {link ? (
                    <a href={link} target="_blank" rel="noopener noreferrer"
                      style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: "#1E293B", padding: "9px 14px", border: "1px solid #D4D4CE", borderRadius: 8, textDecoration: "none", whiteSpace: "nowrap", background: "#FFFFFF", transition: "all 0.15s" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#1E293B"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "#1E293B"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "#FFFFFF"; e.currentTarget.style.color = "#1E293B"; e.currentTarget.style.borderColor = "#D4D4CE"; }}>
                      <ExternalLink size={12} /> {btnLabel}
                    </a>
                  ) : (
                    <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, color: "#C2A878", letterSpacing: "0.08em", textTransform: "uppercase" }}>Soon</span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── 04 SUBMISSION FORM ──────────────────────────── */}
      <section id="submit" className="tp-pad" style={{ borderTop: "1px solid #E5E5E0" }}>
        <div className="tp-wrap-sm">
          <motion.div {...FI()} style={{ marginBottom: 36, textAlign: "center" }}>
            <span className="tp-section-eyebrow">Apply Now</span>
            <h2 className="tp-h2" style={{ marginBottom: 12 }}>{d.formTitle}</h2>
            <p style={{ fontSize: 16, color: "#5F5F5F", lineHeight: 1.65, maxWidth: 520, margin: "0 auto" }}>{d.formSubtext}</p>
          </motion.div>
          <motion.div {...FI(0.08)} style={{ background: "#FFFFFF", border: "1px solid #EAEAE4", borderRadius: 18, padding: "clamp(28px,5vw,44px)", boxShadow: "0 14px 40px rgba(10,10,10,0.04)" }}>
            <PoolForm d={d} formVariant={config.formVariant} poolType={config.poolType} submitLabel={d.ctaPrimary} />
          </motion.div>
          {d.formDisclaimer && (
            <motion.p {...FI(0.14)} style={{ fontSize: 12, color: "#8A8A8A", textAlign: "center", marginTop: 18, lineHeight: 1.65 }}>
              {d.formDisclaimer}
            </motion.p>
          )}
          <motion.p {...FI(0.18)} style={{ fontSize: 12, color: "#8A8A8A", textAlign: "center", marginTop: 10, lineHeight: 1.65 }}>
            Questions?{" "}
            <a href="mailto:careers.growitbuddy@gmail.com" style={{ color: "#1E293B", fontWeight: 600, textDecoration: "none" }}>
              careers.growitbuddy@gmail.com
            </a>
          </motion.p>
        </div>
      </section>

      {/* ─── 05 FINAL CTA ────────────────────────────────── */}
      <section className="tp-pad" style={{ background: "#1E293B", borderTop: "1px solid #1E293B", position: "relative", overflow: "hidden" }}>
        {/* decorative dotted grid (palette-safe) */}
        <span aria-hidden style={{
          position: "absolute", top: 24, left: 24, width: 120, height: 120, opacity: 0.18,
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "10px 10px",
          maskImage: "radial-gradient(circle at top left, black, transparent 70%)",
          WebkitMaskImage: "radial-gradient(circle at top left, black, transparent 70%)",
          pointerEvents: "none",
        }} />
        <span aria-hidden style={{
          position: "absolute", bottom: 24, right: 24, width: 120, height: 120, opacity: 0.18,
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "10px 10px",
          maskImage: "radial-gradient(circle at bottom right, black, transparent 70%)",
          WebkitMaskImage: "radial-gradient(circle at bottom right, black, transparent 70%)",
          pointerEvents: "none",
        }} />
        {/* gold accent line */}
        <span aria-hidden style={{
          position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
          width: 64, height: 3, background: "var(--gb-gold)", borderRadius: "0 0 6px 6px",
        }} />

        <div style={{ position: "relative", maxWidth: 560, margin: "0 auto", padding: "0 20px", textAlign: "center" }}>
          <motion.div {...FI()}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase",
              color: "var(--gb-gold)", marginBottom: 18,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--gb-gold)" }} />
              Ready to join
            </span>
            <h2 style={{ fontSize: "clamp(24px, 4vw, 46px)", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.04em", marginBottom: 14, lineHeight: 1.08 }}>
              {d.finalHeadline}
            </h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.65)", lineHeight: 1.7, marginBottom: 36, maxWidth: "44ch", margin: "0 auto 36px" }}>
              {d.finalSubtext}
            </p>
            <a href="#submit" className="gb-btn" style={{ background: "#FFFFFF", color: "#0A0A0A", border: "1px solid rgba(255,255,255,0.18)" }}>
              {d.finalCtaPrimary} <ArrowRight size={16} />
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
