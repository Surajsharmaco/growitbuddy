import { motion } from "framer-motion";
import { Link, useParams } from "wouter";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useState } from "react";
import SEOMeta from "@/components/SEOMeta";
import { useLiveInfluencers } from "@/hooks/useLiveInfluencers";

export default function InfluencerProfile() {
  const { slug } = useParams<{ slug: string }>();
  const { influencers } = useLiveInfluencers();
  const inf = influencers.find((i) => i.slug === slug);
  const [imgError, setImgError] = useState(false);

  if (!inf) {
    return (
      <div style={{ background: "#F8F8F6", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, fontFamily: "'Inter', sans-serif" }}>
        <p style={{ fontSize: 14, color: "#5F5F5F" }}>Influencer not found.</p>
        <Link href="/influencers">
          <span style={{ fontSize: 14, fontWeight: 700, color: "#0A0A0A", textDecoration: "underline", cursor: "pointer" }}>Back to Explore</span>
        </Link>
      </div>
    );
  }

  if (inf.profileEnabled === false) {
    return (
      <div style={{ background: "#F8F8F6", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, fontFamily: "'Inter', sans-serif" }}>
        <p style={{ fontSize: 28, fontWeight: 800, color: "#0A0A0A", letterSpacing: "-0.04em" }}>Profile Unavailable</p>
        <p style={{ fontSize: 14, color: "#5F5F5F", maxWidth: "30ch", textAlign: "center", lineHeight: 1.6 }}>
          This influencer profile is currently not available. Please check back later.
        </p>
        <Link href="/influencers">
          <span style={{ fontSize: 14, fontWeight: 700, color: "#0A0A0A", textDecoration: "underline", cursor: "pointer" }}>Back to Explore</span>
        </Link>
      </div>
    );
  }

  return (
    <div style={{ background: "#F8F8F6", fontFamily: "'Inter', sans-serif", minHeight: "100vh" }}>
      <SEOMeta
        title={`${inf.name} - GrowitBuddy Influencer Network`}
        description={inf.description}
      />

      {/* Back */}
      <div style={{ paddingTop: 88, paddingLeft: 24, paddingRight: 24 }}>
        <div className="max-w-[760px] mx-auto">
          <Link href="/influencers">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#7A7A85", cursor: "pointer" }} className="hover:text-black transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              All Influencers
            </span>
          </Link>
        </div>
      </div>

      {/* Profile card */}
      <section style={{ padding: "32px 24px 96px" }}>
        <div className="max-w-[760px] mx-auto" style={{ display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Main card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ background: "#FFFFFF", border: "1px solid #E5E5E0", borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 12px rgba(11,11,11,0.05)" }}
          >
            {/* Photo */}
            <div style={{ position: "relative", width: "100%", aspectRatio: "1/1", maxHeight: 320, overflow: "hidden", background: inf.accentColor }}>
              {!imgError && inf.photo ? (
                <img
                  src={inf.photo}
                  alt={inf.name}
                  onError={() => setImgError(true)}
                  style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }}
                />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#0A0A0A", fontWeight: 800, fontSize: 72, letterSpacing: "-0.02em" }}>
                  {inf.initials}
                </div>
              )}
              {/* Niche badge */}
              <div style={{ position: "absolute", top: 16, left: 16, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#1E293B", background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)", borderRadius: 100, padding: "4px 12px", border: "1px solid rgba(255,255,255,0.6)" }}>
                {inf.niche}
              </div>
            </div>

            {/* Info */}
            <div style={{ padding: "24px 28px 28px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4, gap: 8 }}>
                <p style={{ fontWeight: 800, fontSize: 22, color: "#0A0A0A", letterSpacing: "-0.03em" }}>{inf.name}</p>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#0A0A0A", whiteSpace: "nowrap", flexShrink: 0 }}>{inf.followers}</span>
              </div>
              <p style={{ fontSize: 14, fontWeight: 500, color: "#7A7A85", marginBottom: 14 }}>{inf.username}</p>
              <p style={{ fontSize: 15, color: "#5F5F5F", lineHeight: 1.7, marginBottom: 20 }}>{inf.description}</p>

              {/* Engagement pill */}
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#7A7A85", background: "rgba(10,10,10,0.04)", borderRadius: 100, padding: "5px 14px" }}>
                {inf.engagementRate} engagement
              </span>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            style={{ background: "#EFEFEA", borderRadius: 20, padding: "40px 36px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 20 }}
          >
            <h2 style={{ fontWeight: 800, fontSize: "clamp(22px, 4vw, 32px)", letterSpacing: "-0.04em", color: "#0A0A0A", lineHeight: 1.1 }}>
              Work With {inf.name.split(" ")[0]}
            </h2>
            <p style={{ fontSize: 15, color: "#8A8A8A", maxWidth: "44ch", lineHeight: 1.7 }}>
              Get in touch to explore collaboration opportunities, brand deals, and content partnerships.
            </p>
            <Link href="/contact">
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#FFFFFF", color: "#0A0A0A", fontWeight: 700, fontSize: 14, borderRadius: 100, padding: "12px 24px", cursor: "pointer", border: "1px solid #E5E5E0" }}>
                Work With This Influencer
                <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </motion.div>

        </div>
      </section>
    </div>
  );
}
