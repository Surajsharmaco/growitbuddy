import { Link } from "wouter";
import { AlertCircle } from "lucide-react";
import SEOMeta from "@/components/SEOMeta";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center text-center" style={{ minHeight: "70vh", padding: 24 }}>
      <SEOMeta
        title="Page not found — GrowitBuddy"
        description="The page you're looking for doesn't exist or has moved."
        robots="noindex,follow"
      />
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "rgba(11,11,11,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        <AlertCircle size={24} color="#1E293B" />
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0B0B0B", letterSpacing: "-0.02em", margin: 0 }}>
        404 — Page not found
      </h1>
      <p style={{ marginTop: 8, fontSize: 14, color: "rgba(11,11,11,0.55)", maxWidth: 440, lineHeight: 1.55 }}>
        The page you're looking for doesn't exist or may have moved. Let's get you back on track.
      </p>
      <div style={{ display: "flex", gap: 10, marginTop: 22, flexWrap: "wrap", justifyContent: "center" }}>
        <Link
          href="/"
          style={{
            textDecoration: "none",
            background: "#1E293B",
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
            padding: "11px 22px",
            borderRadius: 100,
          }}
        >
          Go to homepage
        </Link>
        <Link
          href="/contact"
          style={{
            textDecoration: "none",
            background: "#FFFFFF",
            color: "#0B0B0B",
            fontWeight: 700,
            fontSize: 14,
            padding: "11px 22px",
            borderRadius: 100,
            border: "1.5px solid #E5E5E0",
          }}
        >
          Contact us
        </Link>
      </div>
    </div>
  );
}
