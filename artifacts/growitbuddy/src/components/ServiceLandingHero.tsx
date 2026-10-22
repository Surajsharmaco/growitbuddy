import { ArrowRight } from "lucide-react";
import { SiInstagram, SiWhatsapp, SiX } from "react-icons/si";
import { FaLinkedinIn } from "react-icons/fa";
import ServiceInquiryForm from "@/components/ServiceInquiryForm";
import "./service-landing-hero.css";

export interface ServiceLandingHeroProps {
  title: string;
  description: string;
  bookingUrl: string;
  whatsappNumber: string;
  instagramUrl: string;
  xUrl: string;
  linkedinUrl: string;
  ctaLabel?: string;
  formHeading: string;
  formSubtitle: string;
  privacyMessage: string;
  privacyUrl: string;
  preview?: boolean;
}

function safeHttpUrl(value: string, allowRelative = false): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (allowRelative && trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : "";
  } catch {
    return "";
  }
}

export function ServiceLandingHero({
  title,
  description,
  bookingUrl,
  whatsappNumber,
  instagramUrl,
  xUrl,
  linkedinUrl,
  ctaLabel = "Book a Call Now",
  formHeading,
  formSubtitle,
  privacyMessage,
  privacyUrl,
  preview = false,
}: ServiceLandingHeroProps) {
  const whatsappDigits = whatsappNumber.replace(/\D/g, "");
  const bookingDestination = safeHttpUrl(bookingUrl, true);
  const socialLinks = [
    whatsappDigits
      ? { label: "Chat with GrowitBuddy on WhatsApp", href: `https://wa.me/${whatsappDigits}`, Icon: SiWhatsapp, testId: "link-service-whatsapp" }
      : null,
    safeHttpUrl(instagramUrl)
      ? { label: "GrowitBuddy on Instagram", href: safeHttpUrl(instagramUrl), Icon: SiInstagram, testId: "link-service-instagram" }
      : null,
    safeHttpUrl(xUrl) ? { label: "GrowitBuddy on X", href: safeHttpUrl(xUrl), Icon: SiX, testId: "link-service-x" } : null,
    safeHttpUrl(linkedinUrl)
      ? { label: "GrowitBuddy on LinkedIn", href: safeHttpUrl(linkedinUrl), Icon: FaLinkedinIn, testId: "link-service-linkedin" }
      : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <section className={`service-landing-hero${preview ? " is-preview" : ""}`} aria-labelledby="service-landing-title">
      <div className="service-landing-hero-inner">
        <div className="service-landing-copy">
          <h1 id="service-landing-title" data-testid="text-service-title">{title}</h1>
          {description.trim() && <p className="service-landing-description" data-testid="text-service-description">{description}</p>}
          <div className="service-landing-actions">
            {bookingDestination && (
              <a
                className="service-landing-booking"
                href={bookingDestination}
                target={bookingDestination.startsWith("http") ? "_blank" : undefined}
                rel={bookingDestination.startsWith("http") ? "noopener noreferrer" : undefined}
                data-testid="link-book-service-call"
              >
                <span>{ctaLabel}</span>
                <ArrowRight size={17} strokeWidth={1.8} aria-hidden="true" />
              </a>
            )}
            <nav className="service-landing-socials" aria-label="GrowitBuddy social profiles">
              {socialLinks.map(({ label, href, Icon, testId }) => (
                <a
                  key={testId}
                  className="service-landing-social-link"
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  data-testid={testId}
                >
                  <Icon aria-hidden="true" />
                </a>
              ))}
            </nav>
          </div>
        </div>
        <ServiceInquiryForm
          disabled={preview}
          heading={formHeading}
          subtitle={formSubtitle}
          privacyMessage={privacyMessage}
          privacyUrl={privacyUrl}
        />
      </div>
    </section>
  );
}

export default ServiceLandingHero;
