import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { ArrowRight } from "lucide-react";
import SEOMeta from "@/components/SEOMeta";
import { usePublicContent } from "@/hooks/usePublicContent";
import HalftoneDots from "@/components/effects/HalftoneDots";

interface JoinNetworkData {
  heroLabel: string; heroHeadline: string; heroSubtext: string;
  card1Num: string; card1Title: string; card1Subtitle: string; card1Desc: string; card1CTA: string;
  card2Num: string; card2Title: string; card2Subtitle: string; card2Desc: string; card2CTA: string;
  footerNote: string;
}
const JN_DEFAULTS: JoinNetworkData = {
  heroLabel: "Join Our Network", heroHeadline: "Choose Your Path.", heroSubtext: "Two ways to become part of a growing ecosystem. Pick the one that fits you.",
  card1Num: "01", card1Title: "I'm an Influencer", card1Subtitle: "", card1Desc: "I create content on my personal profile, build an audience, and collaborate with brands.", card1CTA: "Continue as Influencer",
  card2Num: "02", card2Title: "I run Pages", card2Subtitle: "Meme / Theme Pages", card2Desc: "I manage one or more content pages with large audiences and help distribute content at scale.", card2CTA: "Continue as Page Owner",
  footerNote: "Not sure where you fit? Choose the closest option - we'll guide you from there.",
};

export default function JoinNetwork() {
  const cms = usePublicContent<JoinNetworkData>("joinnetwork", JN_DEFAULTS);
  const [, navigate] = useLocation();

  return (
    <div style={{ background: "#F8F8F6", fontFamily: "'Inter', sans-serif", minHeight: "100vh" }}>
      <style>{`
        .jn-wrap {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 24px;
        }
        .jn-cards {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .jn-card {
          border-radius: 24px;
          padding: 52px 44px 48px;
          display: flex;
          flex-direction: column;
          gap: 0;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          min-height: 400px;
        }
        .jn-card:hover {
          transform: translateY(-6px) scale(1.01);
        }
        .jn-card-dark {
          background: #EFEFEA;
          border: 1px solid rgba(30,41,59,0.25);
          box-shadow: 0 4px 32px rgba(0,0,0,0.06);
        }
        .jn-card-dark:hover {
          box-shadow: 0 28px 72px rgba(30,41,59,0.12);
          border-color: rgba(30,41,59,0.45);
        }
        .jn-card-light {
          background: #FFFFFF;
          border: 1.5px solid #E5E5E0;
          box-shadow: 0 2px 16px rgba(0,0,0,0.3);
        }
        .jn-card-light:hover {
          box-shadow: 0 28px 72px rgba(0,0,0,0.06);
          border-color: rgba(30,41,59,0.20);
        }
        .jn-card-dark .jn-num   { color: var(--gb-accent); }
        .jn-card-dark .jn-title { color: #0A0A0A; }
        .jn-card-dark .jn-sub   { color: #8A8A8A; }
        .jn-card-dark .jn-rule  { background: var(--gb-accent); }
        .jn-card-dark .jn-desc  { color: #5F5F5F; }
        .jn-card-dark .jn-btn   { background: var(--gb-accent); color: #fff; }
        .jn-card-dark .jn-btn:hover { opacity: 0.88; }
        .jn-card-light .jn-num  { color: #8A8A8A; }
        .jn-card-light .jn-title { color: #0A0A0A; }
        .jn-card-light .jn-sub  { color: #8A8A8A; }
        .jn-card-light .jn-rule { background: rgba(10,10,10,0.1); }
        .jn-card-light .jn-desc { color: #5F5F5F; }
        .jn-card-light .jn-btn  { background: #1E293B; color: #F8F8F6; border: none; }
        .jn-card-light .jn-btn:hover { opacity: 0.88; }
        .jn-num   { font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 32px; display: block; }
        .jn-title { font-weight: 800; font-size: clamp(28px, 3.5vw, 42px); letter-spacing: -0.04em; line-height: 1.08; margin-bottom: 0; }
        .jn-sub   { font-size: 13px; font-weight: 600; letter-spacing: 0.01em; margin-top: 6px; }
        .jn-rule  { width: 36px; height: 2px; border-radius: 2px; margin: 24px 0; flex-shrink: 0; }
        .jn-desc  { font-size: 15px; line-height: 1.75; flex: 1; margin-bottom: 40px; }
        .jn-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 700;
          border-radius: 100px;
          padding: 13px 24px;
          border: none;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          width: fit-content;
          transition: opacity 0.15s ease;
          pointer-events: none;
          letter-spacing: -0.01em;
        }
        .jn-deco {
          position: absolute;
          bottom: -40px;
          right: -40px;
          width: 180px;
          height: 180px;
          border-radius: 50%;
          pointer-events: none;
        }
        .jn-deco-dark  { background: rgba(30,41,59,0.05); }
        .jn-deco-light { background: rgba(10,10,10,0.015); }
        @media (max-width: 680px) {
          .jn-cards { grid-template-columns: 1fr; }
          .jn-card  { padding: 40px 32px 40px; min-height: auto; }
        }
      `}</style>

      <SEOMeta
        title="Join Our Network - GrowitBuddy"
        description="Join the GrowitBuddy creator and distribution network. Apply as an influencer or as a meme/theme page owner and become part of our growing ecosystem."
        robots="noindex,follow"
      />

      {/* Hero */}
      <section style={{ paddingTop: 128, paddingBottom: 56, paddingLeft: 24, paddingRight: 24, position: "relative", overflow: "hidden" }}>
        <HalftoneDots
          style={{ position: "absolute", top: 0, right: 0, opacity: 0.13, pointerEvents: "none" }}
          origin="top-right" width={300} height={240}
        />
        <div className="jn-wrap">
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#7A7A85", marginBottom: 18 }}>
            {cms.heroLabel}
          </p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
            style={{ fontWeight: 800, fontSize: "clamp(28px, 7vw, 80px)", letterSpacing: "-0.045em", lineHeight: "1.08", color: "#0A0A0A", maxWidth: "16ch", marginBottom: 20 }}
          >
            {cms.heroHeadline}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ fontSize: "clamp(15px, 2vw, 17px)", color: "#5F5F5F", lineHeight: 1.75, maxWidth: "44ch" }}
          >
            {cms.heroSubtext}
          </motion.p>
        </div>
      </section>

      {/* Cards */}
      <section style={{ padding: "0 24px 56px" }}>
        <div className="jn-wrap">
          <div className="jn-cards">

            {/* Card 1 - Dark */}
            <motion.div
              className="jn-card jn-card-dark"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.55 }}
              onClick={() => navigate("/creators")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && navigate("/creators")}
            >
              <div className="jn-deco jn-deco-dark" />
              <span className="jn-num">{cms.card1Num}</span>
              <h2 className="jn-title">{cms.card1Title}</h2>
              <div className="jn-rule" />
              <p className="jn-desc">
                {cms.card1Desc}
              </p>
              <span className="jn-btn">
                {cms.card1CTA}
                <ArrowRight style={{ width: 14, height: 14 }} />
              </span>
            </motion.div>

            {/* Card 2 - Light */}
            <motion.div
              className="jn-card jn-card-light"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.55 }}
              onClick={() => navigate("/join/page-owner")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && navigate("/join/page-owner")}
            >
              <div className="jn-deco jn-deco-light" />
              <span className="jn-num">{cms.card2Num}</span>
              <h2 className="jn-title">{cms.card2Title}</h2>
              {cms.card2Subtitle && <p className="jn-sub">{cms.card2Subtitle}</p>}
              <div className="jn-rule" />
              <p className="jn-desc">
                {cms.card2Desc}
              </p>
              <span className="jn-btn">
                {cms.card2CTA}
                <ArrowRight style={{ width: 14, height: 14 }} />
              </span>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Footer note */}
      <section style={{ padding: "0 24px 96px" }}>
        <div className="jn-wrap" style={{ textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "#5F5F5F", lineHeight: 1.7, borderTop: "1px solid #E5E5E0", paddingTop: 32 }}>
            {cms.footerNote}
          </p>
        </div>
      </section>
    </div>
  );
}
