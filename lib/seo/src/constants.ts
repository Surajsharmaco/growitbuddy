/** Canonical public origin (no trailing slash). */
export const SITE_URL = "https://growitbuddy.com";
/** Public API origin (no trailing slash). */
export const API_URL = "https://growitbuddy-api.onrender.com";
/** Canonical path for blog articles. */
export const BLOG_PATH = "/blog";

export const BRAND = {
  name: "GrowitBuddy",
  url: SITE_URL,
  logo: `${SITE_URL}/logo-dark.png`,
  email: "cs.growitbuddy@gmail.com",
  twitter: "@growitbuddy",
  description:
    "GrowitBuddy builds positioning, production, distribution, and inbound demand systems for founders and creators.",
  founder: {
    id: `${SITE_URL}/#suraj-sharma`,
    name: "Suraj Sharma",
    jobTitle: "Founder & CEO",
  },
  sameAs: [
    "https://instagram.com/growitbuddy",
    "https://youtube.com/@growitbuddy",
    "https://x.com/growitbuddy",
    "https://www.linkedin.com/company/growitbuddy",
  ],
} as const;