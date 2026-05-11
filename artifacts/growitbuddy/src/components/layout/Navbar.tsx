import { Link, useLocation } from "wouter";
import { ArrowUpRight, Menu, X, ChevronDown } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  {
    label: "Careers",
    dropdown: [
      { href: "/freelancers", label: "Talent Network", subtitle: "" },
      { href: "/full-time",   label: "Full Time",      subtitle: "" },
      { href: "/internship",  label: "Internship",     subtitle: "" },
    ],
  },
  {
    label: "More",
    dropdown: [
      { href: "/insights",        label: "Blog",            subtitle: "" },
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
                        <motion.div
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
                            <a
                              key={item.href}
                              href={item.href}
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
                              onMouseEnter={e => (e.currentTarget.style.background = "rgba(30,41,59,0.04)")}
                              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
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
                            </a>
                          ))}
                        </motion.div>
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
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 8,
              borderRadius: 8,
              flexShrink: 0,
            }}
            onClick={() => setIsOpen(!isOpen)}
            data-testid="button-mobile-menu"
            aria-label="Toggle menu"
          >
            {isOpen
              ? <X style={{ width: 22, height: 22, stroke: "#0A0A0A", strokeWidth: 2 }} />
              : <Menu style={{ width: 22, height: 22, stroke: "#0A0A0A", strokeWidth: 2 }} />
            }
          </button>
        </div>
      </header>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            style={{
              position: "fixed",
              top: 72,
              left: 0,
              right: 0,
              zIndex: 40,
              background: "#F8F8F6",
              borderBottom: "1px solid #E5E5E0",
              padding: "24px 20px 32px",
            }}
          >
            <nav className="flex flex-col gap-4">
              {[...NAV_LINKS, { href: "/contact", label: "Contact" }].map((link) => {
                if (link.dropdown) {
                  return (
                    <div key={link.label}>
                      <p
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          color: "#8A8A8A",
                          marginBottom: 6,
                          paddingLeft: 2,
                        }}
                      >
                        {link.label}
                      </p>
                      {link.dropdown.map((item) => (
                        <Link key={item.href} href={item.href}>
                          <span
                            style={{
                              fontFamily: "'Inter', sans-serif",
                              fontSize: 20,
                              fontWeight: 700,
                              color: location === item.href ? "#0A0A0A" : "#8A8A8A",
                              cursor: "pointer",
                              display: "block",
                              letterSpacing: "-0.02em",
                              paddingLeft: 16,
                              marginBottom: 4,
                            }}
                          >
                            {item.label}
                          </span>
                        </Link>
                      ))}
                    </div>
                  );
                }
                return (
                  <Link key={link.href} href={link.href!}>
                    <span
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: 20,
                        fontWeight: 700,
                        color: location === link.href ? "#0A0A0A" : "#8A8A8A",
                        cursor: "pointer",
                        display: "block",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {link.label}
                    </span>
                  </Link>
                );
              })}
              <button
                onClick={() => { setIsOpen(false); goContact("cal"); }}
                className="gb-btn justify-center mt-2"
                style={{ width: "100%", borderRadius: 12, padding: "14px 0", fontSize: 15 }}
              >
                {navbar.ctaLabel}
              </button>
              <button
                onClick={() => { setIsOpen(false); goContact("form"); }}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl mt-1"
                style={{
                  width: "100%", padding: "14px 0", fontSize: 15, fontWeight: 600,
                  fontFamily: "'Inter', sans-serif", color: "#5F5F5F",
                  border: "1px solid rgba(10,10,10,0.08)", background: "transparent", cursor: "pointer",
                }}
              >
                Get In Touch
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
