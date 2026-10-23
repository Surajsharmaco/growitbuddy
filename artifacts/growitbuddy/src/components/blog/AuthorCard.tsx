import { useState } from "react";
import { FaLinkedinIn } from "react-icons/fa6";
import { SiInstagram, SiX } from "react-icons/si";
import "./AuthorCard.css";

const LINKEDIN_URL = "https://www.linkedin.com/in/surajsharmain/";

const SOCIAL_LINKS = [
  {
    label: "Suraj Sharma on LinkedIn",
    href: LINKEDIN_URL,
    Icon: FaLinkedinIn,
    color: "#0A66C2",
    testId: "link-author-linkedin",
  },
  {
    label: "Suraj Sharma on X",
    href: "https://x.com/surajsharmaco",
    Icon: SiX,
    color: "#111827",
    testId: "link-author-x",
  },
  {
    label: "Suraj Sharma on Instagram",
    href: "https://www.instagram.com/surajsharma.co/",
    Icon: SiInstagram,
    color: "#C13584",
    testId: "link-author-instagram",
  },
] as const;

export function AuthorCard() {
  const [photoFailed, setPhotoFailed] = useState(false);

  return (
    <section className="gb-author-card" aria-label="About the author" data-testid="author-card">
      <div className="gb-author-card__profile">
        <div className="gb-author-card__portrait">
          {photoFailed ? (
            <span
              className="gb-author-card__fallback"
              role="img"
              aria-label="Suraj Sharma, Founder of GrowItBuddy"
            >
              SS
            </span>
          ) : (
            <img
              src="/images/suraj-sharma-author.webp"
              alt="Suraj Sharma, Founder of GrowItBuddy"
              width={160}
              height={160}
              data-testid="img-author-portrait"
              loading="lazy"
              decoding="async"
              onError={() => setPhotoFailed(true)}
            />
          )}
        </div>

        <div className="gb-author-card__copy">
          <p className="gb-author-card__eyebrow">WRITTEN BY</p>
          <h2 className="gb-author-card__name">Suraj Sharma</h2>
          <p className="gb-author-card__role">
            Founder, GrowItBuddy | Personal Branding &amp; Marketing Strategist
          </p>
        </div>
        <p className="gb-author-card__intro">
          I help founders, creators, and businesses build authority through strategic content,
          personal branding, and distribution.
        </p>
      </div>

      <div className="gb-author-card__social">
        <p className="gb-author-card__eyebrow">CONNECT WITH ME</p>
        <div className="gb-author-card__actions">
          <nav className="gb-author-card__links" aria-label="Suraj Sharma social profiles">
            {SOCIAL_LINKS.map(({ label, href, Icon, color, testId }) => (
              <a
                key={label}
                className="gb-author-card__social-link"
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                data-testid={testId}
              >
                <Icon aria-hidden="true" focusable="false" style={{ color }} />
              </a>
            ))}
          </nav>
          <a
            className="gb-author-card__linkedin-button"
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="link-author-linkedin-cta"
          >
            Connect on LinkedIn →
          </a>
        </div>
      </div>
    </section>
  );
}
