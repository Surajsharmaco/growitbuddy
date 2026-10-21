import { Phone } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { usePublicContent } from "@/hooks/usePublicContent";
import { NAVBAR_DEFAULTS, type NavbarData } from "@/lib/navbarDefaults";
import "./floating-contact-widget.css";

const CONTACT_WIDGET_LINKS = {
  whatsapp: "https://wa.me/919911990608",
  phone: "tel:+919911990608",
  instagramFallback: NAVBAR_DEFAULTS.instagram,
} as const;

function resolveInstagramHref(configuredUrl: string): string {
  try {
    const url = new URL(configuredUrl.trim() || CONTACT_WIDGET_LINKS.instagramFallback);
    const isInstagram = url.hostname === "instagram.com" || url.hostname === "www.instagram.com";
    return url.protocol === "https:" && isInstagram
      ? url.href
      : CONTACT_WIDGET_LINKS.instagramFallback;
  } catch {
    return CONTACT_WIDGET_LINKS.instagramFallback;
  }
}

function InstagramMark() {
  return (
    <svg
      aria-hidden="true"
      className="gb-floating-contact__instagram-mark"
      viewBox="0 0 24 24"
      focusable="false"
    >
      <defs>
        <linearGradient id="gb-floating-contact-instagram-gradient" x1="4" y1="20" x2="20" y2="4" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FEDA75" />
          <stop offset=".32" stopColor="#FA7E1E" />
          <stop offset=".58" stopColor="#D62976" />
          <stop offset=".8" stopColor="#962FBF" />
          <stop offset="1" stopColor="#4F5BD5" />
        </linearGradient>
      </defs>
      <path
        fill="url(#gb-floating-contact-instagram-gradient)"
        d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.04-.9.19-1.39.32-1.71.17-.43.37-.74.69-1.06.32-.32.63-.52 1.06-.69.32-.13.81-.28 1.71-.32 1.24-.06 1.61-.07 4.76-.07zm0 1.62c-3.15 0-3.52.01-4.76.07-.9.04-1.39.19-1.71.32-.43.17-.74.37-1.06.69-.32.32-.52.63-.69 1.06-.13.32-.28.81-.32 1.71-.06 1.24-.07 1.61-.07 4.76s.01 3.52.07 4.76c.04.9.19 1.39.32 1.71.17.43.37.74.69 1.06.32.32.63.52 1.06.69.32.13.81.28 1.71.32 1.24.06 1.61.07 4.76.07s3.52-.01 4.76-.07c.9-.04 1.39-.19 1.71-.32.43-.17.74-.37 1.06-.69.32-.32.52-.63.69-1.06.13-.32.28-.81.32-1.71.06-1.24.07-1.61.07-4.76s-.01-3.52-.07-4.76c-.04-.9-.19-1.39-.32-1.71a2.85 2.85 0 0 0-.69-1.06 2.85 2.85 0 0 0-1.06-.69c-.32-.13-.81-.28-1.71-.32-1.24-.06-1.61-.07-4.76-.07zm0 2.76a5.46 5.46 0 1 1 0 10.92 5.46 5.46 0 0 1 0-10.92zm0 9a3.54 3.54 0 1 0 0-7.08 3.54 3.54 0 0 0 0 7.08zm6.95-9.22a1.28 1.28 0 1 1-2.55 0 1.28 1.28 0 0 1 2.55 0z"
      />
    </svg>
  );
}

export function FloatingContactWidget() {
  const navbar = usePublicContent<NavbarData>("navbar", NAVBAR_DEFAULTS);
  const instagramHref = resolveInstagramHref(navbar.instagram);

  return (
    <nav className="gb-floating-contact" aria-label="GrowitBuddy contact links">
      <a
        className="gb-floating-contact__button gb-floating-contact__button--whatsapp"
        href={CONTACT_WIDGET_LINKS.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp"
      >
        <SiWhatsapp className="gb-floating-contact__whatsapp-mark" aria-hidden="true" />
      </a>
      <a
        className="gb-floating-contact__button gb-floating-contact__button--phone"
        href={CONTACT_WIDGET_LINKS.phone}
        aria-label="Call GrowitBuddy"
      >
        <Phone className="gb-floating-contact__phone-mark" aria-hidden="true" strokeWidth={2.1} />
      </a>
      <a
        className="gb-floating-contact__button gb-floating-contact__button--instagram"
        href={instagramHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instagram"
      >
        <InstagramMark />
      </a>
    </nav>
  );
}
