import { useState } from "react";
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
} from "lucide-react";

type Status = "idle" | "loading" | "done" | "error";

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
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setStatus("loading");
    setError(null);
    try {
      const res = await authFetch(`${API_BASE}/admin/backup`);
      if (!res.ok) {
        let msg = `Backup failed (${res.status})`;
        try {
          const j = (await res.json()) as { error?: string };
          msg = j.error ?? msg;
        } catch {
          /* response was not JSON */
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
      setStatus("done");
    } catch (e) {
      setError((e as Error).message);
      setStatus("error");
    }
  }

  const loading = status === "loading";

  if (!isSuperAdmin) {
    return (
      <div style={{ padding: "28px 24px", maxWidth: 760, margin: "0 auto", fontFamily: "Inter, sans-serif" }}>
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

  return (
    <div style={{ padding: "28px 24px", maxWidth: 760, margin: "0 auto", fontFamily: "Inter, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <FileArchive size={22} color="#1E293B" />
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0B0B0B", letterSpacing: "-0.02em", margin: 0 }}>
          Backup / Migration
        </h1>
      </div>
      <p style={{ fontSize: 14, color: "rgba(11,11,11,0.6)", lineHeight: 1.6, margin: "0 0 22px" }}>
        Ek click mein poore project ki <strong>ek hi backup file (ZIP)</strong> download karo. Isme
        saara code + saari guide + AI prompt hota hai — kisi bhi AI ko ye file do aur woh bina kuch
        samjhaye poora project samajh kar aage kaam ya dobara bana sakta hai.
      </p>

      <div
        style={{
          background: "#fff",
          border: "1px solid #ECECE7",
          borderRadius: 16,
          padding: 24,
          boxShadow: "0 1px 2px rgba(11,11,11,0.04)",
        }}
      >
        <button
          onClick={handleDownload}
          disabled={loading}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            background: loading ? "#475569" : "#0B0B0B",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            padding: "13px 22px",
            fontSize: 15,
            fontWeight: 700,
            cursor: loading ? "default" : "pointer",
            transition: "background 0.15s",
          }}
        >
          {loading ? <Loader2 size={18} className="gb-spin" /> : <DownloadCloud size={18} />}
          {loading ? "Backup ban raha hai..." : "Download Full Backup"}
        </button>

        <p style={{ fontSize: 12.5, color: "rgba(11,11,11,0.45)", margin: "12px 0 0", lineHeight: 1.55 }}>
          File thodi badi ho sakti hai aur banne mein kuch second lagte hain — button dabane ke baad
          ruk jao, download apne aap shuru ho jayega.
        </p>

        {status === "done" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 16,
              padding: "10px 14px",
              background: "rgba(16,185,129,0.08)",
              border: "1px solid rgba(16,185,129,0.25)",
              borderRadius: 10,
              color: "#047857",
              fontSize: 13.5,
              fontWeight: 600,
            }}
          >
            <CheckCircle2 size={17} /> Backup download ho gaya! File aapke downloads folder mein hai.
          </div>
        )}

        {status === "error" && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              marginTop: 16,
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
            <span>{error ?? "Kuch galat ho gaya. Thodi der baad dobara try karo."}</span>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 20 }}>
        <div style={{ background: "#fff", border: "1px solid #ECECE7", borderRadius: 14, padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
            <CheckCircle2 size={16} color="#047857" />
            <h2 style={{ fontSize: 13, fontWeight: 800, color: "#0B0B0B", margin: 0 }}>Backup mein kya hai</h2>
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
          <strong>Kaise use karein:</strong> ZIP unzip karo, andar <code>START_HERE.md</code> aur{" "}
          <code>_AI_HANDOFF/AI_PROMPT.md</code> milegi. Wo prompt copy karke kisi bhi AI ko de do — code{" "}
          <code>SOURCE_CODE/</code> folder mein poora hota hai. Code wahi hota hai jo abhi live website
          par chal raha hai (GitHub se), isliye sirf push ho chuke changes hi isme aate hain.
        </p>
      </div>

      <style>{`.gb-spin{animation:gb-spin 0.7s linear infinite}@keyframes gb-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
