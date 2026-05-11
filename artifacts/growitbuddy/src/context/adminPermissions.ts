export type AdminRole = "super" | "member";

export const ALL_PERMISSIONS = [
  { key: "leads", label: "Leads & CRM" },
  { key: "certificates", label: "Certificates" },
  { key: "home", label: "Home Page" },
  { key: "services", label: "Services" },
  { key: "framework", label: "Framework" },
  { key: "work", label: "Work" },
  { key: "blog", label: "Blog / Insights" },
  { key: "resources", label: "Resources" },
  { key: "about", label: "About" },
  { key: "contact", label: "Contact" },
  { key: "influencers", label: "Influencers" },
  { key: "influencer-explore", label: "Influencer Explore" },
  { key: "distribution-network", label: "Distribution Network" },
  { key: "distribution-pages", label: "Distribution Pages" },
  { key: "authority-audit", label: "Authority Audit" },
  { key: "join-network", label: "Join Network" },
  { key: "freelancers", label: "Freelancers Page" },
  { key: "full-time", label: "Full-Time Page" },
  { key: "media", label: "Media Library" },
  { key: "navbar", label: "Navbar" },
  { key: "footer", label: "Footer" },
  { key: "settings", label: "Settings" },
] as const;

export type PermissionKey = (typeof ALL_PERMISSIONS)[number]["key"];
