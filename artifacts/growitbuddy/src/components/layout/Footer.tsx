import { Link } from "wouter";
import { usePublicContent } from "@/hooks/usePublicContent";

interface FooterLink { label: string; path: string; }
interface FooterColumn { title: string; links: FooterLink[]; }

interface FooterData {
  tagline: string;
  email: string;
  linkedin: string;
  twitter: string;
  instagram: string;
  columns: FooterColumn[];
  legalText: string;
}

const DEFAULTS: FooterData = {
  tagline: "Authority, content, and distribution systems for founders, creators, and modern brands.",
  email: "cs.growitbuddy@gmail.com",
  linkedin: "",
  twitter: "",
  instagram: "",
  columns: [
    {
      title: "Services",
      links: [
        { label: "Content Creation", path: "/services#service-1" },
        { label: "Personal Branding", path: "/services#service-2" },
        { label: "Distribution & Growth", path: "/services#service-3" },
        { label: "Web & Funnel Systems", path: "/services#service-4" },
        { label: "AI Automation", path: "/services#service-5" },
        { label: "Digital Products & Growth", path: "/services#service-6" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About", path: "/about" },
        { label: "Work", path: "/work" },
        { label: "Framework", path: "/framework" },
        { label: "Blog", path: "/blog" },
        { label: "Resources", path: "/resources" },
        { label: "Contact", path: "/contact" },
      ],
    },
    {
      title: "Network",
      links: [
        { label: "Influencer Network", path: "/influencers" },
        { label: "Distribution Network", path: "/distribution" },
        { label: "Join Our Network", path: "/join" },
      ],
    },
    {
      title: "Careers",
      links: [
        { label: "Full-time Jobs", path: "/career?type=full-time" },
        { label: "Freelance Work", path: "/career?type=freelancer" },
        { label: "Internship", path: "/career?type=internship" },
        { label: "Authority Audit", path: "/authority-audit" },
      ],
    },
  ],
  legalText: `${new Date().getFullYear()} GrowitBuddy. All rights reserved.`,
};

const socialLinks = [
  { key: "linkedin" as const, label: "LinkedIn" },
  { key: "twitter" as const, label: "Twitter" },
  { key: "instagram" as const, label: "Instagram" },
];

export function Footer() {
  const data = usePublicContent<FooterData>("footer", DEFAULTS);

  const activeSocials = socialLinks.filter((s) => data[s.key]);

  return (
    <footer
      style={{
        background: "#1E293B",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "60px 24px 32px",
      }}
    >
      <div className="max-w-[1200px] mx-auto">
        <div
          className="footer-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 48,
            marginBottom: 56,
          }}
        >
          <div className="footer-brand" style={{ gridColumn: "span 2" }}>
            <Link href="/">
              <span style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, textDecoration: "none", cursor: "pointer" }}>
                <span
                  style={{
                    width: 36, height: 36,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.1)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    fontWeight: 800,
                    color: "#fff",
                    fontFamily: "'Inter', sans-serif",
                    flexShrink: 0,
                  }}
                >
                  G
                </span>
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 17,
                    fontWeight: 800,
                    color: "#fff",
                    letterSpacing: "-0.03em",
                  }}
                >
                  GrowitBuddy
                </span>
              </span>
            </Link>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 14,
                color: "rgba(255,255,255,0.35)",
                maxWidth: "28ch",
                lineHeight: "1.7",
                marginTop: 4,
              }}
            >
              {data.tagline}
            </p>
            <a
              href={`mailto:${data.email}`}
              style={{
                display: "inline-block",
                marginTop: 16,
                fontFamily: "'Inter', sans-serif",
                fontSize: 13,
                color: "rgba(255,255,255,0.55)",
                fontWeight: 600,
                textDecoration: "none",
              }}
              className="hover:text-white transition-colors"
            >
              {data.email}
            </a>
            {activeSocials.length > 0 && (
              <div style={{ display: "flex", gap: 14, marginTop: 14 }}>
                {activeSocials.map((s) => (
                  <a
                    key={s.key}
                    href={data[s.key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "rgba(255,255,255,0.4)",
                      textDecoration: "none",
                    }}
                    className="hover:text-white transition-colors"
                  >
                    {s.label}
                  </a>
                ))}
              </div>
            )}
          </div>

          {data.columns.map((col, ci) => (
            <div key={ci}>
              <h4
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.22)",
                  marginBottom: 18,
                }}
              >
                {col.title}
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {col.links.map((l, li) => {
                  const isExternal = /^https?:\/\//i.test(l.path) || l.path.startsWith("mailto:") || l.path.startsWith("tel:");
                  const linkStyle = {
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 14,
                    color: "rgba(255,255,255,0.55)",
                    display: "block",
                    textDecoration: "none",
                    transition: "color 0.15s",
                  } as const;
                  if (isExternal) {
                    return (
                      <a key={li} href={l.path} style={linkStyle} className="hover:!text-white" target="_blank" rel="noopener noreferrer">
                        {l.label}
                      </a>
                    );
                  }
                  return (
                    <Link key={li} href={l.path}>
                      <span style={{ ...linkStyle, cursor: "pointer" }} className="hover:!text-white">
                        {l.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.07)",
            paddingTop: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 12,
              color: "rgba(255,255,255,0.18)",
            }}
          >
            &copy; {data.legalText}
          </p>
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <Link href="/verify">
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.35)", textDecoration: "none", transition: "color 0.15s", cursor: "pointer" }} className="hover:!text-white/60">
                Verify Certificate
              </span>
            </Link>
            <Link href="/privacy">
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.35)", textDecoration: "none", transition: "color 0.15s", cursor: "pointer" }} className="hover:!text-white/60">
                Privacy
              </span>
            </Link>
            <Link href="/terms">
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.35)", textDecoration: "none", transition: "color 0.15s", cursor: "pointer" }} className="hover:!text-white/60">
                Terms
              </span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
