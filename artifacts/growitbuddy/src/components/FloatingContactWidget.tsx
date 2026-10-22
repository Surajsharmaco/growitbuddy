import { Phone } from "lucide-react";
import { SiInstagram, SiWhatsapp } from "react-icons/si";
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
        <SiInstagram
          className="gb-floating-contact__instagram-mark"
          aria-hidden="true"
        />
      </a>
    </nav>
  );
}
