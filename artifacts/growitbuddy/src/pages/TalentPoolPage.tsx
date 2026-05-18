import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ExternalLink, Play, CheckCircle, ChevronRight } from "lucide-react";
import SEOMeta from "@/components/SEOMeta";
import { usePublicContent } from "@/hooks/usePublicContent";
import EcosystemOptIn from "@/components/EcosystemOptIn";
import { API_BASE } from "@/lib/api";

const VARIANT_TO_CONTEXT: Record<string, string> = {
  designers:  "designer",
  thumbnail:  "thumbnail-designer",
  writers:    "writer",
  social:     "social-manager",
  motion:     "motion-designer",
  ai:         "ai-creator",
  ugc:        "ugc-creator",
};

export type FormVariant = "designers" | "thumbnail" | "writers" | "social" | "motion" | "ai" | "ugc";

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
    <div style={{ width: "100%", aspectRatio: "16/9", borderRadius: 16, overflow: "hidden", background: "#0F172A", position: "relative", boxShadow: "0 24px 64px rgba(0,0,0,0.22)" }}>
      {!playing && (
        <div
          onClick={() => url && setPlaying(true)}
          style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: url ? "pointer" : "default" }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: url ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.06)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 12px",
              boxShadow: url ? "0 8px 32px rgba(0,0,0,0.3)" : "none",
              transition: "transform 0.15s",
            }}>
              <Play size={28} color={url ? "#1E293B" : "#ffffff20"} fill={url ? "#1E293B" : "#ffffff20"} style={{ marginLeft: 5 }} />
            </div>
            {!url && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.18)", letterSpacing: "0.12em", textTransform: "uppercase" }}>Demo video coming soon</span>}
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
      const res = await fetch(`${API_BASE}/forms/contact`, {
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
      {inp("Behance / Dribbble", extra.portfolio ?? "", v => se("portfolio", v), "url", "https://behance.net/...")}
      {inp("Figma Portfolio", extra.figma ?? "", v => se("figma", v), "url", "https://figma.com/...", false)}
    </>),
    thumbnail: (<>
      {inp("Portfolio Link", extra.portfolio ?? "", v => se("portfolio", v), "url", "https://...")}
      {inp("Submission Link", extra.link ?? "", v => se("link", v), "url", "Google Drive / Dropbox with your thumbnail")}
    </>),
    writers: (<>
      {inp("Writing Niche / Topics", extra.niche ?? "", v => se("niche", v), "text", "e.g. Finance, Health, Creator Economy")}
      {inp("Writing Sample (Google Docs)", extra.sample ?? "", v => se("sample", v), "url", "https://docs.google.com/...")}
      {inp("LinkedIn Profile", extra.linkedin ?? "", v => se("linkedin", v), "url", "https://linkedin.com/in/...", false)}
    </>),
    social: (<>
      {inp("Platforms Managed", extra.platforms ?? "", v => se("platforms", v), "text", "e.g. Instagram, LinkedIn, TikTok")}
      {inp("Portfolio / Case Study Link", extra.portfolio ?? "", v => se("portfolio", v), "url", "https://...")}
    </>),
    motion: (<>
      {inp("Tools Used", extra.tools ?? "", v => se("tools", v), "text", "e.g. After Effects, Rive, Cavalry")}
      {inp("Reel / Demo Link", extra.reel ?? "", v => se("reel", v), "url", "https://...")}
    </>),
    ai: (<>
      {inp("AI Tools Used", extra.tools ?? "", v => se("tools", v), "text", "e.g. n8n, Make, OpenAI, Zapier")}
      {inp("Automation Example Link", extra.example ?? "", v => se("example", v), "url", "https://...")}
      {inp("Loom Walkthrough", extra.loom ?? "", v => se("loom", v), "url", "https://loom.com/share/...", false)}
    </>),
    ugc: (<>
      {inp("Instagram / TikTok Handle", extra.social ?? "", v => se("social", v), "text", "@yourhandle")}
      {inp("Content Sample Link", extra.sample ?? "", v => se("sample", v), "url", "Drive / Dropbox / Link")}
      {inp("Brand Types / Niches", extra.niche ?? "", v => se("niche", v), "text", "e.g. Skincare, Tech, Food", false)}
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
        .tp-pad     { padding: 88px 0; }
        .tp-steps   { display: grid; grid-template-columns: repeat(4,1fr); gap: 0; }
        .tp-cards   { display: grid; grid-template-columns: repeat(2,1fr); gap: 12px; }
        .tp-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .tp-btns    { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; }
        .tp-step-num { font-size: 40px; font-weight: 900; letter-spacing: -0.04em; color: #E5E5E0; line-height: 1; margin-bottom: 12px; font-family: 'Inter', sans-serif; }
        @media (max-width: 900px) {
          .tp-steps   { grid-template-columns: repeat(2,1fr); }
          .tp-cards   { grid-template-columns: 1fr; }
          .tp-pad     { padding: 64px 0; }
        }
        @media (max-width: 600px) {
          .tp-steps   { grid-template-columns: 1fr; }
          .tp-form-grid { grid-template-columns: 1fr; }
          .tp-wrap, .tp-wrap-md, .tp-wrap-sm { padding: 0 20px; }
          .tp-pad     { padding: 48px 0; }
          .tp-btns a  { width: 100%; max-width: 280px; justify-content: center; text-align: center; }
        }
      `}</style>

      {/* ─── 01 HERO ─────────────────────────────────────── */}
      <section style={{ paddingTop: 88, paddingBottom: 0, background: "#FFFFFF", borderBottom: "1px solid #E5E5E0" }}>
        <div className="tp-wrap-md">
          <motion.div {...FI()} style={{ textAlign: "center", paddingBottom: 52 }}>
            <span className="gb-eyebrow" style={{ marginBottom: 20, display: "block" }}>{d.eyebrow}</span>
            <h1 style={{ fontSize: "clamp(28px, 5vw, 62px)", fontWeight: 900, lineHeight: 1.08, letterSpacing: "-0.04em", color: "#0A0A0A", marginBottom: 18 }}>
              {d.headline}
            </h1>
            <p style={{ fontSize: 17, color: "#5F5F5F", lineHeight: 1.7, maxWidth: 500, margin: "0 auto 32px" }}>
              {d.description}
            </p>
            <div className="tp-btns">
              <a href="#submit" className="gb-btn" style={{ fontSize: 14, padding: "13px 26px", display: "inline-flex", alignItems: "center", gap: 7 }}>
                {d.ctaPrimary} <ArrowRight size={14} />
              </a>
              <a href="#resources" className="gb-btn-outline" style={{ fontSize: 14, padding: "13px 26px" }}>
                {d.ctaSecondary}
              </a>
            </div>
            {d.heroTrustText && (
              <p style={{ fontSize: 12, color: "#8A8A8A", marginTop: 16, lineHeight: 1.65 }}>
                {d.heroTrustText}
              </p>
            )}
          </motion.div>
        </div>

        {d.videoUrl && (
          <motion.div {...FI(0.08)} style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px 0" }}>
            <VideoPlayer url={d.videoUrl} />
          </motion.div>
        )}

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
          <motion.div {...FI()} style={{ marginBottom: 52, textAlign: "center" }}>
            <span className="gb-eyebrow" style={{ display: "block", marginBottom: 14 }}>Process</span>
            <h2 style={{ fontSize: "clamp(18px, 2.8vw, 40px)", fontWeight: 800, color: "#0A0A0A", letterSpacing: "-0.03em" }}>
              {d.stepsTitle}
            </h2>
          </motion.div>
          <div className="tp-steps">
            {d.steps.map((step, i) => (
              <motion.div key={i} {...FI(i * 0.08)}
                style={{ padding: "0 32px 0", borderLeft: i > 0 ? "1px solid #E5E5E0" : "none" }}>
                <div className="tp-step-num">{step.number}</div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#0A0A0A", marginBottom: 6 }}>{step.title}</p>
                <p style={{ fontSize: 13, color: "#8A8A8A", lineHeight: 1.65 }}>{step.desc}</p>
                {i < d.steps.length - 1 && (
                  <ChevronRight size={14} color="#D4D4CE" style={{ position: "absolute", right: -8, top: 12 }} />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 03 RESOURCES ────────────────────────────────── */}
      <section id="resources" className="tp-pad" style={{ background: "#FFFFFF", borderTop: "1px solid #E5E5E0" }}>
        <div className="tp-wrap-md">
          <motion.div {...FI()} style={{ marginBottom: 36 }}>
            <span className="gb-eyebrow" style={{ marginBottom: 14, display: "block" }}>Resources</span>
            <h2 style={{ fontSize: "clamp(18px, 2.8vw, 38px)", fontWeight: 800, color: "#0A0A0A", letterSpacing: "-0.03em", marginBottom: 10 }}>
              {d.resourcesTitle}
            </h2>
            <p style={{ fontSize: 15, color: "#5F5F5F" }}>{d.resourcesSubtext}</p>
          </motion.div>
          <div className="tp-cards">
            {d.resources.map((r, i) => (
              <motion.div key={r.id} {...FI(i * 0.06)}
                style={{ background: "var(--gb-bg)", border: "1px solid #E5E5E0", borderRadius: 12, padding: "20px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0A0A0A", marginBottom: 3 }}>{r.title}</h3>
                  <p style={{ fontSize: 12, color: "#8A8A8A", lineHeight: 1.55 }}>{r.desc}</p>
                </div>
                {r.link ? (
                  <a href={r.link} target="_blank" rel="noopener noreferrer"
                    style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: "#1E293B", padding: "8px 14px", border: "1px solid #D4D4CE", borderRadius: 8, textDecoration: "none", whiteSpace: "nowrap", background: "#FFFFFF" }}>
                    <ExternalLink size={12} /> {r.btnLabel || "Open"}
                  </a>
                ) : (
                  <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, color: "#C2A878", letterSpacing: "0.08em", textTransform: "uppercase" }}>Soon</span>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 04 SUBMISSION FORM ──────────────────────────── */}
      <section id="submit" className="tp-pad" style={{ borderTop: "1px solid #E5E5E0" }}>
        <div className="tp-wrap-sm">
          <motion.div {...FI()} style={{ marginBottom: 32 }}>
            <span className="gb-eyebrow" style={{ marginBottom: 14, display: "block" }}>Apply Now</span>
            <h2 style={{ fontSize: "clamp(18px, 2.8vw, 38px)", fontWeight: 800, color: "#0A0A0A", letterSpacing: "-0.03em", marginBottom: 10 }}>
              {d.formTitle}
            </h2>
            <p style={{ fontSize: 15, color: "#5F5F5F" }}>{d.formSubtext}</p>
          </motion.div>
          <motion.div {...FI(0.08)} style={{ background: "#FFFFFF", border: "1px solid #E5E5E0", borderRadius: 16, padding: "clamp(24px,5vw,40px)" }}>
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
      <section className="tp-pad" style={{ background: "#1E293B", borderTop: "1px solid #1E293B" }}>
        <div style={{ maxWidth: 540, margin: "0 auto", padding: "0 20px", textAlign: "center" }}>
          <motion.div {...FI()}>
            <span className="gb-eyebrow" style={{ display: "block", marginBottom: 16, color: "rgba(255,255,255,0.4)" }}>Ready to join?</span>
            <h2 style={{ fontSize: "clamp(20px, 3.5vw, 44px)", fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.04em", marginBottom: 14, lineHeight: 1.08 }}>
              {d.finalHeadline}
            </h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, marginBottom: 32 }}>{d.finalSubtext}</p>
            <a href="#submit" style={{
              display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 700,
              background: "rgba(255,255,255,0.1)", color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 8, padding: "13px 26px", textDecoration: "none", transition: "background 0.15s",
              fontFamily: "'Inter', sans-serif",
            }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
            >
              {d.finalCtaPrimary} <ArrowRight size={14} />
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
