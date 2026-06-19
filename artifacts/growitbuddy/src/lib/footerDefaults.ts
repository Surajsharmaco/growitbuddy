export interface FooterLink { label: string; path: string; }
export interface FooterColumn { title: string; links: FooterLink[]; }

export interface FooterData {
  tagline: string;
  email: string;
  linkedin: string;
  twitter: string;
  instagram: string;
  youtube: string;
  columns: FooterColumn[];
  legalText: string;
}

export const FOOTER_DEFAULTS: FooterData = {
  tagline: "Authority, content, and distribution systems for founders, creators, and modern brands.",
  email: "cs.growitbuddy@gmail.com",
  linkedin: "https://www.linkedin.com/company/growitbuddy",
  twitter: "https://x.com/growitbuddy",
  instagram: "https://instagram.com/growitbuddy",
  youtube: "https://youtube.com/@growitbuddy",
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
