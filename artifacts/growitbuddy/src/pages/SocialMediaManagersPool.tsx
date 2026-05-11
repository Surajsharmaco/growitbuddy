import TalentPoolPage, { type PoolConfig } from "./TalentPoolPage";

const config: PoolConfig = {
  sectionKey: "pool-social-managers",
  poolType: "social-managers",
  formVariant: "social",
  defaults: {
    eyebrow: "SOCIAL MEDIA MANAGERS NETWORK",
    headline: "Manage growth systems, not just posting schedules.",
    description: "Join our social growth network and help brands scale visibility, build consistency, and create distribution systems that actually work.",
    opportunityText: "We collaborate with social managers who think in systems, not just content calendars. Distribution is the product.",
    ctaPrimary: "Submit Your Profile",
    ctaSecondary: "View Resources",
    videoUrl: "",
    heroTrustText: "We build long-term growth relationships inside the GrowitBuddy creator and brand ecosystem.",
    stepsTitle: "How it works.",
    steps: [
      { number: "01", title: "Watch the Overview",    desc: "Understand how we think about growth and distribution." },
      { number: "02", title: "Access the Frameworks", desc: "Download content calendars and distribution workflows." },
      { number: "03", title: "Submit Your Profile",   desc: "Share your experience, platforms, and case studies." },
      { number: "04", title: "Join the Network",      desc: "Get added for future brand and creator collaborations." },
    ],
    resourcesTitle: "Growth Resources & SOPs",
    resourcesSubtext: "Frameworks, calendars, and workflows used across our creator and brand network.",
    resources: [
      { id: "1", title: "Content Calendars",      desc: "Templates and planning frameworks for consistent output.",     link: "", btnLabel: "Download" },
      { id: "2", title: "Analytics Frameworks",   desc: "How we track performance and iterate on content strategy.",    link: "", btnLabel: "Open" },
      { id: "3", title: "Posting SOPs",           desc: "Platform-specific publishing checklists and best practices.",  link: "", btnLabel: "Open" },
      { id: "4", title: "Distribution Workflows", desc: "How content moves from creation to maximum reach.",            link: "", btnLabel: "Download" },
    ],
    formTitle: "Submit Your Profile",
    formSubtext: "Tell us about the platforms you manage and share a case study or portfolio.",
    formDisclaimer: "Submitting adds you to our internal social management network. We reach out when projects align.",
    formNotifyEmail: "",
    finalHeadline: "Ready to grow with the ecosystem?",
    finalSubtext: "Submit your profile and become part of the GrowitBuddy social growth network.",
    finalCtaPrimary: "Submit Your Profile",
    seoTitle: "Social Media Managers Network - GrowitBuddy",
    seoDesc: "Join the GrowitBuddy social media management network. Access growth frameworks, submit your profile, and collaborate on future projects.",
  },
};

export default function SocialMediaManagersPool() {
  return <TalentPoolPage config={config} />;
}
