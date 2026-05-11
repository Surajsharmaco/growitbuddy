import TalentPoolPage, { type PoolConfig } from "./TalentPoolPage";

const config: PoolConfig = {
  sectionKey: "pool-meme-designers",
  poolType: "meme-designers",
  formVariant: "ugc",
  defaults: {
    eyebrow: "MEME DESIGNERS NETWORK",
    headline: "Create memes that actually spread.",
    description: "Join our meme design network and help creator brands build culture, relatability, and organic reach through shareable content.",
    opportunityText: "The best memes aren't just funny - they're strategic. We collaborate with meme designers who understand both humor and brand positioning.",
    ctaPrimary: "Submit Your Memes",
    ctaSecondary: "View Resources",
    videoUrl: "",
    heroTrustText: "We build long-term creative relationships with meme designers inside the GrowitBuddy creator ecosystem.",
    stepsTitle: "How it works.",
    steps: [
      { number: "01", title: "Watch the Overview",   desc: "Understand the type of meme content we create for brands." },
      { number: "02", title: "Access the References", desc: "Download brand guidelines, tone references, and format templates." },
      { number: "03", title: "Submit Your Work",     desc: "Share your profile and a sample of your meme style." },
      { number: "04", title: "Join the Network",     desc: "Get added for future meme campaigns and creator collabs." },
    ],
    resourcesTitle: "Meme Resources & Format Guides",
    resourcesSubtext: "References, templates, and tone guides for creating on-brand, shareable meme content.",
    resources: [
      { id: "1", title: "Meme Format References",  desc: "Popular formats and templates across platforms.",              link: "", btnLabel: "Open" },
      { id: "2", title: "Brand Tone Guide",         desc: "How to apply humor while staying on-brand.",                  link: "", btnLabel: "Open" },
      { id: "3", title: "Viral Meme Examples",      desc: "High-performing meme breakdowns from creator brands.",        link: "", btnLabel: "Open" },
      { id: "4", title: "Template Pack",            desc: "Editable PSD and Canva templates for quick turnaround.",      link: "", btnLabel: "Download" },
    ],
    formTitle: "Submit Your Memes",
    formSubtext: "Share your social profile and a sample of your meme work so we can understand your style.",
    formDisclaimer: "Submitting adds you to our internal meme designer network. We reach out when brand and creator projects come in.",
    formNotifyEmail: "",
    finalHeadline: "Ready to create memes that build brands?",
    finalSubtext: "Submit your work and join the growing GrowitBuddy meme designer network.",
    finalCtaPrimary: "Submit Your Memes",
    seoTitle: "Meme Designers Network - GrowitBuddy",
    seoDesc: "Join the GrowitBuddy meme designer network. Access brand references, submit your work, and collaborate on future creator brand campaigns.",
  },
};

export default function MemeDesignersPool() {
  return <TalentPoolPage config={config} />;
}
