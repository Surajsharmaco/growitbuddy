import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { ShieldCheck, ShieldX, AlertCircle, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
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

export default function VerifyCertificate() {
  const params = useParams<{ id: string }>();
  const id = params.id || "";
  const [result, setResult] = useState<CertResult | null | "not_found" | "error">(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setResult("not_found"); setLoading(false); return; }
    fetch(`${API_BASE}/admin/public/certificate/${encodeURIComponent(id.toUpperCase())}`)
      .then(async (res) => {
        if (res.status === 404) return setResult("not_found");
        if (!res.ok) return setResult("error");
        setResult(await res.json());
      })
      .catch(() => setResult("error"))
      .finally(() => setLoading(false));
  }, [id]);

  const isVerified = result && result !== "not_found" && result !== "error" && result.status === "verified";
  const isRevoked = result && result !== "not_found" && result !== "error" && result.status === "revoked";
  const cert = result && result !== "not_found" && result !== "error" ? result : null;

  return (
    <div style={{ background: "#F8F8F6", fontFamily: "'Inter', sans-serif", minHeight: "100vh" }}>
      <SEOMeta
        title={cert ? `${cert.name} | Certificate Verification | GrowitBuddy` : "Certificate Verification | GrowitBuddy"}
        description={cert ? `Verify ${cert.name}'s ${cert.role} certificate issued by GrowitBuddy.` : "Verify certificates issued by GrowitBuddy."}
      />

      <section
        style={{
          paddingTop: 120,
          paddingBottom: 80,
          paddingLeft: 24,
          paddingRight: 24,
        }}
      >
        <div className="max-w-[560px] mx-auto">
          <Link href="/verify">
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
                fontWeight: 600,
                color: "#7A7A85",
                marginBottom: 32,
                cursor: "pointer",
                transition: "color 0.15s",
              }}
              className="hover:text-[#1E293B]"
            >
              <ArrowLeft size={14} />
              Verify another certificate
            </span>
          </Link>

          {loading && (
            <div style={{ textAlign: "center", paddingTop: 60 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  border: "3px solid rgba(11,11,11,0.08)",
                  borderTopColor: "#EFEFEA",
                  animation: "spin 0.7s linear infinite",
                  margin: "0 auto",
                }}
              />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <p style={{ marginTop: 16, fontSize: 14, color: "#7A7A85", fontWeight: 500 }}>
                Verifying certificate...
              </p>
            </div>
          )}

          {!loading && cert && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{
                position: "relative",
                borderRadius: 24,
                overflow: "hidden",
                border: "1px solid rgba(30,41,59,0.12)",
                background: "#FFFFFF",
                boxShadow: "0 1px 0 rgba(255,255,255,0.6) inset, 0 24px 60px -28px rgba(30,41,59,0.25)",
              }}
            >
              {/* gold accent strip top center */}
              <span aria-hidden style={{
                position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
                width: 72, height: 3, background: "var(--gb-gold)", borderRadius: "0 0 6px 6px", zIndex: 2,
              }} />
              {/* decorative dotted-grid corners */}
              <span aria-hidden style={{
                position: "absolute", top: 18, left: 18, width: 88, height: 88, opacity: 0.32,
                backgroundImage: "radial-gradient(circle, rgba(30,41,59,0.32) 1px, transparent 1px)",
                backgroundSize: "9px 9px",
                maskImage: "radial-gradient(circle at top left, black, transparent 70%)",
                WebkitMaskImage: "radial-gradient(circle at top left, black, transparent 70%)",
                pointerEvents: "none", zIndex: 1,
              }} />
              <span aria-hidden style={{
                position: "absolute", bottom: 18, right: 18, width: 88, height: 88, opacity: 0.32,
                backgroundImage: "radial-gradient(circle, rgba(30,41,59,0.32) 1px, transparent 1px)",
                backgroundSize: "9px 9px",
                maskImage: "radial-gradient(circle at bottom right, black, transparent 70%)",
                WebkitMaskImage: "radial-gradient(circle at bottom right, black, transparent 70%)",
                pointerEvents: "none", zIndex: 1,
              }} />

              {/* Document header */}
              <div style={{ position: "relative", padding: "44px 36px 28px", textAlign: "center", borderBottom: "1px solid rgba(30,41,59,0.08)", background: "linear-gradient(180deg, #F8F8F6 0%, #FFFFFF 100%)" }}>
                <p style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.28em",
                  textTransform: "uppercase", color: "var(--gb-gold)", marginBottom: 6,
                }}>
                  GrowitBuddy
                </p>
                <p style={{
                  fontSize: 12, fontWeight: 700, letterSpacing: "0.22em",
                  textTransform: "uppercase", color: "#5F5F5F",
                }}>
                  Certificate of Verification
                </p>
                {/* gold divider with center dot */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 18 }}>
                  <span style={{ width: 40, height: 1, background: "rgba(194,168,120,0.5)" }} />
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--gb-gold)" }} />
                  <span style={{ width: 40, height: 1, background: "rgba(194,168,120,0.5)" }} />
                </div>
              </div>

              {/* Status seal + recipient */}
              <div style={{ position: "relative", padding: "36px 36px 28px", textAlign: "center" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
                  <div style={{
                    width: 76, height: 76, borderRadius: "50%",
                    background: isVerified ? "rgba(16,185,129,0.10)" : "rgba(248,113,113,0.10)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: isVerified ? "1.5px solid rgba(16,185,129,0.30)" : "1.5px solid rgba(248,113,113,0.30)",
                    boxShadow: isVerified
                      ? "0 0 0 6px rgba(16,185,129,0.05), 0 8px 20px rgba(16,185,129,0.12)"
                      : "0 0 0 6px rgba(248,113,113,0.05), 0 8px 20px rgba(248,113,113,0.12)",
                  }}>
                    {isVerified ? (
                      <ShieldCheck size={34} style={{ color: "#10b981", strokeWidth: 2 }} />
                    ) : (
                      <ShieldX size={34} style={{ color: "#f87171", strokeWidth: 2 }} />
                    )}
                  </div>
                </div>
                <p style={{
                  fontSize: 11, fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase",
                  color: isVerified ? "#10b981" : "#f87171", marginBottom: 14,
                }}>
                  {isVerified ? "✓ Verified Authentic" : "Revoked"}
                </p>
                <p style={{ fontSize: 13, color: "#8A8A8A", fontWeight: 500, marginBottom: 6, letterSpacing: "0.04em" }}>
                  This certificate is awarded to
                </p>
                <p style={{
                  fontSize: "clamp(26px, 5vw, 36px)", fontWeight: 800, letterSpacing: "-0.03em",
                  color: "#0A0A0A", lineHeight: 1.05, marginBottom: 10,
                }}>
                  {cert.name}
                </p>
                <span aria-hidden style={{ display: "block", width: 56, height: 2, background: "var(--gb-gold)", borderRadius: 2, margin: "0 auto 14px" }} />
                <p style={{ fontSize: 15, color: "#5F5F5F", fontWeight: 500, letterSpacing: "0.01em" }}>
                  {cert.role}
                </p>
              </div>

              {/* Detail list in framed band — stacked one-by-one so every value
                  gets full width on every screen (no squeeze, no cut-off). */}
              <div style={{ position: "relative", padding: "0 28px 32px" }}>
                <ul style={{
                  background: "#F8F8F6",
                  border: "1px solid rgba(30,41,59,0.08)",
                  borderRadius: 14,
                  padding: "8px 22px",
                  listStyle: "none",
                  margin: 0,
                }}>
                  {[
                    { label: "Issued By", value: "GrowitBuddy" },
                    { label: "Role / Program", value: cert.role },
                    { label: "Issue Date", value: cert.issueDate },
                    { label: "Certificate ID", value: cert.certificateId, mono: true },
                  ].map(({ label, value, mono }, idx, arr) => (
                    <li
                      key={label}
                      style={{
                        display: "block",
                        padding: "14px 0",
                        borderBottom: idx < arr.length - 1 ? "1px solid rgba(30,41,59,0.08)" : "none",
                      }}
                    >
                      <p style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: "0.2em",
                        textTransform: "uppercase", color: "var(--gb-gold)", marginBottom: 6,
                      }}>
                        {label}
                      </p>
                      <p style={{
                        fontSize: 15, fontWeight: 700, color: "#0A0A0A",
                        lineHeight: 1.4,
                        fontFamily: mono ? "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" : undefined,
                        letterSpacing: mono ? "0.02em" : "-0.01em",
                        wordBreak: mono ? "break-all" : "normal",
                        overflowWrap: "break-word",
                      }}>
                        {value}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Admin remark / feedback */}
              {cert.remark && cert.remark.trim() && (
                <div style={{ position: "relative", padding: "0 36px 28px" }}>
                  <div style={{
                    background: "linear-gradient(180deg, rgba(194,168,120,0.06) 0%, rgba(194,168,120,0.02) 100%)",
                    border: "1px solid rgba(194,168,120,0.25)",
                    borderRadius: 14,
                    padding: "20px 24px",
                    position: "relative",
                  }}>
                    <p style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: "0.2em",
                      textTransform: "uppercase", color: "var(--gb-gold)", marginBottom: 10,
                    }}>
                      Remark from GrowitBuddy
                    </p>
                    <p style={{
                      fontSize: 14.5, color: "#2A2A2A", lineHeight: 1.65,
                      fontStyle: "italic", fontWeight: 500,
                      wordBreak: "normal", overflowWrap: "break-word",
                    }}>
                      &ldquo;{cert.remark}&rdquo;
                    </p>
                  </div>
                </div>
              )}

              {/* Signature footer band */}
              <div style={{
                position: "relative",
                background: "#EFEFEA",
                borderTop: "1px solid rgba(30,41,59,0.08)",
                padding: "20px 36px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                flexWrap: "wrap",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--gb-gold)", boxShadow: "0 0 0 3px rgba(194,168,120,0.20)" }} />
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#1E293B", letterSpacing: "0.02em" }}>
                    {isVerified ? "Authentic & Issued by GrowitBuddy" : "Revoked by GrowitBuddy"}
                  </p>
                </div>
                <p style={{ fontSize: 11, color: "#8A8A8A", fontWeight: 500, letterSpacing: "0.04em" }}>
                  {isVerified
                    ? "This holder completed a recognised program with us."
                    : "Please contact us for further information."}
                </p>
              </div>
            </motion.div>
          )}

          {!loading && result === "not_found" && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                textAlign: "center",
                padding: "60px 24px",
                background: "#FFFFFF",
                borderRadius: 20,
                border: "1.5px solid #E5E5E0",
              }}
            >
              <AlertCircle size={32} style={{ color: "#7A7A85", margin: "0 auto 16px" }} />
              <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.03em", color: "#0A0A0A", marginBottom: 8 }}>
                Certificate not found
              </h2>
              <p style={{ fontSize: 14, color: "#7A7A85", marginBottom: 24, maxWidth: "36ch", margin: "0 auto 24px" }}>
                No certificate was found with ID <strong style={{ fontFamily: "monospace" }}>{id}</strong>. Please check the ID and try again.
              </p>
              <Link href="/verify">
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "11px 20px",
                    borderRadius: 100,
                    background: "#EFEFEA",
                    color: "#0A0A0A",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "'Inter', sans-serif",
                  }}
                  className="hover:opacity-80 transition-opacity"
                >
                  Try another ID
                </span>
              </Link>
            </motion.div>
          )}

          {!loading && result === "error" && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                textAlign: "center",
                padding: "48px 24px",
                background: "#FFFFFF",
                borderRadius: 20,
                border: "1.5px solid #E5E5E0",
              }}
            >
              <AlertCircle size={28} style={{ color: "rgba(248,113,113,0.7)", margin: "0 auto 12px" }} />
              <p style={{ fontSize: 15, fontWeight: 600, color: "#0A0A0A" }}>Something went wrong</p>
              <p style={{ fontSize: 13, color: "#7A7A85", marginTop: 6 }}>
                Please try again or verify manually at{" "}
                <Link href="/verify">
                  <span style={{ color: "#0A0A0A", fontWeight: 700, cursor: "pointer" }}>/verify</span>
                </Link>
                .
              </p>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}
