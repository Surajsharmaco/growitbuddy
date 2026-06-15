import React from "react";
import {
  LayoutDashboard,
  FileText,
  Share2,
  Users,
  Target,
  Inbox,
  ChevronDown,
  Calendar,
} from "lucide-react";

/**
 * Decorative, on-brand analytics dashboard mock-up for the bottom of the hero
 * (SendRoq-style product shot). Tilted in 3D, clipped by the hero's bottom
 * edge. Navy / gold / cream only. Purely visual — aria-hidden, not interactive.
 */

const NAVY = "#1E293B";
const NAVY_DEEP = "#161E2B";
const GOLD = "#C2A878";
const INK = "#0F1115";
const BORDER = "#ECECE6";
const MUTED = "#8B8F96";
const FAINT = "#F4F2ED";

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: FileText, label: "Content" },
  { icon: Share2, label: "Distribution" },
  { icon: Users, label: "Audience" },
  { icon: Target, label: "Leads" },
  { icon: Inbox, label: "Inbox" },
];

const STATS = [
  { label: "Reach", value: "+98K", dot: GOLD },
  { label: "New Followers", value: "+30", dot: NAVY },
  { label: "Posts Shipped", value: "+70", dot: "#D8C39B" },
  { label: "Inbound Leads", value: "+35", dot: "#A7AEBA" },
];

const CAMPAIGNS = [
  { name: "Enterprise Brands", pct: 51 },
  { name: "SaaS Founders", pct: 33 },
  { name: "Series-A CTOs", pct: 31 },
  { name: "Creator Network", pct: 24 },
];

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        border: `1px solid ${BORDER}`,
        background: "#FFFFFF",
        borderRadius: 8,
        padding: "5px 9px",
        fontSize: 10.5,
        fontWeight: 600,
        color: "#5C5F66",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function Chart() {
  // Three smooth lines (gold = primary, navy = secondary, faint = tertiary).
  const W = 560;
  const H = 168;
  const lines = [
    { color: GOLD, w: 2.4, d: "M0,120 C70,96 110,52 170,70 C230,88 270,150 330,120 C390,92 430,40 490,58 C520,66 545,52 560,46" },
    { color: NAVY, w: 2, d: "M0,140 C60,132 110,108 170,116 C235,124 280,150 340,138 C400,126 440,96 500,104 C525,107 545,98 560,92" },
    { color: "#C9CDD4", w: 1.6, d: "M0,150 C70,148 120,140 180,144 C245,148 285,158 345,152 C405,146 450,132 505,136 C528,138 546,132 560,128" },
  ];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" style={{ display: "block" }}>
      {[40, 80, 120].map((y) => (
        <line key={y} x1={0} y1={y} x2={W} y2={y} stroke="#EFEDE7" strokeWidth={1} />
      ))}
      {lines.map((l, i) => (
        <path key={i} d={l.d} fill="none" stroke={l.color} strokeWidth={l.w} strokeLinecap="round" />
      ))}
    </svg>
  );
}

function HeroDashboard() {
  const css = `
    .gb-herodash-wrap {
      width: 100%;
      margin-top: clamp(40px, 6vw, 76px);
      display: flex;
      justify-content: center;
      align-items: flex-start;
      height: 420px;
      overflow: hidden;
      pointer-events: none;
      perspective: 2000px;
    }
    .gb-herodash {
      width: 1040px;
      flex: none;
      transform: rotateX(7deg) rotateY(-6deg);
      transform-origin: top center;
      transform-style: preserve-3d;
    }
    .gb-herodash-card {
      display: flex;
      background: #FFFFFF;
      border: 1px solid ${BORDER};
      border-radius: 18px;
      overflow: hidden;
      box-shadow: 0 50px 90px -40px rgba(15,17,21,0.30), 0 18px 40px -28px rgba(15,17,21,0.22);
      position: relative;
    }
    @media (max-width: 1120px) {
      .gb-herodash-wrap { height: 360px; }
      .gb-herodash { transform: rotateX(6deg) rotateY(-5deg) scale(0.84); }
    }
    @media (max-width: 760px) {
      .gb-herodash-wrap { height: 232px; margin-top: 36px; }
      .gb-herodash { transform: rotateX(5deg) rotateY(-3deg) scale(0.52); }
    }
  `;

  return (
    <div className="gb-herodash-wrap" aria-hidden>
      <style>{css}</style>
      <div className="gb-herodash">
        <div className="gb-herodash-card">
          {/* ── Sidebar ── */}
          <aside
            style={{
              width: 188,
              flex: "none",
              background: NAVY_DEEP,
              backgroundImage: "var(--gb-grain)",
              backgroundSize: "150px 150px",
              padding: "20px 14px",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "2px 8px 18px" }}>
              <img
                src={`${import.meta.env.BASE_URL}logo-circle.png`}
                alt=""
                style={{ width: 22, height: 22, borderRadius: "50%" }}
              />
              <span style={{ fontSize: 14, fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.02em" }}>
                GrowitBuddy
              </span>
            </div>
            {NAV.map((n) => {
              const Icon = n.icon;
              return (
                <div
                  key={n.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 10px",
                    borderRadius: 9,
                    background: n.active ? "rgba(194,168,120,0.16)" : "transparent",
                    color: n.active ? GOLD : "rgba(255,255,255,0.62)",
                  }}
                >
                  <Icon size={15} strokeWidth={2} />
                  <span style={{ fontSize: 12.5, fontWeight: n.active ? 700 : 500 }}>{n.label}</span>
                </div>
              );
            })}
          </aside>

          {/* ── Main ── */}
          <div style={{ flex: 1, minWidth: 0, padding: "22px 24px 30px" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: INK, letterSpacing: "-0.02em" }}>Analytics</div>
            <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>
              Track your content performance across channels and campaigns
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
              <Pill>
                All channels <ChevronDown size={12} />
              </Pill>
              <Pill>
                All campaigns <ChevronDown size={12} />
              </Pill>
              <Pill>
                <Calendar size={12} /> 05/15/2026
              </Pill>
              <Pill>
                <Calendar size={12} /> 05/23/2026
              </Pill>
            </div>

            {/* stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginTop: 16 }}>
              {STATS.map((s) => (
                <div
                  key={s.label}
                  style={{
                    border: `1px solid ${BORDER}`,
                    borderRadius: 11,
                    padding: "11px 12px",
                    background: FAINT,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.dot }} />
                    <span style={{ fontSize: 10.5, color: "#6A6E75", fontWeight: 600 }}>{s.label}</span>
                  </div>
                  <div style={{ fontSize: 21, fontWeight: 800, color: INK, letterSpacing: "-0.03em", marginTop: 7 }}>
                    {s.value}
                  </div>
                </div>
              ))}
            </div>

            {/* chart */}
            <div
              style={{
                marginTop: 14,
                border: `1px solid ${BORDER}`,
                borderRadius: 12,
                padding: "14px 14px 8px",
                background: "#FFFFFF",
              }}
            >
              <div style={{ display: "flex", gap: 14, marginBottom: 8 }}>
                {[
                  { c: GOLD, t: "Reach" },
                  { c: NAVY, t: "Engagement" },
                  { c: "#C9CDD4", t: "Followers" },
                ].map((l) => (
                  <div key={l.t} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 14, height: 3, borderRadius: 2, background: l.c }} />
                    <span style={{ fontSize: 10.5, color: "#6A6E75", fontWeight: 600 }}>{l.t}</span>
                  </div>
                ))}
              </div>
              <Chart />
            </div>
          </div>

          {/* ── Campaigns panel ── */}
          <div
            style={{
              width: 210,
              flex: "none",
              borderLeft: `1px solid ${BORDER}`,
              padding: "22px 18px",
              background: "#FBFAF7",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 800, color: INK, letterSpacing: "-0.01em" }}>Campaigns</div>
            <div style={{ fontSize: 10.5, color: MUTED, marginTop: 3, marginBottom: 16 }}>By inbound velocity</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {CAMPAIGNS.map((c) => (
                <div key={c.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: "#3D4046" }}>{c.name}</span>
                    <span style={{ fontSize: 11.5, fontWeight: 800, color: INK }}>{c.pct}%</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 3, background: "#ECE8DF", overflow: "hidden" }}>
                    <div style={{ width: `${c.pct}%`, height: "100%", borderRadius: 3, background: GOLD }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(HeroDashboard);
