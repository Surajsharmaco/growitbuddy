import TalentPoolPage, { type PoolConfig } from "./TalentPoolPage";

const config: PoolConfig = {
  sectionKey: "pool-thumbnail-designers",
  poolType: "thumbnail-designers",
  formVariant: "thumbnail",
  defaults: {
    eyebrow: "THUMBNAIL DESIGNERS NETWORK",
    headline: "Create thumbnails people can't ignore.",
    description: "We're building a network of thumbnail designers focused on CTR, attention architecture, and visual psychology.",
    opportunityText: "High-performing thumbnails are the front door to every creator's content. We collaborate with designers who understand that.",
    ctaPrimary: "Submit Your Thumbnail",
    ctaSecondary: "View Resources",
    videoUrl: "",
    heroTrustText: "We build long-term creative relationships with thumbnail designers inside the GrowitBuddy ecosystem.",
    stepsTitle: "How it works.",
    steps: [
      { number: "01", title: "Study the References",  desc: "Understand what makes high-CTR thumbnails work." },
      { number: "02", title: "Access Templates",      desc: "Download PSD templates and font packs." },
      { number: "03", title: "Submit Your Thumbnail", desc: "Share a sample thumbnail from your portfolio." },
      { number: "04", title: "Join the Network",      desc: "Get added for future thumbnail projects." },
    ],
    resourcesTitle: "Thumbnail Resources & Templates",
    resourcesSubtext: "References, templates, and visual guides for creating high-CTR thumbnails.",
    resources: [
      { id: "1", title: "Thumbnail References", desc: "High-performing thumbnail examples across niches.",      link: "", btnLabel: "Open" },
      { id: "2", title: "CTR Examples",          desc: "Before/after breakdowns of thumbnails that convert.",    link: "", btnLabel: "Open" },
      { id: "3", title: "PSD Templates",         desc: "Layered template files for quick starting points.",      link: "", btnLabel: "Download" },
      { id: "4", title: "Font Packs",            desc: "Curated typography for thumbnail readability and impact.", link: "", btnLabel: "Download" },
    ],
    formTitle: "Submit Your Thumbnail",
    formSubtext: "Share your portfolio and a sample thumbnail so we can see your CTR thinking.",
    formDisclaimer: "Submitting adds you to our internal thumbnail designer network. We reach out when projects come in.",
    formNotifyEmail: "",
    finalHeadline: "Ready to build thumbnails that convert?",
    finalSubtext: "Join the GrowitBuddy thumbnail designer network and grow with future projects.",
    finalCtaPrimary: "Submit Your Thumbnail",
    seoTitle: "Thumbnail Designers Network - GrowitBuddy",
    seoDesc: "Join the GrowitBuddy thumbnail designer network. Access templates, submit your work, and collaborate on future projects.",
  },
};

export default function ThumbnailDesignersPool() {
  return <TalentPoolPage config={config} />;
}
