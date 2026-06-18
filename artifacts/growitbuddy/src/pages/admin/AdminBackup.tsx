import { useState, useEffect, useCallback } from "react";
import { useAdmin } from "@/context/AdminContext";
import { API_BASE } from "@/lib/api";
import {
  DownloadCloud,
  FileArchive,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Bot,
  ShieldCheck,
  Copy,
  Check,
  RefreshCw,
  FileText,
} from "lucide-react";

type ZipStatus = "idle" | "loading" | "done" | "error";
type PromptStatus = "loading" | "ready" | "error";

const INCLUDED = [
  "Poora source code (saari files — website + admin + API + libraries)",
  "AI ke liye guide: architecture, setup & deploy, database, har connection",
  "Ready-to-paste AI prompt — kisi bhi AI ko de do, project samajh jayega",
  "Website ka live content snapshot (pages, portfolio, logos, certificates)",
];

const EXCLUDED = [
  "Koi bhi secret / API key / password (safety ke liye)",
  "CRM leads ka personal data (privacy ke liye)",
  "Team members ke password aur internal logs",
];

export default function AdminBackup() {
  const { authFetch, isSuperAdmin } = useAdmin();

  // ── Master AI prompt ──
  const [prompt, setPrompt] = useState("");
  const [filename, setFilename] = useState("growitbuddy-ai-prompt.md");
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [promptStatus, setPromptStatus] = useState<PromptStatus>("loading");
  const [promptError, setPromptError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  // ── ZIP backup ──
  const [zipStatus, setZipStatus] = useState<ZipStatus>("idle");
  const [zipError, setZipError] = useState<string | null>(null);

  const loadPrompt = useCallback(async () => {
    setPromptStatus("loading");
    setPromptError(null);
    setCopyError(null);
    setCopied(false);
    try {
      const res = await authFetch(`${API_BASE}/admin/handoff-prompt`);
      if (!res.ok) {
        let msg = `Prompt ban nahi paaya (${res.status})`;
        try {
          const j = (await res.json()) as { error?: string };
          msg = j.error ?? msg;
        } catch {
          /* not JSON */
        }
        throw new Error(msg);
      }
      const j = (await res.json()) as { prompt: string; generatedAt: string; filename: string };
      setPrompt(j.prompt);
      setGeneratedAt(j.generatedAt);
      if (j.filename) setFilename(j.filename);
      setPromptStatus("ready");
    } catch (e) {
      setPromptError((e as Error).message);
      setPromptStatus("error");
    }
  }, [authFetch]);

  useEffect(() => {
    if (isSuperAdmin) void loadPrompt();
  }, [isSuperAdmin, loadPrompt]);

  async function handleCopy() {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setCopyError(null);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopyError("Copy nahi ho paaya — neeche box mein click karke (sab select hoga) manually copy karo.");
    }
  }

  function handleDownloadPrompt() {
    if (!prompt) return;
    const blob = new Blob([prompt], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function handleZipDownload() {
    setZipStatus("loading");
    setZipError(null);
    try {
      const res = await authFetch(`${API_BASE}/admin/backup`);
      if (!res.ok) {
        let msg = `Backup failed (${res.status})`;
        try {
          const j = (await res.json()) as { error?: string };
          msg = j.error ?? msg;
        } catch {
          /* not JSON */
        }
        throw new Error(msg);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `growitbuddy-backup-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setZipStatus("done");
    } catch (e) {
      setZipError((e as Error).message);
      setZipStatus("error");
    }
  }

  if (!isSuperAdmin) {
    return (
      <div style={{ padding: "28px 24px", maxWidth: 820, margin: "0 auto", fontFamily: "Inter, sans-serif" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            padding: "16px 18px",
            background: "rgba(220,38,38,0.06)",
            border: "1px solid rgba(220,38,38,0.25)",
            borderRadius: 12,
            color: "#b91c1c",
          }}
        >
          <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 800 }}>Sirf super admin ke liye</p>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(11,11,11,0.6)" }}>
              Ye backup / migration feature sirf super admin use kar sakta hai.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const fmtTime = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "";
  const charCount = prompt.length;

  return (
    <div style={{ padding: "28px 24px", maxWidth: 820, margin: "0 auto", fontFamily: "Inter, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <FileArchive size={22} color="#1E293B" />
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0B0B0B", letterSpacing: "-0.02em", margin: 0 }}>
          Backup / Migration
        </h1>
      </div>
      <p style={{ fontSize: 14, color: "rgba(11,11,11,0.6)", lineHeight: 1.6, margin: "0 0 22px" }}>
        Apne poore project ko kisi bhi AI ko samjhane ke liye <strong>ek hi master prompt</strong> ready hai —
        copy karo ya download karo aur AI ko de do. Ye prompt hamesha aapki website ke <strong>current
        content</strong> ke hisaab se ban-ta hai, isliye jab bhi aap kuch change karo, dobara copy/download
        karne par naya updated prompt mil jata hai.
      </p>

      {/* ── Master AI prompt card ── */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #ECECE7",
          borderRadius: 16,
          padding: 24,
          boxShadow: "0 1px 2px rgba(11,11,11,0.04)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Bot size={18} color="#1E293B" />
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0B0B0B", margin: 0 }}>Master AI Prompt</h2>
        </div>
        <p style={{ fontSize: 13, color: "rgba(11,11,11,0.55)", lineHeight: 1.55, margin: "0 0 16px" }}>
          Isme project ka poora structure, kaise bana hai, kaise deploy hota hai — sab kuch likha hai, aur
          aapki website ka live content bhi andar hai.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <button
            onClick={handleCopy}
            disabled={promptStatus !== "ready"}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 9,
              background: copied ? "#047857" : promptStatus !== "ready" ? "#94A3B8" : "#0B0B0B",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: "12px 20px",
              fontSize: 14.5,
              fontWeight: 700,
              cursor: promptStatus !== "ready" ? "default" : "pointer",
              transition: "background 0.15s",
            }}
          >
            {copied ? <Check size={17} /> : <Copy size={17} />}
            {copied ? "Copy ho gaya!" : "Copy Prompt"}
          </button>

          <button
            onClick={handleDownloadPrompt}
            disabled={promptStatus !== "ready"}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 9,
              background: "#fff",
              color: promptStatus !== "ready" ? "#94A3B8" : "#0B0B0B",
              border: "1px solid #D4D4CE",
              borderRadius: 12,
              padding: "12px 20px",
              fontSize: 14.5,
              fontWeight: 700,
              cursor: promptStatus !== "ready" ? "default" : "pointer",
            }}
          >
            <FileText size={17} /> Download Prompt (.md)
          </button>

          <button
            onClick={() => void loadPrompt()}
            disabled={promptStatus === "loading"}
            title="Latest content ke saath dobara banao"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "transparent",
              color: "rgba(11,11,11,0.6)",
              border: "1px solid #ECECE7",
              borderRadius: 12,
              padding: "12px 16px",
              fontSize: 13.5,
              fontWeight: 600,
              cursor: promptStatus === "loading" ? "default" : "pointer",
              marginLeft: "auto",
            }}
          >
            {promptStatus === "loading" ? (
              <Loader2 size={15} className="gb-spin" />
            ) : (
              <RefreshCw size={15} />
            )}
            Refresh
          </button>
        </div>

        {promptStatus === "ready" && (
          <p style={{ fontSize: 12, color: "rgba(11,11,11,0.45)", margin: "12px 0 0" }}>
            Generated: {fmtTime(generatedAt)} · {charCount.toLocaleString("en-IN")} characters
          </p>
        )}

        {copyError && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              marginTop: 12,
              padding: "10px 14px",
              background: "rgba(180,83,9,0.08)",
              border: "1px solid rgba(180,83,9,0.25)",
              borderRadius: 10,
              color: "#b45309",
              fontSize: 13.5,
              fontWeight: 600,
            }}
          >
            <AlertTriangle size={17} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{copyError}</span>
          </div>
        )}

        {promptStatus === "error" && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              marginTop: 14,
              padding: "10px 14px",
              background: "rgba(220,38,38,0.07)",
              border: "1px solid rgba(220,38,38,0.25)",
              borderRadius: 10,
              color: "#b91c1c",
              fontSize: 13.5,
              fontWeight: 600,
            }}
          >
            <AlertTriangle size={17} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{promptError ?? "Prompt ban nahi paaya. Thodi der baad dobara try karo."}</span>
          </div>
        )}

        {/* preview */}
        <div
          style={{
            marginTop: 16,
            border: "1px solid #ECECE7",
            borderRadius: 12,
            background: "#FAFAF8",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "8px 14px",
              borderBottom: "1px solid #ECECE7",
              fontSize: 12,
              fontWeight: 700,
              color: "rgba(11,11,11,0.5)",
              display: "flex",
              alignItems: "center",
              gap: 7,
            }}
          >
            <FileText size={14} /> Prompt preview
          </div>
          {promptStatus === "loading" ? (
            <div
              style={{
                padding: 28,
                display: "flex",
                alignItems: "center",
                gap: 10,
                color: "rgba(11,11,11,0.5)",
                fontSize: 13.5,
              }}
            >
              <Loader2 size={16} className="gb-spin" /> Prompt ban raha hai...
            </div>
          ) : (
            <textarea
              readOnly
              value={prompt}
              onFocus={(e) => e.currentTarget.select()}
              spellCheck={false}
              style={{
                width: "100%",
                height: 340,
                resize: "vertical",
                border: "none",
                outline: "none",
                background: "transparent",
                padding: 14,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: 12,
                lineHeight: 1.6,
                color: "rgba(11,11,11,0.8)",
                boxSizing: "border-box",
              }}
            />
          )}
        </div>
      </div>

      {/* ── Full source ZIP backup (secondary) ── */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #ECECE7",
          borderRadius: 16,
          padding: 22,
          marginTop: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <FileArchive size={17} color="#1E293B" />
          <h2 style={{ fontSize: 15, fontWeight: 800, color: "#0B0B0B", margin: 0 }}>
            Full source backup (ZIP)
          </h2>
        </div>
        <p style={{ fontSize: 13, color: "rgba(11,11,11,0.55)", lineHeight: 1.55, margin: "0 0 14px" }}>
          Agar aapko poore project ka <strong>actual code</strong> bhi chahiye (sirf prompt nahi), toh ye
          ZIP download karo — isme saara source code + saari guide files hoti hain. Ye GitHub se code laata
          hai, isliye banne mein kuch second lagte hain.
        </p>
        <button
          onClick={handleZipDownload}
          disabled={zipStatus === "loading"}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 9,
            background: zipStatus === "loading" ? "#475569" : "#1E293B",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            padding: "11px 18px",
            fontSize: 14,
            fontWeight: 700,
            cursor: zipStatus === "loading" ? "default" : "pointer",
          }}
        >
          {zipStatus === "loading" ? <Loader2 size={16} className="gb-spin" /> : <DownloadCloud size={16} />}
          {zipStatus === "loading" ? "ZIP ban raha hai..." : "Download Full ZIP"}
        </button>

        {zipStatus === "done" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 14,
              padding: "10px 14px",
              background: "rgba(16,185,129,0.08)",
              border: "1px solid rgba(16,185,129,0.25)",
              borderRadius: 10,
              color: "#047857",
              fontSize: 13.5,
              fontWeight: 600,
            }}
          >
            <CheckCircle2 size={17} /> ZIP download ho gaya! File aapke downloads folder mein hai.
          </div>
        )}

        {zipStatus === "error" && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              marginTop: 14,
              padding: "10px 14px",
              background: "rgba(220,38,38,0.07)",
              border: "1px solid rgba(220,38,38,0.25)",
              borderRadius: 10,
              color: "#b91c1c",
              fontSize: 13.5,
              fontWeight: 600,
            }}
          >
            <AlertTriangle size={17} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{zipError ?? "Kuch galat ho gaya. Thodi der baad dobara try karo."}</span>
          </div>
        )}
      </div>

      {/* ── what's in / excluded ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 20 }}>
        <div style={{ background: "#fff", border: "1px solid #ECECE7", borderRadius: 14, padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
            <CheckCircle2 size={16} color="#047857" />
            <h2 style={{ fontSize: 13, fontWeight: 800, color: "#0B0B0B", margin: 0 }}>Kya milta hai</h2>
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 7 }}>
            {INCLUDED.map((t) => (
              <li key={t} style={{ fontSize: 12.5, color: "rgba(11,11,11,0.65)", lineHeight: 1.5 }}>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div style={{ background: "#fff", border: "1px solid #ECECE7", borderRadius: 14, padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
            <ShieldCheck size={16} color="#b45309" />
            <h2 style={{ fontSize: 13, fontWeight: 800, color: "#0B0B0B", margin: 0 }}>Safety ke liye exclude</h2>
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 7 }}>
            {EXCLUDED.map((t) => (
              <li key={t} style={{ fontSize: 12.5, color: "rgba(11,11,11,0.65)", lineHeight: 1.5 }}>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          marginTop: 18,
          padding: "14px 16px",
          background: "rgba(30,41,59,0.04)",
          border: "1px solid #ECECE7",
          borderRadius: 12,
        }}
      >
        <Bot size={18} color="#1E293B" style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 12.5, color: "rgba(11,11,11,0.6)", lineHeight: 1.6, margin: 0 }}>
          <strong>Kaise use karein:</strong> upar <strong>Copy Prompt</strong> dabao aur kisi bhi AI
          (ChatGPT, Claude, etc.) ke chat mein paste kar do — AI poora project samajh jayega. Live content
          wahi aata hai jo abhi website par dikh raha hai. Agar AI ko code bhi chahiye toh "Full source
          backup (ZIP)" de do.
        </p>
      </div>

      <style>{`.gb-spin{animation:gb-spin 0.7s linear infinite}@keyframes gb-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
