import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, ShieldX, Search, AlertCircle, ArrowRight } from "lucide-react";
import SEOMeta from "@/components/SEOMeta";
import { API_BASE } from "@/lib/api";

interface CertResult {
  certificateId: string;
  name: string;
  role: string;
  issueDate: string;
  status: "verified" | "revoked";
  remark?: string | null;
}

function ResultCard({ cert }: { cert: CertResult }) {
  const isVerified = cert.status === "verified";
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      style={{
        borderRadius: 20,
        overflow: "hidden",
        border: isVerified ? "1.5px solid rgba(16,185,129,0.25)" : "1.5px solid rgba(248,113,113,0.25)",
        background: "#FFFFFF",
        boxShadow: "0 18px 44px -22px rgba(20,32,46,0.22), 0 4px 12px -6px rgba(20,32,46,0.08)",
      }}
    >
      <div
        className="verify-result-header"
        style={{
          background: isVerified ? "rgba(16,185,129,0.07)" : "rgba(248,113,113,0.07)",
          display: "flex",
          alignItems: "center",
          gap: 16,
          borderBottom: isVerified ? "1px solid rgba(16,185,129,0.12)" : "1px solid rgba(248,113,113,0.12)",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: isVerified ? "rgba(16,185,129,0.12)" : "rgba(248,113,113,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {isVerified ? (
            <ShieldCheck size={22} style={{ color: "#10b981" }} />
          ) : (
            <ShieldX size={22} style={{ color: "#f87171" }} />
          )}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p
            className="verify-header-eyebrow"
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: isVerified ? "#10b981" : "#f87171",
              marginBottom: 2,
            }}
          >
            {isVerified ? "Certificate Verified" : "Certificate Revoked"}
          </p>
          <p className="verify-header-sub" style={{ fontSize: 13, color: "#7A7A85", fontWeight: 500, lineHeight: 1.45 }}>
            {isVerified
              ? "This certificate is authentic and valid."
              : "This certificate has been revoked by GrowitBuddy."}
          </p>
        </div>
      </div>

      <div className="verify-result-body">
        {cert.remark && cert.remark.trim() && (
          <div style={{
            background: "linear-gradient(180deg, rgba(194,168,120,0.07) 0%, rgba(194,168,120,0.02) 100%)",
            border: "1px solid rgba(194,168,120,0.28)",
            borderRadius: 12,
            padding: "16px 18px",
            marginBottom: 6,
          }}>
            <p style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.18em",
              textTransform: "uppercase", color: "#8A7548", marginBottom: 8,
            }}>
              Remark from GrowitBuddy
            </p>
            <p style={{
              fontSize: 14, color: "#2A2A2A", lineHeight: 1.6,
              fontStyle: "italic", fontWeight: 500,
              overflowWrap: "break-word",
            }}>
              &ldquo;{cert.remark}&rdquo;
            </p>
          </div>
        )}
        <ul className="verify-result-list">
          {[
            { label: "Name", value: cert.name },
            { label: "Role / Program", value: cert.role },
            { label: "Issued By", value: "GrowitBuddy" },
            { label: "Issue Date", value: cert.issueDate },
            { label: "Certificate ID", value: cert.certificateId, mono: true },
          ].map(({ label, value, mono }, idx, arr) => (
            <li
              key={label}
              style={{
                display: "block",
                padding: "14px 0",
                borderBottom: idx < arr.length - 1 ? "1px solid #EFEFEA" : "none",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "#7A7A85",
                  marginBottom: 6,
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#0A0A0A",
                  fontFamily: mono ? "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" : undefined,
                  letterSpacing: mono ? "0.02em" : undefined,
                  lineHeight: 1.4,
                  wordBreak: mono ? "break-all" : "normal",
                  overflowWrap: "break-word",
                }}
              >
                {value}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

export default function Verify() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<CertResult | null | "not_found" | "error">(null);
  const [loading, setLoading] = useState(false);
  const [, navigate] = useLocation();

  async function handleVerify() {
    const id = input.trim().toUpperCase();
    if (!id) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${API_BASE}/admin/public/certificate/${encodeURIComponent(id)}`);
      if (res.status === 404) {
        setResult("not_found");
      } else if (!res.ok) {
        setResult("error");
      } else {
        const data: CertResult = await res.json();
        setResult(data);
      }
    } catch {
      setResult("error");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleVerify();
  }

  return (
    <div style={{ background: "#F8F8F6", fontFamily: "'Inter', sans-serif", minHeight: "100vh" }}>
      <style>{`
        .verify-search-btn { padding: 16px 24px; white-space: nowrap; }
        .verify-result-header { padding: 24px 32px; }
        .verify-result-body { padding: 12px 32px 20px; }
        .verify-result-list { list-style: none; margin: 0; padding: 0; }
        @media (max-width: 560px) {
          .verify-result-header { padding: 18px 18px; gap: 12px !important; }
          .verify-result-body { padding: 8px 18px 16px; }
          .verify-search-btn { padding: 14px 16px; }
          .verify-header-eyebrow { font-size: 11px !important; letter-spacing: 0.12em !important; }
          .verify-header-sub { font-size: 12.5px !important; }
        }
      `}</style>
      <SEOMeta
        title="Verify Certificate | GrowitBuddy"
        description="Verify the authenticity of certificates issued by GrowitBuddy."
      />

      <section
        style={{
          paddingTop: 120,
          paddingBottom: 80,
          paddingLeft: 24,
          paddingRight: 24,
          background: "#FFFFFF",
          borderBottom: "1px solid #E5E5E0",
        }}
      >
        <div className="max-w-[640px] mx-auto text-center">
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase",
            color: "var(--gb-gold)", marginBottom: 18,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--gb-gold)" }} />
            Certificate Verification
          </span>
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
            style={{
              fontWeight: 800,
              fontSize: "clamp(28px, 6vw, 64px)",
              letterSpacing: "-0.04em",
              lineHeight: 1.05,
              color: "#0A0A0A",
              marginBottom: 18,
            }}
          >
            Verify Credentials
          </motion.h1>
          <span aria-hidden style={{ display: "inline-block", width: 56, height: 3, background: "var(--gb-gold)", borderRadius: 2, marginBottom: 18 }} />
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.55 }}
            style={{
              fontSize: 17,
              color: "#7A7A85",
              lineHeight: "1.75",
              maxWidth: "42ch",
              margin: "0 auto",
            }}
          >
            Check the authenticity of certificates issued by GrowitBuddy.
          </motion.p>
        </div>
      </section>

      <section style={{ padding: "64px 24px" }}>
        <div className="max-w-[560px] mx-auto">
          <div style={{ marginBottom: 40 }}>
            <div
              style={{
                display: "flex",
                gap: 0,
                background: "#FFFFFF",
                borderRadius: 14,
                border: "1px solid rgba(20,32,46,0.14)",
                overflow: "hidden",
                boxShadow: "0 18px 44px -22px rgba(20,32,46,0.22), 0 4px 12px -6px rgba(20,32,46,0.08)",
              }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value.toUpperCase())}
                onKeyDown={handleKeyDown}
                placeholder="Enter Certificate ID (e.g. GB-2025-XXXXX)"
                style={{
                  flex: 1,
                  padding: "16px 20px",
                  fontSize: 15,
                  fontWeight: 500,
                  fontFamily: "'Inter', sans-serif",
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  color: "#0A0A0A",
                  letterSpacing: "0.02em",
                }}
              />
              <button
                onClick={handleVerify}
                disabled={loading || !input.trim()}
                className="verify-search-btn"
                style={{
                  background: "#EFEFEA",
                  color: "#0A0A0A",
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: "'Inter', sans-serif",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  opacity: loading || !input.trim() ? 0.5 : 1,
                  transition: "opacity 0.15s",
                }}
              >
                {loading ? (
                  "Checking..."
                ) : (
                  <>
                    <Search size={15} />
                    Verify
                  </>
                )}
              </button>
            </div>
            <p
              style={{
                marginTop: 10,
                fontSize: 12,
                color: "#7A7A85",
                textAlign: "center",
                fontWeight: 500,
              }}
            >
              Or scan the QR code on your certificate to verify automatically.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {result === "not_found" && (
              <motion.div
                key="not_found"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "20px 24px",
                  borderRadius: 14,
                  background: "#FFFFFF",
                  border: "1px solid rgba(20,32,46,0.14)",
                  boxShadow: "0 18px 44px -22px rgba(20,32,46,0.22), 0 4px 12px -6px rgba(20,32,46,0.08)",
                }}
              >
                <AlertCircle size={20} style={{ color: "#7A7A85", flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#0A0A0A", marginBottom: 2 }}>Certificate not found</p>
                  <p style={{ fontSize: 13, color: "#7A7A85" }}>
                    Please check the ID and try again.
                  </p>
                </div>
              </motion.div>
            )}

            {result === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "20px 24px",
                  borderRadius: 14,
                  background: "#FFFFFF",
                  border: "1px solid rgba(20,32,46,0.14)",
                  boxShadow: "0 18px 44px -22px rgba(20,32,46,0.22), 0 4px 12px -6px rgba(20,32,46,0.08)",
                }}
              >
                <AlertCircle size={20} style={{ color: "rgba(248,113,113,0.8)", flexShrink: 0 }} />
                <p style={{ fontSize: 14, fontWeight: 500, color: "#5F5F5F" }}>
                  Something went wrong. Please try again.
                </p>
              </motion.div>
            )}

            {result && result !== "not_found" && result !== "error" && (
              <ResultCard key="result" cert={result} />
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
