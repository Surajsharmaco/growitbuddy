import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, Sparkles } from "lucide-react";

import { API_BASE } from "@/lib/api";
const STORAGE_KEY = "gb_ecosystem_opted_in";

interface ContextCopy {
  label: string;
  heading: string;
  subtext: string;
  tag: string;
}

const CONTEXT_COPY: Record<string, ContextCopy> = {
  freelancer: {
    label: "Ecosystem Updates",
    heading: "Stay Connected With The Creator Ecosystem",
    subtext: "Get editing workflows, creator opportunities, content systems, and future collaboration updates directly from GrowitBuddy.",
    tag: "freelancer",
  },
  "full-time": {
    label: "Ecosystem Updates",
    heading: "Get Authority & Growth Insights",
    subtext: "Receive creator systems, authority frameworks, AI workflows, and distribution insights from GrowitBuddy.",
    tag: "career",
  },
  internship: {
    label: "Ecosystem Updates",
    heading: "Stay Inside The Ecosystem",
    subtext: "Get creator opportunities, workflow updates, and insider access to the GrowitBuddy creator network.",
    tag: "intern",
  },
  contact: {
    label: "Growth Insights",
    heading: "Get Authority & Growth Insights",
    subtext: "Receive creator systems, authority frameworks, AI workflows, and distribution insights — sent when it matters.",
    tag: "service_lead",
  },
  creator: {
    label: "Creator Network Updates",
    heading: "Stay Connected With The Creator Network",
    subtext: "Get collaboration opportunities, creator insights, authority systems, and ecosystem updates from GrowitBuddy.",
    tag: "creator",
  },
  "page-owner": {
    label: "Distribution Updates",
    heading: "Get Distribution & Growth Insights",
    subtext: "Receive distribution network updates, page monetization strategies, and ecosystem opportunities from GrowitBuddy.",
    tag: "page_owner",
  },
  editor: {
    label: "Creator Updates",
    heading: "Stay Connected With The Creator Ecosystem",
    subtext: "Get editing workflows, creator opportunities, content systems, and future collaboration updates from GrowitBuddy.",
    tag: "video_editor",
  },
  designer: {
    label: "Design Network Updates",
    heading: "Stay Connected With The Design Network",
    subtext: "Receive design inspirations, creative workflows, brand systems, and future collaboration opportunities.",
    tag: "graphic_designer",
  },
  "thumbnail-designer": {
    label: "Creator Updates",
    heading: "Stay Connected With The Design Network",
    subtext: "Get thumbnail design trends, brand system insights, and creator collaboration opportunities from GrowitBuddy.",
    tag: "thumbnail_designer",
  },
  writer: {
    label: "Creator Updates",
    heading: "Stay Connected With The Content Network",
    subtext: "Get content systems, storytelling insights, and creator collaboration opportunities from GrowitBuddy.",
    tag: "writer",
  },
  "ai-creator": {
    label: "AI & Automation Updates",
    heading: "Stay Connected With AI & Automation Updates",
    subtext: "Get AI workflows, automation systems, creator tools, and future ecosystem opportunities.",
    tag: "ai_creator",
  },
  "ugc-creator": {
    label: "Creator Network Updates",
    heading: "Stay Connected With The UGC Creator Network",
    subtext: "Get UGC briefs, brand collaboration opportunities, creator frameworks, and ecosystem updates.",
    tag: "ugc_creator",
  },
  "motion-designer": {
    label: "Creator Updates",
    heading: "Stay Connected With The Motion Design Network",
    subtext: "Get motion design workflows, creative tools, and collaboration opportunities from GrowitBuddy.",
    tag: "motion_designer",
  },
  "social-manager": {
    label: "Ecosystem Updates",
    heading: "Get Social Media & Growth Insights",
    subtext: "Receive platform strategy updates, growth frameworks, and ecosystem opportunities from GrowitBuddy.",
    tag: "social_manager",
  },
  blog: {
    label: "Growth Insights",
    heading: "Get Weekly Growth Insights",
    subtext: "Founder positioning, creator systems, AI workflows, and authority-building insights — directly in your inbox.",
    tag: "blog_subscriber",
  },
};

const DEFAULT_COPY: ContextCopy = {
  label: "Ecosystem Updates",
  heading: "Get Weekly Growth Insights",
  subtext: "Founder positioning, creator systems, AI workflows, and authority-building insights — directly in your inbox.",
  tag: "subscriber",
};

interface EcosystemOptInProps {
  context: string;
  prefillEmail?: string;
  className?: string;
}

export default function EcosystemOptIn({ context, prefillEmail = "", className = "" }: EcosystemOptInProps) {
  const copy = CONTEXT_COPY[context] ?? DEFAULT_COPY;

  const [email, setEmail]         = useState(prefillEmail);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]           = useState(false);
  const [error, setError]         = useState("");
  const [alreadyDone, setAlreadyDone] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setAlreadyDone(true);
    } catch { /* localStorage not available */ }
  }, []);

  useEffect(() => {
    if (prefillEmail) setEmail(prefillEmail);
  }, [prefillEmail]);

  if (alreadyDone) return (
    <div
      style={{
        marginTop: 16,
        background: "rgba(30, 41, 59, 0.03)",
        border: "1.5px solid rgba(30, 41, 59, 0.12)",
        borderRadius: 16,
        padding: "20px 28px",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "rgba(30, 41, 59, 0.08)",
          border: "1.5px solid rgba(30, 41, 59, 0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Check size={14} color="var(--gb-authority)" />
      </div>
      <div>
        <p style={{ fontWeight: 700, fontSize: 13, color: "var(--gb-authority)", marginBottom: 2 }}>
          You're already subscribed.
        </p>
        <p style={{ fontSize: 12, color: "#5F5F5F", lineHeight: 1.5 }}>
          We'll send updates when they're worth your time.
        </p>
      </div>
    </div>
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/forms/newsletter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmed,
          source: context,
          tags: copy.tag,
        }),
      });
      if (res.ok) {
        setDone(true);
        try { localStorage.setItem(STORAGE_KEY, "1"); } catch { /* ignore */ }
      } else {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={className}
        style={{ marginTop: 16 }}
      >
        <div
          style={{
            background: "rgba(30, 41, 59, 0.03)",
            border: "1.5px solid rgba(30, 41, 59, 0.12)",
            borderRadius: 16,
            padding: "28px 32px",
          }}
        >
          {done ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ display: "flex", alignItems: "center", gap: 14 }}
            >
              <div
                style={{
                  width: 38, height: 38, borderRadius: "50%",
                  background: "rgba(30, 41, 59, 0.1)",
                  border: "1.5px solid rgba(30, 41, 59, 0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Check size={16} color="var(--gb-authority)" />
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 14, color: "var(--gb-authority)", letterSpacing: "-0.01em", marginBottom: 2 }}>
                  You're in.
                </p>
                <p style={{ fontSize: 13, color: "#5F5F5F", lineHeight: "1.6" }}>
                  We'll send updates when they're worth your time. No spam, ever.
                </p>
              </div>
            </motion.div>
          ) : (
            <>
              {/* Label */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <Sparkles size={11} color="var(--gb-gold)" />
                <span
                  style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
                    textTransform: "uppercase", color: "#8A8A8A",
                  }}
                >
                  {copy.label}
                </span>
              </div>

              {/* Heading */}
              <h4
                style={{
                  fontWeight: 800, fontSize: 17, letterSpacing: "-0.025em",
                  color: "var(--gb-authority)", marginBottom: 6, lineHeight: 1.3,
                }}
              >
                {copy.heading}
              </h4>

              {/* Subtext */}
              <p
                style={{
                  fontSize: 13, color: "#5F5F5F", lineHeight: "1.7",
                  marginBottom: 18, maxWidth: "48ch",
                }}
              >
                {copy.subtext}
              </p>

              {/* Form row */}
              <form onSubmit={handleSubmit}>
                <div
                  style={{
                    display: "flex", gap: 8, flexWrap: "wrap",
                  }}
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    placeholder="your@email.com"
                    style={{
                      flex: "1 1 200px",
                      border: error ? "1.5px solid #f87171" : "1.5px solid rgba(30, 41, 59, 0.18)",
                      borderRadius: 10,
                      padding: "11px 14px",
                      fontSize: 13,
                      color: "#0A0A0A",
                      background: "#FFFFFF",
                      outline: "none",
                      fontFamily: "Inter, sans-serif",
                      transition: "border-color 0.15s ease",
                    }}
                    onFocus={(e) => { if (!error) e.currentTarget.style.borderColor = "rgba(30,41,59,0.4)"; }}
                    onBlur={(e) => { if (!error) e.currentTarget.style.borderColor = "rgba(30,41,59,0.18)"; }}
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      background: submitting ? "rgba(139, 58, 26, 0.6)" : "var(--gb-accent)",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: 10,
                      padding: "11px 20px",
                      fontSize: 13, fontWeight: 700,
                      cursor: submitting ? "not-allowed" : "pointer",
                      whiteSpace: "nowrap",
                      fontFamily: "Inter, sans-serif",
                      transition: "background 0.15s ease",
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.background = "var(--gb-accent-hover)"; }}
                    onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.background = "var(--gb-accent)"; }}
                  >
                    {submitting ? "Joining..." : "Join Updates"}
                    {!submitting && <ArrowRight size={13} />}
                  </button>
                </div>
                {error && (
                  <p style={{ fontSize: 12, color: "#dc2626", marginTop: 6, fontWeight: 500 }}>
                    {error}
                  </p>
                )}
                <p style={{ fontSize: 11, color: "#8A8A8A", marginTop: 8 }}>
                  No spam. No pressure. Unsubscribe anytime.
                </p>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
