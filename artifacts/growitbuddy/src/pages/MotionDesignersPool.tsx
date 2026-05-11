import TalentPoolPage, { type PoolConfig } from "./TalentPoolPage";

const config: PoolConfig = {
  sectionKey: "pool-motion-designers",
  poolType: "motion-designers",
  formVariant: "motion",
  defaults: {
    eyebrow: "MOTION DESIGNERS NETWORK",
    headline: "Bring static ideas to life through motion.",
    description: "We're building a motion design network for creator brands, content systems, and digital campaigns that need to move.",
    opportunityText: "Motion is the language of attention. We collaborate with motion designers who understand pacing, brand, and digital storytelling.",
    ctaPrimary: "Submit Your Reel",
    ctaSecondary: "View Resources",
    videoUrl: "",
    heroTrustText: "We build long-term creative relationships with motion designers inside the GrowitBuddy ecosystem.",
    stepsTitle: "How it works.",
    steps: [
      { number: "01", title: "Watch the Overview",   desc: "Understand our motion aesthetic and brand direction." },
      { number: "02", title: "Access Brand Files",   desc: "Download motion templates, audio assets, and brand files." },
      { number: "03", title: "Submit Your Reel",     desc: "Share your motion work so we can see your range." },
      { number: "04", title: "Join the Network",     desc: "Get added for future motion and campaign projects." },
    ],
    resourcesTitle: "Motion Resources & Templates",
    resourcesSubtext: "Reference files, templates, and brand assets for motion design submissions.",
    resources: [
      { id: "1", title: "Animation References", desc: "Motion language references and style direction.",           link: "", btnLabel: "Open" },
      { id: "2", title: "Motion Templates",     desc: "After Effects and other format starting points.",           link: "", btnLabel: "Download" },
      { id: "3", title: "Audio Assets",         desc: "Royalty-free music and sound design for submissions.",     link: "", btnLabel: "Download" },
      { id: "4", title: "Brand Files",          desc: "Logos, colors, and visual assets for reference work.",     link: "", btnLabel: "Download" },
    ],
    formTitle: "Submit Your Reel",
    formSubtext: "Share your tools and a link to your motion work so we can understand your capabilities.",
    formDisclaimer: "Submitting adds you to our internal motion design network. We reach out when animation projects come in.",
    formNotifyEmail: "",
    finalHeadline: "Ready to animate the ecosystem?",
    finalSubtext: "Submit your reel and become part of the GrowitBuddy motion design network.",
    finalCtaPrimary: "Submit Your Reel",
    seoTitle: "Motion Designers Network - GrowitBuddy",
    seoDesc: "Join the GrowitBuddy motion design network. Access templates, submit your reel, and collaborate on future campaigns and creator projects.",
  },
};

export default function MotionDesignersPool() {
  return <TalentPoolPage config={config} />;
}
