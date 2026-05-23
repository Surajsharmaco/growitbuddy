import { Link, useLocation } from "wouter";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import { usePublicContent } from "@/hooks/usePublicContent";

interface NavbarData {
  logo: string;
  ctaLabel: string;
  ctaPath: string;
}

const NAVBAR_DEFAULTS: NavbarData = {
  logo: "GrowitBuddy",
  ctaLabel: "Book a Call",
  ctaPath: "https://cal.com/growitbuddy.com/growth-strategy-call",
};

type NavDropdownItem = { href: string; label: string; subtitle: string };
type NavLink =
  | { href: string; label: string; dropdown?: undefined; wide?: undefined }
  | { href?: undefined; label: string; dropdown: NavDropdownItem[]; wide?: boolean };

const NAV_LINKS: NavLink[] = [
  { href: "/services", label: "Services" },
  { href: "/work", label: "Work" },
  { href: "/framework", label: "Framework" },
  {
    label: "Network",
    dropdown: [
      { href: "/influencers", label: "Influencer Network",    subtitle: "" },
      { href: "/distribution", label: "Distribution Network", subtitle: "" },
      { href: "/join", label: "Join Our Network",             subtitle: "" },
    ],
  },
  { href: "/about", label: "About" },
  { href: "/career", label: "Careers" },
  {
    label: "More",
    dropdown: [
      { href: "/blog",        label: "Blog",            subtitle: "" },
      { href: "/authority-audit", label: "Authority Audit", subtitle: "" },
      { href: "/contact",         label: "Contact",         subtitle: "" },
    ],
  },
];

function useContactNav() {
  const [, navigate] = useLocation();
  return (to: "form" | "cal") => {
    const [onContact] = [window.location.pathname.endsWith("/contact")];
    navigate(`/contact?to=${to}`);
    if (onContact) {
      setTimeout(() => {
        document.getElementById(`section-${to}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    }
  };
}

export function Navbar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const goContact = useContactNav();
  const navbar = usePublicContent<NavbarData>("navbar", NAVBAR_DEFAULTS);
  const [scrolled, setScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setIsOpen(false); setOpenDropdown(null); }, [location]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when mobile menu is open + close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setIsOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener("keydown", onKey); };
  }, [isOpen]);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (navRef.current && !navRef.current.contains(e.target as Node)) {
      setOpenDropdown(null);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  const toggleDropdown = (label: string) => {
    setOpenDropdown((prev) => (prev === label ? null : label));
  };

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-200"
        style={{
          height: 72,
          background: scrolled
            ? "rgba(248,248,246,0.98)"
            : "rgba(248,248,246,0.96)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid #E5E5E0",
          boxShadow: scrolled ? "0 1px 12px rgba(0,0,0,0.04)" : "none",
        }}
      >
        <div
          className="h-full w-full max-w-[1400px] mx-auto px-5 md:px-8"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
        >
          <Link href="/">
            <span className="inline-flex items-center gap-2 cursor-pointer group flex-shrink-0">
              <img
                src={`${import.meta.env.BASE_URL}logo-circle.png`}
                alt="GrowitBuddy"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  objectFit: "cover",
                  flexShrink: 0,
                  transition: "transform 0.2s",
                }}
                className="group-hover:scale-110"
              />
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#0A0A0A",
                  letterSpacing: "-0.03em",
                }}
              >
                {navbar.logo}
              </span>
            </span>
          </Link>

          <nav
            ref={navRef}
            className="hidden lg:flex items-center"
            style={{
              border: "1px solid rgba(10,10,10,0.06)",
              borderRadius: 40,
              padding: "5px 6px",
              gap: 2,
              background: "rgba(255,255,255,0.9)",
            }}
          >
            {NAV_LINKS.map((link) => {
              if (link.dropdown) {
                const isActive = link.dropdown.some(d => location === d.href);
                const isThisOpen = openDropdown === link.label;
                return (
                  <div key={link.label} style={{ position: "relative" }}>
                    <button
                      onClick={() => toggleDropdown(link.label)}
                      className="text-[15px] font-medium cursor-pointer transition-all duration-150 rounded-full px-4 py-2 inline-flex items-center gap-1"
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        color: isActive ? "#fff" : "#8A8A8A",
                        background: isActive ? "var(--gb-accent)" : "transparent",
                        fontWeight: isActive ? 600 : 500,
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      {link.label}
                      <ChevronDown className="w-3 h-3" style={{ transition: "transform 0.15s", transform: isThisOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
                    </button>
                    <AnimatePresence>
                      {isThisOpen && (
                        <m.div
                          initial={{ opacity: 0, y: 6, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 6, scale: 0.97 }}
                          transition={{ duration: 0.15 }}
                          style={{
                            position: "absolute",
                            top: "calc(100% + 8px)",
                            left: "50%",
                            transform: "translateX(-50%)",
                            background: "#FFFFFF",
                            border: "1px solid #E5E5E0",
                            borderRadius: 14,
                            padding: "6px",
                            minWidth: link.wide ? 520 : 180,
                            boxShadow: "0 16px 48px rgba(0,0,0,0.08)",
                            zIndex: 100,
                            display: link.wide ? "grid" : "block",
                            gridTemplateColumns: link.wide ? "1fr 1fr" : undefined,
                            gap: link.wide ? 2 : undefined,
                          }}
                        >
                          {link.dropdown.map((item) => (
                            <Link key={item.href} href={item.href}>
                              <span
                                onClick={() => setOpenDropdown(null)}
                                onMouseEnter={e => (e.currentTarget.style.background = "rgba(30,41,59,0.04)")}
                                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                style={{
                                  display: "block",
                                  padding: item.subtitle ? "10px 14px 10px 14px" : "10px 14px",
                                  borderRadius: 9,
                                  textDecoration: "none",
                                  background: "transparent",
                                  fontFamily: "'Inter', sans-serif",
                                  cursor: "pointer",
                                  transition: "background 0.12s",
                                }}
                              >
                                {item.subtitle && (
                                  <span style={{
                                    display: "block",
                                    fontSize: 10,
                                    fontWeight: 700,
                                    letterSpacing: "0.08em",
                                    color: "#C2A878",
                                    marginBottom: 3,
                                    textTransform: "uppercase",
                                  }}>
                                    {item.subtitle}
                                  </span>
                                )}
                                <span style={{
                                  display: "block",
                                  fontSize: 14,
                                  fontWeight: 600,
                                  color: "#1E293B",
                                  whiteSpace: "nowrap",
                                }}>
                                  {item.label}
                                </span>
                              </span>
                            </Link>
                          ))}
                        </m.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }
              return (
                <Link key={link.href} href={link.href!}>
                  <span
                    className="text-[15px] font-medium cursor-pointer transition-all duration-150 rounded-full px-4 py-2"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      color: location === link.href ? "#fff" : "#8A8A8A",
                      background: location === link.href ? "var(--gb-accent)" : "transparent",
                      fontWeight: location === link.href ? 600 : 500,
                    }}
                  >
                    {link.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => goContact("form")}
              className="inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-[15px] font-semibold cursor-pointer transition-all"
              style={{
                fontFamily: "'Inter', sans-serif",
                color: "#5F5F5F",
                border: "1px solid rgba(10,10,10,0.05)",
                background: "transparent",
                transition: "border-color 0.2s, color 0.2s",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--gb-authority)";
                (e.currentTarget as HTMLElement).style.color = "var(--gb-authority)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(10,10,10,0.05)";
                (e.currentTarget as HTMLElement).style.color = "#5F5F5F";
              }}
              data-testid="button-get-in-touch"
            >
              Get In Touch
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => goContact("cal")}
              className="gb-btn text-[15px] px-5 py-2"
              data-testid="button-book-call-nav"
            >
              {navbar.ctaLabel}
            </button>
          </div>

          <button
            style={{
              color: "#0A0A0A",
              background: isOpen ? "rgba(30,41,59,0.08)" : "transparent",
              border: "1px solid",
              borderColor: isOpen ? "rgba(30,41,59,0.18)" : "rgba(10,10,10,0.08)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 42,
              height: 42,
              borderRadius: 12,
              flexShrink: 0,
              transition: "all 0.18s",
              position: "relative",
              marginLeft: 8,
              zIndex: 60,
            }}
            onClick={() => setIsOpen(!isOpen)}
            data-testid="button-mobile-menu"
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
          >
            <span style={{ position: "relative", width: 18, height: 14, display: "inline-block" }}>
              <span style={{
                position: "absolute", left: 0, right: 0, height: 2, borderRadius: 2, background: "#0A0A0A",
                top: isOpen ? 6 : 0,
                transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                transition: "transform 0.22s cubic-bezier(.4,0,.2,1), top 0.22s cubic-bezier(.4,0,.2,1)",
              }} />
              <span style={{
                position: "absolute", left: 0, right: 0, height: 2, borderRadius: 2, background: "#0A0A0A",
                top: 6,
                opacity: isOpen ? 0 : 1,
                transition: "opacity 0.15s",
              }} />
              <span style={{
                position: "absolute", left: 0, right: 0, height: 2, borderRadius: 2, background: "#0A0A0A",
                top: isOpen ? 6 : 12,
                transform: isOpen ? "rotate(-45deg)" : "rotate(0deg)",
                transition: "transform 0.22s cubic-bezier(.4,0,.2,1), top 0.22s cubic-bezier(.4,0,.2,1)",
              }} />
            </span>
          </button>
        </div>
      </header>

      <AnimatePresence>
        {isOpen && (
          <m.div
            key="gb-fullscreen-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 55,
              background: "#F8F8F6",
              color: "#0A0A0A",
              overflowY: "auto",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {/* Soft brand-aligned glow — same cream/gold palette as the rest of the site */}
            <div aria-hidden style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              background: "radial-gradient(ellipse 70% 50% at 10% 0%, rgba(194,168,120,0.10), transparent 60%), radial-gradient(ellipse 60% 60% at 100% 100%, rgba(30,41,59,0.06), transparent 70%)",
            }} />

            {/* Top bar — logo + close, matches navbar height */}
            <div style={{
              position: "relative",
              height: 72,
              padding: "0 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              maxWidth: 1400,
              margin: "0 auto",
              width: "100%",
            }}>
              <Link href="/">
                <span
                  onClick={() => setIsOpen(false)}
                  className="inline-flex items-center gap-2 cursor-pointer"
                >
                  <img
                    src={`${import.meta.env.BASE_URL}logo-circle.png`}
                    alt="GrowitBuddy"
                    style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover" }}
                  />
                  <span style={{ fontSize: 18, fontWeight: 800, color: "#0A0A0A", letterSpacing: "-0.03em" }}>
                    {navbar.logo}
                  </span>
                </span>
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close menu"
                style={{
                  width: 42, height: 42, borderRadius: 12,
                  background: "rgba(10,10,10,0.04)",
                  border: "1px solid rgba(10,10,10,0.1)",
                  color: "#0A0A0A",
                  cursor: "pointer",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.15s, border-color 0.15s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(10,10,10,0.08)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(10,10,10,0.04)"; }}
              >
                <span style={{ position: "relative", width: 16, height: 16, display: "inline-block" }} aria-hidden>
                  <span style={{ position: "absolute", left: 0, right: 0, top: 7, height: 2, borderRadius: 2, background: "#0A0A0A", transform: "rotate(45deg)" }} />
                  <span style={{ position: "absolute", left: 0, right: 0, top: 7, height: 2, borderRadius: 2, background: "#0A0A0A", transform: "rotate(-45deg)" }} />
                </span>
              </button>
            </div>

            {/* Main content — two columns on desktop, stacked on mobile */}
            <div style={{
              position: "relative",
              maxWidth: 1400,
              margin: "0 auto",
              padding: "clamp(16px, 4vw, 56px) 20px clamp(40px, 6vw, 80px)",
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: "clamp(24px, 4vw, 56px)",
            }} className="gb-menu-grid">
              {/* Left — primary links */}
              <nav style={{ display: "flex", flexDirection: "column", gap: "clamp(2px, 0.6vw, 6px)" }}>
                {(() => {
                  const items: Array<{ kind: "link"; href: string; label: string } | { kind: "group"; label: string; items: NavDropdownItem[] }> = [];
                  NAV_LINKS.forEach((l) => {
                    if (l.dropdown) items.push({ kind: "group", label: l.label, items: l.dropdown });
                    else items.push({ kind: "link", href: l.href!, label: l.label });
                  });
                  items.push({ kind: "link", href: "/contact", label: "Contact" });
                  let idx = 0;
                  return items.map((it) => {
                    if (it.kind === "link") {
                      const active = location === it.href;
                      const i = idx++;
                      return (
                        <m.div
                          key={it.href}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.06 + i * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        >
                          <Link href={it.href}>
                            <span
                              onClick={() => setIsOpen(false)}
                              className="gb-menu-link"
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "clamp(8px, 1.4vw, 14px) 0",
                                fontSize: "clamp(30px, 5.6vw, 56px)",
                                fontWeight: 800,
                                letterSpacing: "-0.04em",
                                lineHeight: 1.05,
                                color: active ? "#0A0A0A" : "#8A8A8A",
                                cursor: "pointer",
                                transition: "color 0.18s",
                                position: "relative",
                                borderBottom: "1px solid rgba(10,10,10,0.06)",
                              }}
                            >
                              <span style={{ display: "inline-flex", alignItems: "baseline", gap: 14 }}>
                                <span style={{
                                  fontSize: "clamp(11px, 1.1vw, 12px)",
                                  fontWeight: 700,
                                  letterSpacing: "0.18em",
                                  color: "var(--gb-accent)",
                                  fontFamily: "'Inter', sans-serif",
                                  width: 28,
                                  display: "inline-block",
                                  transform: "translateY(-4px)",
                                  opacity: 0.7,
                                }}>
                                  {String(i + 1).padStart(2, "0")}
                                </span>
                                {it.label}
                              </span>
                              <ArrowUpRight className="gb-menu-arrow" style={{ width: 26, height: 26, opacity: 0, transform: "translateX(-12px)", transition: "opacity 0.2s, transform 0.25s", color: "var(--gb-accent)" }} />
                            </span>
                          </Link>
                        </m.div>
                      );
                    }
                    const i = idx++;
                    return (
                      <m.div
                        key={it.label}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.06 + i * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        style={{ paddingTop: "clamp(10px, 1.4vw, 16px)" }}
                      >
                        <p style={{
                          fontSize: 11, fontWeight: 800, letterSpacing: "0.22em",
                          textTransform: "uppercase", color: "var(--gb-accent)",
                          margin: 0, marginBottom: 8, paddingLeft: 42, opacity: 0.7,
                        }}>{it.label}</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          {it.items.map((sub) => {
                            const active = location === sub.href;
                            return (
                              <Link key={sub.href} href={sub.href}>
                                <span
                                  onClick={() => setIsOpen(false)}
                                  className="gb-menu-link"
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "clamp(6px, 1vw, 10px) 0 clamp(6px, 1vw, 10px) 42px",
                                    fontSize: "clamp(20px, 3.6vw, 32px)",
                                    fontWeight: 700,
                                    letterSpacing: "-0.03em",
                                    lineHeight: 1.1,
                                    color: active ? "#0A0A0A" : "#8A8A8A",
                                    cursor: "pointer",
                                    transition: "color 0.18s",
                                  }}
                                >
                                  {sub.label}
                                  <ArrowUpRight className="gb-menu-arrow" style={{ width: 20, height: 20, opacity: 0, transform: "translateX(-12px)", transition: "opacity 0.2s, transform 0.25s", color: "var(--gb-accent)" }} />
                                </span>
                              </Link>
                            );
                          })}
                        </div>
                      </m.div>
                    );
                  });
                })()}
              </nav>

              {/* Right — meta: CTAs, contact, year */}
              <m.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 32 }}
                className="gb-menu-side"
              >
                <div style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(10,10,10,0.06)",
                  borderRadius: 20,
                  padding: "clamp(24px, 3vw, 36px)",
                  boxShadow: "0 12px 40px rgba(10,10,10,0.04)",
                }}>
                  <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--gb-accent)", margin: 0, marginBottom: 14, opacity: 0.85 }}>
                    Ready to grow?
                  </p>
                  <p style={{ fontSize: "clamp(18px, 1.8vw, 22px)", fontWeight: 500, lineHeight: 1.45, color: "#1E293B", margin: 0, marginBottom: 24, letterSpacing: "-0.015em" }}>
                    Let's turn your expertise into the kind of authority that compounds.
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <button
                      onClick={() => { setIsOpen(false); goContact("cal"); }}
                      className="gb-btn"
                      style={{
                        width: "100%",
                        padding: "14px 22px",
                        fontSize: 15,
                        justifyContent: "center",
                      }}
                    >
                      {navbar.ctaLabel}
                    </button>
                    <button
                      onClick={() => { setIsOpen(false); goContact("form"); }}
                      style={{
                        width: "100%",
                        padding: "13px 22px",
                        fontSize: 15,
                        fontWeight: 600,
                        fontFamily: "'Inter', sans-serif",
                        color: "#5F5F5F",
                        background: "transparent",
                        border: "1px solid rgba(10,10,10,0.1)",
                        borderRadius: 100,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        transition: "color 0.15s, border-color 0.15s",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--gb-authority)"; (e.currentTarget as HTMLElement).style.color = "var(--gb-authority)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(10,10,10,0.1)"; (e.currentTarget as HTMLElement).style.color = "#5F5F5F"; }}
                    >
                      Get In Touch
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid rgba(10,10,10,0.08)", paddingTop: 22, display: "flex", flexDirection: "column", gap: 8 }}>
                  <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "#8A8A8A", margin: 0 }}>
                    Get in touch
                  </p>
                  <a href="mailto:hello@growitbuddy.com" style={{ fontSize: 16, fontWeight: 600, color: "#0A0A0A", textDecoration: "none", letterSpacing: "-0.01em" }}>
                    hello@growitbuddy.com
                  </a>
                  <p style={{ fontSize: 12, color: "#8A8A8A", margin: 0, marginTop: 4 }}>
                    © {new Date().getFullYear()} GrowitBuddy
                  </p>
                </div>
              </m.div>
            </div>

            {/* Hover-state CSS for big menu links */}
            <style>{`
              .gb-menu-link:hover { color: #0A0A0A !important; }
              .gb-menu-link:hover .gb-menu-arrow { opacity: 1 !important; transform: translateX(0) !important; }
              @media (min-width: 900px) {
                .gb-menu-grid { grid-template-columns: 1.6fr 1fr !important; }
              }
            `}</style>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}
