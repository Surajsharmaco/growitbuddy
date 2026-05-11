import TalentPoolPage, { type PoolConfig } from "./TalentPoolPage";

const config: PoolConfig = {
  sectionKey: "pool-designers",
  poolType: "designers",
  formVariant: "designers",
  defaults: {
    eyebrow: "GRAPHIC DESIGNERS NETWORK",
    headline: "Design visuals that actually build attention.",
    description: "Submit your creative work and join our internal design network for future projects and long-term collaborations.",
    opportunityText: "As new campaigns and brand projects come in, we collaborate with designers who understand creator-focused visual language.",
    ctaPrimary: "Submit Your Design",
    ctaSecondary: "View Resources",
    videoUrl: "",
    heroTrustText: "We build long-term creative relationships inside the GrowitBuddy ecosystem.",
    stepsTitle: "How it works.",
    steps: [
      { number: "01", title: "Watch Overview",     desc: "Understand our design language and aesthetic direction." },
      { number: "02", title: "Access Brand Kit",   desc: "Download the brand kit, references, and color systems." },
      { number: "03", title: "Submit Your Work",   desc: "Share your portfolio and a sample design for review." },
      { number: "04", title: "Join the Network",   desc: "Get added to our designer network for future projects." },
    ],
    resourcesTitle: "Design Resources & Guidelines",
    resourcesSubtext: "Everything you need to understand our visual language and submit your work.",
    resources: [
      { id: "1", title: "Design Brief",     desc: "Project context, audience, and creative direction.",          link: "", btnLabel: "Open" },
      { id: "2", title: "Brand Kit",        desc: "Logos, typography, color palette, and usage guidelines.",     link: "", btnLabel: "Download" },
      { id: "3", title: "Color Systems",    desc: "Primary, secondary, and accent color combinations.",          link: "", btnLabel: "Download" },
      { id: "4", title: "UI References",    desc: "Visual references and inspiration for the right aesthetic.",  link: "", btnLabel: "Open" },
    ],
    formTitle: "Submit Your Design",
    formSubtext: "Share your portfolio and a sample design so we can understand your style.",
    formDisclaimer: "Submitting your work adds you to our internal designer network. We reach out when a project is a great fit.",
    formNotifyEmail: "",
    finalHeadline: "Ready to design with us?",
    finalSubtext: "Submit your work and grow with the GrowitBuddy creative ecosystem.",
    finalCtaPrimary: "Submit Your Design",
    seoTitle: "Graphic Designers Network - GrowitBuddy",
    seoDesc: "Join the GrowitBuddy designers network. Access the brand kit, submit your work, and become part of our creator ecosystem.",
  },
};

export default function DesignersPool() {
  return <TalentPoolPage config={config} />;
}
