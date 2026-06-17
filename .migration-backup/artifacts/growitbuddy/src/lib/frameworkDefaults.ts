export interface FrameworkStep {
  num: string;
  title: string;
  headline: string;
  desc: string;
  details: string[];
}

export interface FrameworkPageData {
  heroLabel: string;
  heroHeadline: string;
  heroSubtext: string;
  steps: FrameworkStep[];
  ctaHeadline: string;
  ctaSubtext: string;
  ctaButton: string;
}

export const FRAMEWORK_DEFAULTS: FrameworkPageData = {
  heroLabel: "Framework",
  heroHeadline: "The Authority Framework.",
  heroSubtext: "A battle-tested content marketing framework for engineering category dominance that compounds over time. No hacks. No shortcuts. Just infrastructure built to generate inbound leads.",
  steps: [
    { num: "01", title: "Positioning",            headline: "Know exactly what you stand for.",                  desc: "We audit your space, map your competitors, and identify the specific category angle only you can own.",                                  details: ["Competitor landscape audit", "Category design & naming", "Unique point of view articulation", "Target audience avatar mapping", "90-day authority roadmap"] },
    { num: "02", title: "Content Engine",         headline: "High-signal content strategy. At scale.",           desc: "We build a repeatable content system that extracts your expertise and packages it into formats that educate, persuade, and convert.",   details: ["Pillar content strategy", "Content calendar & themes", "Ghostwriting & scripting", "Multi-format repurposing", "Editorial quality control"] },
    { num: "03", title: "Distribution Loop",      headline: "Content Distribution Strategy That Actually Works", desc: "Make sure your content doesn't just get posted - it gets seen by the people who actually matter.",                                       details: ["LinkedIn publishing system", "Email list growth strategy", "Cross-platform syndication", "Podcast & media placement", "Community building"] },
    { num: "04", title: "Authority Compounding",  headline: "The flywheel that never stops.",                    desc: "When your personal branding strategy, content system, and distribution work together, authority compounds automatically.",              details: ["Monthly authority score tracking", "Inbound opportunity capture", "Premium positioning signals", "Speaking & PR outreach", "Authority monetization"] },
  ],
  ctaHeadline: "Ready to start building?",
  ctaSubtext: "Book a free strategy call and we'll map out your authority roadmap.",
  ctaButton: "Book a Strategy Call",
};
