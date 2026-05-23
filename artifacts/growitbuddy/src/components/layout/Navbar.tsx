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
            className="lg:hidden"
            style={{
              color: "#0A0A0A",
              background: isOpen ? "rgba(30,41,59,0.06)" : "transparent",
              border: "1px solid",
              borderColor: isOpen ? "rgba(30,41,59,0.12)" : "rgba(10,10,10,0.06)",
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
            }}
            onClick={() => setIsOpen(!isOpen)}
            data-testid="button-mobile-menu"
            aria-label="Toggle menu"
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
          <>
            {/* Backdrop — taps anywhere outside the panel closes it */}
            <m.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              onClick={() => setIsOpen(false)}
              style={{ position: "fixed", top: 72, left: 0, right: 0, bottom: 0, zIndex: 39, background: "rgba(10,10,10,0.35)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
              aria-hidden
            />
            {/* Sheet — drops down from the navbar with a subtle spring */}
            <m.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              role="dialog"
              aria-label="Mobile navigation"
              className="lg:hidden"
              style={{
                position: "fixed",
                top: 72,
                left: 0,
                right: 0,
                zIndex: 40,
                background: "#FFFFFF",
                borderBottom: "1px solid #E5E5E0",
                borderBottomLeftRadius: 24,
                borderBottomRightRadius: 24,
                boxShadow: "0 24px 60px rgba(10,10,10,0.12)",
                maxHeight: "calc(100vh - 72px - 16px)",
                overflowY: "auto",
                padding: "20px 18px 24px",
              }}
            >
              <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {(() => {
                  // Flatten: simple links inline; dropdowns rendered as a labelled group.
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
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.04 + i * 0.03, duration: 0.25, ease: "easeOut" }}
                        >
                          <Link href={it.href}>
                            <span
                              onClick={() => setIsOpen(false)}
                              style={{
                                fontFamily: "'Inter', sans-serif",
                                fontSize: 17,
                                fontWeight: active ? 700 : 600,
                                color: active ? "#0A0A0A" : "#1E293B",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                letterSpacing: "-0.015em",
                                padding: "14px 16px",
                                borderRadius: 12,
                                background: active ? "rgba(30,41,59,0.06)" : "transparent",
                                position: "relative",
                                transition: "background 0.15s",
                              }}
                            >
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                                {active && <span style={{ width: 4, height: 18, borderRadius: 4, background: "var(--gb-accent)" }} aria-hidden />}
                                {it.label}
                              </span>
                              <ArrowUpRight className="w-4 h-4" style={{ opacity: active ? 0.7 : 0.35, color: "#1E293B" }} />
                            </span>
                          </Link>
                        </m.div>
                      );
                    }
                    const i = idx++;
                    return (
                      <m.div
                        key={it.label}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.04 + i * 0.03, duration: 0.25, ease: "easeOut" }}
                        style={{ padding: "10px 4px 6px" }}
                      >
                        <p style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: 10,
                          fontWeight: 800,
                          letterSpacing: "0.18em",
                          textTransform: "uppercase",
                          color: "#A0A0A8",
                          margin: 0,
                          marginBottom: 4,
                          paddingLeft: 12,
                        }}>{it.label}</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          {it.items.map((sub) => {
                            const active = location === sub.href;
                            return (
                              <Link key={sub.href} href={sub.href}>
                                <span
                                  onClick={() => setIsOpen(false)}
                                  style={{
                                    fontFamily: "'Inter', sans-serif",
                                    fontSize: 16,
                                    fontWeight: active ? 700 : 500,
                                    color: active ? "#0A0A0A" : "#5F5F5F",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "11px 16px",
                                    borderRadius: 10,
                                    background: active ? "rgba(30,41,59,0.06)" : "transparent",
                                    transition: "background 0.15s",
                                  }}
                                >
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                                    {active && <span style={{ width: 4, height: 14, borderRadius: 4, background: "var(--gb-accent)" }} aria-hidden />}
                                    {sub.label}
                                  </span>
                                  <ArrowUpRight className="w-3.5 h-3.5" style={{ opacity: active ? 0.7 : 0.3, color: "#1E293B" }} />
                                </span>
                              </Link>
                            );
                          })}
                        </div>
                      </m.div>
                    );
                  });
                })()}

                {/* Soft divider */}
                <div style={{ height: 1, background: "linear-gradient(to right, transparent, rgba(10,10,10,0.08), transparent)", margin: "14px 4px 12px" }} />

                {/* CTAs */}
                <m.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22, duration: 0.25 }} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <button
                    onClick={() => { setIsOpen(false); goContact("cal"); }}
                    style={{
                      width: "100%",
                      padding: "15px 18px",
                      fontSize: 15,
                      fontWeight: 700,
                      fontFamily: "'Inter', sans-serif",
                      color: "#FFFFFF",
                      background: "linear-gradient(135deg, #1E293B 0%, #334155 100%)",
                      border: "none",
                      borderRadius: 14,
                      cursor: "pointer",
                      letterSpacing: "-0.01em",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      boxShadow: "0 8px 24px rgba(30,41,59,0.18)",
                    }}
                  >
                    {navbar.ctaLabel}
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setIsOpen(false); goContact("form"); }}
                    style={{
                      width: "100%",
                      padding: "14px 18px",
                      fontSize: 15,
                      fontWeight: 600,
                      fontFamily: "'Inter', sans-serif",
                      color: "#1E293B",
                      background: "transparent",
                      border: "1.5px solid rgba(30,41,59,0.18)",
                      borderRadius: 14,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    Get In Touch
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </m.div>
              </nav>
            </m.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
